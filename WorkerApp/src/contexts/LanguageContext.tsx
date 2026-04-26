import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, translate } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  isLanguageReady: boolean;
  hasSelectedLanguage: boolean;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const LANGUAGE_KEY = 'rozgarsetu-worker-lang';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLanguageReady, setIsLanguageReady] = useState(false);
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);

  // Initialize language from AsyncStorage on app startup
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
        
        if (stored && (stored === 'en' || stored === 'hi')) {
          setLanguageState(stored as Language);
          setHasSelectedLanguage(true);
          console.log(`✅ Language loaded from storage: ${stored}`);
        } else {
          // No language selected yet
          setHasSelectedLanguage(false);
          console.log('📝 No language selected yet - showing language selection screen');
        }
      } catch (error) {
        console.error('Error loading language from AsyncStorage:', error);
        setHasSelectedLanguage(false);
      } finally {
        // Mark language as ready after attempting to load
        setIsLanguageReady(true);
      }
    };

    initializeLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);
      setHasSelectedLanguage(true);
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      console.log(`✅ Language saved: ${lang}`);
    } catch (error) {
      console.error('Error saving language to AsyncStorage:', error);
    }
  };

  const value = useMemo(
    () => ({
      language,
      isLanguageReady,
      hasSelectedLanguage,
      setLanguage,
      t: (key: string) => translate(language, key),
    }),
    [hasSelectedLanguage, isLanguageReady, language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return context;
};
