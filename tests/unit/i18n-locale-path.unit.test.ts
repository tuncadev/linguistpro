import { describe, expect, it } from "vitest";
import {
  extractLocaleFromPathname,
  localizePath,
  resolvePreferredLocale,
  stripLocalePrefix,
} from "@/i18n/locale-path";

describe("i18n locale path helpers", () => {
  it("extracts locale from localized paths", () => {
    expect(extractLocaleFromPathname("/uk/courses")).toBe("uk");
    expect(extractLocaleFromPathname("/en")).toBe("en");
    expect(extractLocaleFromPathname("/")).toBeNull();
    expect(extractLocaleFromPathname("/random/path")).toBeNull();
  });

  it("strips locale prefix correctly", () => {
    expect(stripLocalePrefix("/uk/courses")).toBe("/courses");
    expect(stripLocalePrefix("/en")).toBe("/");
    expect(stripLocalePrefix("/courses")).toBe("/courses");
  });

  it("localizes paths using explicit locale", () => {
    expect(localizePath("/", "uk")).toBe("/uk");
    expect(localizePath("/courses", "es")).toBe("/es/courses");
    expect(localizePath("/tr/about", "en")).toBe("/en/about");
  });

  it("resolves preferred locale in expected order", () => {
    expect(resolvePreferredLocale({ pathname: "/tr/courses", profileLocale: "uk", cookieLocale: "en" })).toBe("tr");
    expect(resolvePreferredLocale({ pathname: "/courses", profileLocale: "es", cookieLocale: "en" })).toBe("es");
    expect(resolvePreferredLocale({ pathname: "/courses", profileLocale: null, cookieLocale: "ru" })).toBe("ru");
    expect(resolvePreferredLocale({ pathname: "/courses", profileLocale: null, cookieLocale: null })).toBe("uk");
  });
});
