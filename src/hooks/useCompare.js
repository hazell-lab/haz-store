import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { COMPARE_LIMIT } from "../config.js";
import { useCatalog } from "../context/CatalogContext.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { getProductById } from "../utils/catalog.js";

// up to three products to compare side by side
export function useCompare() {
  const { products } = useCatalog();
  const { compare, setCompare } = useStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const items = useMemo(() => compare.map((id) => getProductById(products, id)).filter(Boolean), [compare, products]);
  const has = useCallback((id) => compare.includes(id), [compare]);
  // returns false when the list is already full
  const toggle = useCallback(
    (id) => {
      const view = { label: "Compare now", onClick: () => navigate("/compare") };
      if (compare.includes(id)) {
        setCompare(compare.filter((item) => item !== id));
        showToast("Removed from compare");
        return true;
      }
      if (compare.length >= COMPARE_LIMIT) {
        showToast("You can compare up to " + COMPARE_LIMIT + " products", view);
        return false;
      }
      setCompare([...compare, id]);
      showToast("Added to compare", view);
      return true;
    },
    [compare, setCompare, showToast, navigate],
  );

  const remove = useCallback((id) => setCompare(compare.filter((item) => item !== id)), [compare, setCompare]);
  const clear = useCallback(() => setCompare([]), [setCompare]);

  return { items, has, toggle, remove, clear, count: items.length, isFull: compare.length >= COMPARE_LIMIT };
}
