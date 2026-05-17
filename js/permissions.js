const PROJECT_ROLES = Object.freeze({
  OWNER: "owner",
  MANAGER: "manager",
  EDITOR: "editor",
  VIEWER: "viewer",
});

const PROJECT_ROLE_LABELS = Object.freeze({
  owner: "Власник",
  manager: "Менеджер",
  editor: "Редактор",
  viewer: "Перегляд",
});

const SHAREABLE_PROJECT_ROLES = Object.freeze([
  PROJECT_ROLES.VIEWER,
  PROJECT_ROLES.EDITOR,
  PROJECT_ROLES.MANAGER,
]);

function normalizeProjectRole(role, fallbackRole = PROJECT_ROLES.VIEWER) {
  if (role === "admin") return PROJECT_ROLES.MANAGER;
  if (role === PROJECT_ROLES.OWNER) return PROJECT_ROLES.OWNER;
  if (role === PROJECT_ROLES.MANAGER) return PROJECT_ROLES.MANAGER;
  if (role === PROJECT_ROLES.EDITOR) return PROJECT_ROLES.EDITOR;
  if (role === PROJECT_ROLES.VIEWER) return PROJECT_ROLES.VIEWER;
  return fallbackRole;
}

function getProjectRole(role) {
  if (role !== undefined && role !== null) return normalizeProjectRole(role);

  try {
    if (typeof _projectRole !== "undefined" && _projectRole) {
      return normalizeProjectRole(_projectRole);
    }
  } catch (_) {}

  try {
    const storedRole = allProjects?.[currentId]?._role;
    if (storedRole) return normalizeProjectRole(storedRole);
  } catch (_) {}

  return PROJECT_ROLES.OWNER;
}

function getProjectPermissions(role) {
  const normalizedRole = getProjectRole(role);
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

function isOwner(role) {
  return getProjectRole(role) === PROJECT_ROLES.OWNER;
}

function canViewProject(role) {
  return getProjectPermissions(role).canViewProject;
}

function canEditTasks(role) {
  return getProjectPermissions(role).canEditTasks;
}

function canManageProject(role) {
  return getProjectPermissions(role).canManageProject;
}

function canManageShares(role) {
  return getProjectPermissions(role).canManageShares;
}

function canInviteUsers(role) {
  return getProjectPermissions(role).canInviteUsers;
}

function canViewAuditLog(role) {
  return getProjectPermissions(role).canViewAuditLog;
}

function isReadOnly(role) {
  return !canEditTasks(role);
}

function canEdit(role) {
  return canEditTasks(role);
}

function isShareableProjectRole(role) {
  return SHAREABLE_PROJECT_ROLES.includes(normalizeProjectRole(role));
}
