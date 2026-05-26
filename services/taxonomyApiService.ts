import { Language, Level } from "../types";

type ApiLanguage = {
  id: string;
  name: string;
  code: string;
};

type ApiLevel = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

type TaxonomyResponse = {
  data?: {
    languages?: ApiLanguage[];
    levels?: ApiLevel[];
  };
};

function mapLanguage(language: ApiLanguage): Language {
  return {
    id: language.id,
    name: language.name,
    code: language.code.toUpperCase(),
  };
}

function mapLevel(level: ApiLevel): Level {
  return {
    id: level.id,
    name: level.name,
    description: level.description || "General",
  };
}

export async function fetchTaxonomies(): Promise<{ languages: Language[]; levels: Level[] } | null> {
  try {
    const response = await fetch("/api/taxonomies");
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as TaxonomyResponse;
    if (!payload.data) {
      return null;
    }

    return {
      languages: (payload.data.languages || []).map(mapLanguage),
      levels: (payload.data.levels || []).map(mapLevel),
    };
  } catch (error) {
    console.error("fetchTaxonomies error", error);
    return null;
  }
}

