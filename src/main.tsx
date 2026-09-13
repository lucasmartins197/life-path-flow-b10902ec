import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initDeepLinkPagamento } from "@/lib/checkout";

// Inicializa o listener de deep link de pagamento (so age no app nativo).
// Quando o Stripe volta via saindodojogo://pagamento, fecha o navegador e trata.
initDeepLinkPagamento();

createRoot(document.getElementById("root")!).render(<App />);
