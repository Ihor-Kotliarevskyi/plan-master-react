type PrintSurfaceRuntime = Window & {
  _schedulePrintPreview?: () => void;
};

const runtime = window as PrintSurfaceRuntime;

function initPrintSurfaceIsland(): void {
  const modal = document.getElementById("print-modal");
  if (!modal) return;

  const schedulePreview = (): void => {
    runtime._schedulePrintPreview?.();
  };

  modal.addEventListener("change", schedulePreview);
  modal.addEventListener("input", schedulePreview);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPrintSurfaceIsland, { once: true });
} else {
  initPrintSurfaceIsland();
}

export {};
