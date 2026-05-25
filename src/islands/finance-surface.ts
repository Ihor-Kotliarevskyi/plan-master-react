type FinanceSurfaceRuntime = Window & {
  switchFinTab?: (tab: string) => void;
  onFinSearch?: (query: string) => void;
  clearFinSearch?: () => void;
  resetFinanceFilters?: () => void;
  setFinanceBudgetFilter?: (field: string, value: string) => void;
  setFinanceOnlyBudget?: (value: boolean) => void;
  toggleFinanceEVM?: () => void;
  deleteVisibleFinanceTasks?: () => Promise<void> | void;
  sortFin?: (column: string) => void;
  startFinColResize?: (event: MouseEvent, column: string) => void;
  finOpenTask?: (taskIndex: number) => void;
  finOpenCost?: (taskIndex: number) => void;
  finShowOverview?: () => void;
  finGoToGanttSearch?: (taskIndex: number) => void;
};

const runtime = window as FinanceSurfaceRuntime;

async function handleFinanceSurfaceAction(action: string, element: HTMLElement): Promise<void> {
  switch (action) {
    case "switch-tab":
      runtime.switchFinTab?.(element.dataset.finTab || "overview");
      return;
    case "clear-search":
      runtime.clearFinSearch?.();
      return;
    case "reset-filters":
      runtime.resetFinanceFilters?.();
      return;
    case "toggle-evm":
      runtime.toggleFinanceEVM?.();
      return;
    case "delete-visible-tasks":
      await Promise.resolve(runtime.deleteVisibleFinanceTasks?.());
      return;
    case "sort-col":
      runtime.sortFin?.(element.dataset.colKey || "");
      return;
    case "open-task":
      runtime.finOpenTask?.(Number(element.dataset.taskIndex || -1));
      return;
    case "open-cost":
      runtime.finOpenCost?.(Number(element.dataset.taskIndex || -1));
      return;
    case "show-overview":
      runtime.finShowOverview?.();
      return;
    case "go-to-gantt-search":
      runtime.finGoToGanttSearch?.(Number(element.dataset.taskIndex || -1));
      return;
    default:
      return;
  }
}

function initFinanceSurfaceIsland(): void {
  document.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement | null;
    const actionElement = target?.closest<HTMLElement>("[data-finance-surface-action]");
    if (!actionElement) return;
    await handleFinanceSurfaceAction(actionElement.dataset.financeSurfaceAction || "", actionElement);
  });

  document.addEventListener("input", (event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    const inputType = target.dataset.financeSurfaceInput || "";
    if (inputType === "search") {
      runtime.onFinSearch?.(target.value);
    }
  });

  document.addEventListener("change", (event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    const inputType = target.dataset.financeSurfaceInput || "";
    if (inputType === "budget-min") {
      runtime.setFinanceBudgetFilter?.("budgetMin", target.value);
      return;
    }
    if (inputType === "budget-max") {
      runtime.setFinanceBudgetFilter?.("budgetMax", target.value);
      return;
    }
    if (inputType === "only-budget") {
      runtime.setFinanceOnlyBudget?.(target.checked);
    }
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target || target.dataset.financeSurfaceInput !== "search") return;
    if (event.key !== "Escape") return;
    runtime.clearFinSearch?.();
  });

  document.addEventListener("mousedown", (event) => {
    const target = event.target as HTMLElement | null;
    const handle = target?.closest<HTMLElement>("[data-finance-surface-mousedown='resize-col']");
    if (!handle) return;
    runtime.startFinColResize?.(event as MouseEvent, handle.dataset.col || "");
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFinanceSurfaceIsland, { once: true });
} else {
  initFinanceSurfaceIsland();
}

export {};
