/**
 * Supabase adapter - active backend.
 * Tables: profiles, projects, project_shares, tasks, activity_log.
 * RPC: upsert_tasks(p_project_id, p_tasks), get_user_id_by_email(p_email),
 *      ensure_my_profile(), list_accessible_projects(), list_project_shares().
 */

const SUPABASE_ENV = window.__PLAN_MASTER_ENV__ || {};
const SUPABASE_URL = SUPABASE_ENV.SUPABASE_URL || "";
const SUPABASE_KEY = SUPABASE_ENV.SUPABASE_PUBLISHABLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
}

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

function _getAuthRedirectUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

let _sbUser = null;
let _sbProfile = null;
let _projectRole = null;
let _apiLoadProjectsSeq = 0;
let _syncTimer = null;

function isLoggedIn() {
  return !!_sbUser;
}

async function _getCurrentAuthUser() {
  const { data: { user }, error } = await sb.auth.getUser();
  if (error) throw new Error(error.message);
  if (user) _sbUser = user;
  return user || null;
}

async function apiRegister(name, email, password) {
  _sbUser = _sbProfile = _projectRole = null;
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: _getAuthRedirectUrl(),
    },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Check your email to confirm registration.");
  _sbUser = data.user;
  _sbProfile = await _loadProfile();
  updateUserBtn();
  return data;
}

async function apiLogin(email, password) {
  _sbUser = _sbProfile = _projectRole = null;
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  _sbUser = data.user;
  _sbProfile = await _loadProfile();
  updateUserBtn();
  return data;
}

async function apiLogout() {
  if (currentId && isLoggedIn()) {
    const currentProject = getCurrentProjectSnapshot();
    const localVersion = currentProject?._localVersion || 0;
    const serverVersion = currentProject?._serverVersion || 0;
    if (localVersion > serverVersion) {
      try {
        await apiSyncProject(currentId);
      } catch (_) {}
    }
  }

  await sb.auth.signOut({ scope: "local" });
  _sbUser = _sbProfile = _projectRole = null;

  try {
    localStorage.removeItem(SK_BUF);
  } catch (_) {}

  initDefaultProject();
  loadCurrent();
  render();
  if (typeof refreshUserSyncStatus === "function") refreshUserSyncStatus("offline");
  else updateUserBtn();
}

async function apiGetMe() {
  const user = await _getCurrentAuthUser();
  if (!user) return null;
  _sbProfile = await _loadProfile();
  return _sbProfile;
}

async function _loadProfile() {
  if (!_sbUser) return null;

  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("id", _sbUser.id)
    .maybeSingle();

  if (data) return data;
  if (error) throw new Error(error.message);

  const { data: ensuredProfile, error: ensureError } = await sb.rpc("ensure_my_profile");
  if (ensureError) throw new Error(ensureError.message);
  return ensuredProfile || null;
}

async function apiUpdateProfile(updates) {
  if (!_sbUser) return;

  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
  if (updates.theme !== undefined) dbUpdates.theme = updates.theme;
  if (updates.defaults) {
    if (updates.defaults.sm !== undefined) dbUpdates.default_sm = updates.defaults.sm;
    if (updates.defaults.sy !== undefined) dbUpdates.default_sy = updates.defaults.sy;
    if (updates.defaults.nm !== undefined) dbUpdates.default_nm = updates.defaults.nm;
  }

  const { error } = await sb.from("profiles").update(dbUpdates).eq("id", _sbUser.id);
  if (error) throw new Error(error.message);
}

function _buildTasksPayload(tasks) {
  return buildSupabaseTasksPayload(tasks);
}

async function _assertSyncedTaskCount(serverId, expectedCount) {
  const { count, error } = await sb
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("project_id", serverId);
  if (error) throw error;
  if ((count || 0) !== expectedCount) {
    throw new Error(`Synced task count mismatch: expected ${expectedCount}, got ${count || 0}`);
  }
}

function _saveBuffer() {
  try {
    localStorage.setItem(SK_BUF, JSON.stringify({
      allProjects,
      currentId,
      _userId: _sbUser?.id || null,
    }));
  } catch (_) {}
}

async function apiLoadProject(localId) {
  const authUser = await _getCurrentAuthUser();
  if (!authUser) return;

  const localProject = getProjectSnapshot(localId);
  const serverId = getProjectServerId(localId);
  if (!serverId) return;

  const localVersion = localProject?._localVersion || 0;
  const serverVersion = localProject?._serverVersion || 0;
  if (localVersion > serverVersion) {
    await apiSyncProject(localId);
    return;
  }

  try {
    const { data: projectRow, error: projectError } = await sb
      .from("projects")
      .select("id,name,sm,sy,nm,cats,next_n,baseline,baseline_date,owner_id")
      .eq("id", serverId)
      .single();
    if (projectError) throw projectError;

    let resolvedRole = "owner";
    if (projectRow.owner_id !== authUser.id) {
      const { data: shareRow } = await sb
        .from("project_shares")
        .select("role")
        .eq("project_id", serverId)
        .eq("user_id", authUser.id)
        .single();
      resolvedRole = normalizeProjectRole(shareRow?.role || "viewer");
    }
    setProjectRole(localId, resolvedRole);

    const { data: taskRows, error: taskError } = await sb
      .from("tasks")
      .select("id,n,order,name,cat,ms,ws,me,we,prog,budget,spent,deps,phases,cost_items,notes")
      .eq("project_id", serverId)
      .order("order", { ascending: true });
    if (taskError) throw taskError;

    allProjects[localId] = buildSupabaseProjectSnapshot(
      localId,
      projectRow,
      taskRows || [],
      localProject,
      resolvedRole,
    );
    _saveBuffer();
    loadCurrent();
    render();
    _updateReadOnlyUI();
    if (typeof refreshUserSyncStatus === "function") refreshUserSyncStatus();
  } catch (_) {}
}

async function apiLoadProjects() {
  const authUser = await _getCurrentAuthUser();
  if (!authUser) return;

  const seq = ++_apiLoadProjectsSeq;
  const bufferAtStart = (() => {
    try {
      return localStorage.getItem(SK_BUF) || "";
    } catch (_) {
      return "";
    }
  })();

  try {
    let bufferUserId = null;
    let bufferCurrentId = null;
    const offlineNew = {};
    const localSynced = {};

    try {
      const buffer = JSON.parse(localStorage.getItem(SK_BUF) || "{}");
      bufferUserId = buffer._userId || null;
      bufferCurrentId = buffer.currentId || null;
      const analyzedBuffer = analyzeBufferedProjectsForUser(
        buffer.allProjects || {},
        bufferUserId,
        authUser.id,
      );
      Object.assign(offlineNew, analyzedBuffer.offlineNew);
      Object.assign(localSynced, analyzedBuffer.localSynced);
    } catch (_) {}

    let accessibleList = [];
    const { data: accessibleProjects, error: accessibleProjectsError } = await sb.rpc("list_accessible_projects");
    if (!accessibleProjectsError && Array.isArray(accessibleProjects)) {
      accessibleList = accessibleProjects.filter((item) => !!item?.project_id);
    } else {
      const { data: ownProjects, error: ownError } = await sb
        .from("projects")
        .select("id,name,sm,sy,nm,is_archived,updated_at")
        .eq("owner_id", authUser.id)
        .eq("is_archived", false)
        .order("updated_at", { ascending: false });
      if (ownError) throw ownError;

      const { data: sharedProjects, error: sharedError } = await sb
        .from("project_shares")
        .select("role, invited_by, project:projects(id,name,sm,sy,nm,is_archived,updated_at,owner_id)")
        .eq("user_id", authUser.id);
      if (sharedError) throw sharedError;

      accessibleList = buildAccessibleProjectsFromFallback(ownProjects || [], sharedProjects || [], authUser);
    }

    if (seq !== _apiLoadProjectsSeq) return;

    const bufferNow = (() => {
      try {
        return localStorage.getItem(SK_BUF) || "";
      } catch (_) {
        return "";
      }
    })();
    if (bufferNow !== bufferAtStart) {
      await apiLoadProjects();
      return;
    }

    allProjects = mergeAccessibleProjectsIntoLocalState(
      offlineNew,
      localSynced,
      accessibleList,
      authUser.id,
    );

    if (!Object.keys(allProjects).length) initDefaultProject();
    if (bufferCurrentId && allProjects[bufferCurrentId]) currentId = bufferCurrentId;
    else if (!currentId || !allProjects[currentId]) currentId = Object.keys(allProjects)[0];

    updateProjSel();
    loadCurrent();
    render();
    if (typeof refreshUserSyncStatus === "function") refreshUserSyncStatus();

    if (currentId && allProjects[currentId]) {
      await apiLoadProject(currentId);
    }

    for (const id of Object.keys(offlineNew)) {
      await apiCreateProject(id);
    }
  } catch (_) {}
}

async function apiSyncProject(idToSync) {
  const authUser = await _getCurrentAuthUser();
  if (!authUser) return;

  const snapId = idToSync || currentId;
  if (!snapId) return;
  const projectSnapshot = getProjectSnapshot(snapId);
  if (!projectSnapshot) return;

  const serverId = getProjectServerId(snapId);
  if (!serverId) {
    await apiCreateProject(snapId);
    return;
  }

  const role = getStoredProjectRole(snapId, "viewer");
  if (!canEditTasks(role)) return;

  try {
    const { data: existing, error: checkError } = await sb
      .from("projects")
      .select("id")
      .eq("id", serverId)
      .maybeSingle();
    if (checkError) throw checkError;

    if (!existing) {
      projectSnapshot._serverId = null;
      await apiCreateProject(snapId);
      return;
    }

    const [projectResult, tasksResult] = await Promise.all([
      sb.from("projects").update({
        ...buildSupabaseProjectMutationPayload(projectSnapshot),
        updated_at: new Date().toISOString(),
      }).eq("id", serverId),
      sb.rpc("upsert_tasks", {
        p_project_id: serverId,
        p_tasks: _buildTasksPayload(projectSnapshot.tasks),
      }),
    ]);

    if (projectResult.error) throw projectResult.error;
    if (tasksResult.error) throw tasksResult.error;
    await _assertSyncedTaskCount(serverId, (projectSnapshot.tasks || []).length);

    if (allProjects[snapId]) {
      allProjects[snapId]._serverVersion = allProjects[snapId]._localVersion;
      _saveBuffer();
    }
    _showSyncIndicator();
  } catch (_) {
    if (typeof setUserSyncStatus === "function") setUserSyncStatus("error");
  }
}

async function apiCreateProject(idToCreate) {
  const authUser = await _getCurrentAuthUser();
  if (!authUser) return;

  const snapId = idToCreate || currentId;
  const projectSnapshot = getProjectSnapshot(snapId);
  if (!snapId || !projectSnapshot) return;

  const projectPayload = buildSupabaseProjectInsertPayload(projectSnapshot, authUser.id);
  const { error: insertError } = await sb.from("projects").insert(projectPayload);

  if (insertError) {
    console.error("[supabase] apiCreateProject insert failed", {
      authUserId: authUser.id,
      ownerId: projectPayload.owner_id,
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint,
    });
    if (typeof setUserSyncStatus === "function") setUserSyncStatus("error");
    return;
  }

  const { data, error } = await sb
    .from("projects")
    .select("id")
    .eq("owner_id", authUser.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.id) {
    console.error("[supabase] apiCreateProject lookup failed", {
      authUserId: authUser.id,
      code: error?.code || null,
      message: error?.message || "Created project lookup returned no row",
      details: error?.details || null,
      hint: error?.hint || null,
    });
    if (typeof setUserSyncStatus === "function") setUserSyncStatus("warn");
    return;
  }

  projectSnapshot._serverId = data.id;
  setProjectOwnerRole(snapId);
  _saveBuffer();

  try {
    if ((projectSnapshot.tasks || []).length > 0) {
      const { error: tasksError } = await sb.rpc("upsert_tasks", {
        p_project_id: data.id,
        p_tasks: _buildTasksPayload(projectSnapshot.tasks),
      });
      if (tasksError) throw tasksError;
    }
    await _assertSyncedTaskCount(data.id, (projectSnapshot.tasks || []).length);

    allProjects[snapId]._serverVersion = allProjects[snapId]._localVersion;
    _saveBuffer();
    _showSyncIndicator();
  } catch (_) {
    if (typeof setUserSyncStatus === "function") setUserSyncStatus("error");
  }
}

async function apiDeleteProject(localId) {
  const authUser = await _getCurrentAuthUser();
  if (!authUser) return;
  const serverId = getProjectServerId(localId);
  if (!serverId) return;
  await sb.from("projects").delete().eq("id", serverId);
}

async function apiLogActivity(eventType, payload = {}) {
  const authUser = await _getCurrentAuthUser();
  if (!authUser) return;
  const serverId = getCurrentProjectServerId();
  if (!serverId) return;

  const activityPayload = buildSupabaseActivityInsertPayload({
    projectId: serverId,
    actorId: authUser.id,
    actorName: _sbProfile?.name || authUser?.user_metadata?.name || null,
    actorEmail: authUser?.email || null,
    eventType,
    entityType: payload.entityType || "project",
    entityId: payload.entityId,
    payload: Object.fromEntries(
      Object.entries(payload || {}).filter(([key]) => key !== "entityType" && key !== "entityId"),
    ),
  });

  const { error } = await sb.from("activity_log").insert(activityPayload);
  if (error) throw error;
}

async function apiGetShares() {
  const authUser = await _getCurrentAuthUser();
  const serverId = getCurrentProjectServerId();
  if (!serverId || !authUser) return [];

  const { data: rpcShares, error: rpcSharesError } = await sb.rpc("list_project_shares", {
    p_project_id: serverId,
  });
  if (!rpcSharesError && Array.isArray(rpcShares)) {
    return rpcShares.map(mapSupabaseShareRecord);
  }

  const { data, error } = await sb
    .from("project_shares")
    .select("id, role, user_id, created_at")
    .eq("project_id", serverId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data || []).map(mapSupabaseFallbackShareRecord);
}

async function apiShareProject(email, role = "viewer") {
  const authUser = await _getCurrentAuthUser();
  const serverId = getCurrentProjectServerId();
  if (!serverId || !authUser) return;
  if (!canInviteUsers()) throw new Error("You do not have permission to invite users.");

  const shareRole = normalizeProjectRole(role);
  if (!isShareableProjectRole(shareRole)) throw new Error("Unsupported access role.");

  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) throw new Error("Enter email.");

  const { data: targetUserId, error: lookupError } = await sb.rpc("get_user_id_by_email", {
    p_email: normalizedEmail,
  });
  if (lookupError) throw new Error(lookupError.message);
  if (!targetUserId) {
    throw new Error("User with this email was not found. They need to register first.");
  }
  if (targetUserId === authUser.id) {
    throw new Error("You already have access to this project as the owner.");
  }

  const sharePayload = buildSupabaseProjectShareUpsertPayload({
    projectId: serverId,
    userId: targetUserId,
    role: shareRole,
    invitedBy: authUser.id,
  });

  const { error } = await sb.from("project_shares").upsert(
    sharePayload,
    { onConflict: "project_id,user_id" },
  );

  if (error) throw new Error(error.message);
  _showSyncIndicator();
  await logShareActivity(AUDIT_EVENT_TYPES.SHARE_GRANTED, targetUserId, {
    email: normalizedEmail,
    role: shareRole,
  });
  return {
    userId: targetUserId,
    email: normalizedEmail,
    role: shareRole,
  };
}

async function apiUpdateShareRole(shareId, role) {
  if (!canManageShares()) throw new Error("You do not have permission to manage access.");

  const shareRole = normalizeProjectRole(role);
  if (!isShareableProjectRole(shareRole)) throw new Error("Unsupported access role.");

  const { error } = await sb
    .from("project_shares")
    .update(buildSupabaseProjectShareRoleUpdatePayload(shareRole))
    .eq("id", shareId);

  if (error) throw new Error(error.message);
  _showSyncIndicator();
  await logShareActivity(AUDIT_EVENT_TYPES.SHARE_ROLE_UPDATED, shareId, {
    role: shareRole,
  });
  return shareRole;
}

async function apiRemoveShare(shareId) {
  if (!canManageShares()) throw new Error("You do not have permission to remove access.");
  const { error } = await sb.from("project_shares").delete().eq("id", shareId);
  if (error) throw new Error(error.message);
  _showSyncIndicator();
  await logShareActivity(AUDIT_EVENT_TYPES.SHARE_REVOKED, shareId);
}

async function apiGetActivityLog(limit = 100) {
  const authUser = await _getCurrentAuthUser();
  const serverId = getCurrentProjectServerId();
  if (!serverId || !authUser) return [];

  const { data, error } = await sb
    .from("activity_log")
    .select("id, project_id, actor_id, actor_name, actor_email, event_type, entity_type, entity_id, payload, created_at")
    .eq("project_id", serverId)
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(500, Number(limit) || 100)));

  if (error) throw new Error(error.message);
  return (data || []).map(mapSupabaseActivityRow);
}

function _updateReadOnlyUI() {
  const readonly = !canEditTasks();
  const canShare = canManageShares();
  const role = typeof getProjectRole === "function" ? getProjectRole() : (allProjects?.[currentId]?._role || "owner");
  const roleLabel = typeof PROJECT_ROLE_LABELS !== "undefined" ? (PROJECT_ROLE_LABELS[role] || role) : role;
  const roleHint = typeof getProjectRoleHint === "function" ? getProjectRoleHint(role) : "";
  const accessMeta = allProjects?.[currentId]?._access || null;
  const sharedMeta = accessMeta?.source === "shared"
    ? [accessMeta.ownerName || accessMeta.ownerEmail, accessMeta.invitedByName || accessMeta.invitedByEmail]
        .filter(Boolean)
        .join(" · ")
    : "";

  const banner = document.getElementById("readonly-banner");
  if (banner) banner.style.display = readonly ? "flex" : "none";

  const headerBanner = document.getElementById("project-access-banner");
  if (headerBanner) {
    const shouldShow = role !== "owner";
    headerBanner.style.display = shouldShow ? "flex" : "none";
    headerBanner.className = `project-access-banner${readonly ? " is-readonly" : " is-limited"}`;
    headerBanner.innerHTML = shouldShow
      ? `<span class="project-access-pill">${roleLabel}</span><span class="project-access-text">${roleHint}${sharedMeta ? ` ${sharedMeta}` : ""}</span>`
      : "";
  }

  const ganttTable = document.getElementById("gtbl-wrap");
  if (ganttTable) {
    ganttTable.style.pointerEvents = readonly ? "none" : "";
    ganttTable.style.opacity = readonly ? "0.85" : "";
    ganttTable.title = readonly ? "View-only mode - editing is disabled" : "";
  }

  const addBtn = document.querySelector(".btn-acc[onclick='openAdd()']");
  if (addBtn) addBtn.style.display = readonly ? "none" : "";

  const shareBtn = document.getElementById("share-btn");
  if (shareBtn) shareBtn.style.display = isLoggedIn() && canShare ? "" : "none";
}

async function handleShareRoleChange(shareId, role) {
  try {
    const nextRole = await apiUpdateShareRole(shareId, role);
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: `Role updated: ${PROJECT_ROLE_LABELS[nextRole] || nextRole}`,
      showConfirmButton: false,
      timer: 2600,
    });
    await openShareModal();
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Failed to update role",
      text: err.message || "Try again.",
    });
  }
}

async function handleShareRemoval(shareId) {
  try {
    await apiRemoveShare(shareId);
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Access removed",
      showConfirmButton: false,
      timer: 2400,
    });
    await openShareModal();
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Failed to remove access",
      text: err.message || "Try again.",
    });
  }
}

async function openShareModal() {
  const shares = await apiGetShares();

  if (!canManageShares()) {
    Swal.fire({ icon: "info", title: "You do not have permission to manage access." });
    return;
  }

  const roleOptions = SHAREABLE_PROJECT_ROLES.map(
    (role) => `<option value="${role}">${PROJECT_ROLE_LABELS[role]}</option>`,
  ).join("");
  const roleGuide = `
    <div class="share-role-guide">
      <div><b>Manager:</b> manages access and project settings.</div>
      <div><b>Editor:</b> edits tasks but cannot manage access.</div>
      <div><b>Viewer:</b> read-only access.</div>
    </div>`;

  const list = shares.length
    ? shares.map((share) => {
      const shareRole = normalizeProjectRole(share.role);
      const shareLabel = share.user?.email || share.user?.name || share.user?.id || "-";
      return `
        <div class="share-row">
          <span>${shareLabel}</span>
          <select class="cost-sel" onchange="handleShareRoleChange('${share.id}',this.value)">
            ${SHAREABLE_PROJECT_ROLES.map(
              (role) => `<option value="${role}"${shareRole === role ? " selected" : ""}>${PROJECT_ROLE_LABELS[role]}</option>`,
            ).join("")}
          </select>
          <button class="cost-act-btn del" onclick="handleShareRemoval('${share.id}')">✕</button>
        </div>`;
    }).join("")
    : `<div class="share-empty">No shared users yet</div>`;

  Swal.fire({
    title: "Shared Access",
    html: `
      <div class="share-modal-body">
        <div class="share-proj-name">Project: <b>${proj.name}</b></div>
        <div class="share-list">${list}</div>
        <hr class="share-divider">
        <div class="share-add-title">Grant access:</div>
        <div class="share-add-row">
          <input id="share-email" type="email" placeholder="email@example.com" class="share-email-inp">
          <select id="share-role" class="share-role-sel">
            ${roleOptions}
          </select>
        </div>
        ${roleGuide}
        <div id="share-err" class="share-err"></div>
      </div>`,
    showCancelButton: true,
    confirmButtonText: "Grant access",
    cancelButtonText: "Close",
    preConfirm: async () => {
      const email = document.getElementById("share-email").value.trim();
      const role = document.getElementById("share-role").value;
      if (!email) {
        Swal.showValidationMessage("Enter email");
        return false;
      }
      try {
        const result = await apiShareProject(email, role);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: `Access granted: ${PROJECT_ROLE_LABELS[result.role] || result.role}`,
          text: result.email,
          showConfirmButton: false,
          timer: 2800,
        });
      } catch (err) {
        Swal.showValidationMessage(err.message);
        return false;
      }
    },
  });
}

function _showSyncIndicator() {
  if (typeof setUserSyncStatus === "function") {
    setUserSyncStatus("syncing");
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(() => {
      if (typeof refreshUserSyncStatus === "function") refreshUserSyncStatus();
      else setUserSyncStatus("ok");
    }, 1800);
  }
}

async function _hydrateSession(session, { loadProjects = true } = {}) {
  if (!session?.user) return;
  _sbUser = session.user;
  _sbProfile = await _loadProfile();
  if (typeof refreshUserSyncStatus === "function") refreshUserSyncStatus();
  else updateUserBtn();
  if (loadProjects) await apiLoadProjects();
}

sb.auth.onAuthStateChange(async (event, session) => {
  if ((event === "INITIAL_SESSION" || event === "SIGNED_IN") && session?.user) {
    queueMicrotask(() => {
      _hydrateSession(session, { loadProjects: true }).catch((err) => {
        console.error("[auth] hydrate session failed", err);
      });
    });
    return;
  }

  if (event === "TOKEN_REFRESHED" && session?.user) {
    _sbUser = session.user;
    if (typeof refreshUserSyncStatus === "function") refreshUserSyncStatus();
    else updateUserBtn();
    return;
  }

  if (event === "SIGNED_OUT") {
    _sbUser = _sbProfile = _projectRole = null;
    if (typeof refreshUserSyncStatus === "function") refreshUserSyncStatus("offline");
    else updateUserBtn();
    _updateReadOnlyUI();
    return;
  }

  if (event === "USER_UPDATED" && session?.user) {
    queueMicrotask(() => {
      (async () => {
        _sbUser = session.user;
        _sbProfile = await _loadProfile();
        if (typeof refreshUserSyncStatus === "function") refreshUserSyncStatus();
        else updateUserBtn();
      })().catch((err) => {
        console.error("[auth] user update hydration failed", err);
      });
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  sb.auth.getSession().then(async ({ data: { session } }) => {
    if (session?.user) {
      await _hydrateSession(session, { loadProjects: false });
      return;
    }
    updateUserBtn();
  });
});
