import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DEFAULT_FILTERS,
  filtersToParams,
  getActiveFilterChips,
  getPriceBounds,
  getShopResults,
  parseFilters,
  removeChipFilter,
} from "../utils/filters.js";

// shop filters live in the url (?q=&category=&min=&max=&rating=&availability=&sort=)
// so results can be shared, bookmarked and restored with the back button
export function useProductFilters(products, categories) {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryNames = useMemo(() => categories.map((category) => category.name), [categories]);
  const filters = useMemo(() => parseFilters(searchParams, categoryNames), [searchParams, categoryNames]);
  const priceBounds = useMemo(() => getPriceBounds(products), [products]);

  const results = useMemo(() => getShopResults(products, filters), [products, filters]);
  const chips = useMemo(() => getActiveFilterChips(filters), [filters]);

  // typing and sliding replace the history entry instead of adding one per step
  const apply = useCallback((next, replace = false) => setSearchParams(filtersToParams(next), { replace }), [setSearchParams]);

  const setFilter = useCallback((key, value) => apply({ ...filters, [key]: value }, key === "q"), [filters, apply]);

  // add or remove one category
  const toggleCategory = useCallback(
    (name) => {
      const category = filters.category.includes(name) ? filters.category.filter((item) => item !== name) : [...filters.category, name];
      apply({ ...filters, category });
    },
    [filters, apply],
  );

  // a slider at its end means "no limit"
  const setPrice = useCallback(
    (min, max) => {
      apply(
        {
          ...filters,
          min: min !== null && min > priceBounds.min ? min : null,
          max: max !== null && max < priceBounds.max ? max : null,
        },
        true,
      );
    },
    [filters, apply, priceBounds],
  );

  const clearFilter = useCallback((key) => apply(removeChipFilter(filters, key)), [filters, apply]);

  // keeps the sort, resets everything else
  const clearAll = useCallback(() => apply({ ...DEFAULT_FILTERS, sort: filters.sort }), [filters.sort, apply]);

  // filters in the panel (search has its own field)
  const panelCount = chips.filter((chip) => chip.key !== "q").length;

  return { filters, results, chips, panelCount, priceBounds, setFilter, toggleCategory, setPrice, clearFilter, clearAll };
}
