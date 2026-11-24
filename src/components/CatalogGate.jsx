import { useCatalog } from "../context/CatalogContext.jsx";
import { ErrorState, LoadingState } from "./States.jsx";

// shows loading or error states until the products are ready
// wrapClass puts the loading and error states inside a container (for full pages)
export function CatalogGate({ children, skeletons = 4, wrapClass }) {
  const { status, error, reload } = useCatalog();

  if (status === "ready") {
    return children;
  }
  const content =
    status === "loading" ? <LoadingState count={skeletons} /> : <ErrorState message={error && error.message} onRetry={reload} />;
  return wrapClass ? <div className={wrapClass}>{content}</div> : content;
}
