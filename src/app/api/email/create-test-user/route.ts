import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { generateVerificationEmailHTML } from '@/components/email-templates/verification-email';

function getOrigin(): string {
  const h = headers();
  const origin = h.get('origin');
  if (origin) return origin;
  const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL;
  if (base) {
    const hasProtocol = base.startsWith('http://') || base.startsWith('https://');
    return hasProtocol ? base : `https://${base}`;
  }
  return 'http://localhost:9003';
}

async function sendViaResend(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    return { ok: false, status: 503, error: 'Email provider not configured' };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) return { ok: false, status: res.status, error: await res.text() };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, status: 500, error: e?.message || 'Unknown error' };
  }
}

async function sendViaSendGrid(to: string, subject: string, html: string) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    return { ok: false, status: 503, error: 'Email provider not configured' };
  }
  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });
    if (!res.ok) return { ok: false, status: res.status, error: await res.text() };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, status: 500, error: e?.message || 'Unknown error' };
  }
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { allowed } = rateLimit(`email:create-test-user:${ip}`, 5, 60_000);
    if (!allowed) {
      return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
    }

    const { email, firstName, companyName } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    // Ensure user exists in Firebase Auth; create a temporary test user if missing
    let uid: string | undefined;
    try {
      const userRec = await adminAuth.getUserByEmail(email);
      uid = userRec.uid;
    } catch (e: any) {
      if (e?.code === 'auth/user-not-found') {
        const randomPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        const newUser = await adminAuth.createUser({
          email,
          emailVerified: false,
          password: randomPassword,
          displayName: firstName || undefined,
        });
        uid = newUser.uid;
      } else {
        throw e;
      }
    }

    // Generate a verification link
    const origin = getOrigin();
    const actionCodeSettings = {
      url: `${origin}/verify-email`,
      handleCodeInApp: true,
    };
    const verificationLink = await adminAuth.generateEmailVerificationLink(email, actionCodeSettings);

    const html = generateVerificationEmailHTML({
      firstName: firstName || 'there',
      verificationUrl: verificationLink,
      companyName: companyName || 'TradeCraft',
    });
    const subject = `Verify Your Email Address - ${companyName || 'TradeCraft'}`;

    // Attempt to send via configured provider
    let sent = false;
    let provider: 'resend' | 'sendgrid' | undefined;
    let status: number | undefined;
    let error: string | undefined;
    const resendAttempt = await sendViaResend(email, subject, html);
    if (resendAttempt.ok) {
      sent = true;
      provider = 'resend';
    } else if (resendAttempt.status !== 503) {
      status = resendAttempt.status;
      error = resendAttempt.error;
    }
    if (!sent) {
      const sgAttempt = await sendViaSendGrid(email, subject, html);
      if (sgAttempt.ok) {
        sent = true;
        provider = 'sendgrid';
      } else if (sgAttempt.status !== 503) {
        status = sgAttempt.status;
        error = sgAttempt.error;
      }
    }

    if (sent) {
      return NextResponse.json({ success: true, provider, verificationLink });
    }
    // No provider configured or both failed; return preview HTML and link for manual testing
    return NextResponse.json(
      { success: false, message: 'Email provider not configured', previewHtml: html, verificationLink },
      { status: 503 }
    );
  } catch (e: any) {
    console.error('[api/email/create-test-user] failed:', e);
    return NextResponse.json({ success: false, message: e?.message || 'Server error' }, { status: 500 });
  }
}