type PrintDialogRuntime = Window & {
  openPrintDialog?: () => void;
  closePrintDialog?: () => void;
  changePrintPreviewPage?: (delta: number) => void;
  doPrint?: () => Promise<void> | void;
  doExportPDF?: () => Promise<void> | void;
  closeToolsMenu?: () => void;
};

const runtime = window as PrintDialogRuntime;

async function handlePrintAction(action: string, element: HTMLElement): Promise<void> {
  switch (action) {
    case "open-dialog":
      runtime.openPrintDialog?.();
      runtime.closeToolsMenu?.();
      return;
    case "close-dialog":
      runtime.closePrintDialog?.();
      return;
    case "prev-page":
      runtime.changePrintPreviewPage?.(-1);
      return;
    case "next-page":
      runtime.changePrintPreviewPage?.(1);
      return;
    case "do-print":
      await Promise.resolve(runtime.doPrint?.());
      return;
    case "export-pdf":
      await Promise.resolve(runtime.doExportPDF?.());
      return;
    default:
      return;
  }
}

function initPrintDialogIsland(): void {
  const modal = document.getElementById("print-modal");
  const printOpenButtons = document.querySelectorAll<HTMLElement>("[data-print-action='open-dialog']");

  printOpenButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await handlePrintAction("open-dialog", button);
    });
  });

  modal?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (target === modal) {
      runtime.closePrintDialog?.();
      return;
    }
    const actionElement = target.closest<HTMLElement>("[data-print-action]");
    if (!actionElement) return;
    await handlePrintAction(actionElement.dataset.printAction || "", actionElement);
  });

}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPrintDialogIsland, { once: true });
} else {
  initPrintDialogIsland();
}

export {};
