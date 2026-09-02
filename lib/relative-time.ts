import type { Locale } from "@/lib/locales";
import { INTL_LOCALE } from "@/lib/format";

type Translate = (key: string, values?: Record<string, string | number>) => string;

const THRESHOLDS: { limit: number; unit: Intl.RelativeTimeFormatUnit; per: number; key: string }[] = [
  { limit: 60, unit: "minute", per: 1, key: "time.minutesAgo" },
  { limit: 24, unit: "hour", per: 60, key: "time.hoursAgo" },
  { limit: 30, unit: "day", per: 60 * 24, key: "time.daysAgo" },
];
const MONTHS = { unit: "month" as const, per: 60 * 24 * 30, key: "time.monthsAgo" };

/**
 * "5m ago", "vor 3 Std.", "3 orë më parë".
 *
 * English and German go through Intl, whose narrow style keeps English byte
 * for byte identical to the hand-rolled format this replaced, so the timestamp
 * column does not change width. Albanian is rendered from the catalogue for
 * the same reason `formatDate` spells its months out: browsers that ship no
 * Albanian locale data fall back to English without saying so.
 */
export function formatRelativeTime(iso: string, locale: Locale, t: Translate): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return t("common.justNow");

  const step =
    THRESHOLDS.find(({ limit, per }) => Math.round(minutes / per) < limit) ?? MONTHS;
  const count = Math.round(minutes / step.per);

  if (locale === "sq") return t(step.key, { count });

  return new Intl.RelativeTimeFormat(INTL_LOCALE[locale], {
    numeric: "auto",
    style: "narrow",
  }).format(-count, step.unit);
}
