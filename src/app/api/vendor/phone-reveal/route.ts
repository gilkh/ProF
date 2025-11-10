import { NextResponse } from 'next/server';
import { admin, adminDb, adminAuth } from '@/lib/firebase-admin';
import { verifyCsrfToken } from '@/lib/auth-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { allowed } = rateLimit(`vendor:phone-reveal:${ip}`, 100, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    if (!(await verifyCsrfToken())) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    const body = await req.json();
    const idToken: string | undefined = body?.idToken;
    const vendorId: string | undefined = body?.vendorId;
    if (!idToken) return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    if (!vendorId) return NextResponse.json({ error: 'Missing vendorId' }, { status: 400 });

    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const vendorRef = adminDb.doc(`vendors/${vendorId}`);
    const revealRef = adminDb.collection(`vendors/${vendorId}/phoneReveals`).doc();

    await adminDb.runTransaction(async (tx) => {
      tx.update(vendorRef, { totalPhoneReveals: admin.firestore.FieldValue.increment(1) });
      tx.set(revealRef, {
        revealedAt: admin.firestore.FieldValue.serverTimestamp(),
        clientId: uid || 'anonymous',
      });
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[api/vendor/phone-reveal] failed:', e);
    return NextResponse.json({ error: 'Server error', details: String(e?.message || e) }, { status: 500 });
  }
}