import { expect, mockMatrix } from "./helpers";
import { test } from "@playwright/test";

test.use({ colorScheme: "dark" });

const colorScheme = (): string =>
  getComputedStyle(document.documentElement).colorScheme;

test("follows the system theme until the toggle is used", async ({ page }) => {
  await mockMatrix(page, "online-invite");
  await page.goto("/en/");
  expect(await page.evaluate(colorScheme)).toBe("dark");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");
});

test("the toggle switches the theme and the choice survives a reload", async ({
  page
}) => {
  await mockMatrix(page, "online-invite");
  await page.goto("/en/");
  await page.locator("[data-theme-toggle]").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await page.evaluate(colorScheme)).toBe("light");

  // The inline script in <head> must set it before the body is parsed
  await page.addInitScript(() => {
    const seen = window as unknown as { themeAtBody?: string };
    new MutationObserver((_records, observer) => {
      if (document.body) {
        seen.themeAtBody = document.documentElement.dataset.theme;
        observer.disconnect();
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(
    await page.evaluate(
      () => (window as unknown as { themeAtBody?: string }).themeAtBody
    )
  ).toBe("light");
});
