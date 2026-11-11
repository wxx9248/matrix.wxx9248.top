import { type FakeRoute, fakeFetch } from "@tests/unit/matrix/fake-fetch";
import { describe, expect, it } from "vitest";
import { checkToken } from "@/lib/matrix/token";

const base = "https://matrix.wxx9248.top";
const validityUrl = (encoded: string) =>
  `${base}/_matrix/client/v1/register/m.login.registration_token/validity?token=${encoded}`;

const checkWith = (route: FakeRoute, token = "abc") => {
  const { fetch, calls } = fakeFetch({ [validityUrl("abc")]: route });
  return { calls, result: checkToken(fetch, base, token) };
};

describe("checkToken", () => {
  it.each([
    ["valid", { json: { valid: true }, status: 200 }],
    ["invalid", { json: { valid: false }, status: 200 }],
    ["closed", { status: 403 }],
    ["rate-limited", { status: 429 }],
    ["error", { status: 500 }],
    ["error", "network-error" as const],
    ["error", { json: { valid: "yes" }, status: 200 }],
    ["error", { status: 200, text: "<html>" }]
  ])("returns %s", async (expected, route) => {
    expect(await checkWith(route).result).toBe(expected);
  });

  it("trims and encodes the token", async () => {
    const encoded = "ab%26c%3Dd";
    const { fetch, calls } = fakeFetch({
      [validityUrl(encoded)]: { json: { valid: true }, status: 200 }
    });
    expect(await checkToken(fetch, base, " ab&c=d ")).toBe("valid");
    expect(calls.map((call) => call.url)).toEqual([validityUrl(encoded)]);
  });

  it.each([[""], ["   "], ["\t\n"]])(
    "returns null without a request for %j",
    async (token) => {
      const { calls, result } = checkWith({ status: 200 }, token);
      expect(await result).toBeNull();
      expect(calls).toHaveLength(0);
    }
  );
});
