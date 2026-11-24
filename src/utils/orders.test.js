import { describe, expect, it } from "vitest";
import { catalog } from "../test/renderApp.jsx";
import { addManyToCart, getCartLines, getCartTotals } from "./cart.js";
import { addOrder, checkPromoCode, cleanOrders, createOrderRecord } from "./orders.js";

const { products } = catalog;
const soldOut = products.find((p) => p.stock === 0);

function makeOrder(number, date, overrides = {}) {
  const lines = getCartLines([{ id: 1, quantity: 2 }], products);
  return {
    ...createOrderRecord({ number, date: new Date(date), lines, totals: getCartTotals(lines), payment: "Cash on delivery" }),
    ...overrides,
  };
}

describe("adding several products", () => {
  it("adds what fits in stock and reports the rest", () => {
    // product 1 has 15 in stock, 14 already in the bag
    const result = addManyToCart([{ id: 1, quantity: 14 }], products, [
      { id: 1, quantity: 3 },
      { id: 2, quantity: 1 },
      { id: soldOut.id, quantity: 1 },
      { id: 999, quantity: 1 },
    ]);
    expect(result.cart).toEqual([
      { id: 1, quantity: 15 },
      { id: 2, quantity: 1 },
    ]);
    expect(result.added).toEqual([
      { id: 1, quantity: 1 },
      { id: 2, quantity: 1 },
    ]);
    expect(result.skipped).toEqual([soldOut.id, 999]);
  });

  it("skips products already at the stock limit", () => {
    const result = addManyToCart([{ id: 1, quantity: 15 }], products, [{ id: 1, quantity: 1 }]);
    expect(result.added).toEqual([]);
    expect(result.skipped).toEqual([1]);
  });
});

describe("promo discount", () => {
  it("takes the discount off before shipping is worked out", () => {
    // 2 x RM199.20 = RM398.40, 10% off = RM39.84, RM358.56 still ships free
    const lines = getCartLines([{ id: 1, quantity: 2 }], products);
    expect(getCartTotals(lines, 10)).toMatchObject({ subtotal: 398.4, discount: 39.84, shipping: 0, total: 358.56 });
  });

  it("can drop an order below free shipping", () => {
    // 2 x RM159 = RM318, after 10% off RM286.20, so RM10 shipping is added
    const lines = getCartLines([{ id: 2, quantity: 2 }], products);
    const before = getCartTotals(lines);
    const after = getCartTotals(lines, 10);
    expect(before.subtotal).toBeGreaterThanOrEqual(300);
    expect(before.shipping).toBe(0);
    expect(after.shipping).toBe(10);
    expect(after).toMatchObject({ discount: 31.8, total: 296.2 });
  });

  it("accepts only the demo code, ignoring case and spaces", () => {
    expect(checkPromoCode("  hazdemo10 ")).toEqual({ ok: true, code: "HAZDEMO10", percent: 10 });
    expect(checkPromoCode("FREE100")).toEqual({ ok: false, message: "This code is not valid" });
    expect(checkPromoCode("  ")).toEqual({ ok: false, message: "Enter a promo code" });
  });
});

describe("order history", () => {
  it("keeps only what the history needs, no personal details", () => {
    const order = makeOrder("HAZ-000001", "2026-11-20T10:00:00Z");
    expect(order).toEqual({
      number: "HAZ-000001",
      date: "2026-11-20T10:00:00.000Z",
      payment: "Cash on delivery",
      promoCode: null,
      items: [{ id: 1, name: "Nova Wireless Headphones", quantity: 2, unitPrice: 199.2 }],
      subtotal: 398.4,
      discount: 0,
      shipping: 0,
      total: 398.4,
    });
  });

  it("puts the newest order first and keeps at most ten", () => {
    let history = [];
    for (let day = 1; day <= 12; day += 1) {
      history = addOrder(history, makeOrder("HAZ-" + day, "2026-11-" + String(day).padStart(2, "0") + "T10:00:00Z"));
    }
    expect(history).toHaveLength(10);
    expect(history[0].number).toBe("HAZ-12");
    expect(history[9].number).toBe("HAZ-3");
  });

  it("drops broken saved orders", () => {
    const good = makeOrder("HAZ-1", "2026-11-20T10:00:00Z");
    expect(cleanOrders("nope")).toEqual([]);
    expect(cleanOrders([good, null, { ...good, date: "not a date" }, { ...good, items: [] }, { ...good, total: "9" }])).toEqual([good]);
  });
});
