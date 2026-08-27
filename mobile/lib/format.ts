import type { Language } from './i18n';

function localeFor(language: Language): string {
  if (language === 'sq') return 'sq-AL';
  if (language === 'de') return 'de-DE';
  return 'en-US';
}

// Hermes's bundled ICU data doesn't reliably support month names for every
// locale — Intl.DateTimeFormat's 'short' (and sometimes 'long') month for
// Albanian came back as a naive character truncation ("Gusht" -> "Gush")
// rather than a real abbreviation, the same class of gap already hit with
// Intl.RelativeTimeFormat elsewhere in this file. Hardcode full month names
// per language instead of trusting the engine's locale data for them.
const MONTH_NAMES: Record<Language, string[]> = {
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  sq: [
    'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
    'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor',
  ],
  de: [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ],
};

// Keeps the locale-correct day/month/year order and punctuation from Intl
// (which Hermes handles fine for numeric parts and literals) while
// substituting our own guaranteed-correct month name for the 'month' part.
function formatWithFullMonth(
  d: Date,
  language: Language,
  options: Intl.DateTimeFormatOptions,
): string {
  const parts = new Intl.DateTimeFormat(localeFor(language), { ...options, month: 'long' }).formatToParts(d);
  return parts
    .map((part) => (part.type === 'month' ? MONTH_NAMES[language][d.getMonth()] : part.value))
    .join('');
}

export function formatCurrency(cents: number, language: Language = 'en'): string {
  return (cents / 100).toLocaleString(localeFor(language), {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

export function formatDate(iso: string, language: Language = 'en'): string {
  const d = new Date(iso);
  return formatWithFullMonth(d, language, { day: 'numeric', year: 'numeric' });
}

export function formatMonthYear(iso: string, language: Language = 'en'): string {
  const d = new Date(iso);
  return formatWithFullMonth(d, language, { year: 'numeric' });
}

export function formatDateTime(iso: string, language: Language = 'en'): string {
  const d = new Date(iso);
  return `${formatWithFullMonth(d, language, { day: 'numeric' })} · ${d.toLocaleTimeString(localeFor(language), {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

export function formatRelativeTime(iso: string, language: Language = 'en'): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) {
    if (language === 'sq') return 'sapo';
    if (language === 'de') return 'gerade eben';
    return 'just now';
  }
  if (diffMin < 60) {
    if (language === 'sq') return `para ${diffMin} min`;
    if (language === 'de') return `vor ${diffMin} Min.`;
    return `${diffMin}m ago`;
  }
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) {
    if (language === 'sq') return `para ${diffHr} orë`;
    if (language === 'de') return `vor ${diffHr} Std.`;
    return `${diffHr}h ago`;
  }
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) {
    if (language === 'sq') return `para ${diffDay} ditë`;
    if (language === 'de') return `vor ${diffDay} Tagen`;
    return `${diffDay}d ago`;
  }
  return formatDate(iso, language);
}

export function isPastDue(dueDate?: string): boolean {
  if (!dueDate) return false;
  return new Date(dueDate).getTime() < Date.now();
}
