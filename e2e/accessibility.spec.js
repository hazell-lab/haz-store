import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { openPage, seedStorage } from "./helpers.js";

const paths = ["/", "/shop", "/shop?q=zzzz", "/product/1", "/cart", "/wishlist", "/checkout", "/compare", "/orders", "/does-not-exist"];

for (const theme of ["light", "dark"]) {
  test.describe(theme + " theme", () => {
    test.beforeEach(async ({ page }) => {
      await seedStorage(page, { cart: [{ id: 1, quantity: 1 }], wishlist: [2], recent: [3], compare: [1, 2], theme });
    });

    for (const path of paths) {
      test("no axe violations on " + path, async ({ page }) => {
        await openPage(page, path);
        // show every section and let animations finish, so colours are measured at rest
        await page.evaluate(() => document.querySelectorAll(".reveal").forEach((node) => node.classList.add("is-visible")));
        await page.waitForTimeout(600);
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]).analyze();
        const summary = results.violations.map((item) => item.id + ": " + item.nodes.map((node) => node.target.join(" ")).join(", "));
        expect(summary).toEqual([]);
      });
    }
  });
}
