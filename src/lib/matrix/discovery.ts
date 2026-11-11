import { httpStatus, isRecord, requestJson } from "@/lib/matrix/http";
import type { Fetch } from "@/lib/matrix/types";
import type { ServerConfig } from "@/config/server";

type DiscoveryFailure = "unreachable" | "not-found" | "invalid";

export type Discovery =
  | { ok: true; baseUrl: string }
  | { ok: false; reason: DiscoveryFailure; baseUrl: string };

const trailingSlashes = /\/+$/u;

// Returns the base URL without trailing slashes, or null when it is not an https URL
const parseBaseUrl = (body: unknown): string | null => {
  if (!isRecord(body)) {
    return null;
  }
  const { "m.homeserver": homeserver } = body;
  if (!isRecord(homeserver)) {
    return null;
  }
  const { base_url: baseUrl } = homeserver;
  if (typeof baseUrl !== "string" || !URL.canParse(baseUrl)) {
    return null;
  }
  if (new URL(baseUrl).protocol !== "https:") {
    return null;
  }
  return baseUrl.replace(trailingSlashes, "");
};

export const discover = async (
  fetchFn: Fetch,
  config: ServerConfig
): Promise<Discovery> => {
  const fail = (reason: DiscoveryFailure): Discovery => ({
    baseUrl: config.fallbackBaseUrl,
    ok: false,
    reason
  });
  const result = await requestJson(
    fetchFn,
    `https://${config.serverName}/.well-known/matrix/client`
  );
  if (result.kind === "failed") {
    return fail("unreachable");
  }
  if (result.status === httpStatus.notFound) {
    return fail("not-found");
  }
  if (result.status !== httpStatus.ok) {
    return fail("unreachable");
  }
  const baseUrl = parseBaseUrl(result.body);
  return baseUrl === null ? fail("invalid") : { baseUrl, ok: true };
};
