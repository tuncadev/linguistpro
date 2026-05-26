import {DEFAULT_LOCALE, normalizeLocale, SUPPORTED_LOCALES, type AppLocale} from './routing';

export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';

export function extractLocaleFromPathname(pathname: string): AppLocale | null {
  const parts = pathname.split('/').filter(Boolean);
  const first = parts[0];
  if (!first) return null;
  return (SUPPORTED_LOCALES as readonly string[]).includes(first) ? (first as AppLocale) : null;
}

export function stripLocalePrefix(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return '/';
  if ((SUPPORTED_LOCALES as readonly string[]).includes(parts[0])) {
    const rest = parts.slice(1).join('/');
    return rest ? `/${rest}` : '/';
  }
  return pathname;
}

export function localizePath(pathname: string, locale: AppLocale): string {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const withoutLocale = stripLocalePrefix(normalized);
  return withoutLocale === '/' ? `/${locale}` : `/${locale}${withoutLocale}`;
}

export function resolvePreferredLocale(input: {
  pathname?: string;
  cookieLocale?: string | null;
  profileLocale?: string | null;
}): AppLocale {
  const pathLocale = input.pathname ? extractLocaleFromPathname(input.pathname) : null;
  if (pathLocale) return pathLocale;
  if (input.profileLocale) return normalizeLocale(input.profileLocale);
  if (input.cookieLocale) return normalizeLocale(input.cookieLocale);
  return DEFAULT_LOCALE;
}
