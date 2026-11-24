import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
// self-hosted archivo with the width axis (no google fonts request)
import "@fontsource-variable/archivo/wdth.css";
import "./styles/index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
