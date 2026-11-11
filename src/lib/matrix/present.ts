import type { Auth, SignInMethod } from "@/lib/matrix/auth";
import type { Contact } from "@/lib/matrix/support";
import type { Discovery } from "@/lib/matrix/discovery";
import type { Registration } from "@/lib/matrix/registration";
import type { ServerStatus } from "@/lib/matrix/check";
import type { TokenResult } from "@/lib/matrix/token";
import type { UiKey } from "@/i18n/t";
import { fill } from "@/i18n/fill";

type Dot = "ok" | "warn" | "bad" | "none";

export type Row = {
  dot: Dot;
  label: string;
  note: string;
  href: string | null;
};

export type StatusView = {
  server: Row;
  registration: Row;
  spec: Row;
  signIn: Row;
  discovery: Row;
  contact: Contact | null;
  tokenChecker: boolean;
  bar: "online" | "offline";
};

export type Strings = Record<UiKey, string>;

const noItems = 0;

const isEmpty = (list: readonly unknown[]): boolean => list.length === noItems;

const separator = " · ";

const row = (
  dot: Dot,
  label: string,
  note = "",
  href: string | null = null
): Row => ({
  dot,
  href,
  label,
  note
});

const unknownRow = (strings: Strings): Row =>
  row("none", strings["status.unknown"]);

const discoveryFailureKeys = {
  "invalid": "discovery.invalid",
  "not-found": "discovery.notFound",
  "unreachable": "discovery.unreachable"
} as const satisfies Record<Extract<Discovery, { ok: false }>["reason"], UiKey>;

const describeDiscovery = (
  discovery: Discovery,
  strings: Strings,
  serverName: string
): Row => {
  if (discovery.ok) {
    const { host } = new URL(discovery.baseUrl);
    return row("ok", `${serverName} → ${host}`);
  }
  return row(
    "bad",
    fill(strings[discoveryFailureKeys[discovery.reason]], {
      server: serverName
    })
  );
};

const describeServer = (status: ServerStatus, strings: Strings): Row => {
  if (!status.versions.online) {
    return row("bad", strings["status.offline"], strings["status.offlineNote"]);
  }
  const note =
    status.software === null
      ? ""
      : `${status.software.name} ${status.software.version}`;
  return row("ok", strings["status.online"], note);
};

const describeSpec = (
  versions: ServerStatus["versions"],
  strings: Strings
): Row =>
  versions.online && versions.spec !== null
    ? row("none", versions.spec, strings["status.specNote"])
    : unknownRow(strings);

const describeRegistration = (
  registration: Registration,
  strings: Strings
): Row => {
  const needs = registration.requirements
    .map((requirement) => strings[`require.${requirement}`])
    .join(separator);
  switch (registration.state) {
    case "open":
      return row(
        "ok",
        strings["status.open"],
        needs === "" ? strings["status.openNote"] : needs
      );
    case "invite":
      return row(
        "warn",
        strings["status.invite"],
        strings["status.inviteNote"]
      );
    case "closed":
      return row("bad", strings["status.closed"], strings["status.closedNote"]);
    default:
      return unknownRow(strings);
  }
};

const describeMethod = (method: SignInMethod, strings: Strings): string => {
  if (method.kind === "password") {
    return strings["status.password"];
  }
  return isEmpty(method.providers)
    ? strings["status.sso"]
    : fill(strings["status.ssoWith"], {
        providers: method.providers.join(", ")
      });
};

const describeSignIn = (auth: Auth | null, strings: Strings): Row => {
  if (auth === null) {
    return unknownRow(strings);
  }
  if (auth.api === "oauth") {
    return row("none", strings["status.accountPage"], "", auth.accountUrl);
  }
  if (auth.signIn === null || isEmpty(auth.signIn)) {
    return unknownRow(strings);
  }
  return row(
    "none",
    auth.signIn.map((method) => describeMethod(method, strings)).join(separator)
  );
};

// Every display decision lives here; the browser script only copies values into the page
export const describeStatus = (
  status: ServerStatus,
  strings: Strings,
  serverName: string
): StatusView => ({
  bar: status.versions.online ? "online" : "offline",
  contact: status.contact,
  discovery: describeDiscovery(status.discovery, strings, serverName),
  registration: describeRegistration(status.registration, strings),
  server: describeServer(status, strings),
  signIn: describeSignIn(status.auth, strings),
  spec: describeSpec(status.versions, strings),
  tokenChecker: status.registration.state === "invite"
});

const tokenViews = {
  "closed": { key: "token.closed", tone: "bad" },
  "error": { key: "token.error", tone: "muted" },
  "invalid": { key: "token.invalid", tone: "bad" },
  "rate-limited": { key: "token.rateLimited", tone: "muted" },
  "valid": { key: "token.valid", tone: "ok" }
} as const satisfies Record<
  TokenResult,
  { key: UiKey; tone: "ok" | "bad" | "muted" }
>;

export const describeToken = (
  result: TokenResult,
  strings: Strings
): { text: string; tone: "ok" | "bad" | "muted" } => {
  const { key, tone } = tokenViews[result];
  return { text: strings[key], tone };
};
