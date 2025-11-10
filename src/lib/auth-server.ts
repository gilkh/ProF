import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export type AppRole = 'client' | 'vendor' | 'admin';

export const SESSION_COOKIE_NAME = 'session';
export const CSRF_COOKIE_NAME = 'csrfToken';

export interface SessionUser {
  uid: string;
  email: string | null;
  role: AppRole | null;
  emailVerified: boolean;
  claims: Record<string, any>;
}

async function deriveRole(uid: string, claims: Record<string, any>): Promise<AppRole | null> {
  // Prefer explicit custom claim if present
  if (typeof claims?.role === 'string') {
    if (claims.role === 'admin') return 'admin';
    if (claims.role === 'vendor') return 'vendor';
    if (claims.role === 'client') return 'client';
  }
  return null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userRec = await adminAuth.getUser(decoded.uid);
    if (userRec.disabled) {
      return null;
    }
    let role = await deriveRole(decoded.uid, decoded);
    // Admin email override to keep parity with /api/auth/session
    if (!role) {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@tradecraft.com';
      const userEmail = userRec.email ? userRec.email.toLowerCase() : '';
      if (userEmail && userEmail === adminEmail.toLowerCase()) {
        role = 'admin';
      }
    }
    return {
      uid: decoded.uid,
      email: userRec.email ?? null,
      role,
      emailVerified: !!userRec.emailVerified,
      claims: decoded,
    };
  } catch {
    return null;
  }
}

export async function requireRole(required: AppRole) {
  const session = await getSessionUser();
  if (!session) {
    redirect('/login');
  }
  // Only admins can access admin area
  if (required === 'admin' && session.role !== 'admin') {
    redirect('/login');
  }
  // Email verification is enforced ONLY for clients, and only if enabled in admin settings
  if (required === 'client') {
    try {
      const settingsSnap = await adminDb.doc('adminSettings/emailVerification').get();
      const emailVerificationRequired = settingsSnap.exists
        ? Boolean(settingsSnap.data()?.required)
        : true; // default to required when not configured
      if (emailVerificationRequired && !session.emailVerified) {
        redirect('/login?error=verify-email');
      }
    } catch {
      // If reading settings fails, default to requiring verification for safety
      if (!session.emailVerified) {
        redirect('/login?error=verify-email');
      }
    }
  }
}

export async function verifyCsrfToken(): Promise<boolean> {
  const hdrs = await headers();
  const cookieStore = await cookies();
  const csrfHeader = hdrs.get('x-csrf-token') ?? '';
  const csrfCookie = cookieStore.get(CSRF_COOKIE_NAME)?.value ?? '';
  return Boolean(csrfHeader) && csrfHeader === csrfCookie;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  // Max-Age=0 clears cookie
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}