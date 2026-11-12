export const locales = ["en", "zh-CN", "zh-TW", "ja"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

interface LocaleInfo {
  htmlLang: string;
  label: string;
  // The compact label for the switcher on narrow screens
  short: string;
}

export const localeInfo: Record<Locale, LocaleInfo> = {
  "en": { htmlLang: "en", label: "English", short: "EN" },
  "ja": { htmlLang: "ja", label: "日本語", short: "日" },
  "zh-CN": { htmlLang: "zh-CN", label: "简体中文", short: "简" },
  "zh-TW": { htmlLang: "zh-TW", label: "繁體中文", short: "繁" }
};

// Remembers the visitor's language choice for the redirect at "/"
export const localeCookie = {
  maxAgeSeconds: 31_536_000,
  name: "lang"
} as const;

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (locales as readonly string[]).includes(value)
  );
}

export function localeStaticPaths(): { params: { lang: Locale } }[] {
  return locales.map((lang) => ({ params: { lang } }));
}

export function homeUrl(locale: Locale): string {
  return `/${locale}/`;
}
