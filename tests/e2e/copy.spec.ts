import { expect, mockMatrix } from "./helpers";
import { test } from "@playwright/test";

const copyHomeserver = '[data-copy="wxx9248.top"]';

test("copying puts the value on the clipboard and says so", async ({
  context,
  page
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  await mockMatrix(page, "online-invite");
  await page.goto("/en/");
  await page.locator(copyHomeserver).click();
  await expect(page.locator("[data-message]")).toHaveText(
    '"wxx9248.top" copied'
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "wxx9248.top"
  );
  expect(errors).toEqual([]);
});

test("the message goes away after a few seconds", async ({ page }) => {
  await page.clock.install();
  await mockMatrix(page, "online-invite");
  await page.goto("/en/");
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.locator(copyHomeserver).click();
  await expect(page.locator("[data-message]")).not.toHaveText("");
  await page.clock.runFor(4_500);
  await expect(page.locator("[data-message]")).toHaveText("");
});

test("a rejected clipboard shows the failure message", async ({ page }) => {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("denied")) }
    });
  });
  await mockMatrix(page, "online-invite");
  await page.goto("/en/");
  await page.locator(copyHomeserver).click();
  await expect(page.locator("[data-message]")).toHaveText(
    "Couldn't copy; select the text instead."
  );
  expect(errors).toEqual([]);
});
