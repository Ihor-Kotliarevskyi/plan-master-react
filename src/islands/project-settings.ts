type ProjectSettingsRuntime = Window & {
  openProj?: () => void;
  closeProjModal?: () => void;
  saveProjSettings?: () => Promise<void> | void;
  openCatEditor?: () => void;
  closeCatModal?: () => void;
  addCat?: () => void;
  saveCats?: () => void;
  setCatDraftName?: (index: number, value: string) => void;
  pickCatColor?: (index: number, color: string, dotEl?: HTMLElement | null) => void;
  toggleCatColorDropdown?: (index: number) => void;
  deleteCat?: (index: number) => Promise<void> | void;
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
    case "toggle-category-color":
      projectRuntime.toggleCatColorDropdown?.(Number(element.dataset.catIndex || -1));
      return;
    case "pick-category-color":
      projectRuntime.pickCatColor?.(
        Number(element.dataset.catIndex || -1),
        element.dataset.color || "",
        element,
      );
      return;
    case "delete-category":
      await Promise.resolve(projectRuntime.deleteCat?.(Number(element.dataset.catIndex || -1)));
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
    event.stopPropagation();
    await handleProjectAction(actionElement.dataset.projectAction || "", actionElement);
  });

  categoryModal?.addEventListener("input", (event) => {
    const target = event.target as HTMLInputElement | null;
    const inputType = target?.dataset.projectInput || "";
    const catIndex = Number(target?.dataset.catIndex || -1);

    if (inputType === "category-name" && catIndex >= 0) {
      projectRuntime.setCatDraftName?.(catIndex, target?.value || "");
      return;
    }

    if (inputType === "category-color" && catIndex >= 0) {
      projectRuntime.pickCatColor?.(catIndex, target?.value || "", null);
    }
  });

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest(".color-picker-wrap")) return;
    document.querySelectorAll(".color-dropdown.open").forEach((node) => {
      node.classList.remove("open");
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProjectSettingsIsland, { once: true });
} else {
  initProjectSettingsIsland();
}

export {};
