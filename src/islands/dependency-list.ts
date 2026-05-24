type DependencyListRuntime = Window & {
  closeDepList?: () => void;
  setDepListFilter?: (filter: string) => void;
  depListGo?: (taskIndex: number) => void;
};

const runtime = window as DependencyListRuntime;

function initDependencyListIsland(): void {
  const modal = document.getElementById("dep-list-modal");
  if (!modal) return;

  modal.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    if (target === modal) {
      runtime.closeDepList?.();
      return;
    }

    const filterButton = target.closest<HTMLElement>("[data-dep-action='set-filter']");
    if (filterButton) {
      runtime.setDepListFilter?.(filterButton.dataset.f || "all");
      return;
    }

    const closeButton = target.closest<HTMLElement>("[data-dep-action='close-modal']");
    if (closeButton) {
      runtime.closeDepList?.();
      return;
    }

    const row = target.closest<HTMLElement>("[data-dep-action='go-to-task']");
    if (row) {
      runtime.depListGo?.(Number(row.dataset.taskIndex || -1));
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDependencyListIsland, { once: true });
} else {
  initDependencyListIsland();
}

export {};
