import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { SESSION_COOKIE_NAME, verifyCsrfToken } from '@/lib/auth-server';

function json(status: number, data: any) {
  return NextResponse.json(data, { status });
}

async function getRoleForUid(uid: string, claims: Record<string, any>): Promise<'client'|'vendor'|'admin'|null> {
  if (claims?.role === 'admin') return 'admin';
  if (claims?.role === 'vendor') return 'vendor';
  if (claims?.role === 'client') return 'client';
  return null;
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = rateLimit(`session:${ip}`, 15, 5 * 60 * 1000);
  if (!allowed) return json(429, { error: 'Too many requests' });

  if (!(await verifyCsrfToken())) {
    return json(403, { error: 'Invalid CSRF token' });
  }

  let idToken: string | undefined;
  try {
    const body = await req.json();
    idToken = body?.idToken;
  } catch {}
  if (!idToken || typeof idToken !== 'string') {
    return json(400, { error: 'Missing idToken' });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const userRec = await adminAuth.getUser(decoded.uid);
    if (userRec.disabled) return json(403, { error: 'Account disabled' });

    let role = await getRoleForUid(decoded.uid, decoded);
    // Admin email override; also set a durable custom claim for future logins
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@tradecraft.com';
    if (!role && userRec.email && userRec.email.toLowerCase() === adminEmail.toLowerCase()) {
      role = 'admin';
      try {
        const currentClaims = userRec.customClaims || {};
        if (currentClaims.role !== 'admin') {
          await adminAuth.setCustomUserClaims(decoded.uid, { ...currentClaims, role: 'admin' });
          // Revoke refresh tokens so the new claim propagates to the client on next sign-in
          await adminAuth.revokeRefreshTokens(decoded.uid);
        }
      } catch (e) {
        // Non-fatal: if we cannot set the claim now, fallback role still applies
        console.warn('[api/auth/session] Failed to set admin custom claim:', (e as any)?.message || e);
      }
    }
    // One-time bootstrap: if no role claim yet, infer and set a durable claim
    if (!role) {
      try {
        const pendingVendor = await adminDb.doc(`pendingVendors/${decoded.uid}`).get();
        const vendorDoc = await adminDb.doc(`vendors/${decoded.uid}`).get();
        const pendingClient = await adminDb.doc(`pendingClients/${decoded.uid}`).get();
        const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
        if (pendingVendor.exists || vendorDoc.exists) {
          role = 'vendor';
          const currentClaims = userRec.customClaims || {};
          await adminAuth.setCustomUserClaims(decoded.uid, { ...currentClaims, role: 'vendor' });
          await adminAuth.revokeRefreshTokens(decoded.uid);
        } else if (pendingClient.exists || userDoc.exists) {
          role = 'client';
          const currentClaims = userRec.customClaims || {};
          await adminAuth.setCustomUserClaims(decoded.uid, { ...currentClaims, role: 'client' });
          await adminAuth.revokeRefreshTokens(decoded.uid);
        }
      } catch (e) {
        console.warn('[api/auth/session] Role bootstrap failed:', (e as any)?.message || e);
      }
    }
    if (!role) return json(403, { error: 'No role assigned. Contact support.' });

    // Enforce email verification for non-admins when enabled in admin settings
    try {
      const settingsSnap = await adminDb.doc('adminSettings/emailVerification').get();
      const emailVerificationRequired = settingsSnap.exists
        ? Boolean(settingsSnap.data()?.required)
        : true; // default to required when not configured
      if (emailVerificationRequired && role !== 'admin') {
        // Cross-check both Firebase Auth and Firestore profile flags
        const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
        const firestoreVerified = userDoc.exists ? Boolean(userDoc.data()?.emailVerified) : false;
        const isVerified = !!userRec.emailVerified && (!userDoc.exists || firestoreVerified);
        if (!isVerified) {
          return json(403, { error: 'Email not verified', redirect: '/login?error=verify-email' });
        }
      }
    } catch {
      // If we cannot read the setting, default to requiring verification for safety
      if (role !== 'admin' && !userRec.emailVerified) {
        return json(403, { error: 'Email not verified', redirect: '/login?error=verify-email' });
      }
    }

    // Set session to maximum allowed by Firebase (14 days) - we'll auto-refresh to keep it alive forever
    const expiresIn = 14 * 24 * 60 * 60 * 1000; // 14 days (Firebase maximum)
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const cookieStore = await cookies();
    
    // Detect if request is from Capacitor WebView (via user-agent or custom header)
    const userAgent = req.headers.get('user-agent') || '';
    const isCapacitor = userAgent.includes('CapacitorWebView') || req.headers.get('x-capacitor-platform');
    
    cookieStore.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // Use 'none' for Capacitor apps accessing remote URLs, 'lax' for web
      sameSite: isCapacitor ? 'none' : 'lax',
      path: '/',
      maxAge: Math.floor(expiresIn / 1000),
    });

    // Decide default redirect per role
    const redirectTo = role === 'admin' ? '/admin/home' : role === 'vendor' ? '/vendor/home' : '/client/home';
    return json(200, { success: true, role, redirect: redirectTo });
  } catch (e: any) {
    console.error('[api/auth/session] Session establishment failed:', { message: e?.message, code: e?.code });
    const msg: string = e?.message || '';
    const isAdminNotConfigured = /credential|private key|certificate|service account|GOOGLE_APPLICATION_CREDENTIALS/i.test(msg);
    if (isAdminNotConfigured) {
      return json(500, { error: 'Server auth is not configured', details: msg, code: 'admin-not-configured' });
    }
    return json(401, { error: 'Invalid credentials', details: msg, code: e?.code });
  }
}

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = rateLimit(`session:get:${ip}`, 60, 5 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  try {
    const session = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
    if (!session) return NextResponse.json({ loggedIn: false }, { status: 200 });
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userRec = await adminAuth.getUser(decoded.uid);
    if (userRec.disabled) return NextResponse.json({ loggedIn: false }, { status: 200 });
    let role = await getRoleForUid(decoded.uid, decoded);
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@tradecraft.com';
    if (!role && userRec.email && userRec.email.toLowerCase() === adminEmail.toLowerCase()) {
      role = 'admin';
    }
    return NextResponse.json({
      loggedIn: true,
      uid: decoded.uid,
      role,
      email: userRec.email ?? null,
      emailVerified: !!userRec.emailVerified,
    });
  } catch (e: any) {
    return NextResponse.json({ loggedIn: false }, { status: 200 });
  }
}