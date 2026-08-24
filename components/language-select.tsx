"use client";

import { Globe } from "lucide-react";
import { useLocale, LOCALE_LABELS, LOCALES } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const LOCALE_FLAGS = {
  en: "🇬🇧",
  de: "🇩🇪",
  sq: "🇦🇱",
} as const;

export function LanguageSelect({
  compact = false,
  showIcon = true,
  contentClassName,
  shortLabel = false,
  triggerClassName,
}: {
  compact?: boolean;
  showIcon?: boolean;
  contentClassName?: string;
  shortLabel?: boolean;
  triggerClassName?: string;
}) {
  const { locale, setLocale, t } = useLocale();

  if (compact) {
    return (
      <Select value={locale} onValueChange={(value) => value && setLocale(value as typeof locale)}>
        <SelectTrigger
          aria-label={t("language.label")}
          className={cn(
            "marketing-lang-trigger size-8 border-0 bg-transparent p-0 shadow-none [&>svg:last-child]:hidden",
            triggerClassName,
          )}
        >
          <Globe className="size-4 text-muted-foreground" aria-hidden="true" />
        </SelectTrigger>
        <SelectContent
          align="end"
          alignItemWithTrigger={false}
          className="marketing-language-content crm-language-content !w-auto !min-w-0"
        >
          {LOCALES.map((item) => (
            <SelectItem className="crm-language-item !p-2 [&>span:last-child]:hidden" key={item} value={item}>
              <span className="text-sm leading-none" aria-hidden="true">{LOCALE_FLAGS[item]}</span>
              {LOCALE_LABELS[item]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="flex items-center">
      {showIcon && <Globe className="mr-1.5 size-3.5 text-muted-foreground" aria-hidden="true" />}
      <Select value={locale} onValueChange={(value) => value && setLocale(value as typeof locale)}>
        <SelectTrigger
          aria-label={t("language.label")}
          className={cn(
            "h-8 w-[104px] border-0 bg-transparent px-2 text-[12px] shadow-none",
            triggerClassName,
          )}
        >
          {shortLabel ? <span className="text-[11px]">{locale.toUpperCase()}</span> : <SelectValue />}
        </SelectTrigger>
        <SelectContent className={contentClassName}>
          {LOCALES.map((item) => (
            <SelectItem className="crm-language-item [&>span:last-child]:hidden" key={item} value={item}>
              {LOCALE_LABELS[item]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
