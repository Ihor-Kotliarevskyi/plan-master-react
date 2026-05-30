import {
  openLegacyAuthFlow,
  openLegacyUserCabinet,
  switchLegacyProject,
} from "../bridge/legacy-app";
import { useReactHostStore } from "../store/app-shell-store";
import type { ReactHostRoute } from "../types";

const ROUTES: Array<{ id: ReactHostRoute; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "auth", label: "Auth" },
  { id: "audit", label: "Audit" },
  { id: "share", label: "Share" },
  { id: "projects", label: "Projects" },
  { id: "settings", label: "Settings" },
];

function formatCapturedAt(value: string | null): string {
  if (!value) return "waiting for bridge";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString("uk-UA");
}

export function ReactHostShell() {
  const session = useReactHostStore((state) => state.session);
  const projectCollection = useReactHostStore((state) => state.projectCollection);
  const currentProject = useReactHostStore((state) => state.currentProject);
  const ui = useReactHostStore((state) => state.ui);
  const lastCapturedAt = useReactHostStore((state) => state.lastCapturedAt);
  const setRoute = useReactHostStore((state) => state.setRoute);

  return (
    <aside className="react-host-panel" aria-label="React transition host">
      <div className="react-host-panel__header">
        <div>
          <p className="react-host-panel__eyebrow">Phase 3 / Stage 0</p>
          <h2>React host bootstrap</h2>
        </div>
        <span className={`react-host-panel__badge${ui.bridgeReady ? " is-live" : ""}`}>
          {ui.bridgeReady ? "bridge live" : "booting"}
        </span>
      </div>

      <nav className="react-host-panel__nav">
        {ROUTES.map((route) => (
          <button
            key={route.id}
            className={`react-host-panel__nav-btn${ui.route === route.id ? " is-active" : ""}`}
            onClick={() => setRoute(route.id)}
            type="button"
          >
            {route.label}
          </button>
        ))}
      </nav>

      {ui.route === "overview" && (
        <section className="react-host-panel__section">
          <p className="react-host-panel__lead">
            React shell is mounted next to the legacy runtime and reading shared project state through a typed bridge.
          </p>
          <dl className="react-host-panel__stats">
            <div>
              <dt>Session</dt>
              <dd>{session.isAuthenticated ? "authenticated" : "guest"}</dd>
            </div>
            <div>
              <dt>Project</dt>
              <dd>{currentProject?.name || "none"}</dd>
            </div>
            <div>
              <dt>Legacy tab</dt>
              <dd>{ui.activeTab || "unknown"}</dd>
            </div>
            <div>
              <dt>Bridge sync</dt>
              <dd>{formatCapturedAt(lastCapturedAt)}</dd>
            </div>
          </dl>
        </section>
      )}

      {ui.route === "auth" && (
        <section className="react-host-panel__section">
          <p className="react-host-panel__lead">Target for the first low-risk migration slice.</p>
          <p className="react-host-panel__meta">Auth CTA: {session.authLabel || "not rendered yet"}</p>
          <p className="react-host-panel__meta">User label: {session.userLabel || "guest"}</p>
          <button className="react-host-panel__action" onClick={openLegacyAuthFlow} type="button">
            Open current auth flow
          </button>
          <button
            className="react-host-panel__action react-host-panel__action--secondary"
            onClick={openLegacyUserCabinet}
            type="button"
          >
            Open current user cabinet
          </button>
        </section>
      )}

      {ui.route === "projects" && (
        <section className="react-host-panel__section">
          <p className="react-host-panel__lead">Project collection store skeleton is hydrated from the legacy runtime.</p>
          <div className="react-host-panel__project-list">
            {projectCollection.items.map((project) => (
              <button
                key={project.id}
                className={`react-host-panel__project-item${project.isCurrent ? " is-current" : ""}`}
                onClick={() => switchLegacyProject(project.id)}
                type="button"
              >
                <span>{project.name}</span>
                <span>{project.role}</span>
              </button>
            ))}
            {projectCollection.items.length === 0 && (
              <p className="react-host-panel__empty">No bridge projects available yet.</p>
            )}
          </div>
        </section>
      )}

      {["audit", "share", "settings"].includes(ui.route) && (
        <section className="react-host-panel__section">
          <p className="react-host-panel__lead">
            This route is scaffolded now so the next migration slices can replace isolated legacy islands without changing the host shell contract.
          </p>
          <p className="react-host-panel__meta">Current project role: {currentProject?.role || "unknown"}</p>
          <p className="react-host-panel__meta">
            Tasks / categories: {currentProject ? `${currentProject.taskCount} / ${currentProject.categoryCount}` : "n/a"}
          </p>
        </section>
      )}
    </aside>
  );
}
