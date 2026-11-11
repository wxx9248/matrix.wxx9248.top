import { defineConfig } from "@playwright/test";

const port = 8788;

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  projects: [
    { name: "phone", use: { viewport: { height: 844, width: 390 } } },
    { name: "desktop", use: { viewport: { height: 800, width: 1280 } } }
  ],
  reporter: [["list"], ["html", { open: "never" }]],
  testDir: "tests/e2e",
  use: { baseURL: `http://localhost:${port}` },
  webServer: {
    command: `pnpm exec astro build && pnpm exec wrangler dev --port ${port}`,
    env: { WRANGLER_SEND_METRICS: "false" },
    port,
    reuseExistingServer: !process.env.CI
  }
});
