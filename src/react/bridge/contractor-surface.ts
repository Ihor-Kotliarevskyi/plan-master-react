import { z } from "zod";
import type { ContractorSurfaceSnapshot } from "../types";

const snapshotSchema: z.ZodType<ContractorSurfaceSnapshot> = z.object({
  searchQuery: z.string(),
  summaryHtml: z.string(),
  statusFilterHtml: z.string(),
  typeFilterHtml: z.string(),
  categoryFilterHtml: z.string(),
  resetFilterHtml: z.string(),
  selectionActionsHtml: z.string(),
  tableHtml: z.string(),
  capturedAt: z.string(),
});

type ContractorSurfaceWindow = Window & {
  getContractorSurfaceBridgeSnapshot?: () => unknown;
};

function getContractorSurfaceWindow(): ContractorSurfaceWindow {
  return window as ContractorSurfaceWindow;
}

function buildFallbackSnapshot(): ContractorSurfaceSnapshot {
  return {
    searchQuery: "",
    summaryHtml: "",
    statusFilterHtml: "",
    typeFilterHtml: "",
    categoryFilterHtml: "",
    resetFilterHtml: "",
    selectionActionsHtml: "",
    tableHtml: "",
    capturedAt: new Date().toISOString(),
  };
}

export function readContractorSurfaceSnapshot(): ContractorSurfaceSnapshot {
  const parsed = snapshotSchema.safeParse(getContractorSurfaceWindow().getContractorSurfaceBridgeSnapshot?.());
  return parsed.success ? parsed.data : buildFallbackSnapshot();
}

export function subscribeContractorSurfaceSync(onSync: () => void): () => void {
  const handler = () => onSync();
  document.addEventListener("plan-master:contractor-surface-sync", handler);
  return () => document.removeEventListener("plan-master:contractor-surface-sync", handler);
}
