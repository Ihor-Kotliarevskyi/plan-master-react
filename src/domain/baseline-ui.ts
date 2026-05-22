export interface BaselinePanelModel {
  sectionTitle: string;
  hasBaseline: boolean;
  savedLabel: string;
  toggleLabel: string;
  saveActionLabel: string;
  deleteActionLabel: string;
  emptyHint: string;
  showBaseline: boolean;
}

export interface BaselineSavedToastModel {
  title: string;
}

export interface BaselineClearDialogModel {
  title: string;
  text: string;
  confirmButtonText: string;
  cancelButtonText: string;
}

export interface BaselineMissingModel {
  title: string;
  text: string;
}

export function buildBaselinePanelModel(options: {
  hasBaseline: boolean;
  baselineDate?: string | null;
  showBaseline: boolean;
}): BaselinePanelModel {
  const savedDate = options.baselineDate || "-";
  return {
    sectionTitle: "Baseline",
    hasBaseline: options.hasBaseline,
    savedLabel: `Saved: ${savedDate}`,
    toggleLabel: options.showBaseline ? "Hide" : "Show",
    saveActionLabel: options.hasBaseline ? "Overwrite" : "Save baseline",
    deleteActionLabel: "Delete",
    emptyHint: "Baseline is not saved yet. Save the current task positions to compare plan vs actual later.",
    showBaseline: options.showBaseline,
  };
}

export function buildBaselineSavedToastModel(baselineDate: string): BaselineSavedToastModel {
  return {
    title: `Базовий план збережено (${baselineDate})`,
  };
}

export function buildBaselineClearDialogModel(): BaselineClearDialogModel {
  return {
    title: "Очистити базовий план?",
    text: "Ghost-бари зникнуть. Відновити буде неможливо.",
    confirmButtonText: "Очистити",
    cancelButtonText: "Скасувати",
  };
}

export function buildBaselineMissingModel(): BaselineMissingModel {
  return {
    title: "Базовий план не збережено",
    text: "Натисніть «Зберегти базовий план» щоб зафіксувати поточний стан.",
  };
}
