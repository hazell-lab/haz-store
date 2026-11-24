import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const SITE_URL = "https://hazstore-ecommerce.netlify.app";

// write sitemap.xml at build time from the product catalog,
// so new products are listed without editing the sitemap by hand
function sitemap() {
  return {
    name: "hazstore-sitemap",
    apply: "build",
    generateBundle() {
      const { products } = JSON.parse(readFileSync("public/data/products.json", "utf8"));
      const paths = ["/", "/shop", ...products.map((product) => "/product/" + product.id)];
      const urls = paths.map((path) => "  <url><loc>" + SITE_URL + path + "</loc></url>").join("\n");
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source:
          '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "\n</urlset>\n",
      });
    },
  };
}

// preload the latin archivo file so text does not reflow when the font arrives late
function preloadFont() {
  return {
    name: "hazstore-preload-font",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html, context) {
        const file = Object.keys(context.bundle || {}).find((name) => /archivo-latin-wdth-normal.*\.woff2$/.test(name));
        if (!file) {
          return html;
        }
        return [
          {
            tag: "link",
            attrs: { rel: "preload", href: "/" + file, as: "font", type: "font/woff2", crossorigin: "" },
            injectTo: "head-prepend",
          },
        ];
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), sitemap(), preloadFont()],
  server: { port: 5173 },
  preview: { port: 4173 },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
    css: false,
    include: ["src/**/*.test.{js,jsx}"],
    // full app dom tests can be slow on a busy machine or ci runner
    testTimeout: 15000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{js,jsx}"],
      exclude: ["src/**/*.test.{js,jsx}", "src/test/**", "src/main.jsx"],
      reporter: ["text-summary", "html"],
    },
  },
});
