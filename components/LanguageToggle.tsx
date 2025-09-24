"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

export default function LanguageToggle() {
  const { lang, setLang, t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 px-2 py-1 rounded-md border hover:bg-neutral-100">
        <Globe className="h-4 w-4" />
        <span className="text-sm">{lang === "ar" ? "العربية" : "English"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLang("ar")}>🇸🇦 العربية</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLang("en")}>🇬🇧 English</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}











