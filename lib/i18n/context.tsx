'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import en from './en';
import zu from './zu';

export type Locale = 'en' | 'zu';

const messages: Record<Locale, Record<string, any>> = { en, zu };

interface TranslationContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');

  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('spanispace-locale') as Locale | null;
    if (saved && (saved === 'en' || saved === 'zu')) {
      setLocale(saved);
    }
  }, []);

  // Persist preference and update html lang
  useEffect(() => {
    localStorage.setItem('spanispace-locale', locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (key: string): string => {
      const keys = key.split('.');
      let value: any = messages[locale];
      for (const k of keys) {
        value = value?.[k];
      }
      return typeof value === 'string' ? value : key;
    },
    [locale],
  );

  return (
    <TranslationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}
