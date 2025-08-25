import { createI18n } from "vue-i18n";

// Import locale messages
import enUS from "@/locales/en-US.json";
import zhCN from "@/locales/zh-CN.json";
import zhTW from "@/locales/zh-TW.json";
import jaJP from "@/locales/ja-JP.json";

// Detect user's preferred language
function getDefaultLocale(): string {
  const supportedLocales: string[] = ["en-US", "zh-CN", "zh-TW", "ja-JP"];
  const userLocale = navigator.language;

  // Try exact match first
  if (supportedLocales.includes(userLocale)) {
    return userLocale;
  }

  // Try language code match (e.g., 'zh' matches 'zh-CN')
  const userLang = userLocale.split("-")[0];
  if (!userLang) {
    return "en-US";
  }

  const matchingLocale = supportedLocales.find((locale) =>
    locale.startsWith(userLang)
  );
  if (!matchingLocale) {
    return "en-US";
  }

  return matchingLocale;
}

const defaultLocale = getDefaultLocale();

const i18n = createI18n({
  locale: defaultLocale,
  fallbackLocale: "en-US",
  messages: {
    "en-US": enUS,
    "zh-CN": zhCN,
    "zh-TW": zhTW,
    "ja-JP": jaJP
  },
  globalInjection: true // Enable global $t function
});

// Set initial HTML lang attribute
document.documentElement.lang = defaultLocale;

export default i18n;
