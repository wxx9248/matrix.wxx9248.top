import { describe, expect, it } from "vitest";
import { dictionary, fill, t } from "@/i18n/t";
import { homeUrl, isLocale, localeStaticPaths, locales } from "@/i18n/locales";

const placeholders = (text: string): string[] =>
  [
    ...new Set([...text.matchAll(/\{(?<name>\w+)\}/gu)].map((m) => m[1] ?? ""))
  ].sort();

describe("dictionaries", () => {
  const english = dictionary("en");

  it.each(locales)(
    "%s has exactly the English keys and no empty values",
    (lang) => {
      const entries = dictionary(lang);
      expect(Object.keys(entries).sort()).toEqual(Object.keys(english).sort());
      for (const value of Object.values(entries)) {
        expect(value.trim()).not.toBe("");
      }
    }
  );

  it.each(locales)("%s keeps the English placeholders", (lang) => {
    const entries = dictionary(lang);
    for (const [key, value] of Object.entries(english)) {
      expect(placeholders(entries[key as keyof typeof entries])).toEqual(
        placeholders(value)
      );
    }
  });
});

describe("fill", () => {
  it("fills placeholders", () => {
    expect(fill("{a} and {b}", { a: 1, b: "x" })).toBe("1 and x");
  });

  it("throws when a placeholder has no param", () => {
    expect(() => fill("{a}", {})).toThrow(/needs a "a" param/u);
  });
});

describe("t", () => {
  it("returns the string for the locale", () => {
    expect(t("en", "panel.connect")).toBe("connect");
    expect(t("en", "message.copied", { text: "x" })).toBe('"x" copied');
  });
});

describe("locales", () => {
  it("recognizes only configured locales", () => {
    expect(isLocale("zh-TW")).toBe(true);
    expect(isLocale("zh")).toBe(false);
    expect(isLocale(null)).toBe(false);
  });

  it("builds one static path and home URL per locale", () => {
    expect(localeStaticPaths()).toEqual([
      { params: { lang: "en" } },
      { params: { lang: "zh-CN" } },
      { params: { lang: "zh-TW" } },
      { params: { lang: "ja" } }
    ]);
    expect(homeUrl("zh-CN")).toBe("/zh-CN/");
  });
});
