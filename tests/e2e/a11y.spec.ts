import { expect, mockMatrix } from "./helpers";
import AxeBuilder from "@axe-core/playwright";
import { locales } from "@/i18n/locales";
import { test } from "@playwright/test";

for (const locale of locales) {
  for (const colorScheme of ["light", "dark"] as const) {
    test.describe(`${locale} ${colorScheme}`, () => {
      test.use({ colorScheme });

      test("has no accessibility violations", async ({ page }) => {
        await mockMatrix(page, "online-invite");
        await page.goto(`/${locale}/`);
        const { violations } = await new AxeBuilder({ page }).analyze();
        expect(
          violations.map(({ id, nodes }) => ({
            id,
            targets: nodes.map(({ target }) => target.join(" "))
          }))
        ).toEqual([]);
      });
    });
  }
}
