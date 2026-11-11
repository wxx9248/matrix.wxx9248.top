import { describe, expect, it } from "vitest";
import {
  localeSettings,
  negotiateLocale,
  readCookie
} from "@/lib/language/negotiate";

describe("negotiateLocale", () => {
  it.each([
    [{ cookie: "ja", preferred: ["en-US"] }, "ja"],
    [{ cookie: "xx", preferred: ["ja-JP"] }, "ja"],
    [{ cookie: null, preferred: ["fr", "zh-TW"] }, "zh-TW"],
    [{ cookie: null, preferred: ["zh-Hant"] }, "zh-TW"],
    [{ cookie: null, preferred: ["zh-HK"] }, "zh-TW"],
    [{ cookie: null, preferred: ["zh-MO"] }, "zh-TW"],
    [{ cookie: null, preferred: ["ZH-tw"] }, "zh-TW"],
    [{ cookie: null, preferred: ["zh-Hant-CN"] }, "zh-TW"],
    [{ cookie: null, preferred: ["zh"] }, "zh-CN"],
    [{ cookie: null, preferred: ["zh-CN"] }, "zh-CN"],
    [{ cookie: null, preferred: ["zh-Hans-TW"] }, "zh-CN"],
    [{ cookie: null, preferred: ["zh-SG"] }, "zh-CN"],
    [{ cookie: null, preferred: ["en-GB"] }, "en"],
    [{ cookie: null, preferred: [] }, "en"]
  ])("negotiates %o → %s", (input, expected) => {
    expect(negotiateLocale(input, localeSettings)).toBe(expected);
  });
});

describe("readCookie", () => {
  it("reads a cookie from a document.cookie string", () => {
    expect(readCookie("a=1; lang=zh-TW", "lang")).toBe("zh-TW");
  });

  it("returns nothing for missing or malformed cookies", () => {
    expect(readCookie("lang=%E0", "lang")).toBeNull();
    expect(readCookie("", "lang")).toBeNull();
  });
});
