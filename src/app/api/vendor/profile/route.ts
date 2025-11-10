import { NextResponse } from 'next/server';
import { admin, adminAuth, adminDb } from '@/lib/firebase-admin';
import { verifyCsrfToken } from '@/lib/auth-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// Vendor-editable keys only; privilege fields are excluded
const VENDOR_EDITABLE_KEYS = new Set([
  'businessName',
  'category',
  'tagline',
  'description',
  'email',
  'phone',
  'avatar',
  'portfolio',
  'location',
]);

type Verification = 'none' | 'verified' | 'trusted';
type AccountTier = 'free' | 'vip1' | 'vip2' | 'vip3';

function filterVendorEditable(input: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(input || {})) {
    if (VENDOR_EDITABLE_KEYS.has(k)) out[k] = v;
  }
  return out;
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { allowed } = rateLimit(`vendor:profile:${ip}`, 50, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const csrfOk = await verifyCsrfToken();
    if (!csrfOk) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    const body = await req.json();
    const idToken: string | undefined = body?.idToken;
    const vendorId: string | undefined = body?.vendorId;
    const data: Record<string, any> | undefined = body?.data;

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }
    if (!vendorId || typeof vendorId !== 'string') {
      return NextResponse.json({ error: 'Missing vendorId' }, { status: 400 });
    }
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Missing vendor data' }, { status: 400 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;
    const userRec = await adminAuth.getUser(uid);
    const isAdminEmail = userRec.email?.toLowerCase() === (process.env.ADMIN_EMAIL || 'admin@tradecraft.com').toLowerCase();
    const role = (decoded as any)?.role === 'admin' || isAdminEmail
      ? 'admin'
      : (decoded as any)?.role;

    // Vendors can only update their own profile; admins can update any
    if (role !== 'admin' && uid !== vendorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only vendor-editable keys are accepted here
    const payload = filterVendorEditable(data);

    // Auto-approval or scheduling for new pending portfolio items
    try {
      if (Array.isArray(payload.portfolio) && payload.portfolio.length > 0) {
        const cfgSnap = await adminDb.doc('adminSettings/autoApproval').get();
        const cfg = cfgSnap.exists ? cfgSnap.data() || {} : {};
        const enabled = !!cfg.enabled;
        const mode = (cfg.mode === 'scheduled' || cfg.mode === 'instant') ? cfg.mode : 'instant';
        const hours = Number(cfg.hours) || 0;
        if (enabled) {
          if (mode === 'instant') {
            payload.portfolio = payload.portfolio.map((item: any) => (
              item?.status === 'pending' ? { ...item, status: 'approved' } : item
            ));
          } else if (mode === 'scheduled' && hours > 0) {
            const pendingItems = payload.portfolio.filter((item: any) => item?.status === 'pending');
            await Promise.all(pendingItems.map((item: any) =>
              adminDb.collection('scheduledActions').add({
                vendorId,
                mediaUrl: item.url,
                type: 'profile',
                decision: 'approved',
                reason: 'auto-approval schedule',
                scheduledFor: new Date(Date.now() + hours * 60 * 60 * 1000),
                createdAt: new Date(),
                status: 'pending',
              })
            ));
          }
        }
      }
    } catch (e) {
      console.warn('[api/vendor/profile] auto-approval scheduling failed:', (e as any)?.message || e);
    }

    await adminDb.doc(`vendors/${vendorId}`).set(
      { ...payload, lastModified: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true },
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[api/vendor/profile] update failed:', err);
    return NextResponse.json({ error: 'Server error', details: String(err?.message || err) }, { status: 500 });
  }
}