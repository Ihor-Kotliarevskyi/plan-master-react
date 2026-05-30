import { z } from "zod";
import type { PrintDialogSnapshot } from "../types";

const snapshotSchema: z.ZodType<PrintDialogSnapshot> = z.object({
  visible: z.boolean(),
  previewHtml: z.string(),
  previewMeta: z.string(),
  chartListHtml: z.string(),
  controls: z.object({
    gantt: z.boolean(),
    finance: z.boolean(),
    charts: z.boolean(),
    range: z.string(),
    paper: z.string(),
    orientation: z.string(),
    scale: z.string(),
    fit: z.string(),
    margin: z.string(),
    quality: z.string(),
  }),
  chartPickerVisible: z.boolean(),
  navigation: z.object({
    prevDisabled: z.boolean(),
    nextDisabled: z.boolean(),
  }),
  labels: z.object({
    title: z.string(),
    includeSectionTitle: z.string(),
    ganttLabel: z.string(),
    ganttHint: z.string(),
    financeLabel: z.string(),
    financeHint: z.string(),
    chartsLabel: z.string(),
    chartsHint: z.string(),
    chartPickerLabel: z.string(),
    settingsSectionTitle: z.string(),
    formatLabel: z.string(),
    orientationLabel: z.string(),
    scaleLabel: z.string(),
    fitLabel: z.string(),
    marginLabel: z.string(),
    qualityLabel: z.string(),
    cancelButton: z.string(),
    printButton: z.string(),
    exportButton: z.string(),
    prevTitle: z.string(),
    nextTitle: z.string(),
  }),
  capturedAt: z.string(),
});

type PrintDialogWindow = Window & {
  getPrintDialogBridgeSnapshot?: () => unknown;
};

function getPrintDialogWindow(): PrintDialogWindow {
  return window as PrintDialogWindow;
}

function buildFallbackSnapshot(): PrintDialogSnapshot {
  return {
    visible: false,
    previewHtml: "",
    previewMeta: "",
    chartListHtml: "",
    controls: {
      gantt: true,
      finance: false,
      charts: false,
      range: "all",
      paper: "a3",
      orientation: "landscape",
      scale: "1",
      fit: "paginate",
      margin: "5",
      quality: "1",
    },
    chartPickerVisible: false,
    navigation: {
      prevDisabled: true,
      nextDisabled: true,
    },
    labels: {
      title: "Друк та експорт PDF",
      includeSectionTitle: "Що включити",
      ganttLabel: "Діаграма Ганта",
      ganttHint: "Таблиця з барами",
      financeLabel: "Фінанси",
      financeHint: "Зведення + таблиця задач",
      chartsLabel: "Графіки аналітики",
      chartsHint: "Вибрати конкретні графіки нижче",
      chartPickerLabel: "Які графіки включити",
      settingsSectionTitle: "Налаштування сторінки",
      formatLabel: "Формат",
      orientationLabel: "Орієнтація",
      scaleLabel: "Масштаб",
      fitLabel: "Вміщення",
      marginLabel: "Поля",
      qualityLabel: "Якість PDF",
      cancelButton: "Скасувати",
      printButton: "Друк",
      exportButton: "Зберегти PDF",
      prevTitle: "Попередня сторінка",
      nextTitle: "Наступна сторінка",
    },
    capturedAt: new Date().toISOString(),
  };
}

export function readPrintDialogSnapshot(): PrintDialogSnapshot {
  const parsed = snapshotSchema.safeParse(getPrintDialogWindow().getPrintDialogBridgeSnapshot?.());
  return parsed.success ? parsed.data : buildFallbackSnapshot();
}

export function subscribePrintDialogSync(onSync: () => void): () => void {
  const handler = () => onSync();
  document.addEventListener("plan-master:print-dialog-sync", handler);
  return () => document.removeEventListener("plan-master:print-dialog-sync", handler);
}
