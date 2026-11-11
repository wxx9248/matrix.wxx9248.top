import { type Page, test } from "@playwright/test";
import { type TokenAnswer, expect, mockMatrix } from "./helpers";

const label = "Got a registration token? Check it before you sign up.";

const openChecker = async (page: Page, token: TokenAnswer) => {
  const mock = await mockMatrix(page, "online-invite", { token });
  await page.goto("/en/");
  await expect(page.locator("[data-token-checker]")).toBeVisible();
  return mock;
};

const submit = async (page: Page, value: string) => {
  await page.getByLabel(label).fill(value);
  await page.getByRole("button", { name: "check" }).click();
};

const validityRequests = (requests: { url: string }[]) =>
  requests.filter(({ url }) => url.includes("/validity"));

const cases = [
  ["valid", "✓ valid.", "tone-ok"],
  ["invalid", "✗ not valid: mistyped, used up or expired.", "tone-bad"],
  ["rate-limited", "Too many tries; wait a minute.", "tone-muted"]
] as const;

for (const [answer, text, tone] of cases) {
  test(`a ${answer} answer is shown as "${text}"`, async ({ page }) => {
    await openChecker(page, answer);
    await submit(page, "abc");
    const result = page.locator("[data-token-result]");
    await expect(result).toHaveText(text);
    await expect(result).toHaveClass(new RegExp(tone, "u"));
  });
}

test("an empty token makes no request", async ({ page }) => {
  const { requests } = await openChecker(page, "valid");
  await submit(page, "  ");
  await expect(page.locator("[data-token-result]")).toHaveText("");
  expect(validityRequests(requests)).toHaveLength(0);
});

test("the token is trimmed and encoded", async ({ page }) => {
  const { requests } = await openChecker(page, "valid");
  await submit(page, " ab&c=d ");
  await expect(page.locator("[data-token-result]")).toHaveText(/valid/u);
  const [request, ...rest] = validityRequests(requests);
  expect(rest).toHaveLength(0);
  expect(request?.url).toContain("token=ab%26c%3Dd");
});

test("editing the token clears the previous answer", async ({ page }) => {
  await openChecker(page, "valid");
  await submit(page, "abc");
  await expect(page.locator("[data-token-result]")).toHaveText(/valid/u);
  await page.getByLabel(label).fill("abcd");
  await expect(page.locator("[data-token-result]")).toHaveText("");
});

test("an answer that arrives after an edit is dropped", async ({ page }) => {
  await openChecker(page, "valid");
  await page.route("**/validity?*", async (route) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 400);
    });
    await route.fallback();
  });
  const answered = page.waitForResponse(/validity/u);
  await submit(page, "abc");
  await expect(page.locator("[data-token-result]")).toHaveText("checking…");
  await page.getByLabel(label).fill("abcd");
  await answered;
  // Lets the page handle the answer before looking
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        setTimeout(resolve);
      })
  );
  await expect(page.locator("[data-token-result]")).toHaveText("");
});
