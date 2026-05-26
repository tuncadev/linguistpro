import { getValueByDottedKey, type JsonObject, type JsonValue } from "@/lib/i18n/translation-registry";

type LocalizableTutorStat = {
  id: string;
  label: string;
  value: string;
};

type LocalizableTutorModule = {
  id: string;
  title: string;
  description: string;
};

type LocalizableTutor = {
  id: string;
  name: string | null;
  bio: string | null;
  location: string;
  languagesSpoken: string;
  profileHighlights: string[];
  profileStats: LocalizableTutorStat[];
  pedagogicalModules: LocalizableTutorModule[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : fallback;
}

function readNullableString(value: unknown, fallback: string | null): string | null {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : fallback;
}

function readStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }
  const normalized = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return normalized.length > 0 ? normalized : fallback;
}

export function localizeTutorFromMessages<T extends LocalizableTutor>(
  tutor: T,
  localeMessages: JsonObject
): T {
  const localizedNode = getValueByDottedKey(
    localeMessages,
    `content.tutors.${tutor.id}`
  ) as JsonValue | undefined;

  if (!isObject(localizedNode)) {
    return tutor;
  }

  return {
    ...tutor,
    name: readNullableString(localizedNode.name, tutor.name),
    bio: readNullableString(localizedNode.bio, tutor.bio),
    location: readString(localizedNode.location, tutor.location),
    languagesSpoken: readString(localizedNode.languagesSpoken, tutor.languagesSpoken),
    profileHighlights: readStringArray(localizedNode.profileHighlights, tutor.profileHighlights),
    profileStats: tutor.profileStats.map((stat, index) => {
      const translatedRaw = Array.isArray(localizedNode.profileStats)
        ? localizedNode.profileStats[index]
        : undefined;
      const translated = isObject(translatedRaw) ? translatedRaw : undefined;
      return {
        ...stat,
        label: readString(translated?.label, stat.label),
      };
    }),
    pedagogicalModules: tutor.pedagogicalModules.map((module, index) => {
      const translatedRaw = Array.isArray(localizedNode.pedagogicalModules)
        ? localizedNode.pedagogicalModules[index]
        : undefined;
      const translated = isObject(translatedRaw) ? translatedRaw : undefined;
      return {
        ...module,
        title: readString(translated?.title, module.title),
        description: readString(translated?.description, module.description),
      };
    }),
  };
}
