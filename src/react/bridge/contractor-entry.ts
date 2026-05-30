import { z } from "zod";
import type { ContractorEntrySnapshot } from "../types";

const snapshotSchema: z.ZodType<ContractorEntrySnapshot> = z.object({
  visible: z.boolean(),
  supplierLocked: z.boolean(),
  supplier: z.string(),
  contractsHtml: z.string(),
  labels: z.object({
    title: z.string(),
    supplierLabel: z.string(),
    supplierPlaceholder: z.string(),
    addContractButton: z.string(),
    cancelButton: z.string(),
    saveButton: z.string(),
  }),
  capturedAt: z.string(),
});

type ContractorEntryWindow = Window & {
  getContractorEntryBridgeSnapshot?: () => unknown;
  openContractorEntryModal?: (prefillSupplier?: string, lockSupplier?: boolean) => void;
  closeContractorEntryModal?: () => void;
  addContractorContractRow?: () => void;
  saveContractorEntry?: () => Promise<void> | void;
};

function getContractorEntryWindow(): ContractorEntryWindow {
  return window as ContractorEntryWindow;
}

function buildFallbackSnapshot(): ContractorEntrySnapshot {
  return {
    visible: false,
    supplierLocked: false,
    supplier: "",
    contractsHtml: "",
    labels: {
      title: "Контрагент",
      supplierLabel: "Контрагент",
      supplierPlaceholder: "Назва контрагента",
      addContractButton: "Додати договір",
      cancelButton: "Скасувати",
      saveButton: "Зберегти",
    },
    capturedAt: new Date().toISOString(),
  };
}

export function readContractorEntrySnapshot(): ContractorEntrySnapshot {
  const parsed = snapshotSchema.safeParse(getContractorEntryWindow().getContractorEntryBridgeSnapshot?.());
  return parsed.success ? parsed.data : buildFallbackSnapshot();
}

export function subscribeContractorEntrySync(onSync: () => void): () => void {
  const handler = () => onSync();
  document.addEventListener("plan-master:contractor-entry-sync", handler);
  return () => document.removeEventListener("plan-master:contractor-entry-sync", handler);
}

export function openContractorEntryModal(prefillSupplier?: string, lockSupplier?: boolean): void {
  getContractorEntryWindow().openContractorEntryModal?.(prefillSupplier, lockSupplier);
}

export function closeContractorEntryModal(): void {
  getContractorEntryWindow().closeContractorEntryModal?.();
}

export function addContractorContractRow(): void {
  getContractorEntryWindow().addContractorContractRow?.();
}

export async function saveContractorEntry(): Promise<void> {
  await Promise.resolve(getContractorEntryWindow().saveContractorEntry?.());
}
