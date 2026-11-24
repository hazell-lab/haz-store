import { expect, test } from "@playwright/test";
import { isMobile, openPage } from "./helpers.js";

const cards = (page) => page.locator("main .product-grid .product-card");

test("category pills filter the products and update the link", async ({ page }) => {
  await openPage(page, "/shop");
  await expect(page.getByText("All 20 products")).toBeVisible();
  await page
    .getByRole("group", { name: "Filter by category" })
    .getByRole("button", { name: /headphones/i })
    .click();
  await expect(page).toHaveURL(/category=Headphones/);
  await expect(page.getByText(/products? match/)).toBeVisible();

  // the back button restores the previous results
  await page.goBack();
  await expect(page.getByText("All 20 products")).toBeVisible();
});

test("a shared link restores the filters and chips can be removed", async ({ page }) => {
  await openPage(page, "/shop?category=Headphones&sort=price-low");
  await expect(page.getByRole("button", { name: /remove filter/i })).toHaveCount(1);
  await expect(page.locator("#sortSelect")).toHaveValue("price-low");

  await page.getByRole("button", { name: /remove filter/i }).click();
  await expect(page.getByText("All 20 products")).toBeVisible();
  // clearing filters keeps the sort
  await expect(page).toHaveURL(/sort=price-low/);
});

test("search with no results shows an empty state that can be cleared", async ({ page }) => {
  await openPage(page, "/shop");
  await page.getByPlaceholder(/search by product/i).fill("zzzz");
  await expect(page.getByText(/no products found/i)).toBeVisible();
  await page.getByRole("button", { name: "Clear all filters" }).click();
  await expect(page.getByText("All 20 products")).toBeVisible();
});

test("show more loads the next page of products", async ({ page }) => {
  await openPage(page, "/shop");
  const before = await cards(page).count();
  expect(before).toBeLessThan(20);
  await page.getByRole("button", { name: /show more products/i }).click();
  await expect.poll(() => cards(page).count()).toBeGreaterThan(before);
});

test("header search suggests products and opens one", async ({ page }) => {
  await openPage(page, "/");
  await page.getByRole("button", { name: "Search products" }).click();
  await page.keyboard.type("nova");
  await expect(page.getByRole("option").first()).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/product\/\d+/);
});

test("the mobile filter sheet opens and closes with escape", async ({ page }, testInfo) => {
  test.skip(!isMobile(testInfo), "mobile only");
  await openPage(page, "/shop");
  const toggle = page.locator("main").getByRole("button", { name: /^filters/i });
  await toggle.click();
  await expect(page.locator(".filter-panel.open")).toBeVisible();
  // several categories and a price slider (moved with the keyboard)
  await page.getByRole("checkbox", { name: "Mice" }).check();
  await page.getByRole("checkbox", { name: "Laptops" }).check();
  await expect(page).toHaveURL(/category=Mice%2CLaptops/);
  await page.locator("#priceMax").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page).toHaveURL(/max=\d+/);
  await page.keyboard.press("Escape");
  await expect(page.locator(".filter-panel.open")).toHaveCount(0);
  await expect(toggle).toBeFocused();
});
