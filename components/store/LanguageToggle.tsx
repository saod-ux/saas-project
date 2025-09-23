"use client";

import { useState, useEffect } from "react";

export default function LanguageToggle() {
  const [lang, setLang] = useState<"ar" | "en">("ar");

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem("lang") as "ar" | "en" | null;
    if (stored) {
      setLang(stored);
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = lang === "ar" ? "en" : "ar";
    setLang(newLang);
    
    // Update document
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    
    // Update localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", newLang);
      
      // Dispatch custom event for other components to listen
      window.dispatchEvent(new CustomEvent("languageChanged"));
    }
  };

  return (
    <button
      onClick={toggleLanguage}
      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white 
                 px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:border-gray-300 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                 transition-all duration-200 hover:scale-105 hover:shadow-md group"
      aria-label="Toggle language"
    >
      <span className="text-lg group-hover:scale-110 transition-transform">
        {lang === "ar" ? "🇸🇦" : "🇬🇧"}
      </span>
      <span className="text-sm font-semibold tracking-tight">
        {lang === "ar" ? "العربية" : "English"}
      </span>
    </button>
  );
}