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
  return typeof buildRuntimeAuthRedirectUrl === "function"
    ? buildRuntimeAuthRedirectUrl(window.location.origin, window.location.pathname)
    : `${window.location.origin}${window.location.pathname}`;
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
  const resetState = typeof buildRuntimeResetSupabaseAuthState === "function"
    ? buildRuntimeResetSupabaseAuthState()
    : { user: null, profile: null, projectRole: null };
  _sbUser = resetState.user;
  _sbProfile = resetState.profile;
  _projectRole = resetState.projectRole;
  const registerRequest = typeof buildRuntimeSupabaseRegisterRequest === "function"
    ? buildRuntimeSupabaseRegisterRequest(name, email, password, _getAuthRedirectUrl())
    : {
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: _getAuthRedirectUrl(),
        },
      };
  const { data, error } = await sb.auth.signUp(registerRequest);
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Check your email to confirm registration.");
  _sbUser = data.user;
  const profile = await _loadProfile();
  const hydrated = typeof buildRuntimeHydratedAuthState === "function"
    ? buildRuntimeHydratedAuthState(data.user, profile)
    : { user: data.user, profile };
  _sbUser = hydrated.user;
  _sbProfile = hydrated.profile;
  updateUserBtn();
  return data;
}

async function apiLogin(email, password) {
  const resetState = typeof buildRuntimeResetSupabaseAuthState === "function"
    ? buildRuntimeResetSupabaseAuthState()
    : { user: null, profile: null, projectRole: null };
  _sbUser = resetState.user;
  _sbProfile = resetState.profile;
  _projectRole = resetState.projectRole;
  const loginRequest = typeof buildRuntimeSupabaseLoginRequest === "function"
    ? buildRuntimeSupabaseLoginRequest(email, password)
    : { email, password };
  const { data, error } = await sb.auth.signInWithPassword(loginRequest);
  if (error) throw new Error(error.message);
  _sbUser = data.user;
  const profile = await _loadProfile();
  const hydrated = typeof buildRuntimeHydratedAuthState === "function"
    ? buildRuntimeHydratedAuthState(data.user, profile)
    : { user: data.user, profile };
  _sbUser = hydrated.user;
  _sbProfile = hydrated.profile;
  updateUserBtn();
  return data;
}

async function apiLogout() {
  if (currentId && isLoggedIn()) {
    const currentProject = getCurrentProjectSnapshot();
    const logoutSyncDecision = typeof buildRuntimeLogoutSyncDecision === "function"
      ? buildRuntimeLogoutSyncDecision(currentProject)
      : { shouldSync: (currentProject?._localVersion || 0) > (currentProject?._serverVersion || 0) };
    if (logoutSyncDecision.shouldSync) {
      try {
        await apiSyncProject(currentId);
      } catch (_) {}
    }
  }

  await sb.auth.signOut({ scope: "local" });
  const resetState = typeof buildRuntimeResetSupabaseAuthState === "function"
    ? buildRuntimeResetSupabaseAuthState()
    : { user: null, profile: null, projectRole: null };
  _sbUser = resetState.user;
  _sbProfile = resetState.profile;
  _projectRole = resetState.projectRole;

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
  const profile = await _loadProfile();
  const hydrated = typeof buildRuntimeHydratedAuthState === "function"
    ? buildRuntimeHydratedAuthState(user, profile)
    : { user, profile };
  _sbUser = hydrated.user;
  _sbProfile = hydrated.profile;
  return _sbProfile;
}

async function _loadProfile() {
  if (!_sbUser) return null;
  const profileSelectRequest = typeof buildRuntimeSupabaseProfileSelectRequest === "function"
    ? buildRuntimeSupabaseProfileSelectRequest(_sbUser.id)
    : { userId: _sbUser.id };

  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("id", profileSelectRequest.userId)
    .maybeSingle();

  if (data) return data;
  if (error) throw new Error(error.message);

  const { data: ensuredProfile, error: ensureError } = await sb.rpc("ensure_my_profile");
  if (ensureError) throw new Error(ensureError.message);
  return ensuredProfile || null;
}

async function apiUpdateProfile(updates) {
  if (!_sbUser) return;

  const dbUpdates = typeof buildRuntimeSupabaseProfileUpdatePayload === "function"
    ? buildRuntimeSupabaseProfileUpdatePayload(updates)
    : (() => {
        const fallbackUpdates = {};
        if (updates.name !== undefined) fallbackUpdates.name = updates.name;
        if (updates.avatar !== undefined) fallbackUpdates.avatar = updates.avatar;
        if (updates.theme !== undefined) fallbackUpdates.theme = updates.theme;
        if (updates.defaults) {
          if (updates.defaults.sm !== undefined) fallbackUpdates.default_sm = updates.defaults.sm;
          if (updates.defaults.sy !== undefined) fallbackUpdates.default_sy = updates.defaults.sy;
          if (updates.defaults.nm !== undefined) fallbackUpdates.default_nm = updates.defaults.nm;
        }
        return fallbackUpdates;
      })();

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
  const loadDecision = typeof buildRuntimeResolveProjectLoadDecision === "function"
    ? buildRuntimeResolveProjectLoadDecision(localProject)
    : {
        shouldSyncFirst: (localProject?._localVersion || 0) > (localProject?._serverVersion || 0),
        serverId: getProjectServerId(localId),
      };
  const serverId = loadDecision.serverId || getProjectServerId(localId);
  if (!serverId) return;

  if (loadDecision.shouldSyncFirst) {
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

    let shareRole = null;
    if (projectRow.owner_id !== authUser.id) {
      const { data: shareRow } = await sb
        .from("project_shares")
        .select("role")
        .eq("project_id", serverId)
        .eq("user_id", authUser.id)
        .single();
      shareRole = shareRow?.role || "viewer";
    }
    const resolvedRole = typeof buildRuntimeResolveLoadedProjectRole === "function"
      ? buildRuntimeResolveLoadedProjectRole(projectRow.owner_id, authUser.id, shareRole)
      : (projectRow.owner_id === authUser.id ? "owner" : normalizeProjectRole(shareRole || "viewer"));
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
    currentId = typeof buildRuntimeResolveCurrentProjectId === "function"
      ? buildRuntimeResolveCurrentProjectId(allProjects, currentId, bufferCurrentId)
      : (bufferCurrentId && allProjects[bufferCurrentId]
          ? bufferCurrentId
          : ((!currentId || !allProjects[currentId]) ? Object.keys(allProjects)[0] : currentId));

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

    const syncRequest = typeof buildRuntimeProjectSyncMutationRequest === "function"
      ? buildRuntimeProjectSyncMutationRequest(serverId, projectSnapshot)
      : {
          projectId: serverId,
          updatePayload: {
            ...buildSupabaseProjectMutationPayload(projectSnapshot),
            updated_at: new Date().toISOString(),
          },
          tasksRpc: {
            p_project_id: serverId,
            p_tasks: _buildTasksPayload(projectSnapshot.tasks),
          },
          expectedTaskCount: (projectSnapshot.tasks || []).length,
        };

    const [projectResult, tasksResult] = await Promise.all([
      sb.from("projects").update(syncRequest.updatePayload).eq("id", syncRequest.projectId),
      sb.rpc("upsert_tasks", syncRequest.tasksRpc),
    ]);

    if (projectResult.error) throw projectResult.error;
    if (tasksResult.error) throw tasksResult.error;
    await _assertSyncedTaskCount(syncRequest.projectId, syncRequest.expectedTaskCount);

    if (allProjects[snapId]) {
      allProjects[snapId] = typeof buildRuntimeProjectSyncSuccessSnapshot === "function"
        ? buildRuntimeProjectSyncSuccessSnapshot(allProjects[snapId])
        : {
            ...allProjects[snapId],
            _serverVersion: allProjects[snapId]._localVersion,
          };
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

  const createRequest = typeof buildRuntimeProjectCreateMutationRequest === "function"
    ? buildRuntimeProjectCreateMutationRequest(projectSnapshot, authUser.id)
    : {
        insertPayload: buildSupabaseProjectInsertPayload(projectSnapshot, authUser.id),
        tasksRpc: (projectSnapshot.tasks || []).length > 0
          ? { p_project_id: "__PROJECT_ID__", p_tasks: _buildTasksPayload(projectSnapshot.tasks) }
          : null,
        expectedTaskCount: (projectSnapshot.tasks || []).length,
      };
  const { error: insertError } = await sb.from("projects").insert(createRequest.insertPayload);

  if (insertError) {
    console.error("[supabase] apiCreateProject insert failed", {
      authUserId: authUser.id,
      ownerId: createRequest.insertPayload.owner_id,
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

  allProjects[snapId] = typeof buildRuntimeProjectCreateSuccessSnapshot === "function"
    ? buildRuntimeProjectCreateSuccessSnapshot(projectSnapshot, data.id)
    : { ...projectSnapshot, _serverId: data.id, _role: "owner" };
  setProjectOwnerRole(snapId);
  _saveBuffer();

  try {
    const tasksRpcRequest = typeof buildRuntimeBindProjectCreateTasksRpcRequest === "function"
      ? buildRuntimeBindProjectCreateTasksRpcRequest(createRequest, data.id)
      : (createRequest.tasksRpc
          ? {
              ...createRequest.tasksRpc,
              p_project_id: data.id,
            }
          : null);
    if (tasksRpcRequest) {
      const { error: tasksError } = await sb.rpc("upsert_tasks", tasksRpcRequest);
      if (tasksError) throw tasksError;
    }
    await _assertSyncedTaskCount(data.id, createRequest.expectedTaskCount);

    allProjects[snapId] = typeof buildRuntimeProjectSyncSuccessSnapshot === "function"
      ? buildRuntimeProjectSyncSuccessSnapshot(allProjects[snapId])
      : {
          ...allProjects[snapId],
          _serverVersion: allProjects[snapId]._localVersion,
        };
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
  const deleteRequest = typeof buildRuntimeProjectDeleteRequest === "function"
    ? buildRuntimeProjectDeleteRequest(serverId)
    : { projectId: serverId };
  await sb.from("projects").delete().eq("id", deleteRequest.projectId);
}

async function apiLogActivity(eventType, payload = {}) {
  const authUser = await _getCurrentAuthUser();
  if (!authUser) return;
  const serverId = getCurrentProjectServerId();
  if (!serverId) return;

  const activityRequest = typeof buildRuntimeSupabaseActivityWriteRequest === "function"
    ? buildRuntimeSupabaseActivityWriteRequest({
        projectId: serverId,
        actorId: authUser.id,
        actorName: _sbProfile?.name || authUser?.user_metadata?.name || null,
        actorEmail: authUser?.email || null,
        eventType,
        payload,
      })
    : {
        payload: buildSupabaseActivityInsertPayload({
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
        }),
      };

  const { error } = await sb.from("activity_log").insert(activityRequest.payload);
  if (error) throw error;
}

async function apiGetShares() {
  const authUser = await _getCurrentAuthUser();
  const serverId = getCurrentProjectServerId();
  if (!serverId || !authUser) return [];

  const shareListRpcRequest = typeof buildRuntimeBuildShareListRpcRequest === "function"
    ? buildRuntimeBuildShareListRpcRequest(serverId)
    : { p_project_id: serverId };
  const { data: rpcShares, error: rpcSharesError } = await sb.rpc("list_project_shares", shareListRpcRequest);
  if (!rpcSharesError && Array.isArray(rpcShares)) {
    return rpcShares.map(mapSupabaseShareRecord);
  }

  const shareListFallbackRequest = typeof buildRuntimeBuildShareListFallbackRequest === "function"
    ? buildRuntimeBuildShareListFallbackRequest(serverId)
    : { projectId: serverId };
  const { data, error } = await sb
    .from("project_shares")
    .select("id, role, user_id, created_at")
    .eq("project_id", shareListFallbackRequest.projectId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data || []).map(mapSupabaseFallbackShareRecord);
}

async function apiShareProject(email, role = "viewer") {
  const authUser = await _getCurrentAuthUser();
  const serverId = getCurrentProjectServerId();
  if (!serverId || !authUser) return;
  if (!canInviteUsers()) throw new Error("You do not have permission to invite users.");

  const shareGrantInput = typeof buildRuntimeNormalizeShareGrantInput === "function"
    ? buildRuntimeNormalizeShareGrantInput(email, role, isShareableProjectRole)
    : {
        normalizedEmail: String(email || "").trim().toLowerCase(),
        normalizedRole: normalizeProjectRole(role),
      };
  const shareRole = shareGrantInput.normalizedRole;
  const normalizedEmail = shareGrantInput.normalizedEmail;

  const shareLookupRequest = typeof buildRuntimeBuildShareLookupRequest === "function"
    ? buildRuntimeBuildShareLookupRequest(normalizedEmail)
    : { p_email: normalizedEmail };
  const { data: targetUserId, error: lookupError } = await sb.rpc("get_user_id_by_email", shareLookupRequest);
  if (lookupError) throw new Error(lookupError.message);
  const resolvedTargetUserId = typeof buildRuntimeResolveShareTargetUser === "function"
    ? buildRuntimeResolveShareTargetUser(targetUserId, authUser.id)
    : (() => {
        if (!targetUserId) throw new Error("User with this email was not found. They need to register first.");
        if (targetUserId === authUser.id) throw new Error("You already have access to this project as the owner.");
        return targetUserId;
      })();

  const sharePayload = typeof buildRuntimeBuildShareGrantRequest === "function"
    ? buildRuntimeBuildShareGrantRequest({
        projectId: serverId,
        userId: resolvedTargetUserId,
        role: shareRole,
        invitedBy: authUser.id,
      })
    : buildSupabaseProjectShareUpsertPayload({
        projectId: serverId,
        userId: resolvedTargetUserId,
        role: shareRole,
        invitedBy: authUser.id,
      });

  const shareUpsertOptions = typeof buildRuntimeBuildShareUpsertOptions === "function"
    ? buildRuntimeBuildShareUpsertOptions()
    : { onConflict: "project_id,user_id" };
  const { error } = await sb.from("project_shares").upsert(
    sharePayload,
    shareUpsertOptions,
  );

  if (error) throw new Error(error.message);
  _showSyncIndicator();
  await logShareActivity(AUDIT_EVENT_TYPES.SHARE_GRANTED, resolvedTargetUserId, {
    email: normalizedEmail,
    role: shareRole,
  });
  return typeof buildRuntimeBuildShareGrantResult === "function"
    ? buildRuntimeBuildShareGrantResult(resolvedTargetUserId, normalizedEmail, shareRole)
    : { userId: resolvedTargetUserId, email: normalizedEmail, role: shareRole };
}

async function apiUpdateShareRole(shareId, role) {
  if (!canManageShares()) throw new Error("You do not have permission to manage access.");

  const shareRoleUpdateRequest = typeof buildRuntimeBuildShareRoleUpdateRequest === "function"
    ? buildRuntimeBuildShareRoleUpdateRequest(role, isShareableProjectRole)
    : buildSupabaseProjectShareRoleUpdatePayload(normalizeProjectRole(role));
  const shareRole = typeof buildRuntimeBuildShareRoleUpdateResult === "function"
    ? buildRuntimeBuildShareRoleUpdateResult(role)
    : normalizeProjectRole(role);

  const { error } = await sb
    .from("project_shares")
    .update(shareRoleUpdateRequest)
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
  const shareRemoveRequest = typeof buildRuntimeBuildShareRemoveRequest === "function"
    ? buildRuntimeBuildShareRemoveRequest(shareId)
    : { shareId };
  const { error } = await sb.from("project_shares").delete().eq("id", shareRemoveRequest.shareId);
  if (error) throw new Error(error.message);
  _showSyncIndicator();
  await logShareActivity(AUDIT_EVENT_TYPES.SHARE_REVOKED, shareRemoveRequest.shareId);
}

async function apiGetActivityLog(limit = 100) {
  const authUser = await _getCurrentAuthUser();
  const serverId = getCurrentProjectServerId();
  if (!serverId || !authUser) return [];
  const activityLogReadRequest = typeof buildRuntimeSupabaseActivityLogReadRequest === "function"
    ? buildRuntimeSupabaseActivityLogReadRequest(serverId, limit)
    : {
        projectId: serverId,
        limit: typeof buildRuntimeResolveActivityLogLimit === "function"
          ? buildRuntimeResolveActivityLogLimit(limit)
          : Math.max(1, Math.min(500, Number(limit) || 100)),
      };

  const { data, error } = await sb
    .from("activity_log")
    .select("id, project_id, actor_id, actor_name, actor_email, event_type, entity_type, entity_id, payload, created_at")
    .eq("project_id", activityLogReadRequest.projectId)
    .order("created_at", { ascending: false })
    .limit(activityLogReadRequest.limit);

  if (error) throw new Error(error.message);
  return (data || []).map(mapSupabaseActivityRow);
}

function _updateReadOnlyUI() {
  const readonly = !canEditTasks();
  const canShare = canManageShares();
  const role = typeof getProjectRole === "function" ? getProjectRole() : (allProjects?.[currentId]?._role || "owner");
  const accessMeta = allProjects?.[currentId]?._access || null;
  const bannerModel = typeof buildRuntimeAccessBannerModel === "function"
    ? buildRuntimeAccessBannerModel(role, accessMeta)
    : {
        shouldShow: role !== "owner",
        roleLabel: typeof PROJECT_ROLE_LABELS !== "undefined" ? (PROJECT_ROLE_LABELS[role] || role) : role,
        roleHint: typeof getProjectRoleHint === "function" ? getProjectRoleHint(role) : "",
        sharedMetaText: accessMeta?.source === "shared"
          ? [accessMeta.ownerName || accessMeta.ownerEmail, accessMeta.invitedByName || accessMeta.invitedByEmail]
              .filter(Boolean)
              .join(" ? ")
          : "",
      };

  const uiState = typeof buildRuntimeSupabaseReadOnlyUiState === "function"
    ? buildRuntimeSupabaseReadOnlyUiState({
        readonly,
        canShare,
        isLoggedIn: isLoggedIn(),
        bannerModel,
      })
    : {
        showReadonlyBanner: readonly,
        headerBannerVisible: bannerModel.shouldShow,
        headerBannerClassName: `project-access-banner${readonly ? " is-readonly" : " is-limited"}`,
        headerBannerHtml: bannerModel.shouldShow
          ? `<span class="project-access-pill">${bannerModel.roleLabel}</span><span class="project-access-text">${bannerModel.roleHint}${bannerModel.sharedMetaText ? ` ${bannerModel.sharedMetaText}` : ""}</span>`
          : "",
        ganttPointerEvents: readonly ? "none" : "",
        ganttOpacity: readonly ? "0.85" : "",
        ganttTitle: readonly ? "View-only mode - editing is disabled" : "",
        addButtonVisible: !readonly,
        shareButtonVisible: isLoggedIn() && canShare,
      };

  const banner = document.getElementById("readonly-banner");
  if (banner) banner.style.display = uiState.showReadonlyBanner ? "flex" : "none";

  const headerBanner = document.getElementById("project-access-banner");
  if (headerBanner) {
    headerBanner.style.display = uiState.headerBannerVisible ? "flex" : "none";
    headerBanner.className = uiState.headerBannerClassName;
    headerBanner.innerHTML = uiState.headerBannerHtml;
  }

  const ganttTable = document.getElementById("gtbl-wrap");
  if (ganttTable) {
    ganttTable.style.pointerEvents = uiState.ganttPointerEvents;
    ganttTable.style.opacity = uiState.ganttOpacity;
    ganttTable.title = uiState.ganttTitle;
  }

  const addBtn = document.querySelector(".btn-acc[onclick='openAdd()']");
  if (addBtn) addBtn.style.display = uiState.addButtonVisible ? "" : "none";

  const shareBtn = document.getElementById("share-btn");
  if (shareBtn) shareBtn.style.display = uiState.shareButtonVisible ? "" : "none";
}

async function handleShareRoleChange(shareId, role) {
  try {
    const nextRole = await apiUpdateShareRole(shareId, role);
    const toastModel = typeof buildRuntimeSupabaseRoleUpdatedToast === "function"
      ? buildRuntimeSupabaseRoleUpdatedToast(
          typeof getRuntimeProjectRoleLabel === "function" ? getRuntimeProjectRoleLabel(nextRole) : (PROJECT_ROLE_LABELS[nextRole] || nextRole),
        )
      : {
          title: `Role updated: ${typeof getRuntimeProjectRoleLabel === "function" ? getRuntimeProjectRoleLabel(nextRole) : (PROJECT_ROLE_LABELS[nextRole] || nextRole)}`,
          timer: 2600,
        };
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: toastModel.title,
      showConfirmButton: false,
      timer: toastModel.timer,
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
    const toastModel = typeof buildRuntimeSupabaseShareRemovedToast === "function"
      ? buildRuntimeSupabaseShareRemovedToast()
      : { title: "Access removed", timer: 2400 };
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: toastModel.title,
      showConfirmButton: false,
      timer: toastModel.timer,
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

  const getRoleLabel = (role) => typeof getRuntimeProjectRoleLabel === "function" ? getRuntimeProjectRoleLabel(role) : PROJECT_ROLE_LABELS[role];
  const roleOptions = typeof buildRuntimeSupabaseShareRoleOptions === "function"
    ? buildRuntimeSupabaseShareRoleOptions(SHAREABLE_PROJECT_ROLES, getRoleLabel, "viewer")
    : SHAREABLE_PROJECT_ROLES.map(
        (role) => `<option value="${role}">${getRoleLabel(role)}</option>`,
      ).join("");
  const roleGuideItems = typeof buildRuntimeSupabaseShareRoleGuide === "function"
    ? buildRuntimeSupabaseShareRoleGuide()
    : [
        { title: "Manager", description: "manages access and project settings." },
        { title: "Editor", description: "edits tasks but cannot manage access." },
        { title: "Viewer", description: "read-only access." },
      ];
  const roleGuide = `
    <div class="share-role-guide">
      ${roleGuideItems.map((item) => `<div><b>${item.title}:</b> ${item.description}</div>`).join("")}
    </div>`;

  const shareModalState = typeof buildRuntimeSupabaseShareModalState === "function"
    ? buildRuntimeSupabaseShareModalState({
        shares,
        projectName: proj.name,
        getRoleLabel,
      })
    : {
        projectName: proj.name,
        items: shares.map((share) => ({
          id: share.id,
          role: normalizeProjectRole(share.role),
          normalizedRole: normalizeProjectRole(share.role),
          roleLabel: getRoleLabel(share.role),
          displayLabel: share.user?.email || share.user?.name || share.user?.id || "-",
        })),
      };

  const list = shareModalState.items.length
    ? shareModalState.items.map((share) => {
      return `
        <div class="share-row">
          <span>${share.displayLabel}</span>
          <select class="cost-sel" onchange="handleShareRoleChange('${share.id}',this.value)">
            ${typeof buildRuntimeSupabaseShareRoleOptions === "function"
              ? buildRuntimeSupabaseShareRoleOptions(SHAREABLE_PROJECT_ROLES, getRoleLabel, share.normalizedRole || share.role)
              : SHAREABLE_PROJECT_ROLES.map(
                  (role) => `<option value="${role}"${share.normalizedRole === role ? " selected" : ""}>${getRoleLabel(role)}</option>`,
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
        <div class="share-proj-name">Project: <b>${shareModalState.projectName}</b></div>
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
        const toastModel = typeof buildRuntimeSupabaseShareGrantedToast === "function"
          ? buildRuntimeSupabaseShareGrantedToast(
              typeof getRuntimeProjectRoleLabel === "function" ? getRuntimeProjectRoleLabel(result.role) : (PROJECT_ROLE_LABELS[result.role] || result.role),
              result.email,
            )
          : {
              title: `Access granted: ${typeof getRuntimeProjectRoleLabel === "function" ? getRuntimeProjectRoleLabel(result.role) : (PROJECT_ROLE_LABELS[result.role] || result.role)}`,
              text: result.email,
              timer: 2800,
            };
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: toastModel.title,
          text: toastModel.text,
          showConfirmButton: false,
          timer: toastModel.timer,
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
    const plan = typeof buildRuntimeSupabaseSyncIndicatorPlan === "function"
      ? buildRuntimeSupabaseSyncIndicatorPlan()
      : { status: "syncing", timeoutMs: 1800 };
    setUserSyncStatus(plan.status);
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(() => {
      if (typeof refreshUserSyncStatus === "function") refreshUserSyncStatus();
      else setUserSyncStatus("ok");
    }, plan.timeoutMs);
  }
}

async function _hydrateSession(session, { loadProjects = true } = {}) {
  if (!session?.user) return;
  _sbUser = session.user;
  const profile = await _loadProfile();
  const hydrated = typeof buildRuntimeHydratedAuthState === "function"
    ? buildRuntimeHydratedAuthState(session.user, profile)
    : { user: session.user, profile };
  _sbUser = hydrated.user;
  _sbProfile = hydrated.profile;
  if (typeof refreshUserSyncStatus === "function") refreshUserSyncStatus();
  else updateUserBtn();
  if (loadProjects) await apiLoadProjects();
}

sb.auth.onAuthStateChange(async (event, session) => {
  const plan = typeof buildRuntimeResolveSupabaseAuthEventPlan === "function"
    ? buildRuntimeResolveSupabaseAuthEventPlan(event, !!session?.user)
    : {
        kind: (event === "INITIAL_SESSION" || event === "SIGNED_IN") && session?.user
          ? "hydrate"
          : event === "TOKEN_REFRESHED" && session?.user
            ? "refresh"
            : event === "SIGNED_OUT"
              ? "signed_out"
              : event === "USER_UPDATED" && session?.user
                ? "hydrate"
                : "noop",
        loadProjects: event === "INITIAL_SESSION" || event === "SIGNED_IN",
        refreshStatus: event === "SIGNED_OUT" ? "offline" : undefined,
      };

  if (plan.kind === "hydrate" && session?.user) {
    queueMicrotask(() => {
      _hydrateSession(session, { loadProjects: plan.loadProjects }).catch((err) => {
        console.error("[auth] hydrate session failed", err);
      });
    });
    return;
  }

  if (plan.kind === "refresh" && session?.user) {
    _sbUser = session.user;
    if (typeof refreshUserSyncStatus === "function") refreshUserSyncStatus();
    else updateUserBtn();
    return;
  }

  if (plan.kind === "signed_out") {
    const resetState = typeof buildRuntimeResetSupabaseAuthState === "function"
      ? buildRuntimeResetSupabaseAuthState()
      : { user: null, profile: null, projectRole: null };
    _sbUser = resetState.user;
    _sbProfile = resetState.profile;
    _projectRole = resetState.projectRole;
    if (typeof refreshUserSyncStatus === "function") refreshUserSyncStatus(plan.refreshStatus || "offline");
    else updateUserBtn();
    _updateReadOnlyUI();
    return;
  }

  if (plan.kind === "noop") return;
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
