import { DEMO_PROMO, ORDER_HISTORY_LIMIT } from "../config.js";

// a demo order as it is saved in this browser
// only what the history page needs: no name, email or address is kept
export function createOrderRecord({ number, date, lines, totals, payment, promoCode = null }) {
  return {
    number,
    date: date.toISOString(),
    payment,
    promoCode,
    items: lines.map((line) => ({ id: line.id, name: line.product.name, quantity: line.quantity, unitPrice: line.unitPrice })),
    subtotal: totals.subtotal,
    discount: totals.discount || 0,
    shipping: totals.shipping,
    total: totals.total,
  };
}

function isValidItem(item) {
  return (
    item &&
    Number.isInteger(item.id) &&
    typeof item.name === "string" &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0 &&
    Number.isFinite(item.unitPrice)
  );
}

function isValidOrder(order) {
  return (
    order &&
    typeof order.number === "string" &&
    typeof order.payment === "string" &&
    !Number.isNaN(Date.parse(order.date)) &&
    Array.isArray(order.items) &&
    order.items.length > 0 &&
    order.items.every(isValidItem) &&
    ["subtotal", "discount", "shipping", "total"].every((key) => Number.isFinite(order[key]))
  );
}

// keep only well formed orders, newest first, at most the limit
export function cleanOrders(saved) {
  if (!Array.isArray(saved)) {
    return [];
  }
  return saved
    .filter(isValidOrder)
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, ORDER_HISTORY_LIMIT);
}

// add a new order to the front of the history
export function addOrder(history, order) {
  return cleanOrders([order, ...history]);
}

// check a promo code typed at checkout (case and spaces do not matter)
// returns { ok, code, percent } or { ok: false, message }
export function checkPromoCode(input) {
  const code = input.trim().toUpperCase();
  if (code === "") {
    return { ok: false, message: "Enter a promo code" };
  }
  if (code !== DEMO_PROMO.code) {
    return { ok: false, message: "This code is not valid" };
  }
  return { ok: true, code, percent: DEMO_PROMO.percent };
}
