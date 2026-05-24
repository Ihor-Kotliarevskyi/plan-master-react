type AuthCabinetRuntime = Window & {
  closeUserModal?: () => void;
  apiLogout?: () => Promise<void>;
  updateUserBtn?: () => void;
  _switchAuthTab?: (tab: string) => void;
  _submitAuthInCabinet?: (tab: string) => Promise<void> | void;
};

const runtime = window as AuthCabinetRuntime;

async function handleAuthCabinetAction(action: string, element: HTMLElement): Promise<void> {
  switch (action) {
    case "logout":
      runtime.closeUserModal?.();
      await runtime.apiLogout?.();
      runtime.updateUserBtn?.();
      return;
    case "switch-auth-tab":
      await Promise.resolve(runtime._switchAuthTab?.(element.dataset.authTab || "login"));
      return;
    case "submit-auth":
      await Promise.resolve(runtime._submitAuthInCabinet?.(element.dataset.authTab || "login"));
      return;
    default:
      return;
  }
}

function initAuthCabinetIsland(): void {
  document.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const actionElement = target.closest<HTMLElement>("[data-user-action]");
    if (!actionElement) return;

    const action = actionElement.dataset.userAction || "";
    if (!["logout", "switch-auth-tab", "submit-auth"].includes(action)) return;
    await handleAuthCabinetAction(action, actionElement);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAuthCabinetIsland, { once: true });
} else {
  initAuthCabinetIsland();
}

export {};
