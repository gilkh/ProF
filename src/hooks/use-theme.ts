
'use client';

import { useState, useEffect, useCallback } from 'react';

export function useTheme() {
  const [theme, rawSetTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // This code runs only on the client side
    try {
      const storedTheme = localStorage.getItem('color-theme') as 'light' | 'dark' | null;
      if (storedTheme) {
        rawSetTheme(storedTheme);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        rawSetTheme('dark');
      }
    } catch (error) {
      console.error("Could not access localStorage. Theme will default to light.", error);
    }
  }, []);

  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    try {
        localStorage.setItem('color-theme', newTheme);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(newTheme);
        document.documentElement.style.colorScheme = newTheme;
        rawSetTheme(newTheme);
    } catch (error) {
        console.error("Could not access localStorage to set theme.", error);
    }
  }, []);

  return { theme, setTheme };
}
