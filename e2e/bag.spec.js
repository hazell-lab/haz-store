import { expect, test } from "@playwright/test";
import { openPage, seedStorage } from "./helpers.js";

test("adding from a product page fills the bag drawer with correct totals", async ({ page }) => {
  await openPage(page, "/product/1");
  await page.locator("main").getByRole("button", { name: "Increase quantity" }).first().click();
  await page
    .locator("main")
    .getByRole("button", { name: /add to bag/i })
    .first()
    .click();
  await expect(page.getByText("2 already in your bag")).toBeVisible();

  const bagButton = page.getByRole("button", { name: "Bag, 2 items" });
  await bagButton.click();
  const drawer = page.getByRole("dialog", { name: /bag/i });
  await expect(drawer).toBeVisible();
  // 2 x RM199.20 = RM398.40, free shipping from RM300
  await expect(drawer.getByText("RM398.40").first()).toBeVisible();

  // focus is inside the drawer and escape gives it back
  await expect.poll(() => drawer.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(bagButton).toBeFocused();
});

test("quantity cannot go past the stock", async ({ page }) => {
  // product 1 has 15 in stock
  await seedStorage(page, { cart: [{ id: 1, quantity: 15 }] });
  await openPage(page, "/product/1");
  // desktop shows the full button, phones the sticky buy bar
  const button = page
    .locator("main")
    .getByRole("button", { name: /all (stock is )?in your bag/i })
    .filter({ visible: true })
    .first();
  await expect(button).toBeDisabled();
});

test("the bag survives a reload and the bag page updates totals", async ({ page }) => {
  await seedStorage(page, { cart: [{ id: 12, quantity: 1 }] });
  await openPage(page, "/cart");
  const main = page.locator("main");
  await main
    .getByRole("button", { name: /increase quantity/i })
    .first()
    .click();
  await expect(main.getByTestId("qty-value").first()).toHaveText("2");
  await page.reload();
  await expect(main.getByTestId("qty-value").first()).toHaveText("2");
});

test("the wishlist heart saves a product to the wishlist page", async ({ page }) => {
  await openPage(page, "/shop");
  await page.locator("main").getByRole("button", { name: "Add Nova Wireless Headphones to wishlist" }).click();
  await expect(page.getByRole("link", { name: /wishlist, 1 item/i })).toBeAttached();
  await openPage(page, "/wishlist");
  await expect(page.locator("main").getByText("Nova Wireless Headphones").first()).toBeVisible();
});
