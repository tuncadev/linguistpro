import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'messages');
const locales = ['uk', 'en', 'es', 'tr', 'ru'];
const sourceGlobs = ['app', 'components', 'views', 'lib', 'services'];

function flatten(obj, prefix = '', out = []) {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      flatten(v, key, out);
    }
    return out;
  }
  out.push(prefix);
  return out;
}

const data = {};
for (const locale of locales) {
  const file = path.join(root, `${locale}.json`);
  const raw = await fs.readFile(file, 'utf8');
  data[locale] = JSON.parse(raw);
}

const ukKeys = new Set(flatten(data.uk));
let failed = false;
let warnings = 0;

for (const locale of locales) {
  const keys = new Set(flatten(data[locale]));
  const missing = [...ukKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !ukKeys.has(k));

  if (missing.length || extra.length) {
    failed = true;
    console.error(`\n[${locale}] Translation key mismatch:`);
    if (missing.length) {
      console.error(`  Missing keys (${missing.length}):`);
      for (const key of missing) console.error(`    - ${key}`);
    }
    if (extra.length) {
      console.error(`  Extra keys (${extra.length}):`);
      for (const key of extra) console.error(`    - ${key}`);
    }
  }
}

const sourceFiles = [];
for (const dir of sourceGlobs) {
  const full = path.resolve(process.cwd(), dir);
  await collectSourceFiles(full, sourceFiles);
}
const sourceText = (
  await Promise.all(
    sourceFiles.map(async (file) => fs.readFile(file, 'utf8'))
  )
).join('\n');

const probablyUnusedKeys = [...ukKeys].filter((key) => !sourceText.includes(`'${key}'`) && !sourceText.includes(`"${key}"`));
if (probablyUnusedKeys.length) {
  warnings += 1;
  console.warn(`\n[warn] Possibly unused translation keys (${probablyUnusedKeys.length}):`);
  for (const key of probablyUnusedKeys.slice(0, 50)) {
    console.warn(`  - ${key}`);
  }
  if (probablyUnusedKeys.length > 50) {
    console.warn(`  ... and ${probablyUnusedKeys.length - 50} more`);
  }
}

const fallbackFindings = [];
for (const locale of locales.filter((item) => item !== 'uk')) {
  for (const key of ukKeys) {
    const ukValue = getByPath(data.uk, key);
    const localeValue = getByPath(data[locale], key);
    if (typeof ukValue === 'string' && typeof localeValue === 'string' && ukValue === localeValue) {
      fallbackFindings.push(`${locale}: ${key}`);
    }
  }
}

if (fallbackFindings.length) {
  warnings += 1;
  console.warn(`\n[warn] Possible fallback/untranslated strings (${fallbackFindings.length}):`);
  for (const finding of fallbackFindings.slice(0, 50)) {
    console.warn(`  - ${finding}`);
  }
  if (fallbackFindings.length > 50) {
    console.warn(`  ... and ${fallbackFindings.length - 50} more`);
  }
}

if (failed) {
  process.exit(1);
}

console.log('i18n key check passed for locales:', locales.join(', '));
if (warnings === 0) {
  console.log('No i18n warnings found.');
}

async function collectSourceFiles(dir, out) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.next')) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectSourceFiles(fullPath, out);
      continue;
    }
    if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) {
      out.push(fullPath);
    }
  }
}

function getByPath(obj, dottedPath) {
  const parts = dottedPath.split('.');
  let cursor = obj;
  for (const part of parts) {
    if (!cursor || typeof cursor !== 'object' || !(part in cursor)) {
      return undefined;
    }
    cursor = cursor[part];
  }
  return cursor;
}
