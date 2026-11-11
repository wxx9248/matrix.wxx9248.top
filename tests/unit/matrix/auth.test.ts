import { type FakeRoute, fakeFetch } from "@tests/unit/matrix/fake-fetch";
import { describe, expect, it } from "vitest";
import { getAuth } from "@/lib/matrix/auth";
import { login } from "@tests/fixtures/matrix";

const base = "https://matrix.wxx9248.top";
const metadataUrl = `${base}/_matrix/client/v1/auth_metadata`;
const loginUrl = `${base}/_matrix/client/v3/login`;

const unrecognized = {
  json: { errcode: "M_UNRECOGNIZED", error: "Unrecognized request" },
  status: 404
};

const authWith = (metadata: FakeRoute, loginRoute?: FakeRoute) => {
  const { fetch, calls } = fakeFetch({
    [loginUrl]: loginRoute ?? "network-error",
    [metadataUrl]: metadata
  });
  return { calls, result: getAuth(fetch, base) };
};

describe("getAuth", () => {
  it("lists password sign-in and hides token and appservice flows", async () => {
    const { result } = authWith(unrecognized, { json: login, status: 200 });
    expect(await result).toEqual({
      api: "legacy",
      signIn: [{ kind: "password" }]
    });
  });

  it("lists SSO with the provider names", async () => {
    const { result } = authWith(unrecognized, {
      json: {
        flows: [
          {
            ...Object.fromEntries([
              ["identity_providers", [{ id: "gh", name: "GitHub" }]]
            ]),
            type: "m.login.sso"
          }
        ]
      },
      status: 200
    });
    expect(await result).toEqual({
      api: "legacy",
      signIn: [{ kind: "sso", providers: ["GitHub"] }]
    });
  });

  it("lists SSO without providers as an empty list", async () => {
    const { result } = authWith(unrecognized, {
      json: { flows: [{ type: "m.login.sso" }] },
      status: 200
    });
    expect(await result).toEqual({
      api: "legacy",
      signIn: [{ kind: "sso", providers: [] }]
    });
  });

  it.each([
    ["a network error", "network-error" as const],
    ["a server error", { status: 500 }],
    ["a non-JSON body", { status: 200, text: "<html>" }],
    ["a missing flows list", { json: {}, status: 200 }]
  ])("reports unknown sign-in for %s", async (_name, loginRoute) => {
    const { result } = authWith(unrecognized, loginRoute);
    expect(await result).toEqual({ api: "legacy", signIn: null });
  });

  it("uses the OAuth API and never asks for the login flows", async () => {
    const { calls, result } = authWith({
      json: Object.fromEntries([
        ["account_management_uri", "https://a.example/account"],
        ["prompt_values_supported", ["create"]]
      ]),
      status: 200
    });
    expect(await result).toEqual({
      accountUrl: "https://a.example/account",
      api: "oauth",
      canRegister: true
    });
    expect(calls.map((call) => call.url)).toEqual([metadataUrl]);
  });

  it("reports no registration and no account page when they are not given", async () => {
    const { result } = authWith({ json: {}, status: 200 });
    expect(await result).toEqual({
      accountUrl: null,
      api: "oauth",
      canRegister: false
    });
  });

  it("falls back to the legacy flows when auth_metadata fails", async () => {
    const { result } = authWith("network-error", { json: login, status: 200 });
    expect(await result).toEqual({
      api: "legacy",
      signIn: [{ kind: "password" }]
    });
  });
});
