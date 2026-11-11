import { type Page, type Route, expect } from "@playwright/test";
import {
  federationVersion,
  login,
  register401,
  versions,
  wellKnownClient,
  wellKnownSupport
} from "@tests/fixtures/matrix";
import { serverConfig } from "@/config/server";

export { expect };

export type Scenario =
  | "online-invite"
  | "online-open"
  | "online-closed"
  | "offline"
  | "oauth"
  | "discovery-failure";

export type TokenAnswer = "valid" | "invalid" | "rate-limited";

export interface MockOptions {
  // What the token validity endpoint answers; "invalid" when omitted
  token?: TokenAnswer;
}

export interface MatrixRequest {
  method: string;
  url: string;
}

interface Answer {
  body?: unknown;
  status: number;
}

const notFound: Answer = {
  body: { errcode: "M_UNRECOGNIZED", error: "Unrecognized request" },
  status: 404
};

const openRegister: Answer = {
  body: { flows: [{ stages: ["m.login.dummy"] }], params: {}, session: "open" },
  status: 401
};

const closedRegister: Answer = {
  body: { errcode: "M_FORBIDDEN", error: "Registration has been disabled" },
  status: 403
};

const oauthMetadata = Object.fromEntries([
  ["account_management_uri", "https://matrix.wxx9248.top/account/"],
  ["issuer", "https://matrix.wxx9248.top/"],
  ["prompt_values_supported", ["create"]]
]);

const apiBase = `${serverConfig.fallbackBaseUrl}/_matrix/`;
const wellKnownBase = `https://${serverConfig.serverName}/.well-known/matrix/`;
const tokenPath =
  "/_matrix/client/v1/register/m.login.registration_token/validity";

const tokenAnswers: Record<TokenAnswer, Answer> = {
  "invalid": { body: { valid: false }, status: 200 },
  "rate-limited": {
    body: { errcode: "M_LIMIT_EXCEEDED", error: "Too many requests" },
    status: 429
  },
  "valid": { body: { valid: true }, status: 200 }
};

const corsHeaders = {
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-origin": "*"
};

function registerAnswer(scenario: Scenario): Answer {
  switch (scenario) {
    case "online-open":
      return openRegister;
    case "online-closed":
      return closedRegister;
    default:
      return { body: register401, status: 401 };
  }
}

function matrixAnswer(
  scenario: Scenario,
  { pathname }: URL,
  method: string,
  token: TokenAnswer
): Answer {
  if (scenario === "offline") {
    return { status: 502 };
  }
  switch (pathname) {
    case "/_matrix/client/versions":
      return { body: versions, status: 200 };
    case "/_matrix/federation/v1/version":
      return { body: federationVersion, status: 200 };
    case "/_matrix/client/v1/auth_metadata":
      return scenario === "oauth"
        ? { body: oauthMetadata, status: 200 }
        : notFound;
    case "/_matrix/client/v3/login":
      return { body: login, status: 200 };
    case "/_matrix/client/v3/register":
      return method === "POST" ? registerAnswer(scenario) : notFound;
    case tokenPath:
      return tokenAnswers[token];
    default:
      return notFound;
  }
}

function wellKnownAnswer(scenario: Scenario, { pathname }: URL): Answer {
  if (pathname === "/.well-known/matrix/client") {
    return scenario === "discovery-failure"
      ? notFound
      : { body: wellKnownClient, status: 200 };
  }
  if (pathname === "/.well-known/matrix/support") {
    return { body: wellKnownSupport, status: 200 };
  }
  return notFound;
}

async function fulfill(route: Route, answer: Answer): Promise<void> {
  await route.fulfill({
    body: "body" in answer ? JSON.stringify(answer.body) : "",
    contentType: "application/json",
    headers: corsHeaders,
    status: answer.status
  });
}

function isLocal({ hostname }: URL): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/**
 * Answers every Matrix request the page makes from fixtures, and aborts any
 * other request that isn't served by the local server. Must be called before
 * navigating. Fonts are self-hosted, so nothing legitimate is external.
 */
export async function mockMatrix(
  page: Page,
  scenario: Scenario,
  options: MockOptions = {}
): Promise<{ requests: MatrixRequest[] }> {
  const requests: MatrixRequest[] = [];
  const token = options.token ?? "invalid";
  await page.route(
    (url) => !isLocal(url),
    async (route) => {
      const request = route.request();
      const href = request.url();
      const method = request.method();
      const isApi = href.startsWith(apiBase);
      if (!isApi && !href.startsWith(wellKnownBase)) {
        await route.abort();
        return;
      }
      if (method === "OPTIONS") {
        await route.fulfill({ headers: corsHeaders, status: 204 });
        return;
      }
      requests.push({ method, url: href });
      const url = new URL(href);
      await fulfill(
        route,
        isApi
          ? matrixAnswer(scenario, url, method, token)
          : wellKnownAnswer(scenario, url)
      );
    }
  );
  return { requests };
}
