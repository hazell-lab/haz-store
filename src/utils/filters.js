import { getSalePrice } from "./pricing.js";

// default value of every shop filter
// category is a list (empty means all), min and max are prices in RM (null means no limit)
export const DEFAULT_FILTERS = {
  q: "",
  category: [],
  min: null,
  max: null,
  rating: "all",
  availability: "all",
  sort: "featured",
};

// step of the price sliders, in RM
export const PRICE_STEP = 10;

// old links used fixed price ranges, they still open the same results
const LEGACY_PRICE_RANGES = {
  under100: { min: null, max: 100 },
  "100-300": { min: 100, max: 300 },
  "300-1000": { min: 300, max: 1000 },
  above1000: { min: 1000, max: null },
};

export const RATING_OPTIONS = [
  { value: "all", label: "All ratings" },
  { value: "4", label: "4 stars and above" },
  { value: "3", label: "3 stars and above" },
];

export const AVAILABILITY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "in-stock", label: "In stock" },
  { value: "out-of-stock", label: "Out of stock" },
];

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
  { value: "rating", label: "Rating" },
  { value: "name", label: "Name: A-Z" },
];

function hasOption(options, value) {
  return options.some((option) => option.value === value);
}

function labelOf(options, value) {
  const option = options.find((item) => item.value === value);
  return option ? option.label : value;
}

// lowest and highest sale price, rounded out to the slider step
export function getPriceBounds(products) {
  if (products.length === 0) {
    return { min: 0, max: 0 };
  }
  const prices = products.map(getSalePrice);
  return {
    min: Math.floor(Math.min(...prices) / PRICE_STEP) * PRICE_STEP,
    max: Math.ceil(Math.max(...prices) / PRICE_STEP) * PRICE_STEP,
  };
}

function readPrice(value) {
  if (value === null || value.trim() === "") {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : null;
}

// read filters from the url, ignoring values that are not allowed
export function parseFilters(searchParams, categoryNames) {
  const get = (key) => searchParams.get(key) || DEFAULT_FILTERS[key];
  const rating = get("rating");
  const availability = get("availability");
  const sort = get("sort");

  // several categories are separated by commas, unknown ones are dropped
  const category = (searchParams.get("category") || "")
    .split(",")
    .filter((name, index, list) => categoryNames.includes(name) && list.indexOf(name) === index);

  let min = readPrice(searchParams.get("min"));
  let max = readPrice(searchParams.get("max"));
  const legacy = LEGACY_PRICE_RANGES[searchParams.get("price")];
  if (legacy && min === null && max === null) {
    ({ min, max } = legacy);
  }
  if (min !== null && max !== null && min > max) {
    [min, max] = [max, min];
  }

  return {
    q: (searchParams.get("q") || "").slice(0, 80),
    category,
    min,
    max,
    rating: hasOption(RATING_OPTIONS, rating) ? rating : "all",
    availability: hasOption(AVAILABILITY_OPTIONS, availability) ? availability : "all",
    sort: hasOption(SORT_OPTIONS, sort) ? sort : "featured",
  };
}

// only keep non default values in the url
export function filtersToParams(filters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category.length > 0) params.set("category", filters.category.join(","));
  if (filters.min !== null) params.set("min", String(filters.min));
  if (filters.max !== null) params.set("max", String(filters.max));
  ["rating", "availability", "sort"].forEach((key) => {
    if (filters[key] !== DEFAULT_FILTERS[key]) {
      params.set(key, filters[key]);
    }
  });
  return params;
}

// label for the price chip, e.g. "RM100 - RM300", "From RM100", "Up to RM300"
export function getPriceLabel(min, max) {
  if (min !== null && max !== null) return "RM" + min + " - RM" + max;
  if (min !== null) return "From RM" + min;
  if (max !== null) return "Up to RM" + max;
  return "Any price";
}

// search by name or category (case does not matter)
export function searchProducts(list, query) {
  const term = query.trim().toLowerCase();
  if (term === "") {
    return list;
  }
  return list.filter((product) => product.name.toLowerCase().includes(term) || product.category.toLowerCase().includes(term));
}

// price limits use the sale price and include the limit itself
function matchesPrice(product, min, max) {
  const price = getSalePrice(product);
  return (min === null || price >= min) && (max === null || price <= max);
}

// category, price, rating and stock filters all combine
function filterProducts(list, filters) {
  return list.filter((product) => {
    if (filters.category.length > 0 && !filters.category.includes(product.category)) {
      return false;
    }
    if (!matchesPrice(product, filters.min, filters.max)) {
      return false;
    }
    if (filters.rating !== "all" && product.rating < Number(filters.rating)) {
      return false;
    }
    if (filters.availability === "in-stock" && product.stock === 0) {
      return false;
    }
    if (filters.availability === "out-of-stock" && product.stock > 0) {
      return false;
    }
    return true;
  });
}

export function sortProducts(list, sort) {
  const sorted = [...list];
  switch (sort) {
    case "price-low":
      return sorted.sort((a, b) => getSalePrice(a) - getSalePrice(b));
    case "price-high":
      return sorted.sort((a, b) => getSalePrice(b) - getSalePrice(a));
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    default:
      // featured first, then by id
      return sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || a.id - b.id);
  }
}

// search, filter and sort in one go
export function getShopResults(products, filters) {
  return sortProducts(filterProducts(searchProducts(products, filters.q), filters), filters.sort);
}

// the filters left after removing one chip
export function removeChipFilter(filters, key) {
  if (key.startsWith("category:")) {
    const name = key.slice("category:".length);
    return { ...filters, category: filters.category.filter((item) => item !== name) };
  }
  if (key === "price") {
    return { ...filters, min: null, max: null };
  }
  return { ...filters, [key]: DEFAULT_FILTERS[key] };
}

// removable chips for every active filter (sort is not a filter)
export function getActiveFilterChips(filters) {
  const chips = [];
  if (filters.q.trim() !== "") {
    chips.push({ key: "q", label: "“" + filters.q.trim() + "”" });
  }
  // one chip per category, so each can be removed on its own
  filters.category.forEach((name) => {
    chips.push({ key: "category:" + name, label: name });
  });
  if (filters.min !== null || filters.max !== null) {
    chips.push({ key: "price", label: getPriceLabel(filters.min, filters.max) });
  }
  if (filters.rating !== "all") {
    chips.push({ key: "rating", label: labelOf(RATING_OPTIONS, filters.rating) });
  }
  if (filters.availability !== "all") {
    chips.push({ key: "availability", label: labelOf(AVAILABILITY_OPTIONS, filters.availability) });
  }
  return chips;
}

// quick suggestions for the header search, names that start with the term come first
export function getSearchSuggestions(products, query, limit = 6) {
  const term = query.trim().toLowerCase();
  if (term === "") {
    return [];
  }
  const startsWith = (product) => Number(product.name.toLowerCase().startsWith(term));
  return [...searchProducts(products, term)].sort((a, b) => startsWith(b) - startsWith(a) || a.id - b.id).slice(0, limit);
}
