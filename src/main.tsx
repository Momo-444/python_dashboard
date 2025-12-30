import { createRoot } from "react-dom/client";
import { initSentry } from "./lib/sentry";
import App from "./App.tsx";
import "./index.css";

// Initialiser Sentry avant le rendu de l'app
initSentry();

createRoot(document.getElementById("root")!).render(<App />);
