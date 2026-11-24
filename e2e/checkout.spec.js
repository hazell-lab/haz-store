import { expect, test } from "@playwright/test";
import { openPage, seedStorage } from "./helpers.js";

test.beforeEach(async ({ page }) => {
  await seedStorage(page, { cart: [{ id: 1, quantity: 1 }] });
});

test("shows errors for an empty form and focuses the first one", async ({ page }) => {
  await openPage(page, "/checkout");
  await page.getByRole("button", { name: /place demo order/i }).click();
  await expect(page.getByLabel("Full name")).toBeFocused();
  await expect(page.getByLabel("Full name")).toHaveAttribute("aria-invalid", "true");
});

test("places a labelled demo order that survives a refresh", async ({ page }) => {
  await openPage(page, "/checkout");
  await page.getByLabel("Full name").fill("Test Buyer");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Phone number").fill("012-345 6789");
  await page.getByLabel("Address").fill("1 Jalan Test");
  await page.getByLabel("City").fill("Shah Alam");
  await page.getByLabel("Postcode").fill("40000");
  await page.getByLabel("State").selectOption("Selangor");
  await page.getByRole("button", { name: /place demo order/i }).click();

  await expect(page.getByRole("button", { name: /placing demo order/i })).toBeDisabled();
  await expect(page.getByRole("heading", { name: "Thank you, Test Buyer." })).toBeVisible();
  await expect(page.getByText(/no payment was taken and nothing will be shipped/i)).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Thank you, Test Buyer." })).toBeVisible();
});

test("never asks for card details", async ({ page }) => {
  await openPage(page, "/checkout");
  await expect(page.getByLabel(/card number|cvv|expiry/i)).toHaveCount(0);
});

test("a demo order with the promo code shows up in the order history", async ({ page }) => {
  await openPage(page, "/checkout");
  await page.getByLabel("Promo code").fill("HAZDEMO10");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText("HAZDEMO10 applied")).toBeVisible();
  await page.getByLabel("Full name").fill("Test Buyer");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Phone number").fill("012-345 6789");
  await page.getByLabel("Address").fill("1 Jalan Test");
  await page.getByLabel("City").fill("Shah Alam");
  await page.getByLabel("Postcode").fill("40000");
  await page.getByLabel("State").selectOption("Selangor");
  await page.getByRole("button", { name: /place demo order/i }).click();
  await page.getByRole("link", { name: "View demo orders" }).click();
  await expect(page.locator("main h1")).toHaveText("Demo orders");
  await expect(page.getByText(/Promo HAZDEMO10/)).toBeVisible();
});
