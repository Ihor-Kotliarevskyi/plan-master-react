const AUDIT_EVENT_TYPES = Object.freeze({
  TASK_CREATED: "task.created",
  TASK_UPDATED: "task.updated",
  TASK_DELETED: "task.deleted",
  PROJECT_SETTINGS_UPDATED: "project.settings_updated",
  PROJECT_BASELINE_SAVED: "project.baseline_saved",
  PROJECT_BASELINE_CLEARED: "project.baseline_cleared",
  SHARE_GRANTED: "share.granted",
  SHARE_ROLE_UPDATED: "share.role_updated",
  SHARE_REVOKED: "share.revoked",
});

function getCurrentAuditProjectId() {
  return allProjects?.[currentId]?._serverId || currentId || null;
}

function buildAuditPayload(entityType, entityId, payload = {}) {
  return {
    entityType,
    entityId,
    ...payload,
  };
}

async function logProjectActivity(eventType, payload = {}) {
  if (typeof apiLogActivity !== "function") return;
  try {
    await apiLogActivity(eventType, payload);
  } catch (_) {}
}

async function logTaskActivity(eventType, task, payload = {}) {
  return logProjectActivity(
    eventType,
    buildAuditPayload("task", task?.id || null, {
      taskN: task?.n ?? null,
      taskName: task?.name || null,
      ...payload,
    }),
  );
}

async function logProjectMutation(eventType, payload = {}) {
  return logProjectActivity(
    eventType,
    buildAuditPayload("project", getCurrentAuditProjectId(), payload),
  );
}

async function logShareActivity(eventType, shareId, payload = {}) {
  return logProjectActivity(
    eventType,
    buildAuditPayload("share", shareId, payload),
  );
}
