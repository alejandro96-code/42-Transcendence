import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const fetchTranslation = async (lng: string) => {
  const response = await fetch(`/locals/${lng}/translation.json`);
  return await response.json();
};

const esTranslation = await fetchTranslation('es');
const enTranslation = await fetchTranslation('en');
const euTranslation = await fetchTranslation('eu');

i18n
  .use(initReactI18next)
  .init({
    lng: 'es',
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

export default i18n;