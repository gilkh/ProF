'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Diag = {
  platform: string;
  isNative: boolean;
  hasCapacitor: boolean;
  plugins: string[];
  permission: string;
  tokenPreview: string;
  listeners: string[];
  notes: string[];
};

export default function NotificationsDebugPage() {
  const { userId } = useAuth();
  const [diag, setDiag] = useState<Diag>({
    platform: 'web',
    isNative: false,
    hasCapacitor: false,
    plugins: [],
    permission: 'unknown',
    tokenPreview: 'none',
    listeners: [],
    notes: [],
  });

  const cap = useMemo(() => (typeof window !== 'undefined' ? (window as any).Capacitor : undefined), []);

  useEffect(() => {
    const notes: string[] = [];
    const Plugins = cap?.Plugins || {};

    const hasCapacitor = !!cap;
    const platform = cap?.getPlatform?.() || cap?.platform || 'web';
    const isNative = !!cap?.isNativePlatform?.();
    const plugins = Object.keys(Plugins || {});

    setDiag((d) => ({ ...d, hasCapacitor, platform, isNative, plugins }));

    notes.push(`[env] platform=${platform} isNative=${isNative} hasCapacitor=${hasCapacitor} plugins=${plugins.join(',')}`);
    notes.push('[init] initializeNotifications(...) start');

    (async () => {
      // Check permission via PushNotifications if available
      if (Plugins?.PushNotifications?.checkPermissions) {
        try {
          const perm = await Plugins.PushNotifications.checkPermissions();
          const status = perm?.receive === 'granted' || perm?.receive === true ? 'granted' : String(perm?.receive || 'denied');
          setDiag((d) => ({ ...d, permission: status }));
        } catch (e) {
          notes.push(`[perm] checkPermissions error: ${String(e)}`);
        }
      }

      // Try to preview a token via FirebaseMessaging if available
      if (Plugins?.FirebaseMessaging?.getToken) {
        try {
          const { token } = await Plugins.FirebaseMessaging.getToken();
          if (token) setDiag((d) => ({ ...d, tokenPreview: `${token.slice(0, 16)}...` }));
        } catch (e) {
          notes.push(`[token] getToken error: ${String(e)}`);
        }
      }

      // Listener presence
      const listeners: string[] = [];
      if (Plugins?.FirebaseMessaging?.addListener) listeners.push('FirebaseMessaging');
      if (Plugins?.PushNotifications?.addListener) listeners.push('PushNotifications');
      setDiag((d) => ({ ...d, listeners }));

      notes.push('[init] initializeNotifications(...) done');
      setDiag((d) => ({ ...d, notes }));
    })();
  }, [cap]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Push Diagnostics (Temporary)</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 }}>
          <p>Visible only during troubleshooting. Reinstall APK and log in to see live status.</p>
          <p>User: {userId || 'none'}</p>
          <p>Platform: {diag.platform} | isNative: {String(diag.isNative)} | hasCapacitor: {String(diag.hasCapacitor)}</p>
          <p>Plugins: {diag.plugins.length ? diag.plugins.join(', ') : 'none'}</p>
          <p>Permission: {diag.permission}</p>
          <p>Token: {diag.tokenPreview}</p>
          <p>Listeners: {diag.listeners.length ? diag.listeners.join(', ') : 'none'}</p>
          <p>Steps:</p>
          <pre>{diag.notes.join('\n')}</pre>
        </div>
      </CardContent>
    </Card>
  );
}