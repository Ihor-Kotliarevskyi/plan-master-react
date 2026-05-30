import { useEffect, useState } from "react";
import {
  adjustFinanceChartHeight,
  clearFinanceSearch,
  deleteVisibleFinanceTasks,
  goToFinanceGanttSearch,
  onFinanceSearch,
  openFinanceCost,
  openFinanceTask,
  readFinanceSurfaceSnapshot,
  resetFinanceFilters,
  setFinanceBudgetFilter,
  setFinanceOnlyBudget,
  showFinanceOverview,
  sortFinance,
  startFinanceColResize,
  subscribeFinanceSurfaceSync,
  switchFinanceTab,
  toggleFinanceEvm,
  toggleWeeklyFinanceBars,
} from "../bridge/finance-surface";
import { openReactMultiFilter, resetReactMultiFilter, setReactMultiFilter } from "../bridge/multi-filter";
import type { FinanceSurfaceSnapshot } from "../types";

declare global {
  interface Window {
    lucide?: {
      createIcons: (options?: { nodes?: Array<Element | null | undefined> }) => void;
    };
  }
}

function useFinanceSurfaceSnapshot() {
  const [snapshot, setSnapshot] = useState<FinanceSurfaceSnapshot>(() => readFinanceSurfaceSnapshot());

  useEffect(() => {
    const sync = () => setSnapshot(readFinanceSurfaceSnapshot());
    sync();
    return subscribeFinanceSurfaceSync(sync);
  }, []);

  return snapshot;
}

export function FinanceFiltersShell() {
  const snapshot = useFinanceSurfaceSnapshot();

  useEffect(() => {
    window.lucide?.createIcons({
      nodes: Array.from(document.querySelectorAll("#fin-filters [data-lucide]")),
    });
  }, [snapshot.capturedAt]);

  async function handleAction(event: React.MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    const multiFilterAction = target.closest<HTMLElement>("[data-multi-filter-action]");
    if (multiFilterAction) {
      event.stopPropagation();
      const action = multiFilterAction.dataset.multiFilterAction || "";
      const path = multiFilterAction.dataset.filterPath || "";
      if (action === "toggle") {
        openReactMultiFilter(path, multiFilterAction, event.nativeEvent);
        return;
      }
      if (action === "reset") {
        resetReactMultiFilter(path, multiFilterAction.dataset.renderFn || "");
        return;
      }
    }

    if (target.closest("[data-multi-filter-root]")) {
      event.stopPropagation();
    }

    const actionElement = target.closest<HTMLElement>("[data-finance-surface-action]");
    if (!actionElement) return;

    switch (actionElement.dataset.financeSurfaceAction || "") {
      case "switch-tab":
        switchFinanceTab(actionElement.dataset.finTab || "overview");
        return;
      case "clear-search":
        clearFinanceSearch();
        return;
      case "reset-filters":
        resetFinanceFilters();
        return;
      case "toggle-evm":
        toggleFinanceEvm();
        return;
      case "delete-visible-tasks":
        await deleteVisibleFinanceTasks();
        return;
      default:
        return;
    }
  }

  function handleInput(event: React.FormEvent<HTMLElement>) {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    if (target.dataset.financeSurfaceInput === "search") {
      onFinanceSearch(target.value);
    }
  }

  function handleChange(event: React.FormEvent<HTMLElement>) {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    if (target.dataset.multiFilterAction === "set-option") {
      setReactMultiFilter(
        target.dataset.filterPath || "",
        target.dataset.filterOption || "",
        target.checked,
        target.dataset.renderFn || "",
      );
      return;
    }
    const inputType = target.dataset.financeSurfaceInput || "";
    if (inputType === "budget-min") {
      setFinanceBudgetFilter("budgetMin", target.value);
      return;
    }
    if (inputType === "budget-max") {
      setFinanceBudgetFilter("budgetMax", target.value);
      return;
    }
    if (inputType === "only-budget") {
      setFinanceOnlyBudget(target.checked);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    const target = event.target as HTMLInputElement | null;
    if (!target || target.dataset.financeSurfaceInput !== "search") return;
    if (event.key !== "Escape") return;
    clearFinanceSearch();
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: snapshot.filtersHtml }}
      onClick={(event) => void handleAction(event)}
      onInput={handleInput}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  );
}

export function FinanceSummaryShell() {
  const snapshot = useFinanceSurfaceSnapshot();

  function handleChartAction(event: React.MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    const actionElement = target.closest<HTMLElement>("[data-finance-chart-action]");
    const action = actionElement?.dataset.financeChartAction || "";

    switch (action) {
      case "toggle-weekly-bars":
        toggleWeeklyFinanceBars();
        return;
      case "shrink-height":
        adjustFinanceChartHeight(-40);
        return;
      case "grow-height":
        adjustFinanceChartHeight(40);
        return;
      case "show-overview":
        showFinanceOverview();
        return;
      default:
        return;
    }
  }

  return <div dangerouslySetInnerHTML={{ __html: snapshot.summaryHtml }} onClick={handleChartAction} />;
}

export function FinanceTableShell() {
  const snapshot = useFinanceSurfaceSnapshot();

  async function handleAction(event: React.MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    const actionElement = target.closest<HTMLElement>("[data-finance-surface-action]");
    if (!actionElement) return;

    switch (actionElement.dataset.financeSurfaceAction || "") {
      case "sort-col":
        sortFinance(actionElement.dataset.colKey || "");
        return;
      case "open-task":
        openFinanceTask(Number(actionElement.dataset.taskIndex || -1));
        return;
      case "open-cost":
        openFinanceCost(Number(actionElement.dataset.taskIndex || -1));
        return;
      case "show-overview":
        showFinanceOverview();
        return;
      case "go-to-gantt-search":
        goToFinanceGanttSearch(Number(actionElement.dataset.taskIndex || -1));
        return;
      default:
        return;
    }
  }

  function handleMouseDown(event: React.MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement | null;
    const handle = target?.closest<HTMLElement>("[data-finance-surface-mousedown='resize-col']");
    if (!handle) return;
    startFinanceColResize(event.nativeEvent, handle.dataset.col || "");
  }

  return <table dangerouslySetInnerHTML={{ __html: snapshot.tableHtml }} className="fin-tbl" onClick={(event) => void handleAction(event)} onMouseDown={handleMouseDown} />;
}
