import { type Page, test } from "@playwright/test";
import { type Scenario, expect, mockMatrix } from "./helpers";

const row = (page: Page, name: string) => page.locator(`[data-row="${name}"]`);

const open = async (page: Page, scenario: Scenario) => {
  const mock = await mockMatrix(page, scenario);
  await page.goto("/en/");
  // The checks are done once the last-checked line is filled in
  await expect(page.locator("[data-checked]")).toContainText("checked");
  return mock;
};

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the status panel only says it needs JavaScript", async ({ page }) => {
    await mockMatrix(page, "online-invite");
    await page.goto("/en/");
    const panel = page.locator("#status");
    await expect(panel).toContainText("Live status needs JavaScript.");
    await expect(page.locator("[data-row]").first()).toBeHidden();
    await expect(page.locator("[data-token-checker]")).toBeHidden();
    await expect(page.locator("[data-refresh]")).toBeHidden();
  });
});

test("rows show 'checking…' while the first check runs", async ({ page }) => {
  await mockMatrix(page, "online-invite");
  // Holds the first answer back so the waiting state can be seen
  await page.route("**/_matrix/client/versions", async (route) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 600);
    });
    await route.fallback();
  });
  await page.goto("/en/");
  await expect(row(page, "server")).toContainText("checking…");
  await expect(row(page, "server").locator("[data-dot]")).toHaveAttribute(
    "data-dot",
    "none"
  );
  await expect(row(page, "server")).toContainText("online");
});

test("an online invite-only server", async ({ page }) => {
  await open(page, "online-invite");
  await expect(row(page, "server")).toContainText("online");
  await expect(row(page, "server")).toContainText("Synapse 1.163.0");
  await expect(row(page, "server").locator("[data-dot]")).toHaveAttribute(
    "data-dot",
    "ok"
  );
  await expect(row(page, "registration")).toContainText("invite only");
  await expect(row(page, "registration").locator("[data-dot]")).toHaveAttribute(
    "data-dot",
    "warn"
  );
  await expect(row(page, "spec")).toContainText("v1.15");
  await expect(row(page, "spec").locator("[data-label]")).toHaveClass(/code/u);
  await expect(row(page, "signIn")).toContainText("password");
  await expect(row(page, "discovery")).toContainText(
    "wxx9248.top → matrix.wxx9248.top"
  );
  const contact = row(page, "contact");
  await expect(contact.locator("a[data-matrix]")).toHaveAttribute(
    "href",
    "https://matrix.to/#/@wxx9248:wxx9248.top"
  );
  await expect(contact.locator("a[data-matrix]")).toHaveText(
    "@wxx9248:wxx9248.top"
  );
  await expect(contact.locator("a[data-email]")).toHaveAttribute(
    "href",
    "mailto:wxx9248@wxx9248.top"
  );
  await expect(contact.locator("a[data-email]")).toHaveText("email");
  await expect(page.locator("[data-token-checker]")).toBeVisible();
  const ask = page.locator("[data-ask-token]");
  await expect(ask).toBeVisible();
  await expect(ask.locator("a")).toHaveAttribute(
    "href",
    "https://matrix.to/#/@wxx9248:wxx9248.top"
  );
  await expect(page.locator("[data-bar-state]")).toHaveText("online");
});

test("a row's note moves to its own line instead of breaking mid-phrase", async ({
  page
}) => {
  await open(page, "online-invite");
  const note = row(page, "registration").locator("[data-note]");
  await expect(note).toHaveText("needs a registration token");
  const lines = await note.evaluate((element) => {
    const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);
    return Math.round(element.getBoundingClientRect().height / lineHeight);
  });
  expect(lines).toBe(1);
});

test("an open server has no token checker", async ({ page }) => {
  await open(page, "online-open");
  await expect(row(page, "registration")).toContainText("open");
  await expect(row(page, "registration").locator("[data-dot]")).toHaveAttribute(
    "data-dot",
    "ok"
  );
  await expect(page.locator("[data-token-checker]")).toBeHidden();
});

test("a closed server", async ({ page }) => {
  await open(page, "online-closed");
  await expect(row(page, "registration")).toContainText("closed");
  await expect(row(page, "registration").locator("[data-dot]")).toHaveAttribute(
    "data-dot",
    "bad"
  );
  await expect(page.locator("[data-token-checker]")).toBeHidden();
});

test("an offline server leaves the other rows unknown", async ({ page }) => {
  await open(page, "offline");
  await expect(row(page, "server")).toContainText("offline");
  await expect(row(page, "server").locator("[data-dot]")).toHaveAttribute(
    "data-dot",
    "bad"
  );
  for (const name of ["registration", "spec", "signIn"]) {
    await expect(row(page, name)).toContainText("unknown");
  }
  await expect(row(page, "spec").locator("[data-label]")).not.toHaveClass(
    /code/u
  );
  await expect(page.locator("[data-bar-state]")).toHaveText("offline");
  await expect(row(page, "contact").locator("a[data-matrix]")).toBeVisible();
  await expect(page.locator("[data-token-checker]")).toBeHidden();
});

test("an OAuth server links its account page", async ({ page }) => {
  await open(page, "oauth");
  await expect(
    row(page, "signIn").getByRole("link", { name: "account page" })
  ).toHaveAttribute("href", "https://matrix.wxx9248.top/account/");
  await expect(row(page, "registration")).toContainText("open");
});

test("a missing discovery file is reported and the fallback URL is used", async ({
  page
}) => {
  const { requests } = await open(page, "discovery-failure");
  await expect(row(page, "discovery")).toContainText(
    "wxx9248.top has no client discovery file"
  );
  await expect(row(page, "server")).toContainText("online");
  expect(
    requests.some(({ url }) =>
      url.startsWith("https://matrix.wxx9248.top/_matrix/client/versions")
    )
  ).toBe(true);
});

test("refresh runs one more check, then waits ten seconds", async ({
  page
}) => {
  await page.clock.install();
  const { requests } = await open(page, "online-invite");
  const registerPosts = () =>
    requests.filter(
      ({ method, url }) => method === "POST" && url.includes("/v3/register")
    ).length;
  expect(registerPosts()).toBe(1);

  const refresh = page.locator("[data-refresh]");
  await expect(refresh).toBeEnabled();
  await refresh.click();
  // Faster than a person can: the button is already disabled
  await refresh.click({ force: true });
  await refresh.click({ force: true });
  await expect(refresh).toBeDisabled();
  await expect(page.locator("[data-message]")).toHaveText("status refreshed");

  await page.clock.runFor(9_000);
  await expect(refresh).toBeDisabled();
  await page.clock.runFor(1_500);
  await expect(refresh).toBeEnabled();
  expect(registerPosts()).toBe(2);
});

test("a refresh that finds no contact hides the ask-for-a-token sentence", async ({
  page
}) => {
  await open(page, "online-invite");
  await expect(page.locator("[data-ask-token]")).toBeVisible();
  await page.route("**/.well-known/matrix/support", (route) =>
    route.fulfill({ status: 404 })
  );
  await page.locator("[data-refresh]").click();
  await expect(page.locator("[data-message]")).toHaveText("status refreshed");
  await expect(row(page, "contact")).toBeHidden();
  await expect(page.locator("[data-ask-token]")).toBeHidden();
});

test("the refresh button comes back even if showing a check fails", async ({
  page
}) => {
  await page.clock.install();
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && message.text().includes("data-note")) {
      errors.push(message.text());
    }
  });
  await open(page, "online-invite");
  // Breaks the page's own markup so that writing the result throws
  await page.evaluate(() => {
    document.querySelector('[data-row="spec"] [data-note]')?.remove();
  });
  const refresh = page.locator("[data-refresh]");
  await refresh.click();
  await expect(refresh).toBeDisabled();
  await expect.poll(() => errors.length).toBeGreaterThan(0);
  await expect(page.locator("[data-message]")).toHaveText("");
  await page.clock.runFor(11_000);
  await expect(refresh).toBeEnabled();
});
