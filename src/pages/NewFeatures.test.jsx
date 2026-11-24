import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "../config.js";
import { catalog, renderApp } from "../test/renderApp.jsx";

const soldOut = catalog.products.find((p) => p.stock === 0);
const saved = (key) => JSON.parse(window.localStorage.getItem(STORAGE_KEYS[key]));

async function fillForm(user) {
  await user.type(screen.getByLabelText("Full name"), "Test Buyer");
  await user.type(screen.getByLabelText("Email"), "test@example.com");
  await user.type(screen.getByLabelText("Phone number"), "012-345 6789");
  await user.type(screen.getByLabelText("Address"), "1 Jalan Test");
  await user.type(screen.getByLabelText("City"), "Shah Alam");
  await user.type(screen.getByLabelText("Postcode"), "40000");
  await user.selectOptions(screen.getByLabelText("State"), "Selangor");
}

describe("wishlist move all", () => {
  it("moves what can be bought into the bag and keeps the rest saved", async () => {
    window.localStorage.setItem(STORAGE_KEYS.wishlist, JSON.stringify([1, soldOut.id, 2]));
    const { user } = renderApp("/wishlist");
    await user.click(await screen.findByRole("button", { name: /move all to bag/i }));
    expect(saved("cart")).toEqual([
      { id: 1, quantity: 1 },
      { id: 2, quantity: 1 },
    ]);
    expect(saved("wishlist")).toEqual([soldOut.id]);
    expect(screen.getByRole("button", { name: /move all to bag/i })).toBeDisabled();
    expect(screen.getByText(/everything here is out of stock or already in your bag/i)).toBeInTheDocument();
  });
});

describe("promo code and demo order history", () => {
  it("applies the demo code, saves the order and buys it again", async () => {
    window.localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify([{ id: 2, quantity: 2 }]));
    const { user } = renderApp("/checkout");
    const code = await screen.findByLabelText("Promo code");

    await user.type(code, "FREE100");
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(screen.getByText("This code is not valid")).toBeInTheDocument();
    expect(code).toHaveAttribute("aria-invalid", "true");

    await user.clear(code);
    await user.type(code, "hazdemo10");
    await user.click(screen.getByRole("button", { name: "Apply" }));
    // RM318 - RM31.80 = RM286.20, below RM300 so RM10 shipping
    const main = within(screen.getByRole("main"));
    expect(main.getByTestId("discount")).toHaveTextContent("RM31.80");
    expect(main.getByTestId("total")).toHaveTextContent("RM296.20");
    expect(screen.getByRole("button", { name: /place demo order/i })).toHaveTextContent("RM296.20");

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /place demo order/i }));
    await screen.findByRole("heading", { name: "Thank you, Test Buyer." }, { timeout: 3000 });

    // only what the history needs is saved
    const [order] = saved("orders");
    expect(order).toMatchObject({ promoCode: "HAZDEMO10", discount: 31.8, total: 296.2, items: [{ id: 2, quantity: 2 }] });
    expect(JSON.stringify(order)).not.toMatch(/Test Buyer|example\.com|Jalan/);

    await user.click(screen.getByRole("link", { name: "View demo orders" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Demo orders" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: order.number })).toBeInTheDocument();
    expect(screen.getByText("Promo HAZDEMO10: −RM31.80")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Buy again" }));
    expect(saved("cart")).toEqual([{ id: 2, quantity: 2 }]);

    await user.click(screen.getByRole("button", { name: "Clear order history" }));
    expect(screen.getByText("No demo orders yet.")).toBeInTheDocument();
  });
});

describe("compare products", () => {
  it("adds up to three products and shows them side by side", async () => {
    window.localStorage.setItem(STORAGE_KEYS.compare, JSON.stringify([2, 3, 999]));
    const { user } = renderApp("/product/1");
    const compare = await screen.findByRole("button", { name: "Compare" });
    await user.click(compare);
    expect(screen.getByRole("button", { name: "In your comparison" })).toHaveAttribute("aria-pressed", "true");
    // the unknown id was dropped, so this is the third product
    expect(saved("compare")).toEqual([2, 3, 1]);

    renderApp("/product/4");
    await user.click(await screen.findByRole("button", { name: "Compare" }));
    expect(await screen.findByText("You can compare up to 3 products")).toBeInTheDocument();
    expect(saved("compare")).toEqual([2, 3, 1]);
  });

  it("lists real product details in a table and removes a product", async () => {
    window.localStorage.setItem(STORAGE_KEYS.compare, JSON.stringify([1, 2]));
    const { user } = renderApp("/compare");
    const table = await screen.findByRole("table");
    expect(within(table).getAllByRole("columnheader")).toHaveLength(2);
    expect(within(table).getByRole("rowheader", { name: "Price" })).toBeInTheDocument();
    expect(within(table).getByText("RM199.20")).toBeInTheDocument();
    expect(within(table).getByText("20% off")).toBeInTheDocument();

    await user.click(within(table).getByRole("button", { name: "Remove Nova Wireless Headphones" }));
    expect(within(screen.getByRole("table")).getAllByRole("columnheader")).toHaveLength(1);
    expect(saved("compare")).toEqual([2]);
  });
});
