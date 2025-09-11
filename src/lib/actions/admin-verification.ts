'use server';

import { adminAuth } from '@/lib/firebase-admin';
import { doc, getDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile, VendorProfile } from '@/lib/types';

export async function adminVerifyAccountAction(userId: string, accountType: 'client' | 'vendor'): Promise<boolean> {
    try {
        const batch = writeBatch(db);
        
        if (accountType === 'client') {
            // Get pending client data
            const pendingClientDoc = await getDoc(doc(db, 'pendingClients', userId));
            if (!pendingClientDoc.exists()) {
                throw new Error('Pending client not found');
            }
            
            const clientData = pendingClientDoc.data();
            
            // Create user profile
            const userProfile: Omit<UserProfile, 'id'> = {
                firstName: clientData.firstName,
                lastName: clientData.lastName,
                email: clientData.email,
                phone: clientData.phone || '',
                createdAt: new Date(),
                savedItemIds: [],
                status: 'active',
                avatar: clientData.avatar || '',
                emailVerified: true, // Manually verified by admin
                provider: 'password',
            };
            
            batch.set(doc(db, 'users', userId), userProfile);
            batch.delete(doc(db, 'pendingClients', userId));
        } else if (accountType === 'vendor') {
            // Get pending vendor data
            const pendingVendorDoc = await getDoc(doc(db, 'pendingVendors', userId));
            if (!pendingVendorDoc.exists()) {
                throw new Error('Pending vendor not found');
            }
            
            const vendorData = pendingVendorDoc.data();
            
            // Create user profile
            const userProfile: Omit<UserProfile, 'id'> = {
                firstName: vendorData.firstName,
                lastName: vendorData.lastName,
                email: vendorData.email,
                phone: vendorData.phone || '',
                createdAt: new Date(),
                savedItemIds: [],
                status: 'active',
                avatar: vendorData.avatar || '',
                emailVerified: true, // Manually verified by admin
                provider: 'password',
            };
            
            // Create vendor profile
            const vendorProfile: Omit<VendorProfile, 'id'> = {
                businessName: vendorData.businessName,
                firstName: vendorData.firstName,
                lastName: vendorData.lastName,
                email: vendorData.email,
                ownerId: userId,
                category: 'Venues',
                tagline: '',
                description: '',
                phone: vendorData.phone || '',
                accountTier: 'free',
                createdAt: new Date(),
                status: 'active',
                rating: 0,
                reviewCount: 0,
                avatar: vendorData.avatar || '',
                portfolio: [],
                verification: 'none',
                location: 'Beirut',
                totalPhoneReveals: 0,
            };
            
            batch.set(doc(db, 'users', userId), userProfile);
            batch.set(doc(db, 'vendors', userId), vendorProfile);
            batch.delete(doc(db, 'pendingVendors', userId));
        }
        
        // Update Firebase Auth user's emailVerified status (only in server environment)
        try {
            if (typeof window === 'undefined') {
                // Only run admin operations on server side
                await adminAuth.updateUser(userId, {
                    emailVerified: true
                });
            }
        } catch (adminError) {
            console.warn('Admin auth update failed (this is expected in client environment):', adminError);
            // Continue with Firestore updates even if admin auth fails
        }
        
        await batch.commit();
        return true;
    } catch (error) {
        console.error('Error manually verifying account:', error);
        return false;
    }
}