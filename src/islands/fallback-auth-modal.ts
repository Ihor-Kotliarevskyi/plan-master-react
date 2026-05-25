declare const Swal: any;

type FallbackAuthRuntime = Window & {
  _renderAuthModal?: (tab: string) => void;
  _submitAuth?: (tab: string) => Promise<void> | void;
  openAuthModal?: (tab: string) => void;
  apiLogout?: () => void;
  updateAuthBtn?: () => void;
  _updateReadOnlyUI?: () => void;
  API_UI?: {
    auth?: {
      syncedLogoutPromptTitle?: string;
      syncedLogoutPromptText?: string;
      logoutConfirmButtonText?: string;
    };
    share?: {
      cancelButtonText?: string;
    };
  };
};

const runtime = window as FallbackAuthRuntime;

async function handleFallbackAuthButton(mode: string): Promise<void> {
  if (mode === "login") {
    runtime.openAuthModal?.("login");
    return;
  }
  if (mode !== "logout") return;
  const r = await Swal.fire({
    icon: "question",
    title: runtime.API_UI?.auth?.syncedLogoutPromptTitle || "Вийти?",
    text: runtime.API_UI?.auth?.syncedLogoutPromptText || "",
    showCancelButton: true,
    confirmButtonText: runtime.API_UI?.auth?.logoutConfirmButtonText || "Вийти",
    cancelButtonText: runtime.API_UI?.share?.cancelButtonText || "Скасувати",
  });
  if (!r.isConfirmed) return;
  runtime.apiLogout?.();
  (window as any)._projectRole = null;
  runtime.updateAuthBtn?.();
  runtime._updateReadOnlyUI?.();
}

function initFallbackAuthModalIsland(): void {
  document.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const authAction = target.closest<HTMLElement>("[data-fallback-auth-action]");
    if (authAction) {
      const action = authAction.dataset.fallbackAuthAction || "";
      const tab = authAction.dataset.authTab || "login";
      if (action === "switch-tab") {
        runtime._renderAuthModal?.(tab);
        return;
      }
      if (action === "submit-auth") {
        await Promise.resolve(runtime._submitAuth?.(tab));
        return;
      }
    }

    const authBtn = target.closest<HTMLElement>("#auth-status-btn");
    if (!authBtn) return;
    await handleFallbackAuthButton(authBtn.dataset.fallbackAuthBtn || "login");
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFallbackAuthModalIsland, { once: true });
} else {
  initFallbackAuthModalIsland();
}

export {};
