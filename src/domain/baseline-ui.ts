export interface BaselinePanelModel {
  hasBaseline: boolean;
  savedLabel: string;
  toggleLabel: string;
  saveActionLabel: string;
  deleteActionLabel: string;
  emptyHint: string;
  showBaseline: boolean;
}

export function buildBaselinePanelModel(options: {
  hasBaseline: boolean;
  baselineDate?: string | null;
  showBaseline: boolean;
}): BaselinePanelModel {
  const savedDate = options.baselineDate || "-";
  return {
    hasBaseline: options.hasBaseline,
    savedLabel: `Saved: ${savedDate}`,
    toggleLabel: options.showBaseline ? "Hide" : "Show",
    saveActionLabel: options.hasBaseline ? "Overwrite" : "Save baseline",
    deleteActionLabel: "Delete",
    emptyHint: "Baseline is not saved yet. Save the current task positions to compare plan vs actual later.",
    showBaseline: options.showBaseline,
  };
}
