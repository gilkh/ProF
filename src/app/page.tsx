
'use client';

import { useState, useEffect } from 'react';
import LoginPage from './login/page';
import { MobileIntro } from '@/components/mobile-intro';
import { useIsMobile } from '@/hooks/use-mobile';
import { getMobileIntroSetting } from '@/lib/services';

// The main entry point of the app is the login/landing page.
export default function Home() {
  const [showIntro, setShowIntro] = useState(false);
  const [introCompleted, setIntroCompleted] = useState(false);
  const [mobileIntroEnabled, setMobileIntroEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load mobile intro setting from admin
        const introEnabled = await getMobileIntroSetting();
        setMobileIntroEnabled(introEnabled);
        
        // Check if user has seen intro before
        const hasSeenIntro = localStorage.getItem('hasSeenIntro');
        
        // Show intro only if:
        // 1. Admin has enabled mobile intro
        // 2. User is on mobile
        // 3. User hasn't seen intro before
        // 4. Intro hasn't been completed in this session
        if (introEnabled && isMobile && !hasSeenIntro && !introCompleted) {
          setShowIntro(true);
        }
      } catch (error) {
        console.error('Failed to load mobile intro setting:', error);
        // Default behavior if setting fails to load
        const hasSeenIntro = localStorage.getItem('hasSeenIntro');
        if (isMobile && !hasSeenIntro && !introCompleted) {
          setShowIntro(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [isMobile, introCompleted]);

  const handleIntroComplete = () => {
    setShowIntro(false);
    setIntroCompleted(true);
    localStorage.setItem('hasSeenIntro', 'true');
  };

  // Show loading state while checking settings
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (showIntro && mobileIntroEnabled) {
    return <MobileIntro onComplete={handleIntroComplete} />;
  }

  return <LoginPage />;
}
