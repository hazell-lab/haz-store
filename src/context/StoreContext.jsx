import { createContext, useContext, useEffect, useMemo } from "react";
import { COMPARE_LIMIT, RECENT_LIMIT, STORAGE_KEYS } from "../config.js";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
import { cleanCart, cleanIdList } from "../utils/cart.js";
import { cleanOrders } from "../utils/orders.js";
import { useCatalog } from "./CatalogContext.jsx";

const StoreContext = createContext(null);

function sameJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// cart, wishlist, recently viewed, compare list and demo orders, saved in local storage
export function StoreProvider({ children }) {
  const { status, products } = useCatalog();
  const [cart, setCart] = useLocalStorage(STORAGE_KEYS.cart, []);
  const [wishlist, setWishlist] = useLocalStorage(STORAGE_KEYS.wishlist, []);
  const [recent, setRecent] = useLocalStorage(STORAGE_KEYS.recent, []);
  const [compare, setCompare] = useLocalStorage(STORAGE_KEYS.compare, []);
  const [orders, setOrders] = useLocalStorage(STORAGE_KEYS.orders, []);

  // orders keep their own product names, so they do not need the catalog
  useEffect(() => {
    const cleanedOrders = cleanOrders(orders);
    if (!sameJson(cleanedOrders, orders)) setOrders(cleanedOrders);
  }, [orders, setOrders]);

  // once the products are known, drop saved items that are no longer valid
  useEffect(() => {
    if (status !== "ready") {
      return;
    }
    const cleanedCart = cleanCart(cart, products);
    const cleanedWishlist = cleanIdList(wishlist, products);
    const cleanedRecent = cleanIdList(recent, products).slice(0, RECENT_LIMIT);
    const cleanedCompare = cleanIdList(compare, products).slice(0, COMPARE_LIMIT);
    if (!sameJson(cleanedCart, cart)) setCart(cleanedCart);
    if (!sameJson(cleanedWishlist, wishlist)) setWishlist(cleanedWishlist);
    if (!sameJson(cleanedRecent, recent)) setRecent(cleanedRecent);
    if (!sameJson(cleanedCompare, compare)) setCompare(cleanedCompare);
  }, [status, products, cart, wishlist, recent, compare, setCart, setWishlist, setRecent, setCompare]);

  const value = useMemo(
    () => ({
      cart: Array.isArray(cart) ? cart : [],
      wishlist: Array.isArray(wishlist) ? wishlist : [],
      recent: Array.isArray(recent) ? recent : [],
      compare: Array.isArray(compare) ? compare : [],
      orders: Array.isArray(orders) ? orders : [],
      setCart,
      setWishlist,
      setRecent,
      setCompare,
      setOrders,
    }),
    [cart, wishlist, recent, compare, orders, setCart, setWishlist, setRecent, setCompare, setOrders],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used inside StoreProvider");
  }
  return context;
}
