import { Link } from "react-router-dom";
import { CatalogGate } from "../components/CatalogGate.jsx";
import { EmptyState } from "../components/States.jsx";
import { useCart } from "../hooks/useCart.js";
import { useOrders } from "../hooks/useOrders.js";
import { usePageTitle } from "../hooks/usePageMeta.js";
import { formatPrice } from "../utils/format.js";

const dateFormat = new Intl.DateTimeFormat("en-MY", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function OrderCard({ order, onBuyAgain }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const titleId = "order-" + order.number;
  return (
    <li>
      <article className="order-card" aria-labelledby={titleId}>
        <header className="order-card-header">
          <div>
            <h2 id={titleId} className="order-card-title">
              {order.number}
            </h2>
            <p className="order-card-date">
              <time dateTime={order.date}>{dateFormat.format(new Date(order.date))}</time> · {itemCount}{" "}
              {itemCount === 1 ? "item" : "items"} · {order.payment}
            </p>
          </div>
          <p className="order-card-total">{formatPrice(order.total)}</p>
        </header>
        <ul className="order-card-items">
          {order.items.map((item) => (
            <li key={item.id}>
              <Link to={"/product/" + item.id}>{item.name}</Link>
              <span>
                {item.quantity} × {formatPrice(item.unitPrice)}
              </span>
            </li>
          ))}
        </ul>
        {order.discount > 0 && (
          <p className="order-card-note">
            Promo {order.promoCode}: −{formatPrice(order.discount)}
          </p>
        )}
        <button type="button" className="btn btn-outline btn-small" onClick={() => onBuyAgain(order)}>
          Buy again
        </button>
      </article>
    </li>
  );
}

function OrdersContent() {
  const { orders, clear } = useOrders();
  const { addMany } = useCart();

  if (orders.length === 0) {
    return (
      <EmptyState
        icon="bag"
        headingLevel={2}
        title="No demo orders yet."
        action={
          <Link to="/shop" className="btn btn-primary">
            Browse products
          </Link>
        }
      >
        Orders you place in the demo checkout are listed here, in this browser only.
      </EmptyState>
    );
  }

  return (
    <>
      <ul className="order-list" aria-label="Demo orders">
        {orders.map((order) => (
          <OrderCard key={order.number + order.date} order={order} onBuyAgain={(item) => addMany(item.items)} />
        ))}
      </ul>
      <button type="button" className="btn-link btn-link-muted order-clear" onClick={clear}>
        Clear order history
      </button>
    </>
  );
}

export default function OrdersPage() {
  usePageTitle("Demo orders", "Demo orders placed in this browser at Haz Store. Nothing was charged or shipped.");

  return (
    <section className="section page-section" aria-labelledby="ordersTitle">
      <div className="container">
        <header className="section-header section-header-split">
          <div>
            <p className="kicker">Your orders</p>
            <h1 className="section-title" id="ordersTitle">
              Demo orders
            </h1>
          </div>
          <p className="section-subtitle">Saved in this browser only. Nothing was charged or shipped.</p>
        </header>
        <CatalogGate skeletons={2}>
          <OrdersContent />
        </CatalogGate>
      </div>
    </section>
  );
}
