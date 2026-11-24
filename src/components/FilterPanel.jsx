import { useUI } from "../context/UIContext.jsx";
import { useDialog } from "../hooks/useDialog.js";
import { AVAILABILITY_OPTIONS, PRICE_STEP, RATING_OPTIONS, SORT_OPTIONS, getPriceLabel } from "../utils/filters.js";
import { Icon } from "./Icon.jsx";

function Select({ id, label, value, options, onChange, className = "filter-group" }) {
  return (
    <div className={className}>
      <label htmlFor={id}>{label}</label>
      <select id={id} className="form-control" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// several categories can be picked at once
function CategoryChecks({ categories, selected, onToggle }) {
  return (
    <fieldset className="filter-group filter-group-category">
      <legend>Category</legend>
      <div className="check-list">
        {categories.map((category) => (
          <label className="check-option" key={category.name}>
            <input type="checkbox" checked={selected.includes(category.name)} onChange={() => onToggle(category.name)} />
            <span>{category.name}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// two sliders for the lowest and highest price (sale price, in RM)
function PriceRange({ bounds, min, max, onChange }) {
  const low = min ?? bounds.min;
  const high = max ?? bounds.max;
  if (bounds.max <= bounds.min) {
    return null;
  }
  return (
    <fieldset className="filter-group price-range">
      <legend>Price</legend>
      <p className="price-range-value" aria-hidden="true">
        {min === null && max === null ? "Any price" : getPriceLabel(min, max)}
      </p>
      <label htmlFor="priceMin">Lowest price: RM{low}</label>
      <input
        type="range"
        id="priceMin"
        min={bounds.min}
        max={bounds.max}
        step={PRICE_STEP}
        value={low}
        // the lowest price never passes the highest
        onChange={(event) => onChange(Math.min(Number(event.target.value), high), max)}
      />
      <label htmlFor="priceMax">Highest price: RM{high}</label>
      <input
        type="range"
        id="priceMax"
        min={bounds.min}
        max={bounds.max}
        step={PRICE_STEP}
        value={high}
        onChange={(event) => onChange(min, Math.max(Number(event.target.value), low))}
      />
    </fieldset>
  );
}

// sidebar on desktop, bottom sheet on mobile (opened with the filters button)
export function FilterPanel({ filters, categories, priceBounds, onChange, onToggleCategory, onPriceChange, onClear, resultCount }) {
  const { panel, closePanel } = useUI();
  const open = panel === "filters";
  const ref = useDialog(open, closePanel);

  return (
    <aside
      ref={ref}
      className={"filter-panel drawer-like" + (open ? " open" : "")}
      id="filterPanel"
      aria-label="Product filters"
      role={open ? "dialog" : undefined}
      aria-modal={open ? "true" : undefined}
    >
      <div className="drawer-header filter-panel-header">
        <h2>Filters</h2>
        <button type="button" className="icon-btn drawer-close" onClick={closePanel} aria-label="Close filters">
          <Icon name="close" />
        </button>
      </div>

      <div className="filter-body">
        <CategoryChecks categories={categories} selected={filters.category} onToggle={onToggleCategory} />
        <PriceRange bounds={priceBounds} min={filters.min} max={filters.max} onChange={onPriceChange} />
        <Select
          id="ratingFilter"
          label="Rating"
          value={filters.rating}
          options={RATING_OPTIONS}
          onChange={(value) => onChange("rating", value)}
        />
        <Select
          id="availabilityFilter"
          label="Availability"
          value={filters.availability}
          options={AVAILABILITY_OPTIONS}
          onChange={(value) => onChange("availability", value)}
        />
      </div>

      <div className="filter-footer">
        <button type="button" className="btn btn-outline btn-full" onClick={onClear}>
          Clear filters
        </button>
        <button type="button" className="btn btn-primary btn-full filter-apply" onClick={closePanel}>
          Show {resultCount} {resultCount === 1 ? "result" : "results"}
        </button>
      </div>
    </aside>
  );
}

export function SortControl({ value, onChange }) {
  return <Select id="sortSelect" label="Sort" value={value} options={SORT_OPTIONS} onChange={onChange} className="sort-box" />;
}

// removable chips for active filters, plus clear all
export function ActiveFilters({ chips, onRemove, onClearAll }) {
  if (chips.length === 0) {
    return null;
  }
  return (
    <div className="active-filters">
      {chips.map((chip) => (
        <button type="button" key={chip.key} className="chip" onClick={() => onRemove(chip.key)} aria-label={"Remove filter " + chip.label}>
          {chip.label}
          <Icon name="close" />
        </button>
      ))}
      {chips.length > 1 && (
        <button type="button" className="btn-link btn-link-muted chip-clear" onClick={onClearAll}>
          Clear all
        </button>
      )}
    </div>
  );
}

// quick category buttons above the grid
// "all" clears the list, the others switch a category on or off
export function CategoryPills({ categories, products, selected, onToggle, onClear }) {
  const pills = [
    { name: "all", label: "All", count: products.length },
    ...categories.map((category) => ({
      name: category.name,
      label: category.name,
      count: products.filter((product) => product.category === category.name).length,
    })),
  ];
  return (
    <div className="category-pills" role="group" aria-label="Filter by category">
      {pills.map((pill) => (
        <button
          type="button"
          key={pill.name}
          className="pill"
          aria-pressed={pill.name === "all" ? selected.length === 0 : selected.includes(pill.name)}
          onClick={() => (pill.name === "all" ? onClear() : onToggle(pill.name))}
        >
          {pill.label} <span className="pill-count">{pill.count}</span>
        </button>
      ))}
    </div>
  );
}
