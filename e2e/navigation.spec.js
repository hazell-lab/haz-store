import { expect, test } from "@playwright/test";
import { openPage, watchErrors } from "./helpers.js";

const routes = [
  { path: "/", heading: /technology, edited/i },
  { path: "/shop", heading: /shop all products/i },
  { path: "/product/1", heading: "Nova Wireless Headphones" },
  { path: "/cart", heading: /bag/i },
  { path: "/wishlist", heading: /wishlist|saved/i },
  { path: "/checkout", heading: "Almost yours." },
];

for (const route of routes) {
  test("loads " + route.path + " directly without errors", async ({ page }) => {
    const errors = watchErrors(page);
    await openPage(page, route.path);
    await expect(page.locator("main h1")).toHaveText(route.heading);
    expect(errors).toEqual([]);
  });
}

test("unknown links show the 404 page", async ({ page }) => {
  await openPage(page, "/does-not-exist");
  await expect(page).toHaveTitle(/page not found/i);
});

test("focus moves to the new page heading after navigation", async ({ page }) => {
  await openPage(page, "/shop");
  await page.locator("main").getByRole("link", { name: "Nova Wireless Headphones" }).first().click();
  await expect(page.locator("main h1")).toHaveText("Nova Wireless Headphones");
  await expect(page.locator("main h1")).toBeFocused();
  await expect(page).toHaveTitle("Nova Wireless Headphones | Haz Store");
});

test("serves robots.txt and a sitemap with every product", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Sitemap:");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap.match(/<url>/g)).toHaveLength(22);
});

test("the page never scrolls sideways", async ({ page }) => {
  for (const path of ["/", "/shop", "/product/1", "/checkout"]) {
    await openPage(page, path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
