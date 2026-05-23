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

export interface ShareLookupRequest {
  p_email: string;
}

export interface ShareListRpcRequest {
  p_project_id: string;
}

export interface ShareListFallbackRequest {
  projectId: string;
}

export interface ShareRemoveRequest {
  shareId: string;
}

export interface ActivityLogReadRequest {
  projectId: string;
  limit: number;
}

export interface SupabaseCollaborationErrorMessages {
  invitePermissionDenied: string;
  manageAccessPermissionDenied: string;
  removeAccessPermissionDenied: string;
  emptyEmail: string;
  unsupportedRole: string;
  userNotFound: string;
  ownerAlreadyHasAccess: string;
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
  if (!normalizedEmail) throw new Error(buildSupabaseCollaborationErrorMessages().emptyEmail);

  const normalizedRole = normalizeProjectRole(role);
  if (!isShareableRole(normalizedRole)) throw new Error(buildSupabaseCollaborationErrorMessages().unsupportedRole);

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

export function buildShareLookupRequest(email: string): ShareLookupRequest {
  return {
    p_email: email,
  };
}

export function resolveShareTargetUser(targetUserId: string | null, authUserId: string): string {
  if (!targetUserId) {
    throw new Error(buildSupabaseCollaborationErrorMessages().userNotFound);
  }
  if (targetUserId === authUserId) {
    throw new Error(buildSupabaseCollaborationErrorMessages().ownerAlreadyHasAccess);
  }
  return targetUserId;
}

export function buildShareUpsertOptions() {
  return {
    onConflict: "project_id,user_id",
  } as const;
}

export function buildShareRoleUpdateRequest(role: string, isShareableRole: (role: string) => boolean) {
  const normalizedRole = normalizeProjectRole(role);
  if (!isShareableRole(normalizedRole)) throw new Error(buildSupabaseCollaborationErrorMessages().unsupportedRole);
  return buildProjectShareRoleUpdatePayload(normalizedRole);
}

export function buildShareRoleUpdateResult(role: string): string {
  return normalizeProjectRole(role);
}

export function buildShareListRpcRequest(projectId: string): ShareListRpcRequest {
  return {
    p_project_id: projectId,
  };
}

export function buildShareListFallbackRequest(projectId: string): ShareListFallbackRequest {
  return {
    projectId,
  };
}

export function buildShareRemoveRequest(shareId: string): ShareRemoveRequest {
  return {
    shareId,
  };
}

export function resolveActivityLogLimit(limit: number): number {
  return Math.max(1, Math.min(500, Number(limit) || 100));
}

export function buildActivityLogReadRequest(projectId: string, limit: number): ActivityLogReadRequest {
  return {
    projectId,
    limit: resolveActivityLogLimit(limit),
  };
}

export function buildSupabaseCollaborationErrorMessages(): SupabaseCollaborationErrorMessages {
  return {
    invitePermissionDenied: "You do not have permission to invite users.",
    manageAccessPermissionDenied: "You do not have permission to manage access.",
    removeAccessPermissionDenied: "You do not have permission to remove access.",
    emptyEmail: "Enter email.",
    unsupportedRole: "Unsupported access role.",
    userNotFound: "User with this email was not found. They need to register first.",
    ownerAlreadyHasAccess: "You already have access to this project as the owner.",
  };
}
