import { NextResponse } from 'next/server';
import { admin, adminAuth } from '@/lib/firebase-admin';

export async function GET() {
  // This endpoint provides NON-sensitive diagnostics to verify server Firebase setup
  const hasAdminApp = admin.apps.length > 0;
  let projectId: string | undefined = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const hasServiceAccountJson = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT);
  const hasExplicitKey = Boolean(process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL);
  const hasADC = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);

  // Try a benign call to ensure adminAuth is usable
  let authUsable = false;
  try {
    // getUser will throw if adminAuth is not initialized; we avoid querying any real UID
    // by simply checking that certain methods exist
    authUsable = typeof adminAuth.createSessionCookie === 'function';
  } catch {}

  return NextResponse.json({
    hasAdminApp,
    projectId,
    credentials: {
      hasServiceAccountJson,
      hasExplicitKey,
      hasADC,
    },
    adminAuthUsable: authUsable,
  });
}