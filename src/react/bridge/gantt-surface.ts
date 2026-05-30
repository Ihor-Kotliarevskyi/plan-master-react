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
