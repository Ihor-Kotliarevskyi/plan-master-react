import { useEffect, useState } from "react";
import {
  addNote,
  cancelNoteEdit,
  closeNotesModal,
  deleteNote,
  readNotesModalSnapshot,
  saveNoteEdit,
  startNoteEdit,
  subscribeNotesModalSync,
  toggleNoteHistory,
} from "../bridge/notes-modal";
import type { NotesModalSnapshot } from "../types";

export function NotesModal() {
  const [snapshot, setSnapshot] = useState<NotesModalSnapshot>(() => readNotesModalSnapshot());

  useEffect(() => {
    const sync = () => setSnapshot(readNotesModalSnapshot());
    sync();
    return subscribeNotesModalSync(sync);
  }, []);

  useEffect(() => {
    window.lucide?.createIcons({
      nodes: Array.from(document.querySelectorAll("[data-notes-modal-root] [data-lucide]")),
    });
  }, [snapshot.capturedAt]);

  useEffect(() => {
    const modalRoot = document.getElementById("notes-modal");
    if (!modalRoot) return;

    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target === modalRoot) closeNotesModal();
    };

    modalRoot.addEventListener("click", handleBackdropClick);
    return () => {
      modalRoot.removeEventListener("click", handleBackdropClick);
    };
  }, []);

  async function handleNotesAction(event: React.MouseEvent<HTMLElement>) {
    const actionElement = (event.target as HTMLElement).closest<HTMLElement>("[data-notes-action]");
    if (!actionElement) return;

    const action = actionElement.dataset.notesAction || "";
    const index = Number(actionElement.dataset.noteIndex || -1);

    switch (action) {
      case "close-modal":
        closeNotesModal();
        return;
      case "add-note":
        addNote();
        return;
      case "start-edit":
        if (index >= 0) startNoteEdit(index);
        return;
      case "cancel-edit":
        if (index >= 0) cancelNoteEdit(index);
        return;
      case "save-edit":
        if (index >= 0) saveNoteEdit(index);
        return;
      case "delete-note":
        if (index >= 0) await deleteNote(index);
        return;
      case "toggle-history":
        if (index >= 0) toggleNoteHistory(index);
        return;
      default:
        return;
    }
  }

  return (
    <>
      <div className="modal-header">
        <h3>
          <i data-lucide="message-square"></i> <span id="notes-modal-title">{snapshot.title}</span>
        </h3>
        <button className="btn btn-sm" onClick={closeNotesModal} type="button">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div dangerouslySetInnerHTML={{ __html: snapshot.notesHtml }} className="notes-list" id="notes-list" onClick={(event) => void handleNotesAction(event)} />
      <div className="notes-add-row" style={{ display: snapshot.canEdit ? "" : "none" }}>
        <textarea id="note-input" placeholder={snapshot.labels.placeholder}></textarea>
        <button className="btn btn-acc" onClick={addNote} type="button">
          {snapshot.labels.addButton}
        </button>
      </div>
      <div className="m-btns">
        <button className="btn btn-acc" onClick={closeNotesModal} type="button">
          {snapshot.labels.closeButton}
        </button>
      </div>
    </>
  );
}
