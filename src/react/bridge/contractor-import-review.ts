import { z } from "zod";
import type { ContractorImportReviewSnapshot } from "../types";

const snapshotSchema: z.ZodType<ContractorImportReviewSnapshot> = z.object({
  visible: z.boolean(),
  hasImportableRows: z.boolean(),
  filterCardsHtml: z.string(),
  noteHtml: z.string(),
  tableHtml: z.string(),
  labels: z.object({
    title: z.string(),
    importButton: z.string(),
    okButton: z.string(),
    cancelButton: z.string(),
    noChangesValidation: z.string(),
  }),
  capturedAt: z.string(),
});

type ContractorImportReviewWindow = Window & {
  getContractorImportReviewBridgeSnapshot?: () => unknown;
  closeReactContractorImportReview?: (result?: null) => void;
  submitReactContractorImportReview?: () => { ok: boolean; error?: string };
};

function getWindowState(): ContractorImportReviewWindow {
  return window as ContractorImportReviewWindow;
}

function buildFallbackSnapshot(): ContractorImportReviewSnapshot {
  return {
    visible: false,
    hasImportableRows: false,
    filterCardsHtml: "",
    noteHtml: "",
    tableHtml: "",
    labels: {
      title: "",
      importButton: "Import",
      okButton: "OK",
      cancelButton: "Cancel",
      noChangesValidation: "",
    },
    capturedAt: new Date().toISOString(),
  };
}

export function readContractorImportReviewSnapshot(): ContractorImportReviewSnapshot {
  const parsed = snapshotSchema.safeParse(getWindowState().getContractorImportReviewBridgeSnapshot?.());
  return parsed.success ? parsed.data : buildFallbackSnapshot();
}

export function subscribeContractorImportReviewSync(onSync: () => void): () => void {
  const handler = () => onSync();
  document.addEventListener("plan-master:contractor-import-review-sync", handler);
  return () => document.removeEventListener("plan-master:contractor-import-review-sync", handler);
}

export function closeContractorImportReview(): void {
  getWindowState().closeReactContractorImportReview?.(null);
}

export function submitContractorImportReview() {
  return getWindowState().submitReactContractorImportReview?.();
}
