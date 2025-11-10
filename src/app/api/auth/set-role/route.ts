import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { verifyCsrfToken } from '@/lib/auth-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

type AppRole = 'client' | 'vendor';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { allowed } = rateLimit(`set-role:${ip}`, 20, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const csrfOk = await verifyCsrfToken();
    if (!csrfOk) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    const body = await req.json();
    const role: AppRole | undefined = body?.role;
    const idToken: string | undefined = body?.idToken;

    if (!role || (role !== 'client' && role !== 'vendor')) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    // Never allow clients to self-assign admin
    if ((decoded as any)?.role === 'admin' || decoded.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()) {
      return NextResponse.json({ error: 'Admin role changes must be server-managed' }, { status: 403 });
    }

    // Guard: validate existence in pending collections to avoid privilege escalation
    if (role === 'vendor') {
      const pendingVendor = await adminDb.doc(`pendingVendors/${uid}`).get();
      const existingVendor = await adminDb.doc(`vendors/${uid}`).get();
      if (!pendingVendor.exists && !existingVendor.exists) {
        return NextResponse.json({ error: 'No vendor registration found' }, { status: 403 });
      }
    } else if (role === 'client') {
      const pendingClient = await adminDb.doc(`pendingClients/${uid}`).get();
      const existingUser = await adminDb.doc(`users/${uid}`).get();
      if (!pendingClient.exists && !existingUser.exists) {
        return NextResponse.json({ error: 'No client registration found' }, { status: 403 });
      }
    }

    const userRec = await adminAuth.getUser(uid);
    const currentClaims = userRec.customClaims || {};
    const already = currentClaims.role === role;
    if (!already) {
      await adminAuth.setCustomUserClaims(uid, { ...currentClaims, role });
      await adminAuth.revokeRefreshTokens(uid);
    }

    return NextResponse.json({ success: true, role, already });
  } catch (err: any) {
    console.error('Error setting role claim:', err);
    return NextResponse.json({ error: 'Server error', details: String(err?.message || err) }, { status: 500 });
  }
}