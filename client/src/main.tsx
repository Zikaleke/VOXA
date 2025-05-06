import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set page title and description
document.title = "Voxa - Mensagens Seguras";

// Add favicon if needed
const existingFavicon = document.querySelector('link[rel="icon"]');
if (!existingFavicon) {
  const favicon = document.createElement("link");
  favicon.rel = "icon";
  favicon.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='0.9em' font-size='90'>💬</text></svg>";
  document.head.appendChild(favicon);
}

// Render the app
createRoot(document.getElementById("root")!).render(<App />);
