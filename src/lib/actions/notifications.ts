
'use server';

import { collection, getDocs } from 'firebase/firestore';
import { adminDb, adminAuth, adminMessaging } from '@/lib/firebase-admin';
import type { UserProfile } from '@/lib/types';

export async function sendPushNotification(target: 'all' | 'clients' | 'vendors', title: string, body: string) {
    try {
        const usersSnapshot = await getDocs(collection(adminDb, "users"));
        let targetUsers = usersSnapshot.docs;

        if (target === 'clients') {
            const vendorsSnapshot = await getDocs(collection(adminDb, "vendors"));
            const vendorIds = new Set(vendorsSnapshot.docs.map(doc => doc.id));
            targetUsers = usersSnapshot.docs.filter(doc => !vendorIds.has(doc.id));
        } else if (target === 'vendors') {
            const vendorsSnapshot = await getDocs(collection(adminDb, "vendors"));
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
        }

        return { success: true, message: `${response.successCount} notifications sent.` };

    } catch (error) {
        console.error('Error sending push notification:', error);
        throw error;
    }
}


export async function adminUpdateUserPassword(userId: string, newPassword: string): Promise<void> {
    try {
        await adminAuth.updateUser(userId, {
            password: newPassword,
        });
    } catch(error) {
        console.error(`Failed to update password for user ${userId}`, error);
        throw new Error("Could not update the user's password via Admin SDK.");
    }
}
