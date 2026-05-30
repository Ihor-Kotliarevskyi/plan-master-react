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
  onContractorSearch?: (query: string) => void;
  clearContractorSearch?: () => void;
  resetContractorFilters?: () => void;
  toggleContractorSelectionMode?: () => void;
  clearContractorSelection?: () => void;
  deleteSelectedContractors?: () => Promise<void> | void;
  toggleAllVisibleContractors?: (checked: boolean) => void;
  toggleContractorSelection?: (key: string, checked: boolean) => void;
  sortContractors?: (column: string) => void;
  sortContractorDetails?: (group: string, column: string) => void;
  startContractorColResize?: (event: MouseEvent, column: string) => void;
  startContractorDetailColResize?: (event: MouseEvent, group: string, column: string) => void;
  toggleContractorDetails?: (key: string) => void;
  openContractorTask?: (taskIndex: number) => void;
  editContractor?: (key: string) => Promise<void> | void;
  deleteContractor?: (key: string) => Promise<void> | void;
  openContractorActModal?: (prefillSupplier?: string, contractPath?: string) => Promise<void> | void;
  openContractorPaymentModal?: (contractPath?: string, actPath?: string) => Promise<void> | void;
  editContractorAct?: (path: string) => Promise<void> | void;
  deleteContractorAct?: (path: string) => Promise<void> | void;
  editContractorPayment?: (path: string) => Promise<void> | void;
  deleteContractorPayment?: (path: string) => Promise<void> | void;
  printPaymentRegister?: (id: string) => void;
  exportPaymentRegister?: (id: string, type: string) => void;
  deletePaymentRegister?: (id: string) => Promise<void> | void;
  _contractorSuppressHeaderClick?: boolean;
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

export function onContractorSearch(query: string): void {
  getContractorSurfaceWindow().onContractorSearch?.(query);
}

export function clearContractorSearch(): void {
  getContractorSurfaceWindow().clearContractorSearch?.();
}

export function resetContractorFilters(): void {
  getContractorSurfaceWindow().resetContractorFilters?.();
}

export function toggleContractorSelectionMode(): void {
  getContractorSurfaceWindow().toggleContractorSelectionMode?.();
}

export function clearContractorSelection(): void {
  getContractorSurfaceWindow().clearContractorSelection?.();
}

export async function deleteSelectedContractorsFromSurface(): Promise<void> {
  await Promise.resolve(getContractorSurfaceWindow().deleteSelectedContractors?.());
}

export function toggleAllVisibleContractors(checked: boolean): void {
  getContractorSurfaceWindow().toggleAllVisibleContractors?.(checked);
}

export function toggleContractorSelection(key: string, checked: boolean): void {
  getContractorSurfaceWindow().toggleContractorSelection?.(key, checked);
}

export function sortContractors(column: string): void {
  if (getContractorSurfaceWindow()._contractorSuppressHeaderClick) return;
  getContractorSurfaceWindow().sortContractors?.(column);
}

export function sortContractorDetails(group: string, column: string): void {
  if (getContractorSurfaceWindow()._contractorSuppressHeaderClick) return;
  getContractorSurfaceWindow().sortContractorDetails?.(group, column);
}

export function startContractorColResize(event: MouseEvent, column: string): void {
  getContractorSurfaceWindow().startContractorColResize?.(event, column);
}

export function startContractorDetailColResize(event: MouseEvent, group: string, column: string): void {
  getContractorSurfaceWindow().startContractorDetailColResize?.(event, group, column);
}

export function toggleContractorDetails(key: string): void {
  getContractorSurfaceWindow().toggleContractorDetails?.(key);
}

export function openContractorTask(taskIndex: number): void {
  getContractorSurfaceWindow().openContractorTask?.(taskIndex);
}

export async function editContractor(key: string): Promise<void> {
  await Promise.resolve(getContractorSurfaceWindow().editContractor?.(key));
}

export async function deleteContractor(key: string): Promise<void> {
  await Promise.resolve(getContractorSurfaceWindow().deleteContractor?.(key));
}

export async function openContractorActModal(prefillSupplier: string, contractPath: string): Promise<void> {
  await Promise.resolve(getContractorSurfaceWindow().openContractorActModal?.(prefillSupplier, contractPath));
}

export async function openContractorPaymentModal(contractPath: string, actPath: string): Promise<void> {
  await Promise.resolve(getContractorSurfaceWindow().openContractorPaymentModal?.(contractPath, actPath));
}

export async function editContractorAct(path: string): Promise<void> {
  await Promise.resolve(getContractorSurfaceWindow().editContractorAct?.(path));
}

export async function deleteContractorAct(path: string): Promise<void> {
  await Promise.resolve(getContractorSurfaceWindow().deleteContractorAct?.(path));
}

export async function editContractorPayment(path: string): Promise<void> {
  await Promise.resolve(getContractorSurfaceWindow().editContractorPayment?.(path));
}

export async function deleteContractorPayment(path: string): Promise<void> {
  await Promise.resolve(getContractorSurfaceWindow().deleteContractorPayment?.(path));
}

export function printPaymentRegister(id: string): void {
  getContractorSurfaceWindow().printPaymentRegister?.(id);
}

export function exportPaymentRegister(id: string, type: string): void {
  getContractorSurfaceWindow().exportPaymentRegister?.(id, type);
}

export async function deletePaymentRegister(id: string): Promise<void> {
  await Promise.resolve(getContractorSurfaceWindow().deletePaymentRegister?.(id));
}
