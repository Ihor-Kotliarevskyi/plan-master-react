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
