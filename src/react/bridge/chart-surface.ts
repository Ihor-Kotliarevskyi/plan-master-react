import { z } from "zod";
import type { ChartSurfaceSnapshot } from "../types";

const snapshotSchema: z.ZodType<ChartSurfaceSnapshot> = z.object({
  mounted: z.boolean(),
  form: z.object({
    type: z.string(),
    xKey: z.string(),
    yKey: z.string(),
    category: z.string(),
    status: z.string(),
  }),
  categoryOptionsHtml: z.string(),
  chartCount: z.number(),
  labels: z.object({
    typeLabel: z.string(),
    xAxisLabel: z.string(),
    yAxisLabel: z.string(),
    categoryLabel: z.string(),
    statusLabel: z.string(),
    buildButton: z.string(),
  }),
  capturedAt: z.string(),
});

type ChartSurfaceWindow = Window & {
  getChartSurfaceBridgeSnapshot?: () => unknown;
};

function getChartSurfaceWindow(): ChartSurfaceWindow {
  return window as ChartSurfaceWindow;
}

function buildFallbackSnapshot(): ChartSurfaceSnapshot {
  return {
    mounted: false,
    form: {
      type: "bar",
      xKey: "cat",
      yKey: "count",
      category: "",
      status: "",
    },
    categoryOptionsHtml: '<option value="">Усі</option>',
    chartCount: 0,
    labels: {
      typeLabel: "Тип",
      xAxisLabel: "Вісь X / групування",
      yAxisLabel: "Показник Y",
      categoryLabel: "Категорія",
      statusLabel: "Статус",
      buildButton: "+ Побудувати",
    },
    capturedAt: new Date().toISOString(),
  };
}

export function readChartSurfaceSnapshot(): ChartSurfaceSnapshot {
  const parsed = snapshotSchema.safeParse(getChartSurfaceWindow().getChartSurfaceBridgeSnapshot?.());
  return parsed.success ? parsed.data : buildFallbackSnapshot();
}

export function subscribeChartSurfaceSync(onSync: () => void): () => void {
  const handler = () => onSync();
  document.addEventListener("plan-master:chart-surface-sync", handler);
  return () => document.removeEventListener("plan-master:chart-surface-sync", handler);
}
