export type TranslationReadPayload = {
  locale: "uk" | "en" | "es" | "tr" | "ru";
  key: string;
  value: unknown;
  fallbackValue: unknown;
};

export type TranslationWritePayload = {
  locale: "uk" | "en" | "es" | "tr" | "ru";
  key: string;
  value: unknown;
  allowCreateKey?: boolean;
};

export async function readAdminTranslation(locale: string, key: string): Promise<TranslationReadPayload> {
  const params = new URLSearchParams({
    locale,
    key,
  });
  const response = await fetch(`/api/admin/i18n/translation?${params.toString()}`, {
    credentials: "include",
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Failed to read translation");
  }
  return payload as TranslationReadPayload;
}

export async function writeAdminTranslation(input: TranslationWritePayload): Promise<{
  message: string;
  locale: string;
  key: string;
  value: unknown;
}> {
  const response = await fetch("/api/admin/i18n/translation", {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Failed to update translation");
  }
  return payload as { message: string; locale: string; key: string; value: unknown };
}
