import { z } from "zod";
import type { PaymentRegisterSnapshot } from "../types";

const snapshotSchema: z.ZodType<PaymentRegisterSnapshot> = z.object({
  visible: z.boolean(),
  currentHtml: z.string(),
  listHtml: z.string(),
  labels: z.object({
    title: z.string(),
    createButton: z.string(),
    exportXlsxButton: z.string(),
    exportCsvButton: z.string(),
    printButton: z.string(),
  }),
  capturedAt: z.string(),
});

type PaymentRegisterWindow = Window & {
  getPaymentRegisterBridgeSnapshot?: () => unknown;
};

function getPaymentRegisterWindow(): PaymentRegisterWindow {
  return window as PaymentRegisterWindow;
}

function buildFallbackSnapshot(): PaymentRegisterSnapshot {
  return {
    visible: false,
    currentHtml: "",
    listHtml: "",
    labels: {
      title: "Реєстри платежів",
      createButton: "Сформувати з поточного фільтра",
      exportXlsxButton: "Поточний XLSX",
      exportCsvButton: "Поточний CSV",
      printButton: "Друк поточного",
    },
    capturedAt: new Date().toISOString(),
  };
}

export function readPaymentRegisterSnapshot(): PaymentRegisterSnapshot {
  const parsed = snapshotSchema.safeParse(getPaymentRegisterWindow().getPaymentRegisterBridgeSnapshot?.());
  return parsed.success ? parsed.data : buildFallbackSnapshot();
}

export function subscribePaymentRegisterSync(onSync: () => void): () => void {
  const handler = () => onSync();
  document.addEventListener("plan-master:payment-register-sync", handler);
  return () => document.removeEventListener("plan-master:payment-register-sync", handler);
}
