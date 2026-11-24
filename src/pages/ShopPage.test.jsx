import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderApp } from "../test/renderApp.jsx";

const cards = () => document.querySelectorAll(".shop-grid .product-card");
const count = () => screen.getByTestId("results-count").textContent;
const location = () => screen.getByTestId("location").textContent;

describe("shop page", () => {
  it("shows the first page of products and loads more", async () => {
    const { user } = renderApp("/shop");
    expect(await screen.findByRole("heading", { level: 1, name: /shop all products/i })).toBeInTheDocument();
    expect(count()).toBe("All 20 products");
    expect(cards()).toHaveLength(12);
    await user.click(screen.getByRole("button", { name: /show more products/i }));
    expect(cards()).toHaveLength(20);
    expect(screen.queryByRole("button", { name: /show more products/i })).not.toBeInTheDocument();
  });

  it("combines several categories and a price range, shows chips and syncs the url", async () => {
    const { user } = renderApp("/shop");
    const pills = await screen.findByRole("group", { name: /filter by category/i });
    await user.click(within(pills).getByRole("button", { name: /mice/i }));
    expect(cards()).toHaveLength(3);
    expect(within(pills).getByRole("button", { name: /mice/i })).toHaveAttribute("aria-pressed", "true");
    expect(within(pills).getByRole("button", { name: /^all/i })).toHaveAttribute("aria-pressed", "false");

    // a second category adds to the first
    await user.click(within(pills).getByRole("button", { name: /laptops/i }));
    expect(cards()).toHaveLength(6);
    expect(location()).toBe("/shop?category=Mice%2CLaptops");
    expect(screen.getByRole("checkbox", { name: "Laptops" })).toBeChecked();

    // move the highest price slider down
    fireEvent.change(screen.getByLabelText(/highest price/i), { target: { value: "100" } });
    expect(cards()).toHaveLength(1);
    expect(count()).toBe("1 of 20 products match");
    expect(location()).toBe("/shop?category=Mice%2CLaptops&max=100");

    // removing one chip keeps the rest
    await user.click(screen.getByRole("button", { name: "Remove filter Up to RM100" }));
    expect(cards()).toHaveLength(6);
    await user.click(screen.getByRole("button", { name: "Remove filter Laptops" }));
    expect(location()).toBe("/shop?category=Mice");

    // "all" clears the categories
    await user.click(within(pills).getByRole("button", { name: /^all/i }));
    expect(count()).toBe("All 20 products");
  });

  it("clears every filter at once but keeps the sort", async () => {
    const { user } = renderApp("/shop?category=Laptops&rating=4&sort=price-low");
    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByLabelText("Sort")).toHaveValue("price-low");
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(count()).toBe("All 20 products");
    expect(location()).toBe("/shop?sort=price-low");
  });

  it("restores filters from the url and ignores bad values", async () => {
    renderApp("/shop?availability=out-of-stock&min=banana");
    await screen.findByRole("heading", { level: 1 });
    expect(cards()).toHaveLength(3);
    expect(screen.queryByRole("button", { name: /remove filter.*rm/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Availability")).toHaveValue("out-of-stock");
  });

  it("searches as you type and shows an empty state with a reset", async () => {
    const { user } = renderApp("/shop");
    const search = await screen.findByLabelText("Search products", { selector: "#searchInput" });
    await user.type(search, "nova phone");
    expect(cards()).toHaveLength(3);
    await user.clear(search);
    await user.type(search, "zzz");
    expect(cards()).toHaveLength(0);
    expect(screen.getByText(/no products found/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear all filters" }));
    expect(cards()).toHaveLength(12);
    expect(search).toHaveValue("");
  });

  it("sorts by price", async () => {
    const { user } = renderApp("/shop");
    await screen.findByRole("heading", { level: 1 });
    await user.selectOptions(screen.getByLabelText("Sort"), "price-low");
    const first = cards()[0].querySelector(".product-name").textContent;
    expect(first).toBe("Laptop Sleeve 14 inch");
  });
});
