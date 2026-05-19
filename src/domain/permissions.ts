import type { PermissionSet, ProjectRole } from "./types";

export const PROJECT_ROLES = {
  OWNER: "owner",
  MANAGER: "manager",
  EDITOR: "editor",
  VIEWER: "viewer",
} as const satisfies Record<string, ProjectRole>;

export const PROJECT_ROLE_LABELS: Record<ProjectRole, string> = {
  owner: "Власник",
  manager: "Менеджер",
  editor: "Редактор",
  viewer: "Перегляд",
};

export const PROJECT_ROLE_HINTS: Record<ProjectRole, string> = {
  owner: "Повний доступ до проєкту, ролей і змін.",
  manager: "Може змінювати проєкт і керувати доступом користувачів.",
  editor: "Може редагувати задачі, але не керує доступом і налаштуваннями проєкту.",
  viewer: "Може лише переглядати проєкт без внесення змін.",
};

export const SHAREABLE_PROJECT_ROLES: ProjectRole[] = [
  PROJECT_ROLES.VIEWER,
  PROJECT_ROLES.EDITOR,
  PROJECT_ROLES.MANAGER,
];

export function normalizeProjectRole(
  role: string | null | undefined,
  fallbackRole: ProjectRole = PROJECT_ROLES.VIEWER,
): ProjectRole {
  if (role === "admin") return PROJECT_ROLES.MANAGER;
  if (role === PROJECT_ROLES.OWNER) return PROJECT_ROLES.OWNER;
  if (role === PROJECT_ROLES.MANAGER) return PROJECT_ROLES.MANAGER;
  if (role === PROJECT_ROLES.EDITOR) return PROJECT_ROLES.EDITOR;
  if (role === PROJECT_ROLES.VIEWER) return PROJECT_ROLES.VIEWER;
  return fallbackRole;
}

export function getProjectPermissions(role: string | null | undefined): PermissionSet {
  const normalizedRole = normalizeProjectRole(role);
  const isOwnerRole = normalizedRole === PROJECT_ROLES.OWNER;
  const isManagerRole = normalizedRole === PROJECT_ROLES.MANAGER;
  const isEditorRole = normalizedRole === PROJECT_ROLES.EDITOR;

  return {
    role: normalizedRole,
    canViewProject: true,
    canEditTasks: isOwnerRole || isManagerRole || isEditorRole,
    canManageProject: isOwnerRole || isManagerRole,
    canManageShares: isOwnerRole || isManagerRole,
    canInviteUsers: isOwnerRole || isManagerRole,
    canViewAuditLog: isOwnerRole || isManagerRole || isEditorRole,
  };
}

export function getProjectRoleHint(role: string | null | undefined): string {
  return PROJECT_ROLE_HINTS[normalizeProjectRole(role)];
}

export function canEditTasks(role: string | null | undefined): boolean {
  return getProjectPermissions(role).canEditTasks;
}

export function canManageProject(role: string | null | undefined): boolean {
  return getProjectPermissions(role).canManageProject;
}

export function canManageShares(role: string | null | undefined): boolean {
  return getProjectPermissions(role).canManageShares;
}

export function canInviteUsers(role: string | null | undefined): boolean {
  return getProjectPermissions(role).canInviteUsers;
}

export function canViewAuditLog(role: string | null | undefined): boolean {
  return getProjectPermissions(role).canViewAuditLog;
}
