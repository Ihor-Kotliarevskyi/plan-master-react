import type { AuditEntry, AuditEventType } from "./types";

export const AUDIT_EVENT_TYPES = {
  TASK_CREATED: "task.created",
  TASK_UPDATED: "task.updated",
  TASK_DELETED: "task.deleted",
  PROJECT_SETTINGS_UPDATED: "project.settings_updated",
  PROJECT_BASELINE_SAVED: "project.baseline_saved",
  PROJECT_BASELINE_CLEARED: "project.baseline_cleared",
  SHARE_GRANTED: "share.granted",
  SHARE_ROLE_UPDATED: "share.role_updated",
  SHARE_REVOKED: "share.revoked",
} as const satisfies Record<string, AuditEventType>;

export interface AuditPayloadShape {
  entityType: "task" | "project" | "share";
  entityId: string | number | null;
  [key: string]: unknown;
}

export function buildAuditPayload(
  entityType: AuditPayloadShape["entityType"],
  entityId: AuditPayloadShape["entityId"],
  payload: Record<string, unknown> = {},
): AuditPayloadShape {
  return {
    entityType,
    entityId,
    ...payload,
  };
}

export function formatAuditEntry<TPayload extends Record<string, unknown> = Record<string, unknown>>(
  entry: AuditEntry<TPayload>,
): AuditEntry<TPayload> {
  return {
    ...entry,
    payload: entry.payload || ({} as TPayload),
  };
}
