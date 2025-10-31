'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { ChevronDown, Sparkles, Users, Calendar, Star, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MobileIntroProps {
  onComplete: () => void;
}

export function MobileIntro({ onComplete }: MobileIntroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const slides = [
    {
      id: 1,
      title: "Welcome to Our Platform",
      subtitle: "Lebanon's Premier Event Platform",
      description: "Turn your dreams into unforgettable celebrations with Lebanon's finest event professionals",
      gradient: "from-purple-600 via-pink-600 to-red-600"
    },
    {
      id: 2,
      title: "Everything You Need",
      subtitle: "All in One Place",
      description: "From venues to vendors, photography to catering - we connect you with verified professionals for every aspect of your event",
      gradient: "from-blue-600 via-purple-600 to-pink-600"
    }
  ];

  const handleScroll = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // After second scroll, hide intro and show main content
      setIsVisible(false);
      setTimeout(() => {
        onComplete();
      }, 300);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden min-h-screen">
      {/* Current Slide */}
      <div className="relative h-full w-full min-h-screen transition-transform duration-500 ease-in-out">
        <div className="absolute inset-0">
          <div className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].gradient}`}></div>
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-6 text-white">
          {/* Header */}
          <div className="flex justify-between items-center pt-4">
            <div className="flex items-center gap-2">
              <Logo className="text-white" />
              <span className="text-lg font-bold">Farhetkoun</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSkip}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              Skip
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col justify-center text-center px-4">
            <div className="mb-6">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm mb-4">
                ✨ {slides[currentSlide].subtitle}
              </Badge>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
              {slides[currentSlide].title}
            </h1>
            
            <p className="text-lg text-white/90 mb-8 leading-relaxed max-w-md mx-auto">
              {slides[currentSlide].description}
            </p>

            {/* Stats for first slide */}
            {currentSlide === 0 && (
              <div className="grid grid-cols-3 gap-4 mb-8 max-w-sm mx-auto">
                <div className="text-center">
                  <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-xl font-bold">500+</div>
                  <div className="text-white/80 text-xs">Vendors</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="text-xl font-bold">2K+</div>
                  <div className="text-white/80 text-xs">Events</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Star className="w-5 h-5" />
                  </div>
                  <div className="text-xl font-bold">4.9</div>
                  <div className="text-white/80 text-xs">Rating</div>
                </div>
              </div>
            )}

            {/* Features for second slide */}
            {currentSlide === 1 && (
              <div className="space-y-4 mb-8 max-w-sm mx-auto">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-sm">AI-Powered Planning</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-sm">Verified Professionals</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Star className="w-4 h-4" />
                  </div>
                  <span className="text-sm">Secure & Trusted</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Section */}
          <div className="pb-8">
            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mb-6">
              {slides.map((_, index) => (
                <div 
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide ? 'bg-white w-6' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>

            {/* Action */}
            {currentSlide < slides.length - 1 ? (
              <div className="text-center">
                <Button 
                  onClick={handleScroll}
                  size="lg"
                  className="w-full bg-white text-black hover:bg-white/90 h-14 text-lg font-semibold"
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <div className="mt-4 flex justify-center animate-bounce">
                  <ChevronDown className="w-6 h-6 text-white/60" />
                </div>
                <p className="text-white/60 text-sm mt-2">Swipe up or tap to continue</p>
              </div>
            ) : (
              <div className="text-center">
                <Button 
                  onClick={handleScroll}
                  size="lg"
                  className="w-full bg-white text-black hover:bg-white/90 h-14 text-lg font-semibold"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <div className="mt-4 flex justify-center animate-bounce">
                  <ChevronDown className="w-6 h-6 text-white/60" />
                </div>
                <p className="text-white/60 text-sm mt-2">Ready to plan your event?</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Touch/Swipe Handler for Mobile */}
      <div 
        className="absolute inset-0 z-20"
        onTouchStart={(e) => {
          const touch = e.touches[0];
          const startY = touch.clientY;
          
          const handleTouchMove = (e: TouchEvent) => {
            const touch = e.touches[0];
            const currentY = touch.clientY;
            const diff = startY - currentY;
            
            if (diff > 50) { // Swipe up
              handleScroll();
              document.removeEventListener('touchmove', handleTouchMove);
            }
          };
          
          document.addEventListener('touchmove', handleTouchMove);
          document.addEventListener('touchend', () => {
            document.removeEventListener('touchmove', handleTouchMove);
          }, { once: true });
        }}
      />
    </div>
  );
}