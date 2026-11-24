import { describe, expect, it } from "vitest";
import { catalog } from "../test/renderApp.jsx";
import {
  DEFAULT_FILTERS,
  filtersToParams,
  getActiveFilterChips,
  getPriceBounds,
  getSearchSuggestions,
  getShopResults,
  parseFilters,
  removeChipFilter,
  searchProducts,
  sortProducts,
} from "./filters.js";
import { getSalePrice } from "./pricing.js";

const { products, categories } = catalog;
const names = categories.map((category) => category.name);
const filters = (overrides) => ({ ...DEFAULT_FILTERS, ...overrides });

describe("search", () => {
  it("matches name or category, ignoring case and spaces", () => {
    expect(searchProducts(products, "  NOVA PHONE ").map((p) => p.name)).toEqual(expect.arrayContaining(["Nova Phone X"]));
    expect(searchProducts(products, "mice")).toHaveLength(3);
    expect(searchProducts(products, "zzz")).toHaveLength(0);
    expect(searchProducts(products, "")).toHaveLength(products.length);
  });
});

describe("filters", () => {
  it("filters by category", () => {
    const result = getShopResults(products, filters({ category: ["Laptops"] }));
    expect(result).toHaveLength(3);
    expect(result.every((p) => p.category === "Laptops")).toBe(true);
  });

  it("shows several categories at once", () => {
    const result = getShopResults(products, filters({ category: ["Laptops", "Mice"] }));
    expect(result).toHaveLength(6);
    expect(new Set(result.map((p) => p.category))).toEqual(new Set(["Laptops", "Mice"]));
  });

  it("uses the sale price for the price range, limits included", () => {
    const cheap = getShopResults(products, filters({ max: 100 }));
    expect(cheap.length).toBeGreaterThan(0);
    expect(cheap.every((p) => getSalePrice(p) <= 100)).toBe(true);
    const dear = getShopResults(products, filters({ min: 1000 }));
    expect(dear.length).toBeGreaterThan(0);
    expect(dear.every((p) => getSalePrice(p) >= 1000)).toBe(true);
    const middle = getShopResults(products, filters({ min: 100, max: 300 }));
    expect(middle.every((p) => getSalePrice(p) >= 100 && getSalePrice(p) <= 300)).toBe(true);
  });

  it("rounds the slider bounds out to the step", () => {
    const bounds = getPriceBounds(products);
    const prices = products.map(getSalePrice);
    expect(bounds.min).toBeLessThanOrEqual(Math.min(...prices));
    expect(bounds.max).toBeGreaterThanOrEqual(Math.max(...prices));
    expect(bounds.min % 10).toBe(0);
    expect(bounds.max % 10).toBe(0);
    expect(getPriceBounds([])).toEqual({ min: 0, max: 0 });
  });

  it("filters by minimum rating and availability", () => {
    expect(getShopResults(products, filters({ rating: "4" })).every((p) => p.rating >= 4)).toBe(true);
    const soldOut = getShopResults(products, filters({ availability: "out-of-stock" }));
    expect(soldOut).toHaveLength(3);
    expect(soldOut.every((p) => p.stock === 0)).toBe(true);
    expect(getShopResults(products, filters({ availability: "in-stock" }))).toHaveLength(products.length - 3);
  });

  it("combines search, category, price, rating and availability", () => {
    const result = getShopResults(products, filters({ category: ["Mice"], max: 100 }));
    expect(result).toHaveLength(1);
    const combined = getShopResults(products, filters({ q: "nova", rating: "4", availability: "in-stock", min: 100, max: 300 }));
    combined.forEach((p) => {
      expect(p.name.toLowerCase().includes("nova") || p.category.toLowerCase().includes("nova")).toBe(true);
      expect(p.rating).toBeGreaterThanOrEqual(4);
      expect(p.stock).toBeGreaterThan(0);
      expect(getSalePrice(p)).toBeGreaterThanOrEqual(100);
      expect(getSalePrice(p)).toBeLessThanOrEqual(300);
    });
  });
});

describe("sort", () => {
  it("sorts by sale price both ways", () => {
    const low = sortProducts(products, "price-low").map(getSalePrice);
    expect(low).toEqual([...low].sort((a, b) => a - b));
    const high = sortProducts(products, "price-high").map(getSalePrice);
    expect(high).toEqual([...high].sort((a, b) => b - a));
    expect(sortProducts(products, "price-low")[0].name).toBe("Laptop Sleeve 14 inch");
  });

  it("sorts by rating and name", () => {
    const ratings = sortProducts(products, "rating").map((p) => p.rating);
    expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
    const sortedNames = sortProducts(products, "name").map((p) => p.name);
    expect(sortedNames).toEqual([...sortedNames].sort((a, b) => a.localeCompare(b)));
  });

  it("puts featured products first, then by id", () => {
    const result = sortProducts(products, "featured");
    const firstNormal = result.findIndex((p) => !p.featured);
    expect(result.slice(firstNormal).every((p) => !p.featured)).toBe(true);
    const featuredIds = result.slice(0, firstNormal).map((p) => p.id);
    expect(featuredIds).toEqual([...featuredIds].sort((a, b) => a - b));
  });

  it("does not change the original list", () => {
    const before = products.map((p) => p.id);
    sortProducts(products, "name");
    expect(products.map((p) => p.id)).toEqual(before);
  });
});

describe("url params", () => {
  it("reads valid values and ignores unknown ones", () => {
    const parsed = parseFilters(new URLSearchParams("category=Mice,Toasters,Mice&min=50&max=x&rating=9&sort=bogus&q=nova"), names);
    expect(parsed).toEqual({ ...DEFAULT_FILTERS, category: ["Mice"], min: 50, q: "nova" });
    expect(parseFilters(new URLSearchParams("category=Toasters"), names).category).toEqual([]);
    expect(parseFilters(new URLSearchParams("min=-5"), names).min).toBeNull();
  });

  it("swaps a reversed price range", () => {
    const parsed = parseFilters(new URLSearchParams("min=500&max=100"), names);
    expect([parsed.min, parsed.max]).toEqual([100, 500]);
  });

  it("still opens old links with fixed price ranges", () => {
    expect(parseFilters(new URLSearchParams("price=under100"), names)).toMatchObject({ min: null, max: 100 });
    expect(parseFilters(new URLSearchParams("price=100-300"), names)).toMatchObject({ min: 100, max: 300 });
    expect(parseFilters(new URLSearchParams("price=above1000"), names)).toMatchObject({ min: 1000, max: null });
    expect(parseFilters(new URLSearchParams("price=banana"), names)).toMatchObject({ min: null, max: null });
  });

  it("writes only non default values", () => {
    expect(filtersToParams(filters({ category: ["Mice", "Laptops"], sort: "featured" })).toString()).toBe("category=Mice%2CLaptops");
    expect(filtersToParams(filters({ min: 100, max: 300 })).toString()).toBe("min=100&max=300");
    expect(filtersToParams(DEFAULT_FILTERS).toString()).toBe("");
  });

  it("makes one chip per category and one for the price", () => {
    const chips = getActiveFilterChips(filters({ q: "nova", category: ["Mice", "Laptops"], min: 100, max: 300, availability: "in-stock" }));
    expect(chips.map((chip) => chip.key)).toEqual(["q", "category:Mice", "category:Laptops", "price", "availability"]);
    expect(chips[3].label).toBe("RM100 - RM300");
    expect(getActiveFilterChips(filters({ min: 100 }))[0].label).toBe("From RM100");
    expect(getActiveFilterChips(filters({ max: 300 }))[0].label).toBe("Up to RM300");
  });

  it("removes the filter behind a chip", () => {
    const start = filters({ category: ["Mice", "Laptops"], min: 100, max: 300, rating: "4" });
    expect(removeChipFilter(start, "category:Mice").category).toEqual(["Laptops"]);
    expect(removeChipFilter(start, "price")).toMatchObject({ min: null, max: null });
    expect(removeChipFilter(start, "rating").rating).toBe("all");
  });
});

describe("search suggestions", () => {
  it("lists names that start with the term first, up to the limit", () => {
    const result = getSearchSuggestions(products, "nova", 3);
    expect(result).toHaveLength(3);
    expect(result.every((p) => p.name.toLowerCase().startsWith("nova"))).toBe(true);
    expect(getSearchSuggestions(products, " ")).toEqual([]);
  });
});
