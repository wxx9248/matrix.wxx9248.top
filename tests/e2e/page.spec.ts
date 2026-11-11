import { expect, mockMatrix } from "./helpers";
import { localeInfo, locales } from "@/i18n/locales";
import { dictionary } from "@/i18n/t";
import { test } from "@playwright/test";

const origin = "https://matrix.wxx9248.top";
const clientLinks = [
  "https://element.io/download",
  "https://fluffychat.im",
  "https://cinny.in",
  "https://matrix.org/ecosystem/clients/"
];

for (const locale of locales) {
  test.describe(`/${locale}/`, () => {
    test.beforeEach(async ({ page }) => {
      await mockMatrix(page, "online-invite");
      await page.goto(`/${locale}/`);
    });

    test("is a page in its own language", async ({ page }) => {
      await expect(page.locator("html")).toHaveAttribute(
        "lang",
        localeInfo[locale].htmlLang
      );
      await expect(page.locator("h1")).toHaveText("[matrix]");
      await expect(page).toHaveTitle(dictionary(locale)["meta.title"]);
    });

    test("has the three panels", async ({ page }) => {
      const strings = dictionary(locale);
      for (const key of ["panel.connect", "panel.status", "panel.start"]) {
        await expect(
          page.getByRole("heading", {
            level: 2,
            name: strings[key as keyof typeof strings]
          })
        ).toBeVisible();
      }
    });

    test("shows the server names and the client links", async ({ page }) => {
      await expect(
        page.locator("code", { hasText: /^wxx9248\.top$/u }).first()
      ).toBeVisible();
      await expect(page.locator("code", { hasText: origin })).toBeVisible();
      for (const href of clientLinks) {
        await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
      }
    });

    test("declares every language to search engines", async ({ page }) => {
      const alternates = page.locator('link[rel="alternate"][hreflang]');
      await expect(alternates).toHaveCount(locales.length + 1);
      for (const other of locales) {
        await expect(
          page.locator(
            `link[rel="alternate"][hreflang="${localeInfo[other].htmlLang}"]`
          )
        ).toHaveAttribute("href", `${origin}/${other}/`);
      }
      await expect(
        page.locator('link[rel="alternate"][hreflang="x-default"]')
      ).toHaveAttribute("href", `${origin}/en/`);
    });
  });
}

test("copy buttons are shown when scripts run", async ({ page }) => {
  await mockMatrix(page, "online-invite");
  await page.goto("/en/");
  const buttons = page.locator("[data-copy]");
  await expect(buttons).toHaveCount(2);
  await expect(buttons.first()).toBeVisible();
  await expect(buttons.first()).toHaveAttribute("data-copy", "wxx9248.top");
  await expect(buttons.last()).toHaveAttribute("data-copy", origin);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("renders the content and hides the copy buttons", async ({ page }) => {
    await mockMatrix(page, "online-invite");
    await page.goto("/en/");
    await expect(page.locator("h1")).toHaveText("[matrix]");
    await expect(page.locator("main section[aria-labelledby]")).toHaveCount(3);
    const buttons = page.locator("[data-copy]");
    for (const button of await buttons.all()) {
      await expect(button).toBeHidden();
    }
    await expect(page.locator("[data-ask-token]")).toBeHidden();
  });
});

test("an unknown path under a page route is a 404 with the four homes", async ({
  page
}) => {
  await mockMatrix(page, "online-invite");
  const response = await page.goto("/en/nope/");
  expect(response?.status()).toBe(404);
  for (const locale of locales) {
    await expect(page.locator(`main a[href="/${locale}/"]`)).toBeVisible();
  }
});
