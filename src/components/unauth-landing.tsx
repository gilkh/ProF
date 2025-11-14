"use client";

import { useState, useEffect } from 'react';
import LoginPage from '@/app/login/page';
import { MobileIntro } from '@/components/mobile-intro';
import { useIsMobile } from '@/hooks/use-mobile';
import { getMobileIntroSetting } from '@/lib/services';

export default function UnauthLanding() {
  const [showIntro, setShowIntro] = useState(false);
  const [introCompleted, setIntroCompleted] = useState(false);
  const [mobileIntroEnabled, setMobileIntroEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const introEnabled = await getMobileIntroSetting();
        setMobileIntroEnabled(introEnabled);
        const hasSeenIntro = localStorage.getItem('hasSeenIntro');
        if (introEnabled && isMobile && !hasSeenIntro && !introCompleted) {
          setShowIntro(true);
        }
      } catch (error) {
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

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (showIntro && mobileIntroEnabled) {
    return <MobileIntro onComplete={handleIntroComplete} />;
  }

  return <LoginPage />;
}