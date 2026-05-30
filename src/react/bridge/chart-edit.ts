import { z } from "zod";
import type { ChartEditSnapshot } from "../types";

const snapshotSchema: z.ZodType<ChartEditSnapshot> = z.object({
  visible: z.boolean(),
  chartId: z.string(),
  form: z.object({
    type: z.string(),
    xKey: z.string(),
    yKey: z.string(),
    category: z.string(),
    status: z.string(),
  }),
  categoryOptionsHtml: z.string(),
  labels: z.object({
    title: z.string(),
    typeLabel: z.string(),
    xAxisLabel: z.string(),
    yAxisLabel: z.string(),
    categoryLabel: z.string(),
    statusLabel: z.string(),
    cancelButton: z.string(),
    applyButton: z.string(),
  }),
  capturedAt: z.string(),
});

type ChartEditWindow = Window & {
  getChartEditBridgeSnapshot?: () => unknown;
};

function getChartEditWindow(): ChartEditWindow {
  return window as ChartEditWindow;
}

function buildFallbackSnapshot(): ChartEditSnapshot {
  return {
    visible: false,
    chartId: "",
    form: {
      type: "bar",
      xKey: "cat",
      yKey: "count",
      category: "",
      status: "",
    },
    categoryOptionsHtml: '<option value="">Усі</option>',
    labels: {
      title: "Редагувати графік",
      typeLabel: "Тип",
      xAxisLabel: "Вісь X / групування",
      yAxisLabel: "Показник Y",
      categoryLabel: "Категорія",
      statusLabel: "Статус",
      cancelButton: "Скасувати",
      applyButton: "Оновити",
    },
    capturedAt: new Date().toISOString(),
  };
}

export function readChartEditSnapshot(): ChartEditSnapshot {
  const parsed = snapshotSchema.safeParse(getChartEditWindow().getChartEditBridgeSnapshot?.());
  return parsed.success ? parsed.data : buildFallbackSnapshot();
}

export function subscribeChartEditSync(onSync: () => void): () => void {
  const handler = () => onSync();
  document.addEventListener("plan-master:chart-edit-sync", handler);
  return () => document.removeEventListener("plan-master:chart-edit-sync", handler);
}
