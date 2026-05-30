import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { shouldMountReactHost } from "./bridge/legacy-app";
import { ReactHostShell } from "./components/react-host-shell";
import { UserCabinetShell } from "./components/user-cabinet-shell";
import { ReactHostProvider } from "./providers/react-host-provider";
import "./react-host.css";

function mountReactHost() {
  if (!shouldMountReactHost()) return;

  const host = document.querySelector<HTMLElement>("[data-react-transition-host]");
  if (host) {
    host.hidden = false;
    createRoot(host).render(
      <StrictMode>
        <ReactHostProvider>
          <ReactHostShell />
        </ReactHostProvider>
      </StrictMode>,
    );
  }

  const userCabinetBody = document.getElementById("user-modal-body");
  if (userCabinetBody) {
    document.body.dataset.reactTransitionUserCabinet = "enabled";
    createRoot(userCabinetBody).render(
      <StrictMode>
        <UserCabinetShell />
      </StrictMode>,
    );
  }
}

function mountReactRoots() {
  mountReactHost();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountReactRoots, { once: true });
} else {
  mountReactRoots();
}
