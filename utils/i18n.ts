import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ns1 from '@/utils/locale/en.json';
import ns2 from '@/utils/locale/ar.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
     resources: {
      en: ns1,
      ar: ns2,
    },
  });

export default i18n; 