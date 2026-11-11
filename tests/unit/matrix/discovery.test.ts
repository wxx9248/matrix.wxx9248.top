import { type FakeRoute, fakeFetch } from "@tests/unit/matrix/fake-fetch";
import { describe, expect, it } from "vitest";
import { discover } from "@/lib/matrix/discovery";
import { serverConfig } from "@/config/server";
import { wellKnownClient } from "@tests/fixtures/matrix";

const wellKnownUrl = "https://wxx9248.top/.well-known/matrix/client";
const fallback = "https://matrix.wxx9248.top";

const discoverWith = (route: FakeRoute) => {
  const { fetch, calls } = fakeFetch({ [wellKnownUrl]: route });
  return { calls, result: discover(fetch, serverConfig) };
};

const withBaseUrl = (baseUrl: unknown) => ({
  // The key is snake_case on the wire
  json: {
    "m.homeserver": Object.fromEntries([["base_url", baseUrl]])
  },
  status: 200
});

describe("discover", () => {
  it("reads the base URL from the well-known file", async () => {
    const { calls, result } = discoverWith({
      json: wellKnownClient,
      status: 200
    });
    expect(await result).toEqual({
      baseUrl: "https://matrix.wxx9248.top",
      ok: true
    });
    expect(calls.map((call) => call.url)).toEqual([wellKnownUrl]);
  });

  it("trims a trailing slash", async () => {
    expect(
      await discoverWith(withBaseUrl("https://matrix.wxx9248.top/")).result
    ).toEqual({ baseUrl: "https://matrix.wxx9248.top", ok: true });
    expect(
      await discoverWith(withBaseUrl("https://h.example/x/")).result
    ).toEqual({ baseUrl: "https://h.example/x", ok: true });
  });

  it("reports a missing file as not-found", async () => {
    expect(await discoverWith({ status: 404 }).result).toEqual({
      baseUrl: fallback,
      ok: false,
      reason: "not-found"
    });
  });

  it("reports network errors and server errors as unreachable", async () => {
    expect(await discoverWith("network-error").result).toEqual({
      baseUrl: fallback,
      ok: false,
      reason: "unreachable"
    });
    expect(await discoverWith({ status: 500 }).result).toEqual({
      baseUrl: fallback,
      ok: false,
      reason: "unreachable"
    });
  });

  it.each([
    ["an http URL", withBaseUrl("http://h.example")],
    ["a string that is not a URL", withBaseUrl("not a url")],
    ["a number", withBaseUrl(42)],
    ["a missing m.homeserver", { json: {}, status: 200 }],
    ["a non-JSON body", { status: 200, text: "<html>" }],
    ["a null JSON body", { status: 200, text: "null" }]
  ])("rejects %s as invalid", async (_name, route) => {
    expect(await discoverWith(route).result).toEqual({
      baseUrl: fallback,
      ok: false,
      reason: "invalid"
    });
  });
});
