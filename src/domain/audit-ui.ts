import type { AuditEntry, AuditEventType } from "./types";

export interface AuditEntryViewModel {
  eventLabel: string;
  actorLabel: string;
  subjectLabel: string;
}

const AUDIT_EVENT_LABELS: Record<AuditEventType, string> = {
  "task.created": "Created task",
  "task.updated": "Updated task",
  "task.deleted": "Deleted task",
  "project.settings_updated": "Updated project settings",
  "project.baseline_saved": "Saved baseline",
  "project.baseline_cleared": "Cleared baseline",
  "share.granted": "Granted access",
  "share.role_updated": "Updated access role",
  "share.revoked": "Revoked access",
};

export function getAuditEventLabel(eventType: string | null | undefined): string {
  if (!eventType) return "Event";
  return AUDIT_EVENT_LABELS[eventType as AuditEventType] || eventType;
}

export function getAuditSubjectLabel(
  entry: Pick<AuditEntry<Record<string, unknown>>, "entityType" | "entityId" | "payload"> | null | undefined,
  fallbackProjectName = "Current project",
): string {
  if (!entry) return "-";

  if (entry.entityType === "task") {
    const taskName = typeof entry.payload?.taskName === "string" ? entry.payload.taskName : "";
    const taskN = typeof entry.payload?.taskN === "number" || typeof entry.payload?.taskN === "string"
      ? entry.payload.taskN
      : "?";
    return taskName || `Task #${taskN}`;
  }

  if (entry.entityType === "share") {
    const email = typeof entry.payload?.email === "string" ? entry.payload.email : "";
    return email || entry.entityId || "Shared access";
  }

  return fallbackProjectName || "Current project";
}

export function getAuditActorLabel(
  entry: Pick<AuditEntry<Record<string, unknown>>, "actorName" | "actorEmail"> | null | undefined,
): string {
  if (!entry) return "-";
  return entry.actorName || entry.actorEmail || "-";
}

export function buildAuditEntryViewModel(
  entry: AuditEntry<Record<string, unknown>>,
  fallbackProjectName?: string,
): AuditEntryViewModel {
  return {
    eventLabel: getAuditEventLabel(entry.eventType),
    actorLabel: getAuditActorLabel(entry),
    subjectLabel: getAuditSubjectLabel(entry, fallbackProjectName),
  };
}
