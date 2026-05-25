type ChartSurfaceRuntime = Window & {
  printChart?: (id: string) => void;
  removeChart?: (id: string) => void;
  removeAutoChart?: (id: string) => void;
};

const runtime = window as ChartSurfaceRuntime;

function initChartSurfaceIsland(): void {
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const actionElement = target?.closest<HTMLElement>("[data-chart-surface-action]");
    if (!actionElement) return;
    const action = actionElement.dataset.chartSurfaceAction || "";
    const chartId = actionElement.dataset.chartId || "";

    if (action === "print-chart") {
      runtime.printChart?.(chartId);
      return;
    }
    if (action === "remove-chart") {
      runtime.removeChart?.(chartId);
      return;
    }
    if (action === "remove-auto-chart") {
      runtime.removeAutoChart?.(chartId);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initChartSurfaceIsland, { once: true });
} else {
  initChartSurfaceIsland();
}

export {};
