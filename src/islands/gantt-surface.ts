type GanttSurfaceRuntime = Window & {
  toggleCat?: (index: number, event?: MouseEvent) => void;
  resetCatFilter?: () => void;
  onTaskSearch?: (query: string) => void;
  clearTaskSearch?: () => void;
  resetGanttFilters?: () => void;
  toggleCriticalPath?: () => void;
  toggleDepArrows?: () => void;
  openDepList?: () => void;
  toggleGroupBy?: () => void;
  checkOverdue?: (forceShow?: boolean) => void;
  zoomOut?: () => void;
  zoomIn?: () => void;
  toggleMonoBar?: () => void;
  setMonoColor?: (color: string) => void;
  openAdd?: () => void;
  toggleHidePast?: () => void;
  toggleGroup?: (categoryIndex: number) => void;
  openEdit?: (taskIndex: number) => void;
  copyTask?: (taskIndex: number) => void;
  delTask?: (taskIndex: number) => Promise<void> | void;
  openNotesModal?: (taskIndex: number) => void;
  handleBarClick?: (event: MouseEvent, taskIndex: number) => void;
};

const ganttRuntime = window as GanttSurfaceRuntime;

async function handleGanttSurfaceAction(
  action: string,
  element: HTMLElement,
  event: MouseEvent,
): Promise<void> {
  switch (action) {
    case "toggle-category":
      ganttRuntime.toggleCat?.(Number(element.dataset.categoryIndex || -1), event);
      return;
    case "reset-category-filter":
      ganttRuntime.resetCatFilter?.();
      return;
    case "clear-task-search":
      ganttRuntime.clearTaskSearch?.();
      return;
    case "reset-gantt-filters":
      ganttRuntime.resetGanttFilters?.();
      return;
    case "toggle-critical-path":
      ganttRuntime.toggleCriticalPath?.();
      return;
    case "toggle-dependency-arrows":
      ganttRuntime.toggleDepArrows?.();
      return;
    case "open-dependency-list":
      ganttRuntime.openDepList?.();
      return;
    case "toggle-group-by":
      ganttRuntime.toggleGroupBy?.();
      return;
    case "reopen-overdue":
      ganttRuntime.checkOverdue?.(true);
      return;
    case "zoom-out":
      ganttRuntime.zoomOut?.();
      return;
    case "zoom-in":
      ganttRuntime.zoomIn?.();
      return;
    case "toggle-mono-bar":
      ganttRuntime.toggleMonoBar?.();
      return;
    case "open-add-task":
      ganttRuntime.openAdd?.();
      return;
    case "toggle-hide-past":
      ganttRuntime.toggleHidePast?.();
      return;
    case "toggle-group":
      ganttRuntime.toggleGroup?.(Number(element.dataset.categoryIndex || -1));
      return;
    case "open-edit-task":
      ganttRuntime.openEdit?.(Number(element.dataset.taskIndex || -1));
      return;
    case "copy-task":
      event.stopPropagation();
      ganttRuntime.copyTask?.(Number(element.dataset.taskIndex || -1));
      return;
    case "delete-task":
      event.stopPropagation();
      await Promise.resolve(ganttRuntime.delTask?.(Number(element.dataset.taskIndex || -1)));
      return;
    case "open-notes-modal":
      event.stopPropagation();
      ganttRuntime.openNotesModal?.(Number(element.dataset.taskIndex || -1));
      return;
    case "handle-bar-click":
      ganttRuntime.handleBarClick?.(event, Number(element.dataset.taskIndex || -1));
      return;
    default:
      return;
  }
}

function initGanttSurfaceIsland(): void {
  document.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement | null;
    const actionElement = target?.closest<HTMLElement>("[data-gantt-action]");
    if (!actionElement) return;
    await handleGanttSurfaceAction(actionElement.dataset.ganttAction || "", actionElement, event as MouseEvent);
  });

  document.addEventListener("input", (event) => {
    const target = event.target as HTMLInputElement | null;
    const inputElement = target?.closest<HTMLElement>("[data-gantt-input]");
    if (!inputElement || !target) return;
    const inputType = inputElement.dataset.ganttInput || "";

    if (inputType === "task-search") {
      ganttRuntime.onTaskSearch?.(target.value);
      return;
    }

    if (inputType === "mono-bar-color") {
      ganttRuntime.setMonoColor?.(target.value);
    }
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target as HTMLInputElement | null;
    const inputElement = target?.closest<HTMLElement>("[data-gantt-input='task-search']");
    if (!inputElement || !target) return;
    if (event.key !== "Escape") return;
    target.value = "";
    ganttRuntime.onTaskSearch?.("");
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGanttSurfaceIsland, { once: true });
} else {
  initGanttSurfaceIsland();
}

export {};
