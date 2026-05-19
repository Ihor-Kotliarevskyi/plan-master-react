import { getProjectRoleHint, normalizeProjectRole, PROJECT_ROLE_LABELS } from "./permissions";
import { getSharedProjectLabels } from "./project-access";
import type { ProjectAccessMeta, ProjectRole } from "./types";

export interface AccessBannerModel {
  shouldShow: boolean;
  role: ProjectRole;
  roleLabel: string;
  roleHint: string;
  sharedMetaText: string;
}

export function getProjectRoleLabel(role: string | null | undefined): string {
  const normalizedRole = normalizeProjectRole(role);
  return PROJECT_ROLE_LABELS[normalizedRole] || normalizedRole;
}

export function buildSharedProjectMetaText(accessMeta?: ProjectAccessMeta | null): string {
  const labels = getSharedProjectLabels(accessMeta || null);
  if (!labels.isShared) return "";
  return [labels.ownerLabel, labels.invitedByLabel].filter(Boolean).join(" · ");
}

export function buildSharedProjectMetaLine(accessMeta?: ProjectAccessMeta | null): string {
  const labels = getSharedProjectLabels(accessMeta || null);
  if (!labels.isShared) return "Власний проєкт";
  const ownerText = labels.ownerLabel ? `Власник: ${labels.ownerLabel}` : "";
  const invitedByText = labels.invitedByLabel ? `Поділився: ${labels.invitedByLabel}` : "";
  return [ownerText, invitedByText].filter(Boolean).join(" · ");
}

export function buildAccessBannerModel(
  role: string | null | undefined,
  accessMeta?: ProjectAccessMeta | null,
): AccessBannerModel {
  const normalizedRole = normalizeProjectRole(role, "owner");
  return {
    shouldShow: normalizedRole !== "owner",
    role: normalizedRole,
    roleLabel: getProjectRoleLabel(normalizedRole),
    roleHint: getProjectRoleHint(normalizedRole),
    sharedMetaText: buildSharedProjectMetaText(accessMeta || null),
  };
}
