import { describe, expect, it } from "vitest";
import {
  getValueByDottedKey,
  mergeLocaleMessages,
  resolveTranslationKeyValue,
} from "@/lib/i18n/translation-registry";

describe("translation registry helpers", () => {
  it("reads values by dotted key", () => {
    const source = {
      pages: {
        home: {
          title: "Hello",
        },
      },
    };

    expect(getValueByDottedKey(source, "pages.home.title")).toBe("Hello");
    expect(getValueByDottedKey(source, "pages.home.missing")).toBeUndefined();
  });

  it("merges locale over fallback recursively", () => {
    const fallback = {
      common: {
        a: "A",
        b: "B",
      },
      nested: {
        value: "uk",
      },
    };
    const localized = {
      common: {
        b: "B-en",
      },
      nested: {
        value: "en",
      },
    };

    const merged = mergeLocaleMessages(localized, fallback);
    expect(merged.common.a).toBe("A");
    expect(merged.common.b).toBe("B-en");
    expect(merged.nested.value).toBe("en");
  });

  it("resolves key from locale first then fallback", () => {
    const fallback = {
      common: {
        title: "Заголовок",
      },
    };
    const localized = {
      common: {
        subtitle: "Subtitle",
      },
    };

    const fromLocale = resolveTranslationKeyValue("en", "common.subtitle", localized, fallback);
    expect(fromLocale.found).toBe(true);
    expect(fromLocale.sourceLocale).toBe("en");
    expect(fromLocale.value).toBe("Subtitle");

    const fromFallback = resolveTranslationKeyValue("en", "common.title", localized, fallback);
    expect(fromFallback.found).toBe(true);
    expect(fromFallback.sourceLocale).toBe("uk");
    expect(fromFallback.value).toBe("Заголовок");

    const missing = resolveTranslationKeyValue("en", "common.missing", localized, fallback);
    expect(missing.found).toBe(false);
    expect(missing.sourceLocale).toBeNull();
    expect(missing.value).toBeNull();
  });
});

