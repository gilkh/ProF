
"use client";

import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { fetchWithCapacitorHeaders } from '@/lib/fetch-wrapper';

interface AuthInfo {
  userId: string | null;
  role: 'client' | 'vendor' | 'admin' | null;
  isLoading: boolean;
  user: User | null;
}

async function refreshSessionCookie(user: User): Promise<void> {
  try {
    // Get a fresh ID token from Firebase
    const idToken = await user.getIdToken(true); // force refresh
    
    // Get CSRF token
    const csrfRes = await fetchWithCapacitorHeaders('/api/auth/csrf');
    const { token: csrfToken } = await csrfRes.json();
    
    // Re-establish session cookie with fresh token
    await fetchWithCapacitorHeaders('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      body: JSON.stringify({ idToken }),
    });
    
    // Store the timestamp of last refresh
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('lastSessionRefresh', Date.now().toString());
    }
    
    console.log('[useAuth] Session cookie refreshed successfully');
  } catch (error) {
    console.error('[useAuth] Failed to refresh session cookie:', error);
  }
}

function shouldRefreshSession(): boolean {
  if (typeof localStorage === 'undefined') return false;
  
  const lastRefresh = localStorage.getItem('lastSessionRefresh');
  if (!lastRefresh) return true; // Never refreshed, should refresh
  
  const lastRefreshTime = parseInt(lastRefresh, 10);
  const tenDaysInMs = 10 * 24 * 60 * 60 * 1000;
  
  return Date.now() - lastRefreshTime > tenDaysInMs;
}

export function useAuth(): AuthInfo {
  const [authInfo, setAuthInfo] = useState<AuthInfo>({
    userId: null,
    role: null,
    isLoading: true,
    user: null,
  });
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityListenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as typeof window & { firebaseAuth?: typeof auth }).firebaseAuth = auth;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Ask server for current role from session cookie
          const res = await fetchWithCapacitorHeaders('/api/auth/session', { method: 'GET' });
          const data = await res.json();
          
          // If not logged in on server but user exists on client, refresh the session
          if (!data.loggedIn) {
            console.log('[useAuth] Session not found on server, refreshing...');
            await refreshSessionCookie(user);
            const retryRes = await fetchWithCapacitorHeaders('/api/auth/session', { method: 'GET' });
            const retryData = await retryRes.json();
            setAuthInfo({
              userId: user.uid,
              role: (retryData?.role as AuthInfo['role']) ?? null,
              isLoading: false,
              user,
            });
          } else {
            // Check if we need to proactively refresh (been more than 10 days)
            if (shouldRefreshSession()) {
              console.log('[useAuth] Session is older than 10 days, proactively refreshing...');
              await refreshSessionCookie(user);
            }
            
            setAuthInfo({
              userId: user.uid,
              role: (data?.role as AuthInfo['role']) ?? null,
              isLoading: false,
              user,
            });
          }
          
          // Set up automatic token refresh every 10 days to keep session alive forever
          // Firebase session cookies max out at 14 days, so we refresh at 10 days to be safe
          if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
          }
          refreshIntervalRef.current = setInterval(async () => {
            console.log('[useAuth] Auto-refreshing session to maintain indefinite login');
            await refreshSessionCookie(user);
          }, 10 * 24 * 60 * 60 * 1000); // 10 days
          
          // Handle app resume/visibility change (important for mobile)
          const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible') {
              console.log('[useAuth] App resumed, checking session validity');
              const checkRes = await fetchWithCapacitorHeaders('/api/auth/session', { method: 'GET' });
              const checkData = await checkRes.json();
              
              // If session expired or it's been >10 days, refresh
              if (!checkData.loggedIn && auth.currentUser) {
                console.log('[useAuth] Session expired, refreshing...');
                await refreshSessionCookie(auth.currentUser);
              } else if (shouldRefreshSession() && auth.currentUser) {
                console.log('[useAuth] Session older than 10 days, refreshing...');
                await refreshSessionCookie(auth.currentUser);
              }
            }
          };
          
          if (visibilityListenerRef.current) {
            document.removeEventListener('visibilitychange', visibilityListenerRef.current);
          }
          visibilityListenerRef.current = handleVisibilityChange;
          document.addEventListener('visibilitychange', handleVisibilityChange);
          
          // For Capacitor: listen to app state changes
          if (typeof window !== 'undefined' && (window as any).Capacitor) {
            const { App } = (window as any).Capacitor.Plugins || {};
            if (App) {
              App.addListener('appStateChange', async (state: { isActive: boolean }) => {
                if (state.isActive && auth.currentUser) {
                  console.log('[useAuth] App became active, checking session');
                  const checkRes = await fetchWithCapacitorHeaders('/api/auth/session', { method: 'GET' });
                  const checkData = await checkRes.json();
                  
                  // If session expired or it's been >10 days, refresh
                  if (!checkData.loggedIn) {
                    console.log('[useAuth] Session expired, refreshing...');
                    await refreshSessionCookie(auth.currentUser);
                  } else if (shouldRefreshSession()) {
                    console.log('[useAuth] Session older than 10 days, refreshing...');
                    await refreshSessionCookie(auth.currentUser);
                  }
                }
              });
            }
          }
          
        } catch (error) {
          console.error('[useAuth] Error during auth setup:', error);
          setAuthInfo({ userId: user.uid, role: null, isLoading: false, user });
        }
      } else {
        // User logged out
        setAuthInfo({ userId: null, role: null, isLoading: false, user: null });
        
        // Clean up intervals and listeners
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
        if (visibilityListenerRef.current) {
          document.removeEventListener('visibilitychange', visibilityListenerRef.current);
          visibilityListenerRef.current = null;
        }
        
        // Clear refresh timestamp
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('lastSessionRefresh');
        }
      }
    });
    
    return () => {
      unsubscribe();
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (visibilityListenerRef.current) {
        document.removeEventListener('visibilitychange', visibilityListenerRef.current);
      }
    };
  }, []);

  return authInfo;
}

export async function logout() {
  try {
    const csrfRes = await fetchWithCapacitorHeaders('/api/auth/csrf');
    const { token } = await csrfRes.json();
    await fetchWithCapacitorHeaders('/api/auth/logout', {
      method: 'POST',
      headers: { 'x-csrf-token': token },
    });
    await auth.signOut();
    
    // Clear refresh timestamp on logout
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('lastSessionRefresh');
    }
  } catch (error) {
    console.error('Could not log out.', error);
  }
}
