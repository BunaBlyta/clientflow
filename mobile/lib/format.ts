import type { Language } from './i18n';

function localeFor(language: Language): string {
  if (language === 'sq') return 'sq-AL';
  if (language === 'de') return 'de-DE';
  return 'en-US';
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
  return d.toLocaleDateString(localeFor(language), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string, language: Language = 'en'): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString(localeFor(language), {
    month: 'short',
    day: 'numeric',
  })} · ${d.toLocaleTimeString(localeFor(language), {
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
