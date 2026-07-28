"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import i18n from "@/app/locales/i18n";

type Lang = {
  label: string;
  value: string;
  icon?: string;
  dir?: "ltr" | "rtl";
};

const LANGS: Lang[] = [
  {
    label: "English",
    value: "en",
    dir: "ltr",
    icon: "https://upload.wikimedia.org/wikipedia/en/thumb/a/a4/Flag_of_the_United_States.svg/1280px-Flag_of_the_United_States.svg.png",
  },
  {
    label: "Arabic",
    value: "ar",
    dir: "rtl",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Flag_of_Saudi_Arabia_%281938%E2%80%931973%29.svg/2560px-Flag_of_Saudi_Arabia_%281938%E2%80%931973%29.svg.png",
  },
];

function getStoredLang(): string | null {
  if (typeof window === "undefined") return null;
  // i18next default key:
  return localStorage.getItem("i18nextLng");
}

export default function useLocales() {
  // force this hook to use your i18n instance
  const { t: translate } = useTranslation(["translations"], { i18n });

  const defaultLang = LANGS[0];

  const [currentLang, setCurrentLang] = useState<Lang>(defaultLang);

  useEffect(() => {
    const stored = getStoredLang();
    const detected = LANGS.find((l) => l.value === stored) || defaultLang;
    setCurrentLang(detected);
  }, []);

  const onChangeLang = async (newLang: string) => {
    const next = LANGS.find((l) => l.value === newLang) || defaultLang;

    await i18n.changeLanguage(next.value);

    setCurrentLang(next);

    if (typeof window !== "undefined") {
      localStorage.setItem("i18nextLng", next.value);

      // Optional UX: set document direction for Arabic
      document.documentElement.lang = next.value;
      document.documentElement.dir = next.dir ?? "ltr";
    }
  };

  const allLang = useMemo(() => LANGS, []);

  return {
    onChangeLang,
    translate,
    currentLang,
    allLang,
  };
}
