type NotesModalRuntime = Window & {
  closeNotesModal?: () => void;
  addNote?: () => void;
  startNoteEdit?: (index: number) => void;
  cancelNoteEdit?: (index: number) => void;
  saveNoteEdit?: (index: number) => void;
  deleteNote?: (index: number) => Promise<void> | void;
  toggleNoteHistory?: (index: number) => void;
};

const runtime = window as NotesModalRuntime;

async function handleNotesAction(action: string, element: HTMLElement): Promise<void> {
  const index = Number(element.dataset.noteIndex || -1);
  switch (action) {
    case "close-modal":
      runtime.closeNotesModal?.();
      return;
    case "add-note":
      runtime.addNote?.();
      return;
    case "start-edit":
      if (index >= 0) runtime.startNoteEdit?.(index);
      return;
    case "cancel-edit":
      if (index >= 0) runtime.cancelNoteEdit?.(index);
      return;
    case "save-edit":
      if (index >= 0) runtime.saveNoteEdit?.(index);
      return;
    case "delete-note":
      if (index >= 0) await Promise.resolve(runtime.deleteNote?.(index));
      return;
    case "toggle-history":
      if (index >= 0) runtime.toggleNoteHistory?.(index);
      return;
    default:
      return;
  }
}

function initNotesModalIsland(): void {
  const modal = document.getElementById("notes-modal");
  if (!modal) return;

  modal.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (target === modal) {
      runtime.closeNotesModal?.();
      return;
    }
    const actionElement = target.closest<HTMLElement>("[data-notes-action]");
    if (!actionElement) return;
    await handleNotesAction(actionElement.dataset.notesAction || "", actionElement);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initNotesModalIsland, { once: true });
} else {
  initNotesModalIsland();
}

export {};
