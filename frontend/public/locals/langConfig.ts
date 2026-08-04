// i18n es una librería para idiomas
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Ruta para los archivos JSON
import esTranslation from './locals/es/translation.json';
import euTranslation from './locals/eu/translation.json';
import enTranslation from './locals/en/translation.json';

const resources = {
  es: {
    translation: esTranslation,
  },
  eu: {
    translation: euTranslation,
  },
  en: {
    translation: enTranslation,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es', // idioma default
    fallbackLng: 'es', // idioma para el fallback (por si falla algo)
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;