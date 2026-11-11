import { describe, expect, it } from "vitest";
import { describeStatus, describeToken } from "@/lib/matrix/present";
import type { Auth } from "@/lib/matrix/auth";
import type { Registration } from "@/lib/matrix/registration";
import type { ServerStatus } from "@/lib/matrix/check";
import { dictionary } from "@/i18n/t";

const strings = dictionary("en");
const base = "https://matrix.wxx9248.top";

const onlineStatus = (overrides: Partial<ServerStatus> = {}): ServerStatus => ({
  auth: { api: "legacy", signIn: [{ kind: "password" }] },
  contact: { email: "a@wxx9248.top", matrixId: "@a:wxx9248.top" },
  discovery: { baseUrl: base, ok: true },
  registration: { requirements: [], state: "invite" },
  software: { name: "Synapse", version: "1.163.0" },
  versions: { online: true, spec: "v1.15" },
  ...overrides
});

const view = (overrides: Partial<ServerStatus> = {}) =>
  describeStatus(onlineStatus(overrides), strings, "wxx9248.top");

const withAuth = (auth: Auth) => view({ auth }).signIn;

describe("describeStatus", () => {
  it("describes an online invite-only server", () => {
    const result = view();
    expect(result.server).toEqual({
      dot: "ok",
      href: null,
      label: "online",
      note: "Synapse 1.163.0"
    });
    expect(result.registration).toEqual({
      dot: "warn",
      href: null,
      label: "invite only",
      note: "needs a registration token"
    });
    expect(result.spec).toMatchObject({
      label: "v1.15",
      note: "newest client API it supports"
    });
    expect(result.signIn.label).toBe("password");
    expect(result.discovery).toMatchObject({
      dot: "ok",
      label: "wxx9248.top → matrix.wxx9248.top"
    });
    expect(result.tokenChecker).toBe(true);
    expect(result.bar).toBe("online");
    expect(result.contact).toEqual({
      email: "a@wxx9248.top",
      matrixId: "@a:wxx9248.top"
    });
  });

  it("lists registration requirements for open sign-up", () => {
    const registration: Registration = {
      requirements: ["email", "captcha"],
      state: "open"
    };
    const result = view({ registration });
    expect(result.registration).toMatchObject({
      dot: "ok",
      label: "open",
      note: "email required · captcha"
    });
    expect(result.tokenChecker).toBe(false);
  });

  it("uses the plain note for open sign-up with no requirements", () => {
    const result = view({ registration: { requirements: [], state: "open" } });
    expect(result.registration.note).toBe("anyone can sign up");
  });

  it("describes closed registration", () => {
    const result = view({
      registration: { requirements: [], state: "closed" }
    });
    expect(result.registration).toMatchObject({
      dot: "bad",
      label: "closed",
      note: "not taking new accounts"
    });
  });

  it("describes an offline server", () => {
    const result = view({
      auth: null,
      registration: { requirements: [], state: "unknown" },
      software: null,
      versions: { online: false }
    });
    expect(result.server).toMatchObject({
      dot: "bad",
      label: "offline",
      note: "not responding; check back later"
    });
    for (const row of [result.registration, result.spec, result.signIn]) {
      expect(row).toMatchObject({ dot: "none", label: "unknown" });
    }
    expect(result.tokenChecker).toBe(false);
    expect(result.bar).toBe("offline");
  });

  it("drops the software note when it is unknown", () => {
    expect(view({ software: null }).server.note).toBe("");
  });

  it("shows an unknown spec when none is listed", () => {
    expect(view({ versions: { online: true, spec: null } }).spec).toMatchObject(
      { dot: "none", label: "unknown" }
    );
  });

  it("explains a missing discovery file", () => {
    expect(
      view({ discovery: { baseUrl: base, ok: false, reason: "not-found" } })
        .discovery
    ).toMatchObject({
      dot: "bad",
      label: "wxx9248.top has no client discovery file"
    });
  });

  it("explains unreachable and invalid discovery", () => {
    expect(
      view({ discovery: { baseUrl: base, ok: false, reason: "unreachable" } })
        .discovery.label
    ).toBe("couldn't reach wxx9248.top");
    expect(
      view({ discovery: { baseUrl: base, ok: false, reason: "invalid" } })
        .discovery.label
    ).toBe("wxx9248.top's client discovery file is invalid");
  });

  it("links the OAuth account page", () => {
    expect(
      withAuth({
        accountUrl: "https://a.example/account",
        api: "oauth",
        canRegister: true
      })
    ).toMatchObject({
      href: "https://a.example/account",
      label: "account page"
    });
  });

  it("shows SSO providers", () => {
    expect(
      withAuth({
        api: "legacy",
        signIn: [{ kind: "sso", providers: ["GitHub", "GitLab"] }]
      }).label
    ).toBe("SSO (GitHub, GitLab)");
    expect(
      withAuth({ api: "legacy", signIn: [{ kind: "sso", providers: [] }] })
        .label
    ).toBe("SSO");
  });

  it("joins password and SSO", () => {
    expect(
      withAuth({
        api: "legacy",
        signIn: [{ kind: "password" }, { kind: "sso", providers: [] }]
      }).label
    ).toBe("password · SSO");
  });

  it("shows unknown when sign-in could not be read", () => {
    expect(withAuth({ api: "legacy", signIn: null })).toMatchObject({
      dot: "none",
      label: "unknown"
    });
  });
});

describe("describeToken", () => {
  it.each([
    ["valid", "ok", "token.valid"],
    ["invalid", "bad", "token.invalid"],
    ["closed", "bad", "token.closed"],
    ["rate-limited", "muted", "token.rateLimited"],
    ["error", "muted", "token.error"]
  ] as const)("%s", (result, tone, key) => {
    expect(describeToken(result, strings)).toEqual({
      text: strings[key],
      tone
    });
  });
});
