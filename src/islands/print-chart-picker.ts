function syncPrintChartPicker(checked: boolean): void {
  const picker = document.getElementById("print-chart-picker");
  if (picker) picker.style.display = checked ? "block" : "none";
}

function initPrintChartPickerIsland(): void {
  const chartToggle = document.getElementById("print-charts") as HTMLInputElement | null;
  if (!chartToggle) return;

  syncPrintChartPicker(chartToggle.checked);

  chartToggle.addEventListener("change", () => {
    syncPrintChartPicker(chartToggle.checked);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPrintChartPickerIsland, {
    once: true,
  });
} else {
  initPrintChartPickerIsland();
}

export {};
