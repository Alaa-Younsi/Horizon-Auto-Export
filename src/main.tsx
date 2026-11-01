import "./styles/fonts.css";
import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { keepFresh } from "./lib/fresh-version";

const root = document.getElementById("root");
if (!root) throw new Error("#root missing from index.html");
if (import.meta.env.PROD) keepFresh();

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
