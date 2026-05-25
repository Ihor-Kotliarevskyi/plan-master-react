type ContractorDialogsRuntime = Window & {
  syncPaymentEditActs?: (supplier: string, taskIndex?: number | null) => void;
  syncPaymentAddActs?: (supplier: string) => void;
};

const runtime = window as ContractorDialogsRuntime;

function initContractorDialogsIsland(): void {
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const actionElement = target?.closest<HTMLElement>("[data-contractor-dialog-action]");
    if (!actionElement) return;

    const action = actionElement.dataset.contractorDialogAction || "";
    if (action === "toggle-edit-row-delete") {
      actionElement.closest(".contractor-edit-row")?.classList.toggle("marked-delete");
      return;
    }
    if (action === "toggle-contract-row-delete") {
      actionElement.closest(".contractor-contract-row")?.classList.toggle("marked-delete");
    }
  });

  document.addEventListener("change", (event) => {
    const target = event.target as HTMLInputElement | HTMLSelectElement | null;
    if (!target) return;
    const inputType = target.dataset.contractorDialogInput || "";

    if (inputType === "sync-payment-edit-acts") {
      runtime.syncPaymentEditActs?.(target.dataset.supplier || "");
      return;
    }

    if (inputType === "sync-payment-add-acts") {
      runtime.syncPaymentAddActs?.(target.dataset.supplier || "");
      return;
    }

    if (inputType === "sync-act-contract-item") {
      const selectedOption = target instanceof HTMLSelectElement
        ? target.selectedOptions?.[0]
        : null;
      const nextItemName = selectedOption?.dataset.itemName || "";
      const itemNameInput = document.getElementById("act-item-name") as HTMLInputElement | null;
      if (itemNameInput && nextItemName) itemNameInput.value = nextItemName;
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initContractorDialogsIsland, { once: true });
} else {
  initContractorDialogsIsland();
}

export {};
