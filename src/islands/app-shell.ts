type AppShellRuntime = Window & {
  switchProject?: (id: string) => void;
  toggleTheme?: () => void;
  switchTab?: (id: string, element: HTMLElement) => void;
  toggleToolsMenu?: () => void;
  closeToolsMenu?: () => void;
  exportXLSX?: () => void;
  exportJSON?: () => void;
  importJSON?: (event: Event) => void;
};

const appShellRuntime = window as AppShellRuntime;

async function handleAppShellAction(action: string, element: HTMLElement): Promise<void> {
  switch (action) {
    case "toggle-theme":
      appShellRuntime.toggleTheme?.();
      return;
    case "switch-tab":
      appShellRuntime.switchTab?.(element.dataset.tabId || "gantt", element);
      return;
    case "toggle-tools-menu":
      appShellRuntime.toggleToolsMenu?.();
      return;
    case "export-xlsx":
      appShellRuntime.exportXLSX?.();
      appShellRuntime.closeToolsMenu?.();
      return;
    case "export-json":
      appShellRuntime.exportJSON?.();
      appShellRuntime.closeToolsMenu?.();
      return;
    default:
      return;
  }
}

function initAppShellIsland(): void {
  document.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement | null;
    const actionElement = target?.closest<HTMLElement>("[data-app-shell-action]");
    if (!actionElement) return;
    await handleAppShellAction(actionElement.dataset.appShellAction || "", actionElement);
  });

  const projectSelect = document.getElementById("proj-sel") as HTMLSelectElement | null;
  projectSelect?.addEventListener("change", () => {
    appShellRuntime.switchProject?.(projectSelect.value);
  });

  const importInput = document.querySelector<HTMLInputElement>("[data-app-shell-input='import-json']");
  importInput?.addEventListener("change", (event) => {
    appShellRuntime.importJSON?.(event);
    appShellRuntime.closeToolsMenu?.();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAppShellIsland, { once: true });
} else {
  initAppShellIsland();
}

export {};
