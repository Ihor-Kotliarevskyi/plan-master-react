import { useEffect, useState } from "react";
import { readNotesModalSnapshot, subscribeNotesModalSync } from "../bridge/notes-modal";
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

  return (
    <>
      <div className="modal-header">
        <h3>
          <i data-lucide="message-square"></i> <span id="notes-modal-title">{snapshot.title}</span>
        </h3>
        <button className="btn btn-sm" data-notes-action="close-modal">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div dangerouslySetInnerHTML={{ __html: snapshot.notesHtml }} className="notes-list" id="notes-list" />
      <div className="notes-add-row" style={{ display: snapshot.canEdit ? "" : "none" }}>
        <textarea id="note-input" placeholder={snapshot.labels.placeholder}></textarea>
        <button className="btn btn-acc" data-notes-action="add-note">
          {snapshot.labels.addButton}
        </button>
      </div>
      <div className="m-btns">
        <button className="btn btn-acc" data-notes-action="close-modal">
          {snapshot.labels.closeButton}
        </button>
      </div>
    </>
  );
}
