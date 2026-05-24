type ChartEditRuntime = Window & {
  addCustomChart?: () => void;
  openChartEdit?: (id: string) => void;
  closeChartEdit?: () => void;
  applyChartEdit?: () => void;
};

const runtime = window as ChartEditRuntime;

async function handleChartAction(action: string, element: HTMLElement): Promise<void> {
  switch (action) {
    case "open-edit":
      runtime.openChartEdit?.(element.dataset.chartId || "");
      return;
    case "close-edit":
      runtime.closeChartEdit?.();
      return;
    case "apply-edit":
      runtime.applyChartEdit?.();
      return;
    case "add-custom-chart":
      runtime.addCustomChart?.();
      return;
    default:
      return;
  }
}

function initChartEditIsland(): void {
  const modal = document.getElementById("chart-edit-modal");
  const addButton = document.querySelector<HTMLElement>("[data-chart-action='add-custom-chart']");
  const grid = document.getElementById("chart-grid");

  addButton?.addEventListener("click", async () => {
    await handleChartAction("add-custom-chart", addButton);
  });

  modal?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (target === modal) {
      runtime.closeChartEdit?.();
      return;
    }
    const actionElement = target.closest<HTMLElement>("[data-chart-action]");
    if (!actionElement) return;
    await handleChartAction(actionElement.dataset.chartAction || "", actionElement);
  });

  grid?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const actionElement = target.closest<HTMLElement>("[data-chart-action='open-edit']");
    if (!actionElement) return;
    await handleChartAction("open-edit", actionElement);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initChartEditIsland, { once: true });
} else {
  initChartEditIsland();
}

export {};
