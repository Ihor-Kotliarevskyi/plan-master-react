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

function getAllProjectSnapshots() {
  return allProjects || {};
}

function getCurrentProjectId() {
  return currentId || null;
}

function getLegacyAppBridgeSnapshot() {
  const snapshots = getAllProjectSnapshots();
  const activeProjectId = getCurrentProjectId();
  const activeProject = activeProjectId ? snapshots?.[activeProjectId] || null : null;
  const authButton = document.getElementById("auth-status-btn");
  const userButton = document.getElementById("user-btn");
  const syncIndicator = document.getElementById("sync-indicator");
  const activeTab = document.querySelector(".tab.active")?.dataset?.tabId || null;

  return {
    session: {
      isAuthenticated: typeof isLoggedIn === "function" ? !!isLoggedIn() : false,
      authLabel: authButton?.textContent?.trim() || "",
      userLabel: userButton?.textContent?.trim() || "",
      syncLabel: syncIndicator?.textContent?.trim() || "",
    },
    projectCollection: {
      currentId: activeProjectId,
      items: Object.entries(snapshots).map(([id, snapshot]) => ({
        id,
        name: snapshot?.proj?.name || id,
        role: getStoredProjectRole(id, "owner"),
        serverId: snapshot?._serverId || null,
        isCurrent: id === activeProjectId,
      })),
    },
    currentProject: activeProject
      ? {
          id: activeProjectId,
          name: activeProject?.proj?.name || activeProjectId,
          role: getStoredProjectRole(activeProjectId, "owner"),
          taskCount: Array.isArray(activeProject?.tasks) ? activeProject.tasks.length : 0,
          categoryCount: Array.isArray(activeProject?.cats) ? activeProject.cats.length : 0,
          hasServerCopy: !!activeProject?._serverId,
          updatedAt: activeProject?._localUpdatedAt || null,
        }
      : null,
    ui: {
      activeTab,
    },
    capturedAt: new Date().toISOString(),
  };
}
