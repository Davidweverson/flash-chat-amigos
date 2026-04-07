import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applySettings, loadSettings } from "./lib/settings-store";
import { applyTheme, loadTheme } from "./lib/settings-store";

// Apply settings before first render
applySettings(loadSettings());
applyTheme(loadTheme());

createRoot(document.getElementById("root")!).render(<App />);
