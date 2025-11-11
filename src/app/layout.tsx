
'use client';

import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { useTheme } from '@/hooks/use-theme';
import { useEffect } from 'react';
import { LanguageProvider, useLanguage } from '@/hooks/use-language';
import { initializeNotifications } from '@/lib/notifications';
import { useAuth } from '@/hooks/use-auth';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

function AppBody({ children }: { children: React.ReactNode }) {
    const { theme } = useTheme();
    const { language, translations } = useLanguage();
    const { userId } = useAuth();

    // Ensure Capacitor bridge can inject on remote URLs and attempt defensive injection if missing
    useEffect(() => {
        try {
            // Add CSP that allows Capacitor bridge scripts when loaded via remote server.url
            const csp = document.createElement('meta');
            csp.httpEquiv = 'Content-Security-Policy';
            csp.content = [
                "default-src 'self' https: http: data: blob: capacitor://localhost",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http: blob: capacitor://localhost",
                "style-src 'self' 'unsafe-inline' https: http: capacitor://localhost",
                "img-src 'self' https: http: data: blob: capacitor://localhost",
                "connect-src * ws: wss: https: http: capacitor://localhost",
                "font-src 'self' https: http: data: capacitor://localhost",
                "media-src 'self' https: http: data: blob: capacitor://localhost"
            ].join('; ');
            // Only add if not already present
            const existing = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            if (!existing) {
                document.head.appendChild(csp);
            }

            // Defensive: if Capacitor object is not present, try loading bridge scripts
            const inject = (src: string) => {
                const s = document.createElement('script');
                s.src = src;
                s.async = false;
                s.defer = false;
                // Avoid duplicate injection
                if (![...document.scripts].some(el => el.src === src)) {
                    document.head.appendChild(s);
                }
            };
            const hasCap = !!(window as any).Capacitor;
            // Attempt only once on mount
            if (!hasCap) {
                // Works only inside Capacitor WebView; harmless elsewhere (resource will fail silently)
                inject('capacitor://localhost/capacitor.js');
                inject('capacitor://localhost/capacitor-android-plugins.js');
            }
        } catch {}
    }, []);

    useEffect(() => {
        document.title = translations.meta.title;
        document.querySelector('meta[name="description"]')?.setAttribute('content', translations.meta.description);
    }, [translations]);
    
    useEffect(() => {
        if (userId) {
            initializeNotifications(userId);
        }
    }, [userId]);


    return (
        <html lang={language} dir={language === 'ar' ? 'rtl' : 'ltr'} className={theme} style={{ colorScheme: theme }}>
            <head>
                 {/* Allow Capacitor bridge scripts to load when running inside native WebView */}
                 <meta httpEquiv="Content-Security-Policy" content="default-src 'self' https: http: data: blob: capacitor://localhost; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http: blob: capacitor://localhost; style-src 'self' 'unsafe-inline' https: http: capacitor://localhost; img-src 'self' https: http: data: blob: capacitor://localhost; connect-src * ws: wss: https: http: capacitor://localhost; font-src 'self' https: http: data: capacitor://localhost; media-src 'self' https: http: data: blob: capacitor://localhost" />
                 <meta name="description" content={translations.meta.description} />
                 <link rel="icon" href="/logo-app.png" type="image/png" />
                 <link rel="icon" href="/logo-app.png" sizes="32x32" type="image/png" />
                 <link rel="icon" href="/logo-app.png" sizes="16x16" type="image/png" />
                 <link rel="apple-touch-icon" href="/logo-app.png" />
            </head>
            <body className={`${inter.variable} font-sans antialiased`}>
                {children}
                <Toaster />
            </body>
        </html>
    );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LanguageProvider>
        <AppBody>{children}</AppBody>
    </LanguageProvider>
  );
}
