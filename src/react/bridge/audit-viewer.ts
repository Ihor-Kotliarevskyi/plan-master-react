import { z } from "zod";
import type { AuditViewerSnapshot } from "../types";

const auditViewerSnapshotSchema: z.ZodType<AuditViewerSnapshot> = z.object({
  visible: z.boolean(),
  loading: z.boolean(),
  error: z.string(),
  entries: z.array(
    z.object({
      id: z.string(),
      createdAt: z.string(),
      eventLabel: z.string(),
      actorLabel: z.string(),
      subjectLabel: z.string(),
    }),
  ),
  labels: z.object({
    accessDeniedTitle: z.string(),
    loadFailedTitle: z.string(),
    missingMigrationHint: z.string(),
    retryHint: z.string(),
    actorCaption: z.string(),
    subjectCaption: z.string(),
    emptyHint: z.string(),
    modalTitle: z.string(),
    closeButtonLabel: z.string(),
  }),
  capturedAt: z.string(),
});

type AuditViewerWindow = Window & {
  getAuditBridgeSnapshot?: () => unknown;
  closeReactAuditModal?: () => void;
  reloadReactAuditModal?: () => Promise<void>;
};

function getAuditViewerWindow(): AuditViewerWindow {
  return window as AuditViewerWindow;
}

function buildFallbackSnapshot(): AuditViewerSnapshot {
  return {
    visible: false,
    loading: false,
    error: "",
    entries: [],
    labels: {
      accessDeniedTitle: "",
      loadFailedTitle: "",
      missingMigrationHint: "",
      retryHint: "",
      actorCaption: "Хто",
      subjectCaption: "Об'єкт",
      emptyHint: "",
      modalTitle: "Журнал змін",
      closeButtonLabel: "Закрити",
    },
    capturedAt: new Date().toISOString(),
  };
}

export function readAuditViewerSnapshot(): AuditViewerSnapshot {
  const snapshot = getAuditViewerWindow().getAuditBridgeSnapshot?.();
  const parsed = auditViewerSnapshotSchema.safeParse(snapshot);
  return parsed.success ? parsed.data : buildFallbackSnapshot();
}

export function subscribeAuditViewerSync(onSync: () => void): () => void {
  const handler = () => onSync();
  document.addEventListener("plan-master:user-cabinet-sync", handler);
  return () => {
    document.removeEventListener("plan-master:user-cabinet-sync", handler);
  };
}

export function closeAuditViewerModal(): void {
  getAuditViewerWindow().closeReactAuditModal?.();
}

export async function reloadAuditViewerModal(): Promise<void> {
  await getAuditViewerWindow().reloadReactAuditModal?.();
}
