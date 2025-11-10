import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { verifyCsrfToken } from '@/lib/auth-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

type Role = 'client' | 'vendor';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { allowed } = rateLimit(`admin:user-delete:${ip}`, 20, 60_000);
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

    if (!idToken) return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    if (!role || !['client', 'vendor'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

    const decoded = await adminAuth.verifyIdToken(idToken);
    const userRec = await adminAuth.getUser(decoded.uid);
    const isAdmin = (decoded as any)?.role === 'admin' || userRec.email?.toLowerCase() === (process.env.ADMIN_EMAIL || 'admin@tradecraft.com').toLowerCase();
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Delete Firestore docs
    const userRef = adminDb.doc(`users/${userId}`);
    const ops: Promise<any>[] = [userRef.delete()];
    if (role === 'vendor') {
      ops.push(adminDb.doc(`vendors/${userId}`).delete());
    }
    await Promise.all(ops);

    // Delete Auth user account
    try {
      await adminAuth.deleteUser(userId);
    } catch (e) {
      console.warn('[api/admin/user/delete] auth deletion warning:', (e as any)?.message || e);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[api/admin/user/delete] failed:', e);
    return NextResponse.json({ error: 'Server error', details: String(e?.message || e) }, { status: 500 });
  }
}