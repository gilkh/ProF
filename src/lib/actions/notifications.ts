
'use server';

import { adminDb, adminAuth, adminMessaging, admin } from '@/lib/firebase-admin';
import type { UserProfile } from '@/lib/types';

export async function sendPushNotification(target: 'all' | 'clients' | 'vendors', title: string, body: string) {
    try {
        const usersSnapshot = await adminDb.collection('users').get();
        let targetUsers = usersSnapshot.docs;

        if (target === 'clients') {
            const vendorsSnapshot = await adminDb.collection('vendors').get();
            const vendorIds = new Set(vendorsSnapshot.docs.map(doc => doc.id));
            targetUsers = usersSnapshot.docs.filter(doc => !vendorIds.has(doc.id));
        } else if (target === 'vendors') {
            const vendorsSnapshot = await adminDb.collection('vendors').get();
            const vendorIds = new Set(vendorsSnapshot.docs.map(doc => doc.id));
            targetUsers = usersSnapshot.docs.filter(doc => vendorIds.has(doc.id));
        }

        const tokens: string[] = [];
        targetUsers.forEach(doc => {
            const data = doc.data() as UserProfile;
            if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
                tokens.push(...data.fcmTokens);
            }
        });

        if (tokens.length === 0) {
            console.log("No FCM tokens found for the selected target group.");
            return { success: false, message: "No devices to send to." };
        }
        
        const message = {
            notification: { title, body },
            tokens: [...new Set(tokens)], // Remove duplicate tokens
        };

        const response = await adminMessaging.sendEachForMulticast(message);
        console.log(`${response.successCount} messages were sent successfully`);
        
        if (response.failureCount > 0) {
            console.warn("Failed to send to some devices", response.responses);
            // Clean up invalid tokens to improve future delivery reliability
            const tokensArray = message.tokens as string[];
            const invalidTokenIndices = response.responses
              .map((r, idx) => ({ idx, error: r.error }))
              .filter(r => !!r.error && (
                r.error?.code === 'messaging/invalid-registration-token' ||
                r.error?.code === 'messaging/registration-token-not-registered'
              ))
              .map(r => r.idx);

            const tokensToRemove = invalidTokenIndices.map(i => tokensArray[i]);
            if (tokensToRemove.length) {
              console.warn('Pruning invalid tokens:', tokensToRemove);
              for (const t of tokensToRemove) {
                try {
                  const snap = await adminDb.collection('users').where('fcmTokens', 'array-contains', t).get();
                  const batch = adminDb.batch();
                  snap.docs.forEach(doc => {
                    batch.update(doc.ref, { fcmTokens: admin.firestore.FieldValue.arrayRemove(t) });
                  });
                  await batch.commit();
                } catch (pruneErr) {
                  console.warn('Failed to prune token', t, pruneErr);
                }
              }
            }
        }

        return { success: true, message: `${response.successCount} notifications sent.` };

    } catch (error) {
        console.error('Error sending push notification:', error);
        throw error;
    }
}


export async function adminUpdateUserPassword(userId: string, newPassword: string): Promise<void> {
    console.log(`🔍 adminUpdateUserPassword called with userId: "${userId}"`);
    console.log(`🔍 Password length: ${newPassword.length} characters`);
    
    try {
        // First, let's verify the user exists in Firebase Auth
        const userRecord = await adminAuth.getUser(userId);
        console.log(`✅ Firebase Auth user found:`, {
            uid: userRecord.uid,
            email: userRecord.email,
            emailVerified: userRecord.emailVerified,
            disabled: userRecord.disabled,
            providerData: userRecord.providerData.map(p => ({ providerId: p.providerId, uid: p.uid }))
        });
        
        // Now update the password
        await adminAuth.updateUser(userId, {
            password: newPassword,
        });
        console.log(`✅ Successfully updated password for Firebase Auth user ${userId} (${userRecord.email})`);
    } catch (error: any) {
        console.error(`❌ Failed to update password for user ${userId}:`, error);
        
        // Provide more specific error messages based on the error type
        if (error.code === 'auth/user-not-found') {
            throw new Error(`User not found in Firebase Auth. The user ID "${userId}" may be incorrect or the user may have been deleted.`);
        } else if (error.code === 'auth/insufficient-permission') {
            throw new Error("Insufficient permissions. Please check Firebase Admin SDK configuration and IAM roles.");
        } else if (error.message?.includes('PERMISSION_DENIED')) {
            throw new Error("Permission denied. Please ensure the Firebase service account has the required IAM roles: Service Usage Consumer, Firebase Admin SDK Administrator Service Agent.");
        } else if (error.message?.includes('serviceusage.services.use')) {
            throw new Error("Missing Service Usage Consumer role. Please add 'roles/serviceusage.serviceUsageConsumer' to your Firebase service account in Google Cloud Console IAM.");
        }
        
        throw new Error(`Could not update the user's password: ${error.message || 'Unknown error'}`);
    }
}
