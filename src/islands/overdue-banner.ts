type OverdueBannerRuntime = Window & {
  toggleOverdueExpand?: () => void;
  closeOverdueBanner?: () => void;
};

const runtime = window as OverdueBannerRuntime;

function initOverdueBannerIsland(): void {
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const actionElement = target?.closest<HTMLElement>("[data-overdue-action]");
    if (!actionElement) return;
    const action = actionElement.dataset.overdueAction || "";
    if (action === "toggle-expand") {
      runtime.toggleOverdueExpand?.();
      return;
    }
    if (action === "close-banner") {
      runtime.closeOverdueBanner?.();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initOverdueBannerIsland, { once: true });
} else {
  initOverdueBannerIsland();
}

export {};
