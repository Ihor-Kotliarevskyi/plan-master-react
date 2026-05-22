export interface StorageUiModel {
  offlineIndicatorText: string;
}

export function buildStorageUiModel(): StorageUiModel {
  return {
    offlineIndicatorText: "⚠ офлайн — зміни збережено локально",
  };
}
