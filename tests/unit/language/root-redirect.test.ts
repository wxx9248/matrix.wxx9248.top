import { describe, expect, it } from "vitest";
import { rootRedirectScript } from "@/lib/language/root-redirect";

describe("rootRedirectScript", () => {
  const script = rootRedirectScript();

  it("redirects with location.replace", () => {
    expect(script).toContain("location.replace");
  });

  it("knows every locale's home", () => {
    for (const home of ["/en/", "/zh-CN/", "/zh-TW/", "/ja/"]) {
      expect(script).toContain(home);
    }
  });

  it("parses as a function body", () => {
    expect(() => new Function(script)).not.toThrow();
  });
});
