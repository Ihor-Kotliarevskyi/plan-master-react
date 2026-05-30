import { z } from "zod";
import type { NotesModalSnapshot } from "../types";

const snapshotSchema: z.ZodType<NotesModalSnapshot> = z.object({
  visible: z.boolean(),
  canEdit: z.boolean(),
  title: z.string(),
  notesHtml: z.string(),
  labels: z.object({
    placeholder: z.string(),
    closeButton: z.string(),
    addButton: z.string(),
  }),
  capturedAt: z.string(),
});

type NotesModalWindow = Window & {
  getNotesModalBridgeSnapshot?: () => unknown;
};

function getNotesModalWindow(): NotesModalWindow {
  return window as NotesModalWindow;
}

function buildFallbackSnapshot(): NotesModalSnapshot {
  return {
    visible: false,
    canEdit: true,
    title: "Нотатки",
    notesHtml: "",
    labels: {
      placeholder: "Додати нотатку...",
      closeButton: "Закрити",
      addButton: "+",
    },
    capturedAt: new Date().toISOString(),
  };
}

export function readNotesModalSnapshot(): NotesModalSnapshot {
  const parsed = snapshotSchema.safeParse(getNotesModalWindow().getNotesModalBridgeSnapshot?.());
  return parsed.success ? parsed.data : buildFallbackSnapshot();
}

export function subscribeNotesModalSync(onSync: () => void): () => void {
  const handler = () => onSync();
  document.addEventListener("plan-master:notes-modal-sync", handler);
  return () => document.removeEventListener("plan-master:notes-modal-sync", handler);
}
