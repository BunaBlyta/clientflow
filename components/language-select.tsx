"use client";

import { Globe } from "lucide-react";
import { useLocale, LOCALE_LABELS, LOCALES } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function LanguageSelect({ compact = false, showIcon = true }: { compact?: boolean; showIcon?: boolean }) {
  const { locale, setLocale, t } = useLocale();

  if (compact) {
    return (
      <Select value={locale} onValueChange={(value) => value && setLocale(value as typeof locale)}>
        <SelectTrigger
          aria-label={t("language.label")}
          className="marketing-lang-trigger size-8 border-0 bg-transparent p-0 shadow-none [&>svg:last-child]:hidden"
        >
          <Globe className="size-4 text-muted-foreground" aria-hidden="true" />
        </SelectTrigger>
        <SelectContent>
          {LOCALES.map((item) => <SelectItem key={item} value={item}>{LOCALE_LABELS[item]}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="flex items-center">
      {showIcon && <Globe className="mr-1.5 size-3.5 text-muted-foreground" aria-hidden="true" />}
      <Select value={locale} onValueChange={(value) => value && setLocale(value as typeof locale)}>
        <SelectTrigger aria-label={t("language.label")} className="h-8 w-[104px] border-0 bg-transparent px-2 text-[12px] shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LOCALES.map((item) => <SelectItem key={item} value={item}>{LOCALE_LABELS[item]}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
