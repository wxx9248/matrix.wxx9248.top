import { type Params, fill } from "@/i18n/fill";
import { type UiKey, en } from "./ui/en";
import type { Locale } from "./locales";
import { ja } from "./ui/ja";
import { zhCN } from "./ui/zh-CN";
import { zhTW } from "./ui/zh-TW";

export type { UiKey };
export { fill };

const dictionaries: Record<Locale, Record<UiKey, string>> = {
  en,
  ja,
  "zh-CN": zhCN,
  "zh-TW": zhTW
};

export function dictionary(lang: Locale): Record<UiKey, string> {
  return dictionaries[lang];
}

export function t(lang: Locale, key: UiKey, params: Params = {}): string {
  return fill(dictionaries[lang][key], params);
}
