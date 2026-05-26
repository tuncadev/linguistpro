import { describe, expect, it } from "vitest";
import { setValueByDottedKey } from "@/lib/i18n/translation-file-writer";

describe("translation file writer helpers", () => {
  it("updates existing dotted key", () => {
    const source = {
      pages: {
        about: {
          title: "Old",
        },
      },
    };

    const updated = setValueByDottedKey(source, "pages.about.title", "New", false);
    expect((updated.pages as any).about.title).toBe("New");
    expect((source.pages as any).about.title).toBe("Old");
  });

  it("throws when key is missing and allowCreateKey is false", () => {
    const source = { pages: { about: {} } };
    expect(() => setValueByDottedKey(source as any, "pages.about.subtitle", "X", false)).toThrow(
      "Translation key does not exist"
    );
  });

  it("creates path when allowCreateKey is true", () => {
    const source = { pages: {} };
    const updated = setValueByDottedKey(source as any, "pages.about.subtitle", "Created", true);
    expect((updated.pages as any).about.subtitle).toBe("Created");
  });
});

