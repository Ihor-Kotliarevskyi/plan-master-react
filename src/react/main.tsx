import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { shouldMountReactHost } from "./bridge/legacy-app";
import { AuditViewerModal } from "./components/audit-viewer-modal";
import { ProjectManagerModal } from "./components/project-manager-modal";
import { ProjectSettingsModal } from "./components/project-settings-modal";
import { ReactHostShell } from "./components/react-host-shell";
import { ShareModal } from "./components/share-modal";
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

  const auditHost = document.createElement("div");
  auditHost.id = "react-audit-viewer-root";
  document.body.appendChild(auditHost);
  createRoot(auditHost).render(
    <StrictMode>
      <AuditViewerModal />
    </StrictMode>,
  );

  const shareHost = document.createElement("div");
  shareHost.id = "react-share-modal-root";
  document.body.appendChild(shareHost);
  createRoot(shareHost).render(
    <StrictMode>
      <ShareModal />
    </StrictMode>,
  );

  const projectManagerModal = document.querySelector<HTMLElement>("[data-project-manager-root] .modal");
  if (projectManagerModal) {
    document.body.dataset.reactTransitionProjectManager = "enabled";
    createRoot(projectManagerModal).render(
      <StrictMode>
        <ProjectManagerModal />
      </StrictMode>,
    );
  }

  const projectSettingsModal = document.querySelector<HTMLElement>("[data-project-settings-root] .modal");
  if (projectSettingsModal) {
    document.body.dataset.reactTransitionProjectSettings = "enabled";
    createRoot(projectSettingsModal).render(
      <StrictMode>
        <ProjectSettingsModal />
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
