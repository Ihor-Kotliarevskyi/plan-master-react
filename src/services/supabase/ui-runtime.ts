import { normalizeProjectRole } from "../../domain/permissions";
import type { ProjectAccessMeta } from "../../domain/types";

export interface SupabaseShareListItem {
  id: string;
  role: string;
  normalizedRole: string;
  roleLabel: string;
  displayLabel: string;
}

export interface SupabaseShareModalState {
  projectName: string;
  items: SupabaseShareListItem[];
}

export interface SupabaseReadOnlyUiState {
  readonly: boolean;
  showReadonlyBanner: boolean;
  headerBannerVisible: boolean;
  headerBannerClassName: string;
  headerBannerHtml: string;
  ganttPointerEvents: string;
  ganttOpacity: string;
  ganttTitle: string;
  addButtonVisible: boolean;
  shareButtonVisible: boolean;
}

export interface SupabaseSyncIndicatorPlan {
  status: "syncing";
  timeoutMs: number;
}

export interface SupabaseShareRoleGuideItem {
  role: string;
  title: string;
  description: string;
}

export interface SupabaseShareDialogModel {
  accessDeniedTitle: string;
  emptyText: string;
  modalTitle: string;
  projectLabel: string;
  grantSectionTitle: string;
  emailPlaceholder: string;
  confirmButtonText: string;
  cancelButtonText: string;
  emailRequiredMessage: string;
}

export interface SupabaseShareErrorMessages {
  updateRoleErrorTitle: string;
  updateRoleErrorText: string;
  removeAccessErrorTitle: string;
  removeAccessErrorText: string;
}

export function buildSupabaseShareModalState(params: {
  shares: Array<{
    id: string;
    role: string;
    user?: { id?: string; name?: string; email?: string };
  }>;
  projectName: string;
  getRoleLabel: (role: string) => string;
}): SupabaseShareModalState {
  return {
    projectName: params.projectName,
    items: (params.shares || []).map((share) => ({
      id: String(share.id || ""),
      role: String(share.role || "viewer"),
      normalizedRole: normalizeProjectRole(String(share.role || "viewer")),
      roleLabel: params.getRoleLabel(String(share.role || "viewer")),
      displayLabel: share.user?.email || share.user?.name || share.user?.id || "-",
    })),
  };
}

export function buildSupabaseShareRoleOptions(
  roles: string[],
  getRoleLabel: (role: string) => string,
  selectedRole?: string | null,
): string {
  const normalizedSelectedRole = normalizeProjectRole(selectedRole || "viewer");
  return (roles || []).map(
    (role) => `<option value="${role}"${normalizeProjectRole(role) === normalizedSelectedRole ? " selected" : ""}>${getRoleLabel(role)}</option>`,
  ).join("");
}

export function buildSupabaseShareRoleGuide(): SupabaseShareRoleGuideItem[] {
  return [
    {
      role: "manager",
      title: "Manager",
      description: "manages access and project settings.",
    },
    {
      role: "editor",
      title: "Editor",
      description: "edits tasks but cannot manage access.",
    },
    {
      role: "viewer",
      title: "Viewer",
      description: "read-only access.",
    },
  ];
}

export function buildSupabaseShareDialogModel(): SupabaseShareDialogModel {
  return {
    accessDeniedTitle: "You do not have permission to manage access.",
    emptyText: "No shared users yet",
    modalTitle: "Shared Access",
    projectLabel: "Project",
    grantSectionTitle: "Grant access:",
    emailPlaceholder: "email@example.com",
    confirmButtonText: "Grant access",
    cancelButtonText: "Close",
    emailRequiredMessage: "Enter email",
  };
}

export function buildSupabaseShareErrorMessages(): SupabaseShareErrorMessages {
  return {
    updateRoleErrorTitle: "Failed to update role",
    updateRoleErrorText: "Try again.",
    removeAccessErrorTitle: "Failed to remove access",
    removeAccessErrorText: "Try again.",
  };
}

export function buildSupabaseReadOnlyUiState(params: {
  readonly: boolean;
  canShare: boolean;
  isLoggedIn: boolean;
  bannerModel: {
    shouldShow: boolean;
    roleLabel: string;
    roleHint: string;
    sharedMetaText: string;
  };
}): SupabaseReadOnlyUiState {
  return {
    readonly: params.readonly,
    showReadonlyBanner: params.readonly,
    headerBannerVisible: params.bannerModel.shouldShow,
    headerBannerClassName: `project-access-banner${params.readonly ? " is-readonly" : " is-limited"}`,
    headerBannerHtml: params.bannerModel.shouldShow
      ? `<span class="project-access-pill">${params.bannerModel.roleLabel}</span><span class="project-access-text">${params.bannerModel.roleHint}${params.bannerModel.sharedMetaText ? ` ${params.bannerModel.sharedMetaText}` : ""}</span>`
      : "",
    ganttPointerEvents: params.readonly ? "none" : "",
    ganttOpacity: params.readonly ? "0.85" : "",
    ganttTitle: params.readonly ? "View-only mode - editing is disabled" : "",
    addButtonVisible: !params.readonly,
    shareButtonVisible: params.isLoggedIn && params.canShare,
  };
}

export function buildSupabaseRoleUpdatedToast(roleLabel: string) {
  return {
    title: `Role updated: ${roleLabel}`,
    timer: 2600,
  };
}

export function buildSupabaseShareGrantedToast(roleLabel: string, email: string) {
  return {
    title: `Access granted: ${roleLabel}`,
    text: email,
    timer: 2800,
  };
}

export function buildSupabaseShareRemovedToast() {
  return {
    title: "Access removed",
    timer: 2400,
  };
}

export function buildSupabaseSyncIndicatorPlan(timeoutMs = 1800): SupabaseSyncIndicatorPlan {
  return {
    status: "syncing",
    timeoutMs,
  };
}
