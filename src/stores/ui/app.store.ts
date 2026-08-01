import { create } from 'zustand';
import i18n, { isRTL } from '@/i18n';

type SupportedLanguage = 'en' | 'ar';
type TextDirection = 'ltr' | 'rtl';

interface AppStoreState {
  language: SupportedLanguage;
  direction: TextDirection;
  initialized: boolean;
  setLanguage: (language: SupportedLanguage) => void;
  initializeLanguage: () => void;
}

const setDocumentDirection = (direction: TextDirection) => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('dir', direction);
  }
};

const getStoredLanguage = (): SupportedLanguage | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem('i18nextLng');
  if (stored === 'en' || stored === 'ar') {
    return stored;
  }

  return null;
};

export const useAppStore = create<AppStoreState>((set) => ({
  language: (i18n.language === 'ar' ? 'ar' : 'en'),
  direction: isRTL(i18n.language) ? 'rtl' : 'ltr',
  initialized: false,
  setLanguage: (language) => {
    const direction = isRTL(language) ? 'rtl' : 'ltr';

    void i18n.changeLanguage(language);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('i18nextLng', language);
    }

    setDocumentDirection(direction);

    set({ language, direction, initialized: true });
  },
  initializeLanguage: () => {
    const stored = getStoredLanguage();
    const language = stored ?? (i18n.language === 'ar' ? 'ar' : 'en');
    const direction = isRTL(language) ? 'rtl' : 'ltr';

    setDocumentDirection(direction);
  
    if (language !== i18n.language) {
      void i18n.changeLanguage(language);
    }

    set({ language, direction, initialized: true });
  }
}));
