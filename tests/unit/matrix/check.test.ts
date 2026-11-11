import { type FakeRoute, fakeFetch } from "@tests/unit/matrix/fake-fetch";
import { describe, expect, it } from "vitest";
import {
  federationVersion,
  login,
  register401,
  versions,
  wellKnownClient,
  wellKnownSupport
} from "@tests/fixtures/matrix";
import { checkServer } from "@/lib/matrix/check";
import { serverConfig } from "@/config/server";

const base = "https://matrix.wxx9248.top";
const unrecognized = {
  json: { errcode: "M_UNRECOGNIZED", error: "Unrecognized request" },
  status: 404
};

const liveRoutes = (): Record<string, FakeRoute> => ({
  "https://wxx9248.top/.well-known/matrix/client": {
    json: wellKnownClient,
    status: 200
  },
  "https://wxx9248.top/.well-known/matrix/support": {
    json: wellKnownSupport,
    status: 200
  },
  [`${base}/_matrix/client/v1/auth_metadata`]: unrecognized,
  [`${base}/_matrix/client/v3/login`]: { json: login, status: 200 },
  [`${base}/_matrix/client/v3/register`]: { json: register401, status: 401 },
  [`${base}/_matrix/client/versions`]: { json: versions, status: 200 },
  [`${base}/_matrix/federation/v1/version`]: {
    json: federationVersion,
    status: 200
  }
});

const run = (routes: Record<string, FakeRoute>) => {
  const { fetch, calls } = fakeFetch(routes);
  return { calls, result: checkServer(fetch, serverConfig) };
};

describe("checkServer", () => {
  it("reads a live-like server", async () => {
    const { calls, result } = run(liveRoutes());
    const status = await result;
    expect(status.discovery).toEqual({ baseUrl: base, ok: true });
    expect(status.versions).toEqual({ online: true, spec: "v1.15" });
    expect(status.software).toEqual({ name: "Synapse", version: "1.163.0" });
    expect(status.auth).toEqual({
      api: "legacy",
      signIn: [{ kind: "password" }]
    });
    expect(status.registration).toEqual({ requirements: [], state: "invite" });
    expect(status.contact).not.toBeNull();
    expect(calls.filter((call) => call.init?.method === "POST")).toHaveLength(
      1
    );
  });

  it("skips the later steps when versions fails", async () => {
    const routes = liveRoutes();
    routes[`${base}/_matrix/client/versions`] = { status: 502 };
    const { calls, result } = run(routes);
    const status = await result;
    expect(status.versions).toEqual({ online: false });
    expect(status.software).toBeNull();
    expect(status.auth).toBeNull();
    expect(status.registration).toEqual({ requirements: [], state: "unknown" });
    expect(status.contact).not.toBeNull();
    const later = calls.filter((call) =>
      ["federation", "auth_metadata", "login", "register"].some((part) =>
        call.url.includes(part)
      )
    );
    expect(later).toEqual([]);
  });

  it("falls back to the default base URL when discovery fails", async () => {
    const routes = liveRoutes();
    routes["https://wxx9248.top/.well-known/matrix/client"] = {
      status: 404
    };
    const { calls, result } = run(routes);
    const status = await result;
    expect(status.discovery).toEqual({
      baseUrl: base,
      ok: false,
      reason: "not-found"
    });
    expect(
      calls
        .filter((call) => call.url.includes("_matrix"))
        .every((call) => call.url.startsWith(base))
    ).toBe(true);
  });

  it("reads registration from OAuth metadata without a register request", async () => {
    const routes = liveRoutes();
    routes[`${base}/_matrix/client/v1/auth_metadata`] = {
      json: Object.fromEntries([
        ["account_management_uri", "https://a.example/account"],
        ["prompt_values_supported", ["create"]]
      ]),
      status: 200
    };
    const { calls, result } = run(routes);
    const status = await result;
    expect(status.auth).toEqual({
      accountUrl: "https://a.example/account",
      api: "oauth",
      canRegister: true
    });
    expect(status.registration).toEqual({ requirements: [], state: "open" });
    expect(calls.some((call) => call.url.endsWith("/register"))).toBe(false);
  });

  it("reports closed registration for OAuth without create", async () => {
    const routes = liveRoutes();
    routes[`${base}/_matrix/client/v1/auth_metadata`] = {
      json: {},
      status: 200
    };
    expect((await run(routes).result).registration.state).toBe("closed");
  });
});
