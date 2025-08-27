
'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { translations, TranslationType } from '@/lib/translations';

type Language = 'en' | 'fr' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  translations: TranslationType;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, rawSetLanguage] = useState<Language>('en');

  useEffect(() => {
    try {
      const storedLanguage = localStorage.getItem('language') as Language | null;
      if (storedLanguage && ['en', 'fr', 'ar'].includes(storedLanguage)) {
        rawSetLanguage(storedLanguage);
      }
    } catch (error) {
      console.error("Could not access localStorage. Language will default to English.", error);
    }
  }, []);

  const setLanguage = useCallback((newLanguage: Language) => {
    try {
      localStorage.setItem('language', newLanguage);
      rawSetLanguage(newLanguage);
      if (newLanguage === 'ar') {
        document.documentElement.dir = 'rtl';
      } else {
        document.documentElement.dir = 'ltr';
      }
    } catch (error) {
      console.error("Could not access localStorage to set language.", error);
    }
  }, []);

  const value = {
    language,
    setLanguage,
    translations: translations[language],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
