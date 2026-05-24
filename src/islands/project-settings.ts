type ProjectSettingsRuntime = Window & {
  openProj?: () => void;
  closeProjModal?: () => void;
  saveProjSettings?: () => Promise<void> | void;
  openCatEditor?: () => void;
  closeCatModal?: () => void;
  addCat?: () => void;
  saveCats?: () => void;
  numStep?: (id: string, delta: number) => void;
};

const projectRuntime = window as ProjectSettingsRuntime;

async function handleProjectAction(action: string, element: HTMLElement): Promise<void> {
  switch (action) {
    case "open-settings":
      projectRuntime.openProj?.();
      return;
    case "close-settings":
      projectRuntime.closeProjModal?.();
      return;
    case "save-settings":
      await Promise.resolve(projectRuntime.saveProjSettings?.());
      return;
    case "open-categories":
      projectRuntime.closeProjModal?.();
      projectRuntime.openCatEditor?.();
      return;
    case "close-categories":
      projectRuntime.closeCatModal?.();
      return;
    case "save-categories":
      await Promise.resolve(projectRuntime.saveCats?.());
      return;
    case "add-category":
      projectRuntime.addCat?.();
      return;
    case "num-step": {
      const targetId = element.dataset.targetId || "";
      const delta = Number(element.dataset.delta || 0);
      projectRuntime.numStep?.(targetId, delta);
      return;
    }
    default:
      return;
  }
}

function initProjectSettingsIsland(): void {
  const projectButton = document.querySelector<HTMLElement>("[data-project-action='open-settings']");
  const projectModal = document.getElementById("proj-modal");
  const categoryModal = document.getElementById("cat-modal");

  projectButton?.addEventListener("click", () => {
    projectRuntime.openProj?.();
  });

  projectModal?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    if (target === projectModal) {
      projectRuntime.closeProjModal?.();
      return;
    }

    const actionElement = target.closest<HTMLElement>("[data-project-action]");
    if (!actionElement) return;
    await handleProjectAction(actionElement.dataset.projectAction || "", actionElement);
  });

  categoryModal?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    if (target === categoryModal) {
      projectRuntime.closeCatModal?.();
      return;
    }

    const actionElement = target.closest<HTMLElement>("[data-project-action]");
    if (!actionElement) return;
    await handleProjectAction(actionElement.dataset.projectAction || "", actionElement);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProjectSettingsIsland, { once: true });
} else {
  initProjectSettingsIsland();
}
