import { httpStatus, isRecord, requestJson } from "@/lib/matrix/http";
import type { Fetch } from "@/lib/matrix/types";

export type TokenResult =
  "valid" | "invalid" | "closed" | "rate-limited" | "error";

// Returns null, without a request, when there is nothing to check.
// The token is only sent to the server; it is never stored or logged.
export const checkToken = async (
  fetchFn: Fetch,
  baseUrl: string,
  token: string
): Promise<TokenResult | null> => {
  const trimmed = token.trim();
  if (trimmed === "") {
    return null;
  }
  const result = await requestJson(
    fetchFn,
    `${baseUrl}/_matrix/client/v1/register/m.login.registration_token/validity?token=${encodeURIComponent(trimmed)}`
  );
  if (result.kind === "failed") {
    return "error";
  }
  if (result.status === httpStatus.forbidden) {
    return "closed";
  }
  if (result.status === httpStatus.tooManyRequests) {
    return "rate-limited";
  }
  if (
    result.status !== httpStatus.ok ||
    !isRecord(result.body) ||
    typeof result.body.valid !== "boolean"
  ) {
    return "error";
  }
  return result.body.valid ? "valid" : "invalid";
};
