import { useEffect } from "react";

const BASE_TITLE = "Haz Store";
export const DEFAULT_DESCRIPTION =
  "Haz Store is a fictional electronics store with a small, carefully edited range of laptops, phones, audio and accessories.";

// page title and search description for each route
// (screen readers announce the title on navigation)
export function usePageTitle(title, description = DEFAULT_DESCRIPTION) {
  useEffect(() => {
    document.title = title ? title + " | " + BASE_TITLE : BASE_TITLE + " | Technology, edited";
  }, [title]);

  useEffect(() => {
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.name = "description";
      document.head.appendChild(tag);
    }
    tag.content = description;
  }, [description]);
}
