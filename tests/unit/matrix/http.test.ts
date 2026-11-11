import { describe, expect, it } from "vitest";
import { fakeFetch } from "@tests/unit/matrix/fake-fetch";
import { requestJson } from "@/lib/matrix/http";

const url = "https://h.example/x";

describe("requestJson", () => {
  it("returns the status and parsed body of a JSON response", async () => {
    const { fetch } = fakeFetch({ [url]: { json: { a: 1 }, status: 200 } });
    expect(await requestJson(fetch, url)).toEqual({
      body: { a: 1 },
      kind: "response",
      status: 200
    });
  });

  it("returns a null body when the response is not JSON", async () => {
    const { fetch } = fakeFetch({ [url]: { status: 200, text: "<html>" } });
    expect(await requestJson(fetch, url)).toEqual({
      body: null,
      kind: "response",
      status: 200
    });
  });

  it("keeps non-200 statuses as responses", async () => {
    const { fetch } = fakeFetch({ [url]: { json: { e: 1 }, status: 401 } });
    expect(await requestJson(fetch, url)).toEqual({
      body: { e: 1 },
      kind: "response",
      status: 401
    });
  });

  it("reports a network error as failed", async () => {
    const { fetch } = fakeFetch({ [url]: "network-error" });
    expect(await requestJson(fetch, url)).toEqual({ kind: "failed" });
  });

  it("reports a timeout as failed", async () => {
    const { fetch } = fakeFetch({ [url]: "timeout" });
    expect(await requestJson(fetch, url)).toEqual({ kind: "failed" });
  });

  it("reports an unknown URL as failed", async () => {
    const { fetch } = fakeFetch({});
    expect(await requestJson(fetch, url)).toEqual({ kind: "failed" });
  });

  it("passes an abort signal and the caller's init", async () => {
    const { fetch, calls } = fakeFetch({ [url]: { json: {}, status: 200 } });
    await requestJson(fetch, url, { method: "POST" });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.init?.signal).toBeInstanceOf(AbortSignal);
    expect(calls[0]?.init?.method).toBe("POST");
  });
});
