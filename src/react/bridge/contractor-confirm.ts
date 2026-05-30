import { z } from "zod";
import type { ContractorConfirmSnapshot } from "../types";

const snapshotSchema: z.ZodType<ContractorConfirmSnapshot> = z.object({
  visible: z.boolean(),
  title: z.string(),
  messageHtml: z.string(),
  confirmButtonText: z.string(),
  cancelButtonText: z.string(),
  inputLabel: z.string(),
  inputValue: z.string(),
  expectedValue: z.string(),
  errorText: z.string(),
  capturedAt: z.string(),
});

type ContractorConfirmWindow = Window & {
  getContractorConfirmBridgeSnapshot?: () => unknown;
  closeReactContractorConfirm?: (result?: { confirmed: false }) => void;
  submitReactContractorConfirm?: (
    payload: { inputValue: string },
  ) => { ok: boolean; error?: string };
};

function getWindowState(): ContractorConfirmWindow {
  return window as ContractorConfirmWindow;
}

function buildFallbackSnapshot(): ContractorConfirmSnapshot {
  return {
    visible: false,
    title: "",
    messageHtml: "",
    confirmButtonText: "",
    cancelButtonText: "",
    inputLabel: "",
    inputValue: "",
    expectedValue: "",
    errorText: "",
    capturedAt: new Date().toISOString(),
  };
}

export function readContractorConfirmSnapshot(): ContractorConfirmSnapshot {
  const parsed = snapshotSchema.safeParse(getWindowState().getContractorConfirmBridgeSnapshot?.());
  return parsed.success ? parsed.data : buildFallbackSnapshot();
}

export function subscribeContractorConfirmSync(onSync: () => void): () => void {
  const handler = () => onSync();
  document.addEventListener("plan-master:contractor-confirm-sync", handler);
  return () => document.removeEventListener("plan-master:contractor-confirm-sync", handler);
}

export function closeContractorConfirm(): void {
  getWindowState().closeReactContractorConfirm?.({ confirmed: false });
}

export function submitContractorConfirm(inputValue: string) {
  return getWindowState().submitReactContractorConfirm?.({ inputValue });
}
