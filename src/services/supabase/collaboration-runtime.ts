import { normalizeProjectRole } from "../../domain/permissions";
import { buildActivityInsertPayload, buildProjectShareRoleUpdatePayload, buildProjectShareUpsertPayload } from "./payloads";

export interface ActivityWriteRequest {
  eventType: string;
  payload: ReturnType<typeof buildActivityInsertPayload>;
}

export interface ShareGrantInput {
  normalizedEmail: string;
  normalizedRole: string;
}

export interface ShareGrantResult {
  userId: string;
  email: string;
  role: string;
}

export function buildActivityWriteRequest(params: {
  projectId: string;
  actorId: string;
  actorName?: string | null;
  actorEmail?: string | null;
  eventType: string;
  payload?: Record<string, unknown>;
}): ActivityWriteRequest {
  const activityPayload = { ...(params.payload || {}) };
  const entityType =
    typeof activityPayload.entityType === "string" && activityPayload.entityType
      ? activityPayload.entityType
      : "project";
  const entityId = activityPayload.entityId != null ? String(activityPayload.entityId) : null;
  delete activityPayload.entityType;
  delete activityPayload.entityId;

  return {
    eventType: params.eventType,
    payload: buildActivityInsertPayload({
      projectId: params.projectId,
      actorId: params.actorId,
      actorName: params.actorName ?? null,
      actorEmail: params.actorEmail ?? null,
      eventType: params.eventType,
      entityType,
      entityId,
      payload: activityPayload,
    }),
  };
}

export function normalizeShareGrantInput(
  email: string,
  role: string,
  isShareableRole: (role: string) => boolean,
): ShareGrantInput {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) throw new Error("Enter email.");

  const normalizedRole = normalizeProjectRole(role);
  if (!isShareableRole(normalizedRole)) throw new Error("Unsupported access role.");

  return {
    normalizedEmail,
    normalizedRole,
  };
}

export function buildShareGrantRequest(params: {
  projectId: string;
  userId: string;
  role: string;
  invitedBy: string;
}) {
  return buildProjectShareUpsertPayload({
    projectId: params.projectId,
    userId: params.userId,
    role: params.role,
    invitedBy: params.invitedBy,
  });
}

export function buildShareGrantResult(userId: string, email: string, role: string): ShareGrantResult {
  return {
    userId,
    email,
    role,
  };
}

export function buildShareRoleUpdateRequest(role: string, isShareableRole: (role: string) => boolean) {
  const normalizedRole = normalizeProjectRole(role);
  if (!isShareableRole(normalizedRole)) throw new Error("Unsupported access role.");
  return buildProjectShareRoleUpdatePayload(normalizedRole);
}

export function buildShareRoleUpdateResult(role: string): string {
  return normalizeProjectRole(role);
}

export function resolveActivityLogLimit(limit: number): number {
  return Math.max(1, Math.min(500, Number(limit) || 100));
}
