type FinanceChartRuntime = Window & {
  toggleWeeklyCostBars?: () => void;
  adjustFinanceChartHeight?: (delta: number) => void;
};

const financeRuntime = window as FinanceChartRuntime;

function initFinanceChartControlsIsland(): void {
  const section = document.getElementById("scurve-section");
  if (!section) return;

  section.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const actionElement = target?.closest<HTMLElement>("[data-finance-chart-action]");
    const action = actionElement?.dataset.financeChartAction || "";

    switch (action) {
      case "toggle-weekly-bars":
        financeRuntime.toggleWeeklyCostBars?.();
        return;
      case "shrink-height":
        financeRuntime.adjustFinanceChartHeight?.(-40);
        return;
      case "grow-height":
        financeRuntime.adjustFinanceChartHeight?.(40);
        return;
      default:
        return;
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFinanceChartControlsIsland, {
    once: true,
  });
} else {
  initFinanceChartControlsIsland();
}

export {};
