
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';


interface AuthInfo {
    userId: string | null;
    role: 'client' | 'vendor' | 'admin' | null;
    isLoading: boolean;
    user: User | null;
}

function getCookie(name: string) {
    if (typeof document === 'undefined') return undefined;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
}


export function useAuth(): AuthInfo {
    const [authInfo, setAuthInfo] = useState<AuthInfo>({
        userId: null,
        role: null,
        isLoading: true,
        user: null,
    });

    useEffect(() => {
       const unsubscribe = onAuthStateChanged(auth, (user) => {
           if (user) {
                // Prioritize localStorage immediately after login, fallback to cookie
                const storedRole = (localStorage.getItem('role') || getCookie('role')) as 'client' | 'vendor' | 'admin' | null;
                setAuthInfo({
                   userId: user.uid,
                   role: storedRole,
                   isLoading: false,
                   user: user,
                });
           } else {
                // Handle special case for admin, which doesn't use Firebase Auth
                const adminUserId = localStorage.getItem('userId');
                const adminRole = localStorage.getItem('role');
                if (adminRole === 'admin' && adminUserId === 'admin-user') {
                     setAuthInfo({
                        userId: adminUserId,
                        role: 'admin',
                        isLoading: false,
                        user: null,
                     });
                } else {
                    setAuthInfo({ userId: null, role: null, isLoading: false, user: null });
                }
           }
       });
       
       return () => unsubscribe();
    }, []);

    return authInfo;
}

export function logout() {
    try {
        auth.signOut();
        localStorage.removeItem('userId');
        localStorage.removeItem('role');
        // Clear cookie for middleware
        document.cookie = 'role=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'userId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    } catch (error) {
        console.error("Could not log out.", error);
    }
}
