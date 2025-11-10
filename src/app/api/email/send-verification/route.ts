import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { headers } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';
import { generateVerificationEmailHTML } from '@/components/email-templates/verification-email';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import nodemailer from 'nodemailer';

async function getOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get('origin');
  if (origin) return origin;
  const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL;
  if (base) {
    const hasProtocol = base.startsWith('http://') || base.startsWith('https://');
    return hasProtocol ? base : `https://${base}`;
  }
  return 'http://localhost:9003';
}

async function getMs365GraphAccessToken(): Promise<{ ok: boolean; token?: string; error?: string; status?: number }>{
  const tenantId = process.env.MS365_TENANT_ID;
  const clientId = process.env.MS365_CLIENT_ID;
  const clientSecret = process.env.MS365_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) {
    return { ok: false, error: 'MS365 Graph credentials not configured' };
  }
  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
    scope: 'https://graph.microsoft.com/.default',
  });
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    const msg = await res.text();
    return { ok: false, error: msg, status: res.status };
  }
  const json = await res.json();
  return { ok: true, token: json.access_token as string };
}

async function sendViaMs365Graph(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string; status?: number }>{
  const sender = process.env.MS365_SENDER_EMAIL || process.env.EMAIL_FROM;
  const tenantId = process.env.MS365_TENANT_ID;
  if (!tenantId || !sender) {
    return { ok: false, error: 'MS365_TENANT_ID or MS365_SENDER_EMAIL not configured' };
  }
  const tokenRes = await getMs365GraphAccessToken();
  if (!tokenRes.ok) return { ok: false, error: tokenRes.error, status: tokenRes.status };
  const token = tokenRes.token!;
  // Graph can identify the mailbox by UPN (email address) in the path
  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: 'HTML', content: html },
        toRecipients: [{ emailAddress: { address: to } }],
        from: { emailAddress: { address: sender } },
      },
      saveToSentItems: true,
    }),
  });
  if (!res.ok) {
    const msg = await res.text();
    return { ok: false, error: msg, status: res.status };
  }
  return { ok: true };
}

async function sendViaResend(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string; status?: number }>{
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not configured' };
  const from = process.env.EMAIL_FROM || 'noreply@tradecraft.com';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from, to, subject, html })
  });
  if (!res.ok) {
    const msg = await res.text();
    return { ok: false, error: msg, status: res.status };
  }
  return { ok: true };
}

async function sendViaSendGrid(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string; status?: number }>{
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return { ok: false, error: 'SENDGRID_API_KEY not configured' };
  const fromEmail = process.env.EMAIL_FROM || 'noreply@tradecraft.com';
  const fromName = process.env.EMAIL_FROM_NAME || 'TradeCraft';
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail, name: fromName },
      subject,
      content: [{ type: 'text/html', value: html }]
    })
  });
  if (!res.ok) {
    const msg = await res.text();
    return { ok: false, error: msg, status: res.status };
  }
  return { ok: true };
}

async function sendViaSMTP(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string; status?: number }>{
  const host = process.env.MS365_SMTP_HOST || 'smtp.office365.com';
  const port = Number(process.env.MS365_SMTP_PORT || 587);
  const secure = String(process.env.MS365_SMTP_SECURE || 'false').toLowerCase() === 'true';
  const user = process.env.MS365_SMTP_USER || process.env.MS365_SENDER_EMAIL || process.env.EMAIL_FROM;
  const pass = process.env.MS365_SMTP_PASS;
  const from = process.env.MS365_SENDER_EMAIL || process.env.EMAIL_FROM || user;
  if (!user || !pass) return { ok: false, error: 'MS365_SMTP_USER or MS365_SMTP_PASS not configured' };
  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      // STARTTLS for Office365 on 587
      tls: { rejectUnauthorized: false },
    });
    await transporter.sendMail({ from, to, subject, html });
    return { ok: true };
  } catch (e: any) {
    const msg = e?.message || 'SMTP send failed';
    const code = String(e?.code || '').toUpperCase();
    const responseCode: number | undefined = typeof e?.responseCode === 'number' ? e.responseCode : undefined;
    let status: number | undefined;
    if (/auth|credentials|login/i.test(msg) || code === 'EAUTH' || responseCode === 535) {
      status = 401; // Authentication failed
    } else if (code === 'ETIMEDOUT' || code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ECONNRESET') {
      status = 503; // Network/connection issues
    } else if (typeof responseCode === 'number') {
      status = responseCode >= 500 ? 502 : 400; // Map 5xx to 502, others to 400
    }
    return { ok: false, error: msg, status };
  }
}

export async function POST(req: Request) {
  try {
    // Basic per-IP throttle to avoid spamming providers while testing
    const ip = getClientIp(req);
    const { allowed } = rateLimit(`email:send-verification:${ip}`, 5, 60_000);
    if (!allowed) {
      return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
    }

    const { email, firstName, companyName } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    const origin = await getOrigin();
    const actionCodeSettings = {
      url: `${origin}/verify-email`,
      handleCodeInApp: true,
    };

    // Generate Firebase email verification link
    const verificationLink = await adminAuth.generateEmailVerificationLink(email, actionCodeSettings);

    const html = generateVerificationEmailHTML({
      firstName: firstName || 'there',
      verificationUrl: verificationLink,
      companyName: companyName || 'TradeCraft',
    });

    const subject = `Verify Your Email Address - ${companyName || 'TradeCraft'}`;

    // Try providers in order: MS365 Graph, SMTP, Resend, SendGrid
    let sent = false;
    let error: string | undefined;
    let status: number | undefined;
    let provider: 'ms365' | 'smtp' | 'resend' | 'sendgrid' | undefined;
    const msAttempt = await sendViaMs365Graph(email, subject, html);
    if (msAttempt.ok) {
      sent = true;
      provider = 'ms365';
    } else {
      error = msAttempt.error;
      status = msAttempt.status;
      provider = 'ms365';
      const smtpAttempt = await sendViaSMTP(email, subject, html);
      if (smtpAttempt.ok) {
        sent = true;
        provider = 'smtp';
      } else {
        error = smtpAttempt.error;
        status = smtpAttempt.status;
        provider = 'smtp';
        const resendAttempt = await sendViaResend(email, subject, html);
        if (resendAttempt.ok) {
          sent = true;
          provider = 'resend';
        } else {
          error = resendAttempt.error;
          status = resendAttempt.status;
          provider = 'resend';
          if (process.env.SENDGRID_API_KEY) {
            const sgAttempt = await sendViaSendGrid(email, subject, html);
            if (sgAttempt.ok) {
              sent = true;
              provider = 'sendgrid';
            } else {
              error = sgAttempt.error;
              status = sgAttempt.status;
              provider = 'sendgrid';
            }
          }
        }
      }
    }

    if (!sent) {
      const noProviderConfigured = !process.env.RESEND_API_KEY && !process.env.SENDGRID_API_KEY && !process.env.MS365_CLIENT_ID && !process.env.MS365_SMTP_PASS;
      if (noProviderConfigured) {
        return NextResponse.json({ success: false, message: 'Email provider not configured', previewHtml: html, verificationLink }, { status: 503 });
      }
      const isRateLimited = !!error && /too\s*many\s*requests/i.test(error);
      const statusCode = isRateLimited ? 429 : (status || 502);
      let message = 'Email provider error';
      if (statusCode === 429) message = 'Too many requests';
      else if (statusCode === 400) message = 'Invalid provider request';
      else if (statusCode >= 500) message = 'Provider service unavailable';

      return NextResponse.json({ success: false, message, provider, error, previewHtml: html, verificationLink }, { status: statusCode });
    }

    return NextResponse.json({ success: true, verificationLink });
  } catch (err: any) {
    console.error('Error sending verification email:', err);
    return NextResponse.json({ success: false, message: err?.message || 'Unknown error' }, { status: 500 });
  }
}