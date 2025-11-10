import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { verifyCsrfToken } from '@/lib/auth-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

type AccountTier = 'free' | 'vip1' | 'vip2' | 'vip3';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { allowed } = rateLimit(`vendor:tier:${ip}`, 30, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    if (!(await verifyCsrfToken())) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    const body = await req.json();
    const idToken: string | undefined = body?.idToken;
    const vendorId: string | undefined = body?.vendorId;
    const tier: AccountTier | undefined = body?.tier;

    if (!idToken) return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    if (!vendorId) return NextResponse.json({ error: 'Missing vendorId' }, { status: 400 });
    if (!tier || !['free', 'vip1', 'vip2', 'vip3'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const userRec = await adminAuth.getUser(decoded.uid);
    const isAdmin = (decoded as any)?.role === 'admin' || userRec.email?.toLowerCase() === (process.env.ADMIN_EMAIL || 'admin@tradecraft.com').toLowerCase();
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await adminDb.doc(`vendors/${vendorId}`).set({ accountTier: tier }, { merge: true });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[api/vendor/tier] failed:', e);
    return NextResponse.json({ error: 'Server error', details: String(e?.message || e) }, { status: 500 });
  }
}