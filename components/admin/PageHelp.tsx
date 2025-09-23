"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HelpCircle, X } from "lucide-react";
import { getTranslations } from "@/lib/i18n";

interface PageHelpProps {
  pageKey: string;
  locale?: string;
  className?: string;
}

export function PageHelp({ pageKey, locale = "en", className }: PageHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [t, setT] = useState<any>(null);

  useEffect(() => {
    const loadTranslations = () => {
      try {
        const translations = getTranslations(locale);
        setT(translations);
      } catch (error) {
        console.error('Error loading translations:', error);
        setT(null);
      }
    };
    loadTranslations();
  }, [locale]);

  useEffect(() => {
    // Check if help was dismissed for this page
    const dismissed = localStorage.getItem(`help:${pageKey}`);
    if (dismissed === "true") {
      setIsOpen(false);
    }
  }, [pageKey]);

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem(`help:${pageKey}`, "true");
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      localStorage.setItem(`help:${pageKey}`, "true");
    } else {
      localStorage.removeItem(`help:${pageKey}`);
    }
  };

  // Only show help for Arabic locale
  if (locale !== "ar" || !t) return null;

  const helpKey = `help.${pageKey}`;
  const title = t(`${helpKey}.title`);
  const purpose = t(`${helpKey}.purpose`);
  const actions = t(`${helpKey}.actions`);
  const tips = t(`${helpKey}.tips`);

  // If no help content exists, don't render
  if (!title || title === `${helpKey}.title` || title === '') return null;

  return (
    <div className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleToggle}
            aria-label="عرض المساعدة"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2 w-96 max-w-[90vw]" dir="rtl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleDismiss}
                  aria-label="إغلاق المساعدة"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {/* Purpose */}
              {purpose && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-blue-600">الغرض من هذه الصفحة:</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{purpose}</p>
                </div>
              )}

              {/* Actions */}
              {actions && Array.isArray(actions) && actions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-green-600">الإجراءات المتاحة:</h4>
                  <ul className="space-y-1">
                    {actions.map((action: string, index: number) => (
                      <li key={index} className="flex items-start text-sm text-gray-700">
                        <span className="mr-2 text-green-500 mt-1">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tips */}
              {tips && Array.isArray(tips) && tips.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-amber-600">نصائح مهمة:</h4>
                  <ul className="space-y-1">
                    {tips.map((tip: string, index: number) => (
                      <li key={index} className="flex items-start text-sm text-gray-700">
                        <span className="mr-2 text-amber-500 mt-1">💡</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}