import { type FakeRoute, fakeFetch } from "@tests/unit/matrix/fake-fetch";
import { describe, expect, it } from "vitest";
import {
  probeRegistration,
  registrationFromFlows
} from "@/lib/matrix/registration";
import { register401 } from "@tests/fixtures/matrix";

const base = "https://matrix.wxx9248.top";
const registerUrl = `${base}/_matrix/client/v3/register`;

const probeWith = (route: FakeRoute) => {
  const { fetch, calls } = fakeFetch({ [registerUrl]: route });
  return { calls, result: probeRegistration(fetch, base) };
};

const withFlows = (flows: unknown) => ({
  json: { flows, session: "s" },
  status: 401
});

describe("probeRegistration", () => {
  it("reports invite only when every flow needs a token", async () => {
    expect(await probeWith({ json: register401, status: 401 }).result).toEqual({
      requirements: [],
      state: "invite"
    });
  });

  it("reports open when any flow needs no token", async () => {
    expect(
      await probeWith(
        withFlows([
          { stages: ["m.login.registration_token"] },
          { stages: ["m.login.dummy"] }
        ])
      ).result
    ).toEqual({ requirements: [], state: "open" });
  });

  it("collects requirements in a fixed order without duplicates", async () => {
    expect(
      await probeWith(
        withFlows([
          {
            stages: [
              "m.login.terms",
              "m.login.recaptcha",
              "m.login.email.identity"
            ]
          },
          { stages: ["m.login.email.identity", "m.login.dummy"] }
        ])
      ).result
    ).toEqual({ requirements: ["email", "captcha", "terms"], state: "open" });
  });

  it("maps msisdn to phone", async () => {
    expect(
      await probeWith(withFlows([{ stages: ["m.login.msisdn"] }])).result
    ).toEqual({ requirements: ["phone"], state: "open" });
  });

  it("reports closed for 403", async () => {
    expect(await probeWith({ status: 403 }).result).toEqual({
      requirements: [],
      state: "closed"
    });
  });

  it.each([
    ["429", { status: 429 }],
    ["500", { status: 500 }],
    ["a network error", "network-error" as const],
    ["a 401 without flows", { json: {}, status: 401 }],
    ["a 401 with empty flows", withFlows([])],
    ["a 401 that is not JSON", { status: 401, text: "nope" }]
  ])("reports unknown for %s", async (_name, route) => {
    expect(await probeWith(route).result).toEqual({
      requirements: [],
      state: "unknown"
    });
  });

  it("probes with an empty JSON body and no auth", async () => {
    const { calls, result } = probeWith({ json: register401, status: 401 });
    await result;
    expect(calls).toHaveLength(1);
    const [{ init, url }] = calls;
    expect(url).toBe(registerUrl);
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe("{}");
    expect(new Headers(init?.headers).get("content-type")).toBe(
      "application/json"
    );
    expect(String(init?.body)).not.toContain("auth");
  });
});

describe("registrationFromFlows", () => {
  it("treats a non-array as unknown", () => {
    expect(registrationFromFlows("x")).toEqual({
      requirements: [],
      state: "unknown"
    });
  });

  it("skips malformed flows", () => {
    expect(
      registrationFromFlows([
        null,
        { stages: "x" },
        { stages: ["m.login.dummy"] }
      ])
    ).toEqual({ requirements: [], state: "open" });
  });
});
