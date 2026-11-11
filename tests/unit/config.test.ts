import { describe, expect, it } from "vitest";
import { serverConfig } from "@/config/server";

describe("serverConfig", () => {
  it("names the homeserver and its fallback base URL", () => {
    expect(serverConfig.serverName).toBe("wxx9248.top");
    expect(serverConfig.fallbackBaseUrl).toBe("https://matrix.wxx9248.top");
  });
});
