import type { Fetch } from "@/lib/matrix/types";

const requestTimeoutMs = 8000;

export const httpStatus = {
  forbidden: 403,
  notFound: 404,
  ok: 200,
  tooManyRequests: 429,
  unauthorized: 401
} as const;

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

type HttpResult =
  { kind: "response"; status: number; body: unknown } | { kind: "failed" };

const readBody = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

// Never throws: network errors, timeouts and aborts all become "failed"
export const requestJson = async (
  fetchFn: Fetch,
  url: string,
  init?: RequestInit
): Promise<HttpResult> => {
  try {
    const response = await fetchFn(url, {
      ...init,
      signal: AbortSignal.timeout(requestTimeoutMs)
    });
    return {
      body: await readBody(response),
      kind: "response",
      status: response.status
    };
  } catch {
    return { kind: "failed" };
  }
};
