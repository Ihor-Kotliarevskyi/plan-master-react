type ProjectManagerRuntime = Window & {
  openProjManager?: () => void;
  closeProjMgr?: () => void;
  createProject?: () => Promise<void> | void;
  loadDemoProject?: () => Promise<void> | void;
  deleteProject?: (id: string) => Promise<void> | void;
  renameProjectFromManager?: (id: string, name: string) => string;
  switchProject?: (id: string) => void;
  updateProjSel?: () => void;
};

const runtime = window as ProjectManagerRuntime;

async function handleProjectManagerAction(action: string, element: HTMLElement): Promise<void> {
  switch (action) {
    case "open-manager":
      runtime.openProjManager?.();
      return;
    case "close-manager":
      runtime.closeProjMgr?.();
      return;
    case "create-project":
      await Promise.resolve(runtime.createProject?.());
      return;
    case "load-demo":
      await Promise.resolve(runtime.loadDemoProject?.());
      return;
    case "delete-project":
      await Promise.resolve(runtime.deleteProject?.(element.dataset.projectId || ""));
      return;
    case "switch-project":
      runtime.switchProject?.(element.dataset.projectId || "");
      return;
    default:
      return;
  }
}

function initProjectManagerIsland(): void {
  const openButton = document.querySelector<HTMLElement>("[data-project-manager-action='open-manager']");
  const modal = document.getElementById("projmgr-modal");
  const list = document.getElementById("proj-list-el");

  openButton?.addEventListener("click", () => {
    runtime.openProjManager?.();
  });

  modal?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    if (target === modal) {
      runtime.closeProjMgr?.();
      return;
    }

    const actionElement = target.closest<HTMLElement>("[data-project-manager-action]");
    if (!actionElement) return;

    if (actionElement.closest(".pj-name-inp")) return;
    await handleProjectManagerAction(actionElement.dataset.projectManagerAction || "", actionElement);
  });

  list?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (target.closest(".pj-name-inp")) return;
    const row = target.closest<HTMLElement>(".pj-row[data-project-manager-action='switch-project']");
    if (!row) return;
    await handleProjectManagerAction("switch-project", row);
  });

  list?.addEventListener("change", (event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target || !target.classList.contains("pj-name-inp")) return;
    const projectId = target.dataset.projectId || "";
    if (!projectId) return;
    const nextName = runtime.renameProjectFromManager?.(projectId, target.value);
    if (typeof nextName === "string") target.value = nextName;
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProjectManagerIsland, { once: true });
} else {
  initProjectManagerIsland();
}

export {};
