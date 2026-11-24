import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCatalog } from "../context/CatalogContext.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { getProductById } from "../utils/catalog.js";
import { toggleId } from "../utils/cart.js";

export function useWishlist() {
  const { products } = useCatalog();
  const { wishlist, setWishlist } = useStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // saved products in the order they were added
  const items = useMemo(() => wishlist.map((id) => getProductById(products, id)).filter(Boolean), [wishlist, products]);

  const has = useCallback((id) => wishlist.includes(id), [wishlist]);

  const toggle = useCallback(
    (id) => {
      const wasSaved = wishlist.includes(id);
      setWishlist(toggleId(wishlist, id));
      if (wasSaved) {
        showToast("Removed from wishlist");
      } else {
        showToast("Added to wishlist", { label: "View wishlist", onClick: () => navigate("/wishlist") });
      }
    },
    [wishlist, setWishlist, showToast, navigate],
  );

  const clear = useCallback(() => setWishlist([]), [setWishlist]);

  // remove several products at once, without a toast
  const removeMany = useCallback((ids) => setWishlist((current) => current.filter((id) => !ids.includes(id))), [setWishlist]);

  return { items, ids: wishlist, has, toggle, removeMany, clear, count: items.length };
}
