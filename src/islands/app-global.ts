type AppGlobalRuntime = Window & {
  closeToolsMenu?: () => void;
  closeContractorToolsMenu?: () => void;
  closeModal?: () => void;
  closeProjModal?: () => void;
  closeCatModal?: () => void;
  closeProjMgr?: () => void;
  closeChartEdit?: () => void;
  closeUserModal?: () => void;
  closePhaseModal?: () => void;
  closePrintDialog?: () => void;
  closeNotesModal?: () => void;
  closeCostModal?: () => void;
  closeContractorEntryModal?: () => void;
  closeAuthModal?: () => void;
  saveTask?: () => Promise<void> | void;
  saveProjSettings?: () => Promise<void> | void;
  saveCats?: () => Promise<void> | void;
  applyChartEdit?: () => Promise<void> | void;
  saveContractorEntry?: () => Promise<void> | void;
};

const runtime = window as AppGlobalRuntime;

function isVisible(id: string): boolean {
  const element = document.getElementById(id);
  return !!element && element.style.display !== "none";
}

function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

function initAppGlobalIsland(): void {
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (!target?.closest("#tools-menu")) runtime.closeToolsMenu?.();
    if (!target?.closest("#contractor-tools-menu")) runtime.closeContractorToolsMenu?.();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      [
        runtime.closeModal,
        runtime.closeProjModal,
        runtime.closeCatModal,
        runtime.closeProjMgr,
        runtime.closeChartEdit,
        runtime.closeUserModal,
        runtime.closePhaseModal,
        runtime.closePrintDialog,
        runtime.closeNotesModal,
        runtime.closeCostModal,
        runtime.closeContractorEntryModal,
        runtime.closeAuthModal,
      ].forEach((fn) => fn?.());
      return;
    }

    if (event.key === "Enter" && event.ctrlKey) {
      if (isVisible("modal")) void runtime.saveTask?.();
      if (isVisible("proj-modal")) void runtime.saveProjSettings?.();
      if (isVisible("cat-modal")) void runtime.saveCats?.();
      if (isVisible("chart-edit-modal")) void runtime.applyChartEdit?.();
      if (isVisible("contractor-entry-modal")) void runtime.saveContractorEntry?.();
    }
  });

  window.addEventListener("load", registerServiceWorker, { once: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAppGlobalIsland, { once: true });
} else {
  initAppGlobalIsland();
}

export {};
