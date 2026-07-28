"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SunIcon, MoonIcon, BellIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { hasLanguageParams } from "@/lib/redux/slices/dashboardApplSlice";

interface Language {
  code: string;
  label: string;
  flag: string;
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/Lifecycle": "Scheme Due Day",
  "/dashboard/DueDay": " Due Day",
  "/dashboard/UserTabScreen": "Application Details",
};

export function SiteHeader() {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation("GetStartedPage");
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>({
    code: "en",
    label: "English",
    flag: "/assets/english.png",
  });
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const pageTitle = pageTitles[pathname] || "Page";
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const languages: Language[] = [
    {
      code: "en",
      label: "English",
      flag: "/assets/english.png",
    },
    { code: "ar", label: "Arabic", flag: "/assets/arabic.png" },
  ];

  useEffect(() => {
    if (i18n.resolvedLanguage) {
      document.documentElement.lang = i18n.resolvedLanguage;
      document.documentElement.dir = i18n.dir(i18n.resolvedLanguage);
      const selectedLanguage = languages.find(
        (lang) => lang.code === i18n.resolvedLanguage,
      );
      setSelectedLanguage(selectedLanguage ?? languages[0]);
    }
  }, [i18n, i18n.resolvedLanguage]);

  const toggleDropdown = () => setShowLangDropdown(!showLangDropdown);
  const selectLanguage = (lang: Language) => {
    setShowLangDropdown(false);
    i18n.changeLanguage(lang.code);
    dispatch(hasLanguageParams(lang.code === "ar" ? 2 : 1));
  };

  const toggleNotification = () => setShowNotification(!showNotification);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowLangDropdown(false);
      }
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setShowNotification(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className="
        flex shrink-0 items-center justify-between border-b py-1.5 px-4 mb-4
         border-gray-200
         dark:border-gray-700
        
        rounded-tl-xl rounded-tr-xl
      "
    >
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <h1 className="text-base font-medium">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-4 relative">
        <span className="text-sm text-black font-semibold dark:text-white">
          {currentDate}
        </span>

        <div ref={notifRef} className="relative">
          <button
            onClick={toggleNotification}
            className="
              flex items-center justify-center w-10 h-10 rounded-full
              bg-gray-100 hover:bg-gray-200 text-black
              dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white cursor-pointer
              
            "
          >
            <BellIcon className="w-5 h-5" />
            <span className="absolute top-1 right-1 inline-flex h-2 w-2 rounded-full bg-red-500" />
          </button>

          {showNotification && (
            <div
              className="
    absolute left-1/2 transform -translate-x-1/2 mt-2 w-72 rounded-xl shadow-lg z-50 p-4
    bg-white text-black border border-gray-200
    dark:bg-[#18181b] dark:text-white dark:border-gray-700
    transition-all duration-300
  "
            >
              <h3 className="text-sm font-semibold mb-3 text-center tracking-wide">
                Notifications
              </h3>

              <ul className="space-y-2 text-sm">
                <li
                  className="
        flex items-center gap-3 p-2 rounded-lg cursor-pointer
        bg-gray-50 hover:bg-gray-200
        dark:bg-[#202024] dark:hover:bg-[#2a2a2e]
        transition-colors duration-200
      "
                >
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  <p>New message received</p>
                </li>

                <li
                  className="
        flex items-center gap-3 p-2 rounded-lg cursor-pointer
        bg-gray-50 hover:bg-gray-200
        dark:bg-[#202024] dark:hover:bg-[#2a2a2e]
        transition-colors duration-200
      "
                >
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  <p>Your report is ready</p>
                </li>

                <li
                  className="
        flex items-center gap-3 p-2 rounded-lg cursor-pointer
        bg-gray-50 hover:bg-gray-200
        dark:bg-[#202024] dark:hover:bg-[#2a2a2e]
        transition-colors duration-200
      "
                >
                  <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                  <p>Server restarted successfully</p>
                </li>
              </ul>
            </div>
          )}
        </div>

        <div ref={dropdownRef} className="relative">
          <button
            onClick={toggleDropdown}
            className="
              flex items-center justify-center w-10 h-10 rounded-full
              bg-gray-100 hover:bg-gray-200 text-black
              dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white cursor-pointer
              
            "
          >
            <img
              src={selectedLanguage.flag}
              alt={selectedLanguage.label}
              className="w-5 h-5 rounded-sm"
            />
          </button>

          {showLangDropdown && (
            <div
              className="
                absolute ltr:right-0 rtl:left-0  mt-2 w-36 rounded shadow-lg z-50
                bg-white text-black
                dark:bg-gray-800 dark:text-white
                transition-colors duration-300
              "
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => selectLanguage(lang)}
                  className={`
                    flex items-center gap-2 w-full px-3 py-2 text-left rounded text-sm
                    hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors cursor-pointer
                    ${selectedLanguage.code === lang.code
                      ? "bg-gray-300 dark:bg-gray-700"
                      : ""
                    }
                  `}
                >
                  <img src={lang.flag} className="w-5 h-5 rounded-sm" />
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
          className="
    flex items-center justify-center w-10 h-10 rounded-full
    bg-gray-100 dark:bg-gray-800
    cursor-pointer
  "
        >
          {!mounted ? (
            <div className="w-5 h-5" />
          ) : resolvedTheme === "dark" ? (
            <MoonIcon className="w-5 h-5 text-white" />
          ) : (
            <SunIcon className="w-5 h-5 text-black" />
          )}
        </button>
      </div>
    </header>
  );
}
