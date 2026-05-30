import { z } from "zod";
import type { ContractorDialogSnapshot, ContractorDialogSubmitPayload } from "../types";

const snapshotSchema: z.ZodType<ContractorDialogSnapshot> = z.object({
  visible: z.boolean(),
  mode: z.union([z.literal("act-add"), z.literal("act-edit"), z.literal("payment-add"), z.literal("payment-edit")]),
  editPath: z.string(),
  supplier: z.string(),
  selectedContractId: z.string(),
  selectedActValue: z.string(),
  actType: z.string(),
  actName: z.string(),
  date: z.string(),
  amount: z.string(),
  itemName: z.string(),
  note: z.string(),
  contracts: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      itemName: z.string(),
      acts: z.array(
        z.object({
          value: z.string(),
          label: z.string(),
        }),
      ),
    }),
  ),
    labels: z.object({
    actTitle: z.string(),
    paymentTitle: z.string(),
    editActTitle: z.string(),
    editPaymentTitle: z.string(),
    contractLabel: z.string(),
    actTypeLabel: z.string(),
    actNumberLabel: z.string(),
    dateLabel: z.string(),
    amountLabel: z.string(),
    itemNameLabel: z.string(),
    paymentDateLabel: z.string(),
    paymentAmountLabel: z.string(),
    paymentActLabel: z.string(),
    noteLabel: z.string(),
    cancelButton: z.string(),
    saveButton: z.string(),
    actNameValidation: z.string(),
    actAmountValidation: z.string(),
    paymentAmountValidation: z.string(),
  }),
  actTypeOptions: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
    }),
  ),
  capturedAt: z.string(),
});

type ContractorDialogWindow = Window & {
  getContractorDialogBridgeSnapshot?: () => unknown;
  closeReactContractorDialog?: () => void;
  submitReactContractorDialog?: (
    payload: ContractorDialogSubmitPayload,
  ) => Promise<{ ok: boolean; error?: string }> | { ok: boolean; error?: string };
};

function getContractorDialogWindow(): ContractorDialogWindow {
  return window as ContractorDialogWindow;
}

function buildFallbackSnapshot(): ContractorDialogSnapshot {
  return {
    visible: false,
    mode: "act-add",
    editPath: "",
    supplier: "",
    selectedContractId: "",
    selectedActValue: "",
    actType: "contract",
    actName: "",
    date: "",
    amount: "",
    itemName: "",
    note: "",
    contracts: [],
    labels: {
      actTitle: "",
      paymentTitle: "",
      editActTitle: "",
      editPaymentTitle: "",
      contractLabel: "",
      actTypeLabel: "",
      actNumberLabel: "",
      dateLabel: "",
      amountLabel: "",
      itemNameLabel: "",
      paymentDateLabel: "",
      paymentAmountLabel: "",
      paymentActLabel: "",
      noteLabel: "",
      cancelButton: "Скасувати",
      saveButton: "Зберегти",
      actNameValidation: "",
      actAmountValidation: "",
      paymentAmountValidation: "",
    },
    actTypeOptions: [],
    capturedAt: new Date().toISOString(),
  };
}

export function readContractorDialogSnapshot(): ContractorDialogSnapshot {
  const parsed = snapshotSchema.safeParse(getContractorDialogWindow().getContractorDialogBridgeSnapshot?.());
  return parsed.success ? parsed.data : buildFallbackSnapshot();
}

export function subscribeContractorDialogSync(onSync: () => void): () => void {
  const handler = () => onSync();
  document.addEventListener("plan-master:contractor-dialog-sync", handler);
  return () => document.removeEventListener("plan-master:contractor-dialog-sync", handler);
}

export function closeContractorDialog(): void {
  getContractorDialogWindow().closeReactContractorDialog?.();
}

export async function submitContractorDialog(payload: ContractorDialogSubmitPayload) {
  return getContractorDialogWindow().submitReactContractorDialog?.(payload);
}
