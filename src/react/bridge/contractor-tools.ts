type ContractorToolsWindow = Window & {
  toggleContractorToolsMenu?: () => void;
  closeContractorToolsMenu?: () => void;
  exportContractorImportTemplate?: () => void;
  importContractorTable?: (event: Event) => void;
  deleteSelectedContractors?: () => Promise<void> | void;
  deleteVisibleContractors?: () => Promise<void> | void;
};

function getContractorToolsWindow(): ContractorToolsWindow {
  return window as ContractorToolsWindow;
}

export function toggleContractorToolsMenu(): void {
  getContractorToolsWindow().toggleContractorToolsMenu?.();
}

export function closeContractorToolsMenu(): void {
  getContractorToolsWindow().closeContractorToolsMenu?.();
}

export function exportContractorImportTemplate(): void {
  getContractorToolsWindow().exportContractorImportTemplate?.();
  getContractorToolsWindow().closeContractorToolsMenu?.();
}

export function importContractorTable(event: Event): void {
  getContractorToolsWindow().importContractorTable?.(event);
  getContractorToolsWindow().closeContractorToolsMenu?.();
}

export async function deleteSelectedContractors(): Promise<void> {
  await Promise.resolve(getContractorToolsWindow().deleteSelectedContractors?.());
  getContractorToolsWindow().closeContractorToolsMenu?.();
}

export async function deleteVisibleContractors(): Promise<void> {
  await Promise.resolve(getContractorToolsWindow().deleteVisibleContractors?.());
  getContractorToolsWindow().closeContractorToolsMenu?.();
}
