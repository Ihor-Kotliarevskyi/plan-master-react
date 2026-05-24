type AuditViewerRuntime = Window & {
  openAuditLogModal?: () => Promise<void> | void;
};

const runtime = window as AuditViewerRuntime;

function initAuditViewerIsland(): void {
  document.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const actionElement = target.closest<HTMLElement>("[data-user-action='open-audit-log']");
    if (!actionElement) return;
    await Promise.resolve(runtime.openAuditLogModal?.());
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAuditViewerIsland, { once: true });
} else {
  initAuditViewerIsland();
}

export {};
