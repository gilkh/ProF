
"use client";

import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthInfo {
  userId: string | null;
  role: 'client' | 'vendor' | 'admin' | null;
  isLoading: boolean;
  user: User | null;
}

export function useAuth(): AuthInfo {
  const [authInfo, setAuthInfo] = useState<AuthInfo>({
    userId: null,
    role: null,
    isLoading: true,
    user: null,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as typeof window & { firebaseAuth?: typeof auth }).firebaseAuth = auth;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Ask server for current role from session cookie
          const res = await fetch('/api/auth/session', { method: 'GET' });
          const data = await res.json();
          setAuthInfo({
            userId: user.uid,
            role: (data?.role as AuthInfo['role']) ?? null,
            isLoading: false,
            user,
          });
        } catch {
          setAuthInfo({ userId: user.uid, role: null, isLoading: false, user });
        }
      } else {
        setAuthInfo({ userId: null, role: null, isLoading: false, user: null });
      }
    });
    return () => unsubscribe();
  }, []);

  return authInfo;
}

export async function logout() {
  try {
    const csrfRes = await fetch('/api/auth/csrf');
    const { token } = await csrfRes.json();
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'x-csrf-token': token },
    });
    await auth.signOut();
  } catch (error) {
    console.error('Could not log out.', error);
  }
}
