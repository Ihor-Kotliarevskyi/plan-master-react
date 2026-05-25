type ContractorSurfaceRuntime = Window & {
  onContractorSearch?: (query: string) => void;
  clearContractorSearch?: () => void;
  resetContractorFilters?: () => void;
  toggleContractorSelectionMode?: () => void;
  clearContractorSelection?: () => void;
  deleteSelectedContractors?: () => Promise<void> | void;
  toggleAllVisibleContractors?: (checked: boolean) => void;
  toggleContractorSelection?: (key: string, checked: boolean) => void;
  sortContractors?: (column: string) => void;
  sortContractorDetails?: (group: string, column: string) => void;
  startContractorColResize?: (event: MouseEvent, column: string) => void;
  startContractorDetailColResize?: (event: MouseEvent, group: string, column: string) => void;
  toggleContractorDetails?: (key: string) => void;
  openContractorTask?: (taskIndex: number) => void;
  editContractor?: (key: string) => Promise<void> | void;
  deleteContractor?: (key: string) => Promise<void> | void;
  openContractorActModal?: (prefillSupplier?: string, contractPath?: string) => Promise<void> | void;
  openContractorPaymentModal?: (contractPath?: string, actPath?: string) => Promise<void> | void;
  editContractorAct?: (path: string) => Promise<void> | void;
  deleteContractorAct?: (path: string) => Promise<void> | void;
  editContractorPayment?: (path: string) => Promise<void> | void;
  deleteContractorPayment?: (path: string) => Promise<void> | void;
  printPaymentRegister?: (id: string) => void;
  exportPaymentRegister?: (id: string, type: string) => void;
  deletePaymentRegister?: (id: string) => Promise<void> | void;
  _contractorSuppressHeaderClick?: boolean;
};

const runtime = window as ContractorSurfaceRuntime;

async function handleSurfaceAction(action: string, element: HTMLElement): Promise<void> {
  switch (action) {
    case "clear-search":
      runtime.clearContractorSearch?.();
      return;
    case "reset-filters":
      runtime.resetContractorFilters?.();
      return;
    case "toggle-selection-mode":
      runtime.toggleContractorSelectionMode?.();
      return;
    case "clear-selection":
      runtime.clearContractorSelection?.();
      return;
    case "delete-selected":
      await Promise.resolve(runtime.deleteSelectedContractors?.());
      return;
    case "sort-main-col":
      if (runtime._contractorSuppressHeaderClick) return;
      runtime.sortContractors?.(element.dataset.colKey || "");
      return;
    case "sort-detail-col":
      if (runtime._contractorSuppressHeaderClick) return;
      runtime.sortContractorDetails?.(element.dataset.detailGroup || "", element.dataset.colKey || "");
      return;
    case "toggle-details":
      runtime.toggleContractorDetails?.(element.dataset.rowKey || "");
      return;
    case "open-task":
      runtime.openContractorTask?.(Number(element.dataset.taskIndex || -1));
      return;
    case "edit-contractor":
      await Promise.resolve(runtime.editContractor?.(element.dataset.rowKey || ""));
      return;
    case "delete-contractor":
      await Promise.resolve(runtime.deleteContractor?.(element.dataset.rowKey || ""));
      return;
    case "open-act-modal":
      await Promise.resolve(runtime.openContractorActModal?.("", element.dataset.contractPath || ""));
      return;
    case "open-payment-modal":
      await Promise.resolve(
        runtime.openContractorPaymentModal?.(element.dataset.contractPath || "", element.dataset.actPath || ""),
      );
      return;
    case "edit-act":
      await Promise.resolve(runtime.editContractorAct?.(element.dataset.actPath || ""));
      return;
    case "delete-act":
      await Promise.resolve(runtime.deleteContractorAct?.(element.dataset.actPath || ""));
      return;
    case "edit-payment":
      await Promise.resolve(runtime.editContractorPayment?.(element.dataset.paymentPath || ""));
      return;
    case "delete-payment":
      await Promise.resolve(runtime.deleteContractorPayment?.(element.dataset.paymentPath || ""));
      return;
    case "print-register":
      runtime.printPaymentRegister?.(element.dataset.registerId || "");
      return;
    case "export-register":
      runtime.exportPaymentRegister?.(element.dataset.registerId || "", element.dataset.exportType || "xlsx");
      return;
    case "delete-register":
      await Promise.resolve(runtime.deletePaymentRegister?.(element.dataset.registerId || ""));
      return;
    default:
      return;
  }
}

function initContractorSurfaceIsland(): void {
  document.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement | null;
    const actionElement = target?.closest<HTMLElement>("[data-contractor-surface-action]");
    if (!actionElement) return;
    await handleSurfaceAction(actionElement.dataset.contractorSurfaceAction || "", actionElement);
  });

  document.addEventListener("input", (event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    if (target.dataset.contractorSurfaceInput === "search") {
      runtime.onContractorSearch?.(target.value);
    }
  });

  document.addEventListener("change", (event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    const inputType = target.dataset.contractorSurfaceInput || "";
    if (inputType === "toggle-select-all") {
      runtime.toggleAllVisibleContractors?.(!!target.checked);
      return;
    }
    if (inputType === "toggle-selection") {
      runtime.toggleContractorSelection?.(target.dataset.rowKey || "", !!target.checked);
    }
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target || target.dataset.contractorSurfaceInput !== "search") return;
    if (event.key !== "Escape") return;
    runtime.clearContractorSearch?.();
  });

  document.addEventListener("mousedown", (event) => {
    const target = event.target as HTMLElement | null;
    const handle = target?.closest<HTMLElement>("[data-contractor-surface-mousedown]");
    if (!handle) return;
    const action = handle.dataset.contractorSurfaceMousedown || "";
    if (action === "resize-main-col") {
      runtime.startContractorColResize?.(event as MouseEvent, handle.dataset.col || "");
      return;
    }
    if (action === "resize-detail-col") {
      runtime.startContractorDetailColResize?.(
        event as MouseEvent,
        handle.dataset.detailGroup || "",
        handle.dataset.col || "",
      );
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initContractorSurfaceIsland, { once: true });
} else {
  initContractorSurfaceIsland();
}

export {};
