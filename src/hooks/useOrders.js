import { useCallback } from "react";
import { useStore } from "../context/StoreContext.jsx";
import { addOrder } from "../utils/orders.js";

// demo orders placed in this browser (newest first)
export function useOrders() {
  const { orders, setOrders } = useStore();

  const save = useCallback((order) => setOrders((current) => addOrder(Array.isArray(current) ? current : [], order)), [setOrders]);
  const clear = useCallback(() => setOrders([]), [setOrders]);

  return { orders, save, clear };
}
