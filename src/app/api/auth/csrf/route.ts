import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { CSRF_COOKIE_NAME } from '@/lib/auth-server';

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = rateLimit(`csrf:${ip}`, 30, 5 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const cookieStore = await cookies();
  cookieStore.set({
    name: CSRF_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  });
  return NextResponse.json({ token });
}