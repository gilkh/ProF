import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { verifyCsrfToken } from '@/lib/auth-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

type Role = 'client' | 'vendor';
type Status = 'active' | 'disabled';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { allowed } = rateLimit(`admin:user-status:${ip}`, 40, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    if (!(await verifyCsrfToken())) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    const body = await req.json();
    const idToken: string | undefined = body?.idToken;
    const userId: string | undefined = body?.userId;
    const role: Role | undefined = body?.role;
    const status: Status | undefined = body?.status;

    if (!idToken) return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    if (!role || !['client', 'vendor'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    if (!status || !['active', 'disabled'].includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

    const decoded = await adminAuth.verifyIdToken(idToken);
    const userRec = await adminAuth.getUser(decoded.uid);
    const isAdmin = (decoded as any)?.role === 'admin' || userRec.email?.toLowerCase() === (process.env.ADMIN_EMAIL || 'admin@tradecraft.com').toLowerCase();
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const userRef = adminDb.doc(`users/${userId}`);
    const updates: Record<string, any> = { status };
    await userRef.set(updates, { merge: true });
    if (role === 'vendor') {
      const vendorRef = adminDb.doc(`vendors/${userId}`);
      await vendorRef.set({ status }, { merge: true });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[api/admin/user/status] failed:', e);
    return NextResponse.json({ error: 'Server error', details: String(e?.message || e) }, { status: 500 });
  }
}