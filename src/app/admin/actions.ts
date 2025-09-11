'use server';

import { adminVerifyAccountAction } from '@/lib/actions/admin-verification';
import { sendPushNotification, adminUpdateUserPassword } from '@/lib/actions/notifications';

export async function adminVerifyAccountServerAction(userId: string, accountType: 'client' | 'vendor'): Promise<boolean> {
  return await adminVerifyAccountAction(userId, accountType);
}

export async function sendPushNotificationServerAction(
  target: 'all' | 'vendors' | 'clients',
  title: string,
  body: string
): Promise<void> {
  return await sendPushNotification(target, title, body);
}

export async function adminUpdateUserPasswordServerAction(
  userId: string,
  newPassword: string
): Promise<void> {
  return await adminUpdateUserPassword(userId, newPassword);
}