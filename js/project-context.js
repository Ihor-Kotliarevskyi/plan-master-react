function getProjectSnapshot(projectId = currentId) {
  return projectId ? allProjects?.[projectId] || null : null;
}

function getCurrentProjectSnapshot() {
  return getProjectSnapshot(currentId);
}

function getProjectServerId(projectId = currentId) {
  return getProjectSnapshot(projectId)?._serverId || null;
}

function getCurrentProjectServerId() {
  return getProjectServerId(currentId);
}

function getStoredProjectRole(projectId = currentId, fallbackRole = "owner") {
  const storedRole = getProjectSnapshot(projectId)?._role;
  if (typeof normalizeProjectRole === "function") {
    return normalizeProjectRole(
      storedRole || (projectId === currentId ? _projectRole : null),
      fallbackRole,
    );
  }
  return storedRole || (projectId === currentId ? _projectRole : null) || fallbackRole;
}

function setProjectRole(projectId, role) {
  const normalizedRole =
    typeof normalizeProjectRole === "function" ? normalizeProjectRole(role, role) : role;
  const snap = getProjectSnapshot(projectId);
  if (snap) snap._role = normalizedRole;
  if (projectId === currentId && typeof _projectRole !== "undefined") {
    _projectRole = normalizedRole;
  }
  return normalizedRole;
}

function setProjectOwnerRole(projectId = currentId) {
  return setProjectRole(projectId, "owner");
}
