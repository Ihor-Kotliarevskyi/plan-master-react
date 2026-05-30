import { z } from "zod";
import type { FinanceSurfaceSnapshot } from "../types";

const snapshotSchema: z.ZodType<FinanceSurfaceSnapshot> = z.object({
  filtersHtml: z.string(),
  summaryHtml: z.string(),
  tableHtml: z.string(),
  capturedAt: z.string(),
});

type FinanceSurfaceWindow = Window & {
  getFinanceSurfaceBridgeSnapshot?: () => unknown;
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
  toggleWeeklyCostBars?: () => void;
  adjustFinanceChartHeight?: (delta: number) => void;
};

function getFinanceSurfaceWindow(): FinanceSurfaceWindow {
  return window as FinanceSurfaceWindow;
}

function buildFallbackSnapshot(): FinanceSurfaceSnapshot {
  return {
    filtersHtml: "",
    summaryHtml: "",
    tableHtml: "",
    capturedAt: new Date().toISOString(),
  };
}

export function readFinanceSurfaceSnapshot(): FinanceSurfaceSnapshot {
  const parsed = snapshotSchema.safeParse(getFinanceSurfaceWindow().getFinanceSurfaceBridgeSnapshot?.());
  return parsed.success ? parsed.data : buildFallbackSnapshot();
}

export function subscribeFinanceSurfaceSync(onSync: () => void): () => void {
  const handler = () => onSync();
  document.addEventListener("plan-master:finance-surface-sync", handler);
  return () => document.removeEventListener("plan-master:finance-surface-sync", handler);
}

export function switchFinanceTab(tab: string): void {
  getFinanceSurfaceWindow().switchFinTab?.(tab);
}

export function onFinanceSearch(query: string): void {
  getFinanceSurfaceWindow().onFinSearch?.(query);
}

export function clearFinanceSearch(): void {
  getFinanceSurfaceWindow().clearFinSearch?.();
}

export function resetFinanceFilters(): void {
  getFinanceSurfaceWindow().resetFinanceFilters?.();
}

export function setFinanceBudgetFilter(field: string, value: string): void {
  getFinanceSurfaceWindow().setFinanceBudgetFilter?.(field, value);
}

export function setFinanceOnlyBudget(value: boolean): void {
  getFinanceSurfaceWindow().setFinanceOnlyBudget?.(value);
}

export function toggleFinanceEvm(): void {
  getFinanceSurfaceWindow().toggleFinanceEVM?.();
}

export async function deleteVisibleFinanceTasks(): Promise<void> {
  await Promise.resolve(getFinanceSurfaceWindow().deleteVisibleFinanceTasks?.());
}

export function sortFinance(column: string): void {
  getFinanceSurfaceWindow().sortFin?.(column);
}

export function startFinanceColResize(event: MouseEvent, column: string): void {
  getFinanceSurfaceWindow().startFinColResize?.(event, column);
}

export function openFinanceTask(taskIndex: number): void {
  getFinanceSurfaceWindow().finOpenTask?.(taskIndex);
}

export function openFinanceCost(taskIndex: number): void {
  getFinanceSurfaceWindow().finOpenCost?.(taskIndex);
}

export function showFinanceOverview(): void {
  getFinanceSurfaceWindow().finShowOverview?.();
}

export function goToFinanceGanttSearch(taskIndex: number): void {
  getFinanceSurfaceWindow().finGoToGanttSearch?.(taskIndex);
}

export function toggleWeeklyFinanceBars(): void {
  getFinanceSurfaceWindow().toggleWeeklyCostBars?.();
}

export function adjustFinanceChartHeight(delta: number): void {
  getFinanceSurfaceWindow().adjustFinanceChartHeight?.(delta);
}
