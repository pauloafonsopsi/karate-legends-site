import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./lib/i18n";
import { reloadConteudos } from "./lib/conteudos";
import "./index.css";

reloadConteudos();
createRoot(document.getElementById("root")!).render(<App />);
