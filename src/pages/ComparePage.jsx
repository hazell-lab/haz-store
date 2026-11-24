import { Link } from "react-router-dom";
import { CatalogGate } from "../components/CatalogGate.jsx";
import { Icon } from "../components/Icon.jsx";
import { ProductImage } from "../components/ProductImage.jsx";
import { RatingBadge } from "../components/Rating.jsx";
import { EmptyState } from "../components/States.jsx";
import { COMPARE_LIMIT } from "../config.js";
import { useCart } from "../hooks/useCart.js";
import { useCompare } from "../hooks/useCompare.js";
import { usePageTitle } from "../hooks/usePageMeta.js";
import { formatPrice } from "../utils/format.js";
import { getSalePrice, getStockInfo } from "../utils/pricing.js";

// rows of the comparison, all from real product fields
const ROWS = [
  { label: "Price", value: (product) => formatPrice(getSalePrice(product)) },
  { label: "Original price", value: (product) => (product.discount > 0 ? formatPrice(product.price) : "No discount") },
  { label: "Discount", value: (product) => (product.discount > 0 ? product.discount + "% off" : "None") },
  { label: "Rating", value: (product) => <RatingBadge rating={product.rating} /> },
  { label: "Stock", value: (product) => getStockInfo(product).text },
  { label: "Category", value: (product) => product.category },
  { label: "Description", value: (product) => product.description },
];

function CompareContent() {
  const { items, remove, clear } = useCompare();
  const { add, getQuantity } = useCart();

  if (items.length === 0) {
    return (
      <EmptyState
        icon="eye"
        headingLevel={2}
        title="Nothing to compare yet."
        action={
          <Link to="/shop" className="btn btn-primary">
            Browse products
          </Link>
        }
      >
        Use &ldquo;Compare&rdquo; on a product page to add up to {COMPARE_LIMIT} products here.
      </EmptyState>
    );
  }

  return (
    <>
      <div className="compare-scroll" tabIndex={0} role="region" aria-label="Product comparison, scroll sideways for more">
        <table className="compare-table">
          <caption className="visually-hidden">Comparison of {items.length} products</caption>
          <thead>
            <tr>
              <td />
              {items.map((product) => (
                <th scope="col" key={product.id}>
                  <div className="compare-product">
                    <div className="compare-thumb">
                      <ProductImage src={product.image} alt="" />
                    </div>
                    <Link to={"/product/" + product.id}>{product.name}</Link>
                    <button type="button" className="btn-link btn-link-muted" onClick={() => remove(product.id)}>
                      Remove <span className="visually-hidden">{product.name}</span>
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {items.map((product) => (
                  <td key={product.id}>{row.value(product)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row">
                <span className="visually-hidden">Add to bag</span>
              </th>
              {items.map((product) => {
                const full = product.stock === 0 || getQuantity(product.id) >= product.stock;
                return (
                  <td key={product.id}>
                    <button type="button" className="btn btn-primary btn-small" onClick={() => add(product.id)} disabled={full}>
                      <Icon name="bag" /> {product.stock === 0 ? "Out of stock" : "Add to bag"}
                      <span className="visually-hidden">: {product.name}</span>
                    </button>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
      <button type="button" className="btn-link btn-link-muted order-clear" onClick={clear}>
        Clear comparison
      </button>
    </>
  );
}

export default function ComparePage() {
  usePageTitle("Compare products", "Compare price, discount, rating and stock of up to three Haz Store products.");

  return (
    <section className="section page-section" aria-labelledby="compareTitle">
      <div className="container">
        <header className="section-header section-header-split">
          <div>
            <p className="kicker">Side by side</p>
            <h1 className="section-title" id="compareTitle">
              Compare products
            </h1>
          </div>
          <p className="section-subtitle">Up to {COMPARE_LIMIT} products, using the details we have for each one.</p>
        </header>
        <CatalogGate skeletons={3}>
          <CompareContent />
        </CatalogGate>
      </div>
    </section>
  );
}
