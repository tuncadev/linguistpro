import fs from "node:fs/promises";
import path from "node:path";
import { type AppLocale } from "@/i18n/routing";
import type { JsonObject } from "@/lib/i18n/translation-registry";

export type MessageFileTarget = {
  mode: "sharded" | "monolith";
  absolutePath: string;
  relativePath: string;
};

function messagesRoot(): string {
  return path.resolve(process.cwd(), "messages");
}

export function localeMonolithPath(locale: AppLocale): string {
  return path.join(messagesRoot(), `${locale}.json`);
}

export function localeShardDir(locale: AppLocale): string {
  return path.join(messagesRoot(), locale);
}

async function exists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function localeUsesShards(locale: AppLocale): Promise<boolean> {
  const shardDir = localeShardDir(locale);
  return exists(shardDir);
}

async function listJsonFilesRecursive(root: string): Promise<string[]> {
  const out: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(".json")) {
        out.push(fullPath);
      }
    }
  }

  await walk(root);
  out.sort((a, b) => a.localeCompare(b));
  return out;
}

export async function readLocaleMessagesFromStorage(
  locale: AppLocale,
  mergeFn: (primary: JsonObject, fallback: JsonObject) => JsonObject
): Promise<JsonObject> {
  if (!(await localeUsesShards(locale))) {
    const raw = await fs.readFile(localeMonolithPath(locale), "utf8");
    return JSON.parse(raw) as JsonObject;
  }

  const shardDir = localeShardDir(locale);
  const files = await listJsonFilesRecursive(shardDir);
  let merged: JsonObject = {};

  for (const file of files) {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as JsonObject;
    merged = mergeFn(parsed, merged);
  }

  return merged;
}

function keyToShardRelativePath(key: string): string {
  const [root, second] = key.split(".");

  if (root === "content" && second) {
    return path.join("content", `${second}.json`);
  }
  if (root === "pages") {
    return path.join("pages", "pages.json");
  }
  if (root === "public") {
    return path.join("pages", "public.json");
  }
  if (root === "common" || root === "auth" || root === "locale" || root === "api" || root === "sidebar") {
    return path.join("components", `${root}.json`);
  }

  return path.join("misc", `${root || "root"}.json`);
}

export async function resolveMessageFileTarget(locale: AppLocale, key: string): Promise<MessageFileTarget> {
  const relativePath = keyToShardRelativePath(key);
  const shardDir = localeShardDir(locale);

  if (await localeUsesShards(locale)) {
    return {
      mode: "sharded",
      relativePath,
      absolutePath: path.join(shardDir, relativePath),
    };
  }

  return {
    mode: "monolith",
    relativePath: `${locale}.json`,
    absolutePath: localeMonolithPath(locale),
  };
}
