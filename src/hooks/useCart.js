import { useCallback, useMemo } from "react";
import { useCatalog } from "../context/CatalogContext.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useUI } from "../context/UIContext.jsx";
import { getProductById } from "../utils/catalog.js";
import { addManyToCart, addToCart, getCartLines, getCartTotals, removeFromCart, setCartQuantity } from "../utils/cart.js";

// everything the ui needs for the shopping bag
export function useCart() {
  const { products } = useCatalog();
  const { cart, setCart } = useStore();
  const { showToast } = useToast();
  const { panel, openPanel } = useUI();

  const lines = useMemo(() => getCartLines(cart, products), [cart, products]);
  const totals = useMemo(() => getCartTotals(lines), [lines]);

  // returns true when the product was added
  const add = useCallback(
    (id, quantity = 1) => {
      const product = getProductById(products, id);
      const result = addToCart(cart, product, quantity);
      if (!result.ok) {
        showToast(result.reason === "out-of-stock" ? "This product is out of stock" : "Only " + product.stock + " in stock");
        return false;
      }
      setCart(result.cart);
      // no "view bag" link when the bag is already open
      showToast(
        product.name + " added to your bag",
        panel === "cart" ? undefined : { label: "View bag", onClick: () => openPanel("cart") },
      );
      return true;
    },
    [products, cart, setCart, showToast, panel, openPanel],
  );

  // add several products at once, returns { added, skipped } (lists of ids)
  const addMany = useCallback(
    (items) => {
      const result = addManyToCart(cart, products, items);
      if (result.added.length > 0) {
        setCart(result.cart);
      }
      const addedCount = result.added.length;
      const parts = [];
      if (addedCount > 0) {
        parts.push(addedCount + (addedCount === 1 ? " product" : " products") + " added to your bag");
      }
      if (result.skipped.length > 0) {
        parts.push(result.skipped.length + " could not be added (out of stock or at the stock limit)");
      }
      showToast(parts.join(", "), addedCount > 0 && panel !== "cart" ? { label: "View bag", onClick: () => openPanel("cart") } : undefined);
      return { added: result.added.map((item) => item.id), skipped: result.skipped };
    },
    [products, cart, setCart, showToast, panel, openPanel],
  );

  const setQuantity = useCallback(
    (id, quantity) => {
      const product = getProductById(products, id);
      const result = setCartQuantity(cart, product, quantity);
      if (!result.ok) {
        if (result.reason === "stock-limit") {
          showToast("Only " + product.stock + " in stock");
        }
        return false;
      }
      setCart(result.cart);
      if (result.removed) {
        showToast("Product removed from cart");
      }
      return true;
    },
    [products, cart, setCart, showToast],
  );

  const remove = useCallback(
    (id) => {
      setCart(removeFromCart(cart, id));
      showToast("Product removed from cart");
    },
    [cart, setCart, showToast],
  );

  // quiet clears the bag without a toast (used after the demo order)
  const clear = useCallback(
    ({ quiet = false } = {}) => {
      setCart([]);
      if (!quiet) {
        showToast("Cart cleared");
      }
    },
    [setCart, showToast],
  );

  const getQuantity = useCallback(
    (id) => {
      const item = cart.find((cartItem) => cartItem.id === id);
      return item ? item.quantity : 0;
    },
    [cart],
  );

  return { lines, totals, add, addMany, setQuantity, remove, clear, getQuantity };
}
