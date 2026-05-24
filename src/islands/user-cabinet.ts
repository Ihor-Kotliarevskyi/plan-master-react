type UserCabinetRuntime = Window & {
  openUserModal?: () => void;
  closeUserModal?: () => void;
  saveUserProfile?: () => Promise<void> | void;
  toggleTheme?: () => void;
  _renderUserModal?: () => void;
  toggleBaseline?: () => void;
  saveBaseline?: () => void;
  clearBaseline?: () => void;
  clearAvatar?: () => void;
  handleAvatarUpload?: (event: Event) => void;
  _syncUserNamePreview?: (value: string) => void;
};

const runtime = window as UserCabinetRuntime;

function rerenderUserModal(): void {
  runtime._renderUserModal?.();
}

async function handleUserAction(action: string, element: HTMLElement): Promise<void> {
  switch (action) {
    case "close-modal":
      runtime.closeUserModal?.();
      return;
    case "save-profile":
      await Promise.resolve(runtime.saveUserProfile?.());
      return;
    case "toggle-theme":
      await Promise.resolve(runtime.toggleTheme?.());
      rerenderUserModal();
      return;
    case "toggle-baseline":
      await Promise.resolve(runtime.toggleBaseline?.());
      rerenderUserModal();
      return;
    case "save-baseline":
      await Promise.resolve(runtime.saveBaseline?.());
      rerenderUserModal();
      return;
    case "clear-baseline":
      await Promise.resolve(runtime.clearBaseline?.());
      rerenderUserModal();
      return;
    case "clear-avatar":
      await Promise.resolve(runtime.clearAvatar?.());
      return;
    default:
      return;
  }
}

function initUserCabinetIsland(): void {
  const userButton = document.getElementById("user-btn");
  const modalRoot = document.getElementById("user-modal");

  userButton?.addEventListener("click", () => {
    runtime.openUserModal?.();
  });

  modalRoot?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    if (target === modalRoot) {
      runtime.closeUserModal?.();
      return;
    }

    const actionElement = target.closest<HTMLElement>("[data-user-action]");
    if (!actionElement) return;
    await handleUserAction(actionElement.dataset.userAction || "", actionElement);
  });

  modalRoot?.addEventListener("input", (event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    if (target.dataset.userInput === "name-preview") {
      runtime._syncUserNamePreview?.(target.value);
    }
  });

  modalRoot?.addEventListener("change", (event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    if (target.dataset.userInput === "avatar-upload") {
      runtime.handleAvatarUpload?.(event);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initUserCabinetIsland, { once: true });
} else {
  initUserCabinetIsland();
}

export {};
