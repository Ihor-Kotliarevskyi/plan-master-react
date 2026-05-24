type TaskModalRuntime = Window & {
  closeModal?: () => void;
  saveTask?: () => Promise<void> | void;
  switchTaskTab?: (tab: string) => void;
  modalAddPhase?: () => void;
  modalRemovePhase?: (phaseIndex: number) => void;
  onModalPhaseChange?: () => void;
  onModalProgChange?: (phaseIndex: number, value: string) => void;
  adjNum?: (id: string, delta: number) => void;
  filterDepSearch?: (query: string) => void;
  showDepDropdown?: () => void;
  updCalc?: () => void;
  addCostItem?: (type: string) => void;
};

const taskModalRuntime = window as TaskModalRuntime;

async function handleTaskModalAction(action: string, element: HTMLElement): Promise<void> {
  switch (action) {
    case "close-modal":
      taskModalRuntime.closeModal?.();
      return;
    case "save-task":
      await Promise.resolve(taskModalRuntime.saveTask?.());
      return;
    case "switch-tab":
      taskModalRuntime.switchTaskTab?.(element.dataset.taskTab || "general");
      return;
    case "add-phase":
      taskModalRuntime.modalAddPhase?.();
      return;
    case "remove-phase":
      taskModalRuntime.modalRemovePhase?.(Number(element.dataset.phaseIndex || -1));
      return;
    case "num-step":
      taskModalRuntime.adjNum?.(element.dataset.targetId || "", Number(element.dataset.delta || 0));
      return;
    case "add-cost-item":
      taskModalRuntime.addCostItem?.(element.dataset.costType || "material");
      return;
    default:
      return;
  }
}

function initTaskModalIsland(): void {
  const modal = document.getElementById("modal");
  const depSearch = document.getElementById("dep-search") as HTMLInputElement | null;

  depSearch?.addEventListener("input", (event) => {
    const target = event.target as HTMLInputElement;
    taskModalRuntime.filterDepSearch?.(target.value);
  });

  depSearch?.addEventListener("focus", () => {
    taskModalRuntime.showDepDropdown?.();
  });

  modal?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    if (target === modal) {
      taskModalRuntime.closeModal?.();
      return;
    }

    const actionElement = target.closest<HTMLElement>("[data-task-modal-action]");
    if (!actionElement) return;
    await handleTaskModalAction(actionElement.dataset.taskModalAction || "", actionElement);
  });

  modal?.addEventListener("change", (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const inputElement = target.closest<HTMLElement>("[data-task-modal-input]");
    if (!inputElement) return;

    const inputType = inputElement.dataset.taskModalInput || "";
    if (inputType === "phase-date") {
      taskModalRuntime.onModalPhaseChange?.();
      return;
    }

    if (inputType === "contracts-override-budget") {
      taskModalRuntime.updCalc?.();
    }
  });

  modal?.addEventListener("input", (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const inputElement = target.closest<HTMLElement>("[data-task-modal-input]");
    if (!inputElement) return;

    const inputType = inputElement.dataset.taskModalInput || "";
    if (inputType === "phase-progress") {
      const input = inputElement as HTMLInputElement;
      taskModalRuntime.onModalProgChange?.(Number(input.dataset.phaseIndex || -1), input.value);
      return;
    }

    if (inputType === "budget" || inputType === "spent") {
      taskModalRuntime.updCalc?.();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTaskModalIsland, { once: true });
} else {
  initTaskModalIsland();
}

export {};
