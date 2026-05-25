type MultiFilterRuntime = Window & {
  openMultiFilter?: (path: string, summaryEl?: HTMLElement | null, event?: Event | null) => void;
  resetMultiFilter?: (path: string, renderFnName: string) => void;
  setMultiFilter?: (path: string, option: string, checked: boolean, renderFnName: string) => void;
};

const runtime = window as MultiFilterRuntime;

function initMultiFilterIsland(): void {
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const actionElement = target?.closest<HTMLElement>("[data-multi-filter-action]");
    if (actionElement) {
      event.stopPropagation();
      const action = actionElement.dataset.multiFilterAction || "";
      const path = actionElement.dataset.filterPath || "";
      if (action === "toggle") {
        runtime.openMultiFilter?.(path, actionElement, event);
        return;
      }
      if (action === "reset") {
        runtime.resetMultiFilter?.(path, actionElement.dataset.renderFn || "");
        return;
      }
      return;
    }

    const root = target?.closest<HTMLElement>("[data-multi-filter-root]");
    if (root) {
      event.stopPropagation();
    }
  });

  document.addEventListener("change", (event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target || target.dataset.multiFilterAction !== "set-option") return;
    runtime.setMultiFilter?.(
      target.dataset.filterPath || "",
      target.dataset.filterOption || "",
      target.checked,
      target.dataset.renderFn || "",
    );
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMultiFilterIsland, { once: true });
} else {
  initMultiFilterIsland();
}

export {};
