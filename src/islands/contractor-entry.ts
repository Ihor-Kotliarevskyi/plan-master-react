type ContractorEntryRuntime = Window & {
  openContractorEntryModal?: (prefillSupplier?: string, lockSupplier?: boolean) => void;
  closeContractorEntryModal?: () => void;
  addContractorContractRow?: () => void;
  saveContractorEntry?: () => Promise<void> | void;
};

const contractorEntryRuntime = window as ContractorEntryRuntime;

async function handleContractorEntryAction(action: string): Promise<void> {
  switch (action) {
    case "open-modal":
      contractorEntryRuntime.openContractorEntryModal?.();
      return;
    case "close-modal":
      contractorEntryRuntime.closeContractorEntryModal?.();
      return;
    case "add-contract-row":
      contractorEntryRuntime.addContractorContractRow?.();
      return;
    case "save-entry":
      await Promise.resolve(contractorEntryRuntime.saveContractorEntry?.());
      return;
    default:
      return;
  }
}

function initContractorEntryIsland(): void {
  const openButton = document.querySelector<HTMLElement>("[data-contractor-entry-action='open-modal']");
  const modal = document.getElementById("contractor-entry-modal");

  openButton?.addEventListener("click", async () => {
    await handleContractorEntryAction("open-modal");
  });

  modal?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    if (target === modal) {
      contractorEntryRuntime.closeContractorEntryModal?.();
      return;
    }

    const actionElement = target.closest<HTMLElement>("[data-contractor-entry-action]");
    if (!actionElement) return;
    await handleContractorEntryAction(actionElement.dataset.contractorEntryAction || "");
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initContractorEntryIsland, { once: true });
} else {
  initContractorEntryIsland();
}

export {};
