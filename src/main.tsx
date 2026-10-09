import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./lib/i18n";
import { reloadConteudos } from "./lib/conteudos";
import { capturarOrigem } from "./lib/origem";
import "./index.css";

capturarOrigem();
reloadConteudos();
createRoot(document.getElementById("root")!).render(<App />);
