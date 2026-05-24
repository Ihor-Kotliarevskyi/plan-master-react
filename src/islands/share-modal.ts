type ShareRuntime = Window & {
  openShareModal?: () => Promise<void> | void;
  handleShareRoleChange?: (shareId: string, role: string) => Promise<void> | void;
  handleShareRemoval?: (shareId: string) => Promise<void> | void;
};

const shareRuntime = window as ShareRuntime;

function initShareModalIsland(): void {
  const shareButton = document.getElementById("share-btn");

  shareButton?.addEventListener("click", async () => {
    await Promise.resolve(shareRuntime.openShareModal?.());
  });

  document.addEventListener("change", async (event) => {
    const target = event.target as HTMLSelectElement | null;
    if (!target || target.dataset.shareAction !== "change-role") return;
    const shareId = target.dataset.shareId || "";
    await Promise.resolve(shareRuntime.handleShareRoleChange?.(shareId, target.value));
  });

  document.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const actionElement = target.closest<HTMLElement>("[data-share-action='remove-share']");
    if (!actionElement) return;
    const shareId = actionElement.dataset.shareId || "";
    await Promise.resolve(shareRuntime.handleShareRemoval?.(shareId));
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initShareModalIsland, { once: true });
} else {
  initShareModalIsland();
}
