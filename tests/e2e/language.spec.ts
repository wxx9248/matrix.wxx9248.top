import { expect, mockMatrix } from "./helpers";
import { locales } from "@/i18n/locales";
import { test } from "@playwright/test";

test.describe("the / redirect", () => {
  test.describe("for a Hong Kong browser", () => {
    test.use({ locale: "zh-HK" });

    test("lands on Traditional Chinese", async ({ page }) => {
      await mockMatrix(page, "online-invite");
      await page.goto("/");
      await expect(page).toHaveURL(/\/zh-TW\/$/u);
    });
  });

  test.describe("for a German browser", () => {
    test.use({ locale: "de-DE" });

    test("lands on English", async ({ page }) => {
      await mockMatrix(page, "online-invite");
      await page.goto("/");
      await expect(page).toHaveURL(/\/en\/$/u);
    });
  });

  test("follows the lang cookie over the browser language", async ({
    baseURL,
    context,
    page
  }) => {
    await context.addCookies([{ name: "lang", url: baseURL, value: "ja" }]);
    await mockMatrix(page, "online-invite");
    await page.goto("/");
    await expect(page).toHaveURL(/\/ja\/$/u);
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("lists the four homes", async ({ page }) => {
      await mockMatrix(page, "online-invite");
      await page.goto("/");
      for (const locale of locales) {
        await expect(page.locator(`main a[href="/${locale}/"]`)).toBeVisible();
      }
    });
  });
});

test("the switcher goes to the other language and remembers it", async ({
  context,
  page
}) => {
  await mockMatrix(page, "online-invite");
  await page.goto("/en/");
  await page.locator('a[data-locale="ja"]').click();
  await expect(page).toHaveURL(/\/ja\/$/u);
  const cookie = (await context.cookies()).find(({ name }) => name === "lang");
  expect(cookie?.value).toBe("ja");
  const secondsLeft = (cookie?.expires ?? 0) - Date.now() / 1000;
  const year = 31_536_000;
  expect(secondsLeft).toBeGreaterThan(year - 120);
  expect(secondsLeft).toBeLessThanOrEqual(year);
});

test("the switcher marks the current language", async ({ page }) => {
  await mockMatrix(page, "online-invite");
  await page.goto("/zh-CN/");
  await expect(page.locator('a[data-locale="zh-CN"]')).toHaveAttribute(
    "aria-current",
    "page"
  );
  await expect(page.locator('a[data-locale="en"]')).not.toHaveAttribute(
    "aria-current"
  );
});
