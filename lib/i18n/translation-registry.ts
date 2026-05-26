import { DEFAULT_LOCALE, normalizeLocale, type AppLocale } from "@/i18n/routing";
import { readLocaleMessagesFromStorage } from "@/lib/i18n/message-storage";

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type KeyResolutionResult = {
  found: boolean;
  sourceLocale: AppLocale | null;
  value: JsonValue | null;
};

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getValueByDottedKey(input: JsonObject, dottedKey: string): JsonValue | undefined {
  if (!dottedKey.trim()) {
    return undefined;
  }

  const parts = dottedKey.split(".");
  let cursor: JsonValue | JsonObject | undefined = input;

  for (const part of parts) {
    if (!isObject(cursor) || !(part in cursor)) {
      return undefined;
    }
    cursor = cursor[part];
  }

  return cursor;
}

export function mergeLocaleMessages(primary: JsonObject, fallback: JsonObject): JsonObject {
  const out: JsonObject = { ...fallback };

  for (const [key, value] of Object.entries(primary)) {
    const fallbackValue = fallback[key];
    if (isObject(value) && isObject(fallbackValue)) {
      out[key] = mergeLocaleMessages(value, fallbackValue);
      continue;
    }
    out[key] = value;
  }

  return out;
}

export function resolveTranslationKeyValue(
  locale: AppLocale,
  key: string,
  localeMessages: JsonObject,
  fallbackMessages: JsonObject
): KeyResolutionResult {
  const fromLocale = getValueByDottedKey(localeMessages, key);
  if (typeof fromLocale !== "undefined") {
    return {
      found: true,
      sourceLocale: locale,
      value: fromLocale,
    };
  }

  const fromFallback = getValueByDottedKey(fallbackMessages, key);
  if (typeof fromFallback !== "undefined") {
    return {
      found: true,
      sourceLocale: DEFAULT_LOCALE,
      value: fromFallback,
    };
  }

  return {
    found: false,
    sourceLocale: null,
    value: null,
  };
}

export async function loadLocaleMessagesRaw(locale: AppLocale): Promise<JsonObject> {
  return readLocaleMessagesFromStorage(locale, mergeLocaleMessages);
}

export async function resolveLocaleMessages(localeInput: string | null | undefined): Promise<{
  locale: AppLocale;
  messages: JsonObject;
}> {
  const locale = normalizeLocale(localeInput);
  const fallback = await loadLocaleMessagesRaw(DEFAULT_LOCALE);

  if (locale === DEFAULT_LOCALE) {
    return { locale, messages: fallback };
  }

  const localized = await loadLocaleMessagesRaw(locale);
  return {
    locale,
    messages: mergeLocaleMessages(localized, fallback),
  };
}
