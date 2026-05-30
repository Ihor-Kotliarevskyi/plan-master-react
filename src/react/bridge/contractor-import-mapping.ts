import { z } from "zod";
import type {
  ContractorImportMappingSnapshot,
  ContractorImportMappingSubmitPayload,
} from "../types";

const snapshotSchema: z.ZodType<ContractorImportMappingSnapshot> = z.object({
  visible: z.boolean(),
  fields: z.array(
    z.object({
      field: z.string(),
      label: z.string(),
      column: z.string(),
      examplesHtml: z.string(),
    }),
  ),
  columns: z.array(z.string()),
  defaultTaskId: z.string(),
  defaultTaskOptions: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
    }),
  ),
  labels: z.object({
    title: z.string(),
    defaultTaskLabel: z.string(),
    projectFieldHeader: z.string(),
    fileColumnHeader: z.string(),
    examplesHeader: z.string(),
    continueButton: z.string(),
    cancelButton: z.string(),
    noImportOption: z.string(),
  }),
  capturedAt: z.string(),
});

type ContractorImportMappingWindow = Window & {
  getContractorImportMappingBridgeSnapshot?: () => unknown;
  closeReactContractorImportMapping?: (result?: null) => void;
  submitReactContractorImportMapping?: (payload: ContractorImportMappingSubmitPayload) => void;
};

function getWindowState(): ContractorImportMappingWindow {
  return window as ContractorImportMappingWindow;
}

function buildFallbackSnapshot(): ContractorImportMappingSnapshot {
  return {
    visible: false,
    fields: [],
    columns: [],
    defaultTaskId: "",
    defaultTaskOptions: [],
    labels: {
      title: "",
      defaultTaskLabel: "",
      projectFieldHeader: "",
      fileColumnHeader: "",
      examplesHeader: "",
      continueButton: "Continue",
      cancelButton: "Cancel",
      noImportOption: "",
    },
    capturedAt: new Date().toISOString(),
  };
}

export function readContractorImportMappingSnapshot(): ContractorImportMappingSnapshot {
  const parsed = snapshotSchema.safeParse(getWindowState().getContractorImportMappingBridgeSnapshot?.());
  return parsed.success ? parsed.data : buildFallbackSnapshot();
}

export function subscribeContractorImportMappingSync(onSync: () => void): () => void {
  const handler = () => onSync();
  document.addEventListener("plan-master:contractor-import-mapping-sync", handler);
  return () => document.removeEventListener("plan-master:contractor-import-mapping-sync", handler);
}

export function closeContractorImportMapping(): void {
  getWindowState().closeReactContractorImportMapping?.(null);
}

export function submitContractorImportMapping(payload: ContractorImportMappingSubmitPayload): void {
  getWindowState().submitReactContractorImportMapping?.(payload);
}
