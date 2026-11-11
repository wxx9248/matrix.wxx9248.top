import { type FakeRoute, fakeFetch } from "@tests/unit/matrix/fake-fetch";
import { describe, expect, it } from "vitest";
import { getContact, matrixToUrl } from "@/lib/matrix/support";
import { serverConfig } from "@/config/server";
import { wellKnownSupport } from "@tests/fixtures/matrix";

const supportUrl = "https://wxx9248.top/.well-known/matrix/support";

const contactWith = (route: FakeRoute) => {
  const { fetch, calls } = fakeFetch({ [supportUrl]: route });
  return { calls, result: getContact(fetch, serverConfig) };
};

// The keys are snake_case on the wire
const contact = (
  role: string,
  matrixId: string | null = null,
  email: string | null = null
) => ({
  ...Object.fromEntries(
    [
      ["matrix_id", matrixId],
      ["email_address", email]
    ].filter(([, value]) => value !== null)
  ),
  role
});

describe("getContact", () => {
  it("reads the admin contact from the support file", async () => {
    const { calls, result } = contactWith({
      json: wellKnownSupport,
      status: 200
    });
    expect(await result).toEqual({
      email: "wxx9248@wxx9248.top",
      matrixId: "@wxx9248:wxx9248.top"
    });
    expect(calls.map((call) => call.url)).toEqual([supportUrl]);
  });

  it("picks the first admin even when a security contact comes first", async () => {
    const { result } = contactWith({
      json: {
        contacts: [
          contact("m.role.security", "@sec:wxx9248.top"),
          contact("m.role.admin", "@first:wxx9248.top"),
          contact("m.role.admin", "@second:wxx9248.top")
        ]
      },
      status: 200
    });
    expect(await result).toEqual({
      email: null,
      matrixId: "@first:wxx9248.top"
    });
  });

  it("accepts an admin with only an email address", async () => {
    const { result } = contactWith({
      json: {
        contacts: [contact("m.role.admin", null, "a@b.example")]
      },
      status: 200
    });
    expect(await result).toEqual({ email: "a@b.example", matrixId: null });
  });

  it.each([
    [
      "only a support page",
      {
        json: Object.fromEntries([
          ["support_page", "https://matrix.wxx9248.top"]
        ]),
        status: 200
      }
    ],
    [
      "no admin contact",
      {
        json: {
          contacts: [contact("m.role.security", "@s:b.c")]
        },
        status: 200
      }
    ],
    [
      "an admin without any address",
      { json: { contacts: [contact("m.role.admin")] }, status: 200 }
    ],
    ["a missing file", { status: 404 }],
    ["a malformed body", { status: 200, text: "<html>" }],
    ["a null body", { status: 200, text: "null" }],
    ["a network error", "network-error" as const]
  ])("returns null for %s", async (_name, route) => {
    expect(await contactWith(route).result).toBeNull();
  });
});

describe("matrixToUrl", () => {
  it("links to matrix.to", () => {
    expect(matrixToUrl("@a:b.c")).toBe("https://matrix.to/#/@a:b.c");
  });
});
