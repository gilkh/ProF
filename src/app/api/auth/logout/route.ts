import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { clearSessionCookie, verifyCsrfToken, SESSION_COOKIE_NAME } from '@/lib/auth-server';
import { cookies } from 'next/headers';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = rateLimit(`logout:${ip}`, 30, 5 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  if (!(await verifyCsrfToken())) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  // Verify current session and revoke
  try {
    const session = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
    if (session) {
      const decoded = await adminAuth.verifySessionCookie(session, true);
      await adminAuth.revokeRefreshTokens(decoded.uid);
    }
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  }
}