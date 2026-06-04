import React, { createContext, useState, useMemo, useContext } from "react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translations from "./index";

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(localStorage.getItem("app_lang") || "en");

  const i18nInstance = useMemo(() => {
    const instance = i18n.createInstance();
    instance.use(initReactI18next).init({
      resources: {
        en: { translation: translations.en },
        ta: { translation: translations.ta },
      },
      lng: lang,
      fallbackLng: "en",
      interpolation: {
        escapeValue: false,
      },
    });
    return instance;
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang: (newLang) => {
        localStorage.setItem("app_lang", newLang);
        setLang(newLang);
      },
      t: i18nInstance.t,
    }),
    [lang, i18nInstance]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
