import {getRequestConfig} from 'next-intl/server';
import {hasLocale} from 'next-intl';
import {routing} from './routing';
import { resolveLocaleMessages } from '@/lib/i18n/translation-registry';

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const resolved = await resolveLocaleMessages(locale);

  return {
    locale: resolved.locale,
    messages: resolved.messages
  };
});
