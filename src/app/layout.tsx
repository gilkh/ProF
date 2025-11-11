
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
                 <meta name="description" content={translations.meta.description} />
                 {/* Ensure Capacitor JS bridge is available when loading remote URL */}
                 <script src="https://cdn.jsdelivr.net/npm/@capacitor/core@latest/dist/capacitor.js" defer></script>
                 <link rel="icon" href="/logo-web.png" type="image/png" />
                 <link rel="icon" href="/logo-web.png" sizes="32x32" type="image/png" />
                 <link rel="icon" href="/logo-web.png" sizes="16x16" type="image/png" />
                 <link rel="apple-touch-icon" href="/logo-web.png" />
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
