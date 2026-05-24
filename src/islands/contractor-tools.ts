type ContractorToolsRuntime = Window & {
  toggleContractorToolsMenu?: () => void;
  closeContractorToolsMenu?: () => void;
  exportContractorImportTemplate?: () => void;
  importContractorTable?: (event: Event) => void;
  deleteSelectedContractors?: () => Promise<void> | void;
  deleteVisibleContractors?: () => Promise<void> | void;
};

const contractorToolsRuntime = window as ContractorToolsRuntime;

async function handleContractorToolsAction(action: string): Promise<void> {
  switch (action) {
    case "toggle-menu":
      contractorToolsRuntime.toggleContractorToolsMenu?.();
      return;
    case "export-template":
      contractorToolsRuntime.exportContractorImportTemplate?.();
      contractorToolsRuntime.closeContractorToolsMenu?.();
      return;
    case "delete-selected":
      await Promise.resolve(contractorToolsRuntime.deleteSelectedContractors?.());
      contractorToolsRuntime.closeContractorToolsMenu?.();
      return;
    case "delete-visible":
      await Promise.resolve(contractorToolsRuntime.deleteVisibleContractors?.());
      contractorToolsRuntime.closeContractorToolsMenu?.();
      return;
    default:
      return;
  }
}

function initContractorToolsIsland(): void {
  const menu = document.getElementById("contractor-tools-menu");
  const importInput = menu?.querySelector<HTMLInputElement>("[data-contractor-tools-input='import-file']");

  menu?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const actionElement = target.closest<HTMLElement>("[data-contractor-tools-action]");
    if (!actionElement) return;

    event.preventDefault();
    event.stopPropagation();
    await handleContractorToolsAction(actionElement.dataset.contractorToolsAction || "");
  });

  importInput?.addEventListener("change", (event) => {
    contractorToolsRuntime.importContractorTable?.(event);
    contractorToolsRuntime.closeContractorToolsMenu?.();
  });

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (target.closest("#contractor-tools-menu")) return;
    contractorToolsRuntime.closeContractorToolsMenu?.();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initContractorToolsIsland, { once: true });
} else {
  initContractorToolsIsland();
}

export {};
