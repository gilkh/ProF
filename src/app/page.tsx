
'use client';

import { useState, useEffect } from 'react';
import LoginPage from './login/page';
import { MobileIntro } from '@/components/mobile-intro';
import { useIsMobile } from '@/hooks/use-mobile';

// The main entry point of the app is the login/landing page.
export default function Home() {
  const [showIntro, setShowIntro] = useState(false);
  const [introCompleted, setIntroCompleted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check if user has seen intro before
    const hasSeenIntro = localStorage.getItem('hasSeenIntro');
    
    // Show intro only on mobile and if user hasn't seen it
    if (isMobile && !hasSeenIntro && !introCompleted) {
      setShowIntro(true);
    }
  }, [isMobile, introCompleted]);

  const handleIntroComplete = () => {
    setShowIntro(false);
    setIntroCompleted(true);
    localStorage.setItem('hasSeenIntro', 'true');
  };

  if (showIntro) {
    return <MobileIntro onComplete={handleIntroComplete} />;
  }

  return <LoginPage />;
}
