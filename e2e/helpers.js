import { expect } from "@playwright/test";

// open a page and wait for its main heading (pages load lazily)
export async function openPage(page, path) {
  await page.goto(path);
  await expect(page.locator("main h1")).toBeVisible();
}

// collect console errors, page errors and failed requests
export function watchErrors(page) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => errors.push("request failed: " + request.url()));
  return errors;
}

// put saved data in local storage before the app starts
export async function seedStorage(page, { cart, wishlist, recent, compare, theme } = {}) {
  await page.addInitScript(
    (data) => {
      // only seed once per tab, so reloads keep what the test changed
      if (window.sessionStorage.getItem("e2e-seeded")) {
        return;
      }
      window.sessionStorage.setItem("e2e-seeded", "1");
      if (data.cart) window.localStorage.setItem("HazStoreCart", JSON.stringify(data.cart));
      if (data.wishlist) window.localStorage.setItem("HazStoreWishlist", JSON.stringify(data.wishlist));
      if (data.recent) window.localStorage.setItem("HazStoreRecent", JSON.stringify(data.recent));
      if (data.compare) window.localStorage.setItem("HazStoreCompare", JSON.stringify(data.compare));
      if (data.theme) window.localStorage.setItem("HazStoreTheme", data.theme);
    },
    { cart, wishlist, recent, compare, theme },
  );
}

export function isMobile(testInfo) {
  return testInfo.project.name === "mobile";
}
