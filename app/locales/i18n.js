"use client";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
//
import enLocales from "./en.json";
import arLocales from "./ar.json";
import frLocales from "./fr.json";

// ----------------------------------------------------------------------

// Default language
const defaultLanguage = "en";

// Get language from localStorage if available (only on client side)
let initialLanguage = defaultLanguage;
if (typeof window !== "undefined") {
  initialLanguage = localStorage.getItem("i18nextLng") || defaultLanguage;
}

// Initialize immediately to ensure instance is available
i18n.use(initReactI18next).init({
  resources: {
    en: { translations: enLocales },
    ar: { translations: arLocales },
    fr: { translations: frLocales },
  },
  lng: initialLanguage,
  fallbackLng: defaultLanguage,
  debug: false,
  ns: ["translations"],
  defaultNS: "translations",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
