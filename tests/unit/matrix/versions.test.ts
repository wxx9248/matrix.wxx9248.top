import { describe, expect, it } from "vitest";
import { federationVersion, versions } from "@tests/fixtures/matrix";
import {
  getSoftware,
  getVersions,
  highestSpecVersion
} from "@/lib/matrix/versions";
import { fakeFetch } from "@tests/unit/matrix/fake-fetch";

const base = "https://matrix.wxx9248.top";
const versionsUrl = `${base}/_matrix/client/versions`;
const softwareUrl = `${base}/_matrix/federation/v1/version`;

describe("highestSpecVersion", () => {
  it("compares versions numerically and ignores r-versions", () => {
    expect(highestSpecVersion(["v1.9", "v1.15", "r0.6.1", "v1.10"])).toBe(
      "v1.15"
    );
  });

  it("returns null when there is no vX.Y entry", () => {
    expect(highestSpecVersion(["r0.6.1"])).toBeNull();
    expect(highestSpecVersion([])).toBeNull();
  });

  it("skips entries that are not well-formed versions", () => {
    expect(highestSpecVersion(["v1.x", 3, "v2.0"])).toBe("v2.0");
  });
});

describe("getVersions", () => {
  it("reports the live fixture as online with its spec version", async () => {
    const { fetch, calls } = fakeFetch({
      [versionsUrl]: { json: versions, status: 200 }
    });
    expect(await getVersions(fetch, base)).toEqual({
      online: true,
      spec: "v1.15"
    });
    expect(calls.map((call) => call.url)).toEqual([versionsUrl]);
  });

  it.each([
    ["502", { status: 502 }],
    ["503", { status: 503 }],
    ["404", { status: 404 }],
    ["a network error", "network-error"],
    ["a timeout", "timeout"],
    ["a non-array versions field", { json: { versions: "v1.1" }, status: 200 }],
    ["a non-JSON body", { status: 200, text: "<html>" }]
  ] as const)("reports %s as offline", async (_name, route) => {
    const { fetch } = fakeFetch({ [versionsUrl]: route });
    expect(await getVersions(fetch, base)).toEqual({ online: false });
  });

  it("is online with no spec when only r-versions are listed", async () => {
    const { fetch } = fakeFetch({
      [versionsUrl]: { json: { versions: ["r0.6.1"] }, status: 200 }
    });
    expect(await getVersions(fetch, base)).toEqual({
      online: true,
      spec: null
    });
  });
});

describe("getSoftware", () => {
  it("reads the server name and version", async () => {
    const { fetch, calls } = fakeFetch({
      [softwareUrl]: { json: federationVersion, status: 200 }
    });
    expect(await getSoftware(fetch, base)).toEqual({
      name: "Synapse",
      version: "1.163.0"
    });
    expect(calls.map((call) => call.url)).toEqual([softwareUrl]);
  });

  it.each([
    ["a 404", { status: 404 }],
    ["a malformed body", { json: { server: {} }, status: 200 }],
    ["a network error", "network-error"]
  ] as const)("returns null for %s", async (_name, route) => {
    const { fetch } = fakeFetch({ [softwareUrl]: route });
    expect(await getSoftware(fetch, base)).toBeNull();
  });
});
