import { z } from "zod";
import type { GanttSurfaceSnapshot } from "../types";

const snapshotSchema: z.ZodType<GanttSurfaceSnapshot> = z.object({
  legendHtml: z.string(),
  toolbarHtml: z.string(),
  tableHtml: z.string(),
  capturedAt: z.string(),
});

type GanttSurfaceWindow = Window & {
  getGanttSurfaceBridgeSnapshot?: () => unknown;
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

function getGanttSurfaceWindow(): GanttSurfaceWindow {
  return window as GanttSurfaceWindow;
}

function buildFallbackSnapshot(): GanttSurfaceSnapshot {
  return {
    legendHtml: "",
    toolbarHtml: "",
    tableHtml: "",
    capturedAt: new Date().toISOString(),
  };
}

export function readGanttSurfaceSnapshot(): GanttSurfaceSnapshot {
  const parsed = snapshotSchema.safeParse(getGanttSurfaceWindow().getGanttSurfaceBridgeSnapshot?.());
  return parsed.success ? parsed.data : buildFallbackSnapshot();
}

export function subscribeGanttSurfaceSync(onSync: () => void): () => void {
  const handler = () => onSync();
  document.addEventListener("plan-master:gantt-surface-sync", handler);
  return () => document.removeEventListener("plan-master:gantt-surface-sync", handler);
}

export function toggleGanttCategory(index: number, event?: MouseEvent): void {
  getGanttSurfaceWindow().toggleCat?.(index, event);
}

export function resetGanttCategoryFilter(): void {
  getGanttSurfaceWindow().resetCatFilter?.();
}

export function onGanttTaskSearch(query: string): void {
  getGanttSurfaceWindow().onTaskSearch?.(query);
}

export function clearGanttTaskSearch(): void {
  getGanttSurfaceWindow().clearTaskSearch?.();
}

export function resetGanttFilters(): void {
  getGanttSurfaceWindow().resetGanttFilters?.();
}

export function toggleGanttCriticalPath(): void {
  getGanttSurfaceWindow().toggleCriticalPath?.();
}

export function toggleGanttDependencyArrows(): void {
  getGanttSurfaceWindow().toggleDepArrows?.();
}

export function openGanttDependencyList(): void {
  getGanttSurfaceWindow().openDepList?.();
}

export function toggleGanttGroupBy(): void {
  getGanttSurfaceWindow().toggleGroupBy?.();
}

export function reopenGanttOverdue(): void {
  getGanttSurfaceWindow().checkOverdue?.(true);
}

export function zoomGanttOut(): void {
  getGanttSurfaceWindow().zoomOut?.();
}

export function zoomGanttIn(): void {
  getGanttSurfaceWindow().zoomIn?.();
}

export function toggleGanttMonoBar(): void {
  getGanttSurfaceWindow().toggleMonoBar?.();
}

export function setGanttMonoColor(color: string): void {
  getGanttSurfaceWindow().setMonoColor?.(color);
}

export function openGanttAddTask(): void {
  getGanttSurfaceWindow().openAdd?.();
}

export function toggleGanttHidePast(): void {
  getGanttSurfaceWindow().toggleHidePast?.();
}

export function toggleGanttGroup(categoryIndex: number): void {
  getGanttSurfaceWindow().toggleGroup?.(categoryIndex);
}

export function openGanttEditTask(taskIndex: number): void {
  getGanttSurfaceWindow().openEdit?.(taskIndex);
}

export function copyGanttTask(taskIndex: number): void {
  getGanttSurfaceWindow().copyTask?.(taskIndex);
}

export async function deleteGanttTask(taskIndex: number): Promise<void> {
  await Promise.resolve(getGanttSurfaceWindow().delTask?.(taskIndex));
}

export function openGanttNotesModal(taskIndex: number): void {
  getGanttSurfaceWindow().openNotesModal?.(taskIndex);
}

export function handleGanttBarClick(event: MouseEvent, taskIndex: number): void {
  getGanttSurfaceWindow().handleBarClick?.(event, taskIndex);
}
