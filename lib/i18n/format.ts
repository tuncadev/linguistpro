import { DEFAULT_LOCALE, normalizeLocale } from "@/i18n/routing";

function resolveLocale(locale: string | null | undefined): string {
  if (!locale) {
    return DEFAULT_LOCALE;
  }
  return normalizeLocale(locale);
}

export function formatCurrency(
  value: number,
  locale: string | null | undefined,
  currency = "USD",
  maximumFractionDigits = 2
): string {
  return new Intl.NumberFormat(resolveLocale(locale), {
    style: "currency",
    currency,
    maximumFractionDigits,
  }).format(value);
}

export function formatNumber(value: number, locale: string | null | undefined): string {
  return new Intl.NumberFormat(resolveLocale(locale)).format(value);
}

export function formatDate(
  value: Date | string | number,
  locale: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(resolveLocale(locale), options).format(date);
}
