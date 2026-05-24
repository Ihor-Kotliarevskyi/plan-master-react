type PaymentRegisterRuntime = Window & {
  openPaymentRegisterModal?: () => void;
  closePaymentRegisterModal?: () => void;
  createPaymentRegisterFromFilters?: () => Promise<void> | void;
  exportCurrentPaymentRegister?: (type: string) => void;
  printCurrentPaymentRegister?: () => void;
  closeContractorToolsMenu?: () => void;
};

const paymentRegisterRuntime = window as PaymentRegisterRuntime;

async function handlePaymentRegisterAction(action: string, element?: HTMLElement): Promise<void> {
  switch (action) {
    case "open-modal":
      paymentRegisterRuntime.openPaymentRegisterModal?.();
      paymentRegisterRuntime.closeContractorToolsMenu?.();
      return;
    case "close-modal":
      paymentRegisterRuntime.closePaymentRegisterModal?.();
      return;
    case "create-from-filters":
      await Promise.resolve(paymentRegisterRuntime.createPaymentRegisterFromFilters?.());
      return;
    case "export-current":
      paymentRegisterRuntime.exportCurrentPaymentRegister?.(element?.dataset.exportType || "xlsx");
      return;
    case "print-current":
      paymentRegisterRuntime.printCurrentPaymentRegister?.();
      return;
    default:
      return;
  }
}

function initPaymentRegisterIsland(): void {
  const openButton = document.querySelector<HTMLElement>("[data-payment-register-action='open-modal']");
  const modal = document.getElementById("payment-register-modal");

  openButton?.addEventListener("click", async () => {
    await handlePaymentRegisterAction("open-modal");
  });

  modal?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    if (target === modal) {
      paymentRegisterRuntime.closePaymentRegisterModal?.();
      return;
    }

    const actionElement = target.closest<HTMLElement>("[data-payment-register-action]");
    if (!actionElement) return;
    await handlePaymentRegisterAction(actionElement.dataset.paymentRegisterAction || "", actionElement);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPaymentRegisterIsland, { once: true });
} else {
  initPaymentRegisterIsland();
}

export {};
