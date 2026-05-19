function analyzeBufferedProjectsForUser(bufferProjects, bufferUserId, authUserId) {
  const offlineNew = {};
  const localSynced = {};
  const isOwnBuffer = !bufferUserId || bufferUserId === authUserId;

  Object.entries(bufferProjects || {}).forEach(([localId, snapshot]) => {
    if (!snapshot?._serverId && isOwnBuffer) {
      offlineNew[localId] = snapshot;
      return;
    }
    if (snapshot?._serverId && bufferUserId === authUserId) {
      localSynced[localId] = snapshot;
    }
  });

  return { offlineNew, localSynced };
}

function mapAccessibleProjectAccessMeta(accessMeta, fallback) {
  const source = accessMeta?.source || fallback?.source || "own";
  return {
    source,
    ownerId: accessMeta?.owner_id || fallback?.owner_id || null,
    ownerName: accessMeta?.owner_name || fallback?.owner_name || "",
    ownerEmail: accessMeta?.owner_email || fallback?.owner_email || "",
    invitedBy: accessMeta?.invited_by || fallback?.invited_by || null,
    invitedByName: accessMeta?.invited_by_name || fallback?.invited_by_name || "",
    invitedByEmail: accessMeta?.invited_by_email || fallback?.invited_by_email || "",
  };
}

function mergeAccessibleProjectsIntoLocalState(offlineNew, localSynced, accessibleProjects, authUserId) {
  const mergedProjects = { ...offlineNew };

  (accessibleProjects || []).forEach((item) => {
    if (!item?.project_id) return;

    const normalizedRole = normalizeProjectRole(item.role || (item.source === "own" ? "owner" : "viewer"));
    const fallbackMeta = {
      source: item.source || "own",
      owner_id: item.owner_id || (item.source === "own" ? authUserId : null),
      owner_name: item.owner_name || "",
      owner_email: item.owner_email || "",
      invited_by: item.invited_by || null,
      invited_by_name: item.invited_by_name || "",
      invited_by_email: item.invited_by_email || "",
    };

    const localMatch = Object.entries(localSynced)
      .find(([, localProject]) => localProject?._serverId === item.project_id);

    if (localMatch) {
      const [localId, localProject] = localMatch;
      mergedProjects[localId] = {
        ...localProject,
        _role: normalizedRole,
        _access: mapAccessibleProjectAccessMeta(item, fallbackMeta),
      };
      return;
    }

    mergedProjects[item.project_id] = {
      proj: { name: item.name, sm: item.sm, sy: item.sy, nm: item.nm },
      cats: [],
      tasks: [],
      nextN: 1,
      _serverId: item.project_id,
      _role: normalizedRole,
      _access: mapAccessibleProjectAccessMeta(item, fallbackMeta),
      _localVersion: 0,
      _serverVersion: 0,
    };
  });

  return mergedProjects;
}

function buildAccessibleProjectsFromFallback(ownProjects, sharedProjects, authUser) {
  return [
    ...((ownProjects || []).map((project) => ({
      project_id: project.id,
      name: project.name,
      sm: project.sm,
      sy: project.sy,
      nm: project.nm,
      is_archived: !!project.is_archived,
      updated_at: project.updated_at,
      role: "owner",
      source: "own",
      owner_id: authUser.id,
      owner_name: "",
      owner_email: authUser.email || "",
      invited_by: null,
      invited_by_name: "",
      invited_by_email: "",
    }))),
    ...((sharedProjects || [])
      .filter((item) => item?.project?.id)
      .map((item) => ({
        project_id: item.project.id,
        name: item.project.name,
        sm: item.project.sm,
        sy: item.project.sy,
        nm: item.project.nm,
        is_archived: !!item.project.is_archived,
        updated_at: item.project.updated_at,
        role: normalizeProjectRole(item.role || "viewer"),
        source: "shared",
        owner_id: item.project.owner_id || null,
        owner_name: "",
        owner_email: "",
        invited_by: item.invited_by || null,
        invited_by_name: "",
        invited_by_email: "",
      }))),
  ];
}

function mapSupabaseTaskRow(taskRow) {
  return {
    id: taskRow.id,
    n: taskRow.n,
    order: taskRow.order,
    name: taskRow.name,
    cat: taskRow.cat,
    ms: taskRow.ms,
    ws: taskRow.ws,
    me: taskRow.me,
    we: taskRow.we,
    prog: taskRow.prog,
    budget: Number(taskRow.budget) || 0,
    spent: Number(taskRow.spent) || 0,
    deps: taskRow.deps || [],
    phases: taskRow.phases || null,
    costItems: taskRow.cost_items || null,
    notes: taskRow.notes || [],
  };
}

function buildSupabaseProjectSnapshot(localId, projectRow, taskRows, previousSnapshot, role) {
  const syncedVersion = previousSnapshot?._localVersion || 0;
  return {
    proj: {
      name: projectRow.name,
      sm: projectRow.sm,
      sy: projectRow.sy,
      nm: projectRow.nm,
      baseline: projectRow.baseline,
      baselineDate: projectRow.baseline_date,
    },
    cats: projectRow.cats || [],
    tasks: (taskRows || []).map(mapSupabaseTaskRow),
    nextN: projectRow.next_n || 1,
    _serverId: projectRow.id,
    _role: getStoredProjectRole(localId, role),
    _access: previousSnapshot?._access || null,
    _localVersion: syncedVersion,
    _serverVersion: syncedVersion,
    _localUpdatedAt: previousSnapshot?._localUpdatedAt,
  };
}

function buildSupabaseTasksPayload(tasks) {
  return (tasks || []).map((task, index) => ({
    id: task.id || null,
    n: Math.trunc(task.n || 0),
    order: index,
    name: task.name || "",
    cat: Math.trunc(task.cat || 0),
    ms: Math.trunc(task.ms || 0),
    ws: Math.trunc(task.ws || 0),
    me: Math.trunc(task.me || 0),
    we: Math.trunc(task.we || 0),
    prog: Math.trunc(task.prog || 0),
    budget: Number(task.budget) || 0,
    spent: Number(task.spent) || 0,
    deps: task.deps || [],
    phases: task.phases || null,
    costItems: task.costItems || null,
    notes: task.notes || [],
  }));
}

function buildSupabaseProjectMutationPayload(projectSnapshot) {
  return {
    name: projectSnapshot.proj.name,
    sm: projectSnapshot.proj.sm,
    sy: projectSnapshot.proj.sy,
    nm: projectSnapshot.proj.nm,
    cats: projectSnapshot.cats,
    next_n: projectSnapshot.nextN,
    baseline: projectSnapshot.proj.baseline || null,
    baseline_date: projectSnapshot.proj.baselineDate || null,
  };
}

function buildSupabaseProjectInsertPayload(projectSnapshot, ownerId) {
  return {
    owner_id: ownerId,
    ...buildSupabaseProjectMutationPayload(projectSnapshot),
  };
}

function buildSupabaseActivityInsertPayload({
  projectId,
  actorId,
  actorName = null,
  actorEmail = null,
  eventType,
  entityType = "project",
  entityId = null,
  payload = {},
}) {
  return {
    project_id: projectId,
    actor_id: actorId,
    actor_name: actorName,
    actor_email: actorEmail,
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId != null ? String(entityId) : null,
    payload: { ...payload },
  };
}

function splitSupabaseActivityPayload(payload) {
  const details = { ...(payload || {}) };
  const entityType = typeof details.entityType === "string" && details.entityType
    ? details.entityType
    : "project";
  const entityId = details.entityId != null ? String(details.entityId) : null;
  delete details.entityType;
  delete details.entityId;
  return {
    entityType,
    entityId,
    payload: details,
  };
}

function mapSupabaseShareRecord(shareRow) {
  return {
    id: shareRow.id,
    role: normalizeProjectRole(shareRow.role),
    user: {
      id: shareRow.user_id,
      name: shareRow.user_name || shareRow.user_email || shareRow.user_id,
      email: shareRow.user_email || "",
    },
    invitedByName: shareRow.invited_by_name || "",
    invitedByEmail: shareRow.invited_by_email || "",
  };
}

function mapSupabaseFallbackShareRecord(shareRow) {
  return {
    id: shareRow.id,
    role: normalizeProjectRole(shareRow.role),
    user: {
      id: shareRow.user_id,
      name: shareRow.user_id,
      email: "",
    },
    invitedByName: "",
    invitedByEmail: "",
  };
}

function mapSupabaseActivityRow(activityRow) {
  return {
    id: activityRow.id,
    projectId: activityRow.project_id,
    actorId: activityRow.actor_id,
    actorName: activityRow.actor_name,
    actorEmail: activityRow.actor_email,
    eventType: activityRow.event_type,
    entityType: activityRow.entity_type,
    entityId: activityRow.entity_id,
    payload: activityRow.payload || {},
    createdAt: activityRow.created_at,
  };
}

function buildSupabaseProjectShareUpsertPayload({
  projectId,
  userId,
  role,
  invitedBy,
}) {
  return {
    project_id: projectId,
    user_id: userId,
    role,
    invited_by: invitedBy,
  };
}

function buildSupabaseProjectShareRoleUpdatePayload(role) {
  return { role };
}
