import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { shouldMountReactHost } from "./bridge/legacy-app";
import { ReactHostShell } from "./components/react-host-shell";
import { ReactHostProvider } from "./providers/react-host-provider";
import "./react-host.css";

function mountReactHost() {
  const host = document.querySelector<HTMLElement>("[data-react-transition-host]");
  if (!host || !shouldMountReactHost()) return;

  host.hidden = false;
  createRoot(host).render(
    <StrictMode>
      <ReactHostProvider>
        <ReactHostShell />
      </ReactHostProvider>
    </StrictMode>,
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountReactHost, { once: true });
} else {
  mountReactHost();
}
