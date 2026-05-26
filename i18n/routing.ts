import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['uk', 'en', 'es', 'tr', 'ru'],
  defaultLocale: 'uk',
  localePrefix: 'always'
});

export type AppLocale = (typeof routing.locales)[number];

export const SUPPORTED_LOCALES = routing.locales;
export const DEFAULT_LOCALE: AppLocale = routing.defaultLocale;

export function isSupportedLocale(locale: string | null | undefined): locale is AppLocale {
  return typeof locale === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(locale);
}

export function normalizeLocale(locale: string | null | undefined): AppLocale {
  return isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
}
