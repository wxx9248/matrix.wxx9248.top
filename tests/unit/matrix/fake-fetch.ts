import type { Fetch } from "@/lib/matrix/types";

type FakeResponse =
  | { status: number; json?: unknown; text?: string }
  | "network-error"
  | "timeout";

export type FakeRoute = FakeResponse | ((init?: RequestInit) => FakeResponse);

export type FakeCall = { url: string; init?: RequestInit };

const toResponse = (fake: Exclude<FakeResponse, string>): Response => {
  if ("json" in fake) {
    return new Response(JSON.stringify(fake.json), {
      headers: { "content-type": "application/json" },
      status: fake.status
    });
  }
  return new Response(fake.text ?? "", { status: fake.status });
};

// A fetch stand-in that answers from a route table and records every call
export const fakeFetch = (
  routes: Record<string, FakeRoute>
): { fetch: Fetch; calls: FakeCall[] } => {
  const calls: FakeCall[] = [];
  const fetchFn: Fetch = (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    calls.push({ init, url });
    const route = Object.hasOwn(routes, url) ? routes[url] : null;
    if (route === null) {
      return Promise.reject(new TypeError(`No fake route for ${url}`));
    }
    const fake = typeof route === "function" ? route(init) : route;
    if (fake === "network-error") {
      return Promise.reject(new TypeError("Failed to fetch"));
    }
    if (fake === "timeout") {
      return Promise.reject(
        new DOMException("The operation timed out", "TimeoutError")
      );
    }
    return Promise.resolve(toResponse(fake));
  };
  return { calls, fetch: fetchFn };
};
