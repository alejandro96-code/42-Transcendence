import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const SUPPORTED_LANGUAGES = ['es', 'en', 'eu'];
const STORED_LANGUAGE_KEY = 'transcendence_language';

function readStoredLanguage(): string | null {
  try {
    const stored = window.localStorage.getItem(STORED_LANGUAGE_KEY);
    return stored && SUPPORTED_LANGUAGES.includes(stored) ? stored : null;
  } catch {
    return null;
  }
}

const fetchTranslation = async (lng: string) => {
  const response = await fetch(`/locals/${lng}/translation.json`);
  return await response.json();
};

const esTranslation = await fetchTranslation('es');
const enTranslation = await fetchTranslation('en');
const euTranslation = await fetchTranslation('eu');

const initialLanguage = readStoredLanguage() || 'es';

i18n
  .use(initReactI18next)
  .init({
    lng: initialLanguage,
    fallbackLng: 'es',
    resources: {
      es: { translation: esTranslation },
      en: { translation: enTranslation },
      eu: { translation: euTranslation },
    },
    react: {
      useSuspense: false,
    },
    interpolation: {
      escapeValue: false,
    },
  });

document.documentElement.lang = initialLanguage;

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;

  try {
    window.localStorage.setItem(STORED_LANGUAGE_KEY, lng);
  } catch {
    // Ignore storage failures (private browsing, quota, etc.).
  }
});

export default i18n;