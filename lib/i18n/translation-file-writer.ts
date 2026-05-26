import fs from "node:fs/promises";
import path from "node:path";
import { DEFAULT_LOCALE, normalizeLocale, type AppLocale } from "@/i18n/routing";
import {
  getValueByDottedKey,
  loadLocaleMessagesRaw,
  type JsonObject,
  type JsonValue,
} from "@/lib/i18n/translation-registry";
import { resolveMessageFileTarget } from "@/lib/i18n/message-storage";

type UpdateTranslationParams = {
  locale: string;
  key: string;
  value: unknown;
  allowCreateKey?: boolean;
};

function backupFilePath(relativePath: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.resolve(process.cwd(), "ops", "i18n", "backups", stamp, relativePath);
}

async function readFileOrDefault(filePath: string): Promise<JsonObject> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as JsonObject;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

export function setValueByDottedKey(
  source: JsonObject,
  dottedKey: string,
  value: JsonValue,
  allowCreateKey: boolean
): JsonObject {
  const parts = dottedKey.split(".").filter(Boolean);
  if (parts.length === 0) {
    throw new Error("Invalid translation key");
  }

  const root = JSON.parse(JSON.stringify(source)) as JsonObject;
  let cursor: JsonObject | JsonValue[] = root;

  const parseIndex = (segment: string): number | null => {
    if (!/^\d+$/.test(segment)) {
      return null;
    }
    return Number(segment);
  };

  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    const nextPart = parts[i + 1];
    const nextPartIsIndex = parseIndex(nextPart) !== null;

    if (Array.isArray(cursor)) {
      const index = parseIndex(part);
      if (index === null) {
        throw new Error(`Expected array index in translation key at: ${part}`);
      }

      const next = cursor[index];
      if (typeof next === "undefined") {
        if (!allowCreateKey) {
          throw new Error(`Translation key does not exist: ${dottedKey}`);
        }
        cursor[index] = nextPartIsIndex ? [] : {};
        cursor = cursor[index] as JsonObject | JsonValue[];
        continue;
      }

      if (typeof next !== "object" || next === null) {
        throw new Error(`Translation path is not an object/array at: ${part}`);
      }
      cursor = next as JsonObject | JsonValue[];
      continue;
    }

    const next = cursor[part];
    if (typeof next === "undefined") {
      if (!allowCreateKey) {
        throw new Error(`Translation key does not exist: ${dottedKey}`);
      }
      cursor[part] = nextPartIsIndex ? [] : {};
      cursor = cursor[part] as JsonObject | JsonValue[];
      continue;
    }

    if (typeof next !== "object" || next === null) {
      throw new Error(`Translation path is not an object/array at: ${part}`);
    }
    cursor = next as JsonObject | JsonValue[];
  }

  const leaf = parts[parts.length - 1];
  if (Array.isArray(cursor)) {
    const leafIndex = parseIndex(leaf);
    if (leafIndex === null) {
      throw new Error(`Expected array index in translation key at leaf: ${leaf}`);
    }
    if (!allowCreateKey && typeof cursor[leafIndex] === "undefined") {
      throw new Error(`Translation key does not exist: ${dottedKey}`);
    }
    cursor[leafIndex] = value;
    return root;
  }

  if (!allowCreateKey && typeof cursor[leaf] === "undefined") {
    throw new Error(`Translation key does not exist: ${dottedKey}`);
  }
  cursor[leaf] = value;
  return root;
}

async function writeLocaleFileAtomic(target: string, content: JsonObject, backup: string): Promise<void> {
  const tmp = `${target}.tmp`;

  await fs.mkdir(path.dirname(backup), { recursive: true });
  await fs.mkdir(path.dirname(target), { recursive: true });

  const currentRaw = await fs.readFile(target, "utf8").catch((error) => {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return "{}\n";
    }
    throw error;
  });
  await fs.writeFile(backup, currentRaw, "utf8");

  const nextRaw = `${JSON.stringify(content, null, 2)}\n`;
  JSON.parse(nextRaw);
  await fs.writeFile(tmp, nextRaw, "utf8");
  await fs.rename(tmp, target);
}

export async function updateTranslationKey(params: UpdateTranslationParams): Promise<{
  locale: AppLocale;
  key: string;
  value: JsonValue;
  previousValue: JsonValue | undefined;
  backupPath: string;
}> {
  const locale = normalizeLocale(params.locale);
  const key = params.key.trim();
  const allowCreateKey = Boolean(params.allowCreateKey);
  const value = JSON.parse(JSON.stringify(params.value ?? null)) as JsonValue;

  if (!key) {
    throw new Error("Translation key is required");
  }

  const fileTarget = await resolveMessageFileTarget(locale, key);
  const source = await readFileOrDefault(fileTarget.absolutePath);
  const localeMerged = await loadLocaleMessagesRaw(locale);
  const previousValue = getValueByDottedKey(localeMerged, key);
  const updated = setValueByDottedKey(source, key, value, allowCreateKey);
  const backupPath = backupFilePath(fileTarget.relativePath);
  await writeLocaleFileAtomic(fileTarget.absolutePath, updated, backupPath);

  return {
    locale,
    key,
    value,
    previousValue,
    backupPath,
  };
}

export async function getTranslationKeyValue(input: {
  locale: string;
  key: string;
}): Promise<{
  locale: AppLocale;
  key: string;
  value: JsonValue | undefined;
  fallbackValue: JsonValue | undefined;
}> {
  const locale = normalizeLocale(input.locale);
  const key = input.key.trim();
  if (!key) {
    throw new Error("Translation key is required");
  }

  const localeFile = await loadLocaleMessagesRaw(locale);
  const fallbackFile = locale === DEFAULT_LOCALE ? localeFile : await loadLocaleMessagesRaw(DEFAULT_LOCALE);
  return {
    locale,
    key,
    value: getValueByDottedKey(localeFile, key),
    fallbackValue: getValueByDottedKey(fallbackFile, key),
  };
}
