type CostEditorRuntime = Window & {
  setCostField?: (id: number, field: string, value: string | number) => void;
  setCostContractNo?: (id: number, value: string) => void;
  toggleCostPayments?: (id: number) => void;
  deleteCostItem?: (id: number) => void;
  addPayment?: (itemId: number) => void;
  setPayField?: (itemId: number, paymentIndex: number, field: string, value: string | number) => void;
  deletePayment?: (itemId: number, paymentIndex: number) => void;
  _recalcRow?: (id: number) => void;
  _refreshTotals?: () => void;
};

const runtime = window as CostEditorRuntime;

function getItemId(element: HTMLElement): number {
  return Number(element.dataset.itemId || -1);
}

function getPaymentIndex(element: HTMLElement): number {
  return Number(element.dataset.paymentIndex || -1);
}

function handleCostEditorAction(action: string, element: HTMLElement): void {
  const itemId = getItemId(element);
  switch (action) {
    case "toggle-payments":
      runtime.toggleCostPayments?.(itemId);
      return;
    case "delete-item":
      runtime.deleteCostItem?.(itemId);
      return;
    case "add-payment":
      runtime.addPayment?.(itemId);
      return;
    case "delete-payment":
      runtime.deletePayment?.(itemId, getPaymentIndex(element));
      return;
    default:
      return;
  }
}

function applyCostEditorChange(inputType: string, element: HTMLInputElement | HTMLSelectElement): void {
  const itemId = getItemId(element);
  const paymentIndex = getPaymentIndex(element);

  switch (inputType) {
    case "item-type":
      runtime.setCostField?.(itemId, "type", element.value);
      runtime._recalcRow?.(itemId);
      return;
    case "payment-date":
      runtime.setPayField?.(itemId, paymentIndex, "date", element.value);
      return;
    case "payment-type":
      runtime.setPayField?.(itemId, paymentIndex, "type", element.value);
      return;
    default:
      return;
  }
}

function applyCostEditorBlur(inputType: string, element: HTMLInputElement): void {
  const itemId = getItemId(element);
  const paymentIndex = getPaymentIndex(element);

  switch (inputType) {
    case "contract-no":
      runtime.setCostContractNo?.(itemId, element.value);
      return;
    case "supplier":
      runtime.setCostField?.(itemId, "supplier", element.value);
      return;
    case "unit-price":
      runtime.setCostField?.(itemId, "unitPrice", Number(element.value || 0));
      runtime._recalcRow?.(itemId);
      return;
    case "contract-note":
      runtime.setCostField?.(itemId, "contractNote", element.value);
      return;
    case "payment-amount":
      runtime.setPayField?.(itemId, paymentIndex, "amount", Number(element.value || 0));
      runtime._refreshTotals?.();
      return;
    case "payment-note":
      runtime.setPayField?.(itemId, paymentIndex, "note", element.value);
      return;
    default:
      return;
  }
}

function initCostEditorIsland(): void {
  const modal = document.getElementById("modal");
  if (!modal) return;

  modal.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const actionElement = target?.closest<HTMLElement>("[data-cost-editor-action]");
    if (!actionElement) return;
    handleCostEditorAction(actionElement.dataset.costEditorAction || "", actionElement);
  });

  modal.addEventListener("change", (event) => {
    const target = event.target as HTMLInputElement | HTMLSelectElement | null;
    if (!target) return;
    const inputType = target.dataset.costEditorInput || "";
    if (!inputType) return;
    applyCostEditorChange(inputType, target);
  });

  modal.addEventListener("focusout", (event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    const inputType = target.dataset.costEditorInput || "";
    if (!inputType) return;
    applyCostEditorBlur(inputType, target);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCostEditorIsland, { once: true });
} else {
  initCostEditorIsland();
}

export {};
