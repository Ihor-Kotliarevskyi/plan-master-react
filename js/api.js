/**
 * API адаптер v1 — Express + MongoDB бекенд (резервний).
 * Підключати ТІЛЬКИ ОДИН з двох: api.js АБО supabase-api.js.
 * Щоб активувати: розкоментуйте <script src="./js/api.js"> в index.html
 * і закоментуйте <script src="./js/supabase-api.js">.
 */

const API_URL = "https://your-api.onrender.com"; // замінити на реальний Render URL
// const API_URL = "http://localhost:4000";

const V1 = `${API_URL}/api/v1`;

let _authToken = localStorage.getItem("gantt_token") || null;
let _apiUser = null;
let _projectRole = null;
const API_UI = typeof buildRuntimeApiUiModel === "function"
  ? buildRuntimeApiUiModel()
  : {
      sessionExpiredTitle: "Session expired — sign in again",
      share: {
        accessDeniedTitle: "You do not have access management permissions",
        emptyText: "No one has access yet",
        modalTitle: "Shared access",
        projectLabel: "Project",
        grantSectionTitle: "Grant access:",
        confirmButtonText: API_UI.share.confirmButtonText,
    cancelButtonText: API_UI.share.cancelButtonText,
        emailRequiredMessage: "Enter email",
      },
      auth: {
        loginTabLabel: "Sign in",
        registerTabLabel: "Register",
        nameLabel: "Name",
        namePlaceholder: "Your name",
        passwordLabel: "Password",
        passwordPlaceholder: "Minimum 6 characters",
        loginSubmitLabel: "Sign in",
        registerSubmitLabel: "Create account",
        nameRequiredMessage: "Enter name",
        loginSuccessTitle: (name) => `Welcome, ${name}! ☁ Sync enabled`,
        authErrorFallback: "Authentication error",
        syncedTitle: "Synced. Click to sign out",
        syncedLogoutPromptTitle: "Sign out?",
        syncedLogoutPromptText: "Your data will remain in this browser.",
        logoutConfirmButtonText: "Sign out",
        loginButtonLabel: "☁ Sign in",
      },
    };

function isLoggedIn() { return !!_authToken; }
function _getCurrentRole() {
  return typeof getStoredProjectRole === "function"
    ? getStoredProjectRole(currentId, _projectRole || "owner")
    : _projectRole;
}
function isReadOnly() {
  return typeof canEditTasks === "function"
    ? !canEditTasks(_getCurrentRole())
    : _projectRole === "viewer";
}
function canEdit() {
  return typeof canEditTasks === "function"
    ? canEditTasks(_getCurrentRole())
    : !isReadOnly();
}

async function _fetch(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  if (_authToken) headers["Authorization"] = `Bearer ${_authToken}`;

  const res = await fetch(`${V1}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && data.expired) {
    apiLogout();
    Swal.fire({
      toast: true, position: "top-end", icon: "warning",
      title: API_UI.sessionExpiredTitle,
      showConfirmButton: false, timer: 3500,
    });
    return null;
  }
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function apiRegister(name, email, password) {
  const registerRequest = typeof buildRuntimeFallbackRegisterRequest === "function"
    ? buildRuntimeFallbackRegisterRequest(name, email, password)
    : { name, email, password };
  const data = await _fetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(registerRequest),
  });
  const hydratedState = typeof buildRuntimeFallbackAuthHydratedState === "function"
    ? buildRuntimeFallbackAuthHydratedState(data.token, data.user)
    : { token: data.token, user: data.user, projectRole: null };
  _authToken = hydratedState.token;
  _apiUser = hydratedState.user;
  _projectRole = hydratedState.projectRole;
  localStorage.setItem("gantt_token", _authToken);
  return data;
}

async function apiLogin(email, password) {
  const loginRequest = typeof buildRuntimeFallbackLoginRequest === "function"
    ? buildRuntimeFallbackLoginRequest(email, password)
    : { email, password };
  const data = await _fetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(loginRequest),
  });
  const hydratedState = typeof buildRuntimeFallbackAuthHydratedState === "function"
    ? buildRuntimeFallbackAuthHydratedState(data.token, data.user)
    : { token: data.token, user: data.user, projectRole: null };
  _authToken = hydratedState.token;
  _apiUser = hydratedState.user;
  _projectRole = hydratedState.projectRole;
  localStorage.setItem("gantt_token", _authToken);
  return data;
}

function apiLogout() {
  const resetState = typeof buildRuntimeResetFallbackAuthState === "function"
    ? buildRuntimeResetFallbackAuthState()
    : { token: null, user: null, projectRole: null };
  _authToken = resetState.token;
  _apiUser = resetState.user;
  _projectRole = resetState.projectRole;
  localStorage.removeItem("gantt_token");
  updateUserBtn?.();
}

async function apiGetMe() {
  if (!_authToken) return null;
  try {
    const data = await _fetch("/auth/me");
    _apiUser = data?.user;
    return _apiUser;
  } catch (_) { return null; }
}

async function apiUpdateProfile(updates) {
  if (!_authToken) return;
  const updateRequest = typeof buildRuntimeFallbackProfileUpdateRequest === "function"
    ? buildRuntimeFallbackProfileUpdateRequest(updates)
    : { body: updates };
  return _fetch("/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(updateRequest.body),
  });
}

async function apiLoadProjects() {
  if (!_authToken) return;
  try {
    const data = await _fetch("/projects");
    if (!data?.projects) return;

    data.projects.forEach((sp) => {
      if (!allProjects[sp.id]) {
        allProjects[sp.id] = typeof buildRuntimeFallbackProjectShell === "function"
          ? buildRuntimeFallbackProjectShell(sp)
          : {
              proj: { name: sp.name, sm: sp.sm, sy: sp.sy, nm: sp.nm },
              cats: [],
              tasks: [],
              nextN: 1,
              _serverId: sp.id,
              _role: typeof normalizeProjectRole === "function" ? normalizeProjectRole(sp.role || "owner") : (sp.role || "owner"),
            };
      }
    });
    updateProjSel?.();
  } catch (_) {}
}

async function apiLoadProject(localId) {
  if (!_authToken) return;
  const serverId = typeof getProjectServerId === "function"
    ? getProjectServerId(localId)
    : allProjects[localId]?._serverId;
  if (!serverId) return;

  try {
    const projData = await _fetch(`/projects/${serverId}`);
    if (!projData?.project) return;
    const p = projData.project;

    const resolvedRole = typeof normalizeProjectRole === "function"
      ? normalizeProjectRole(projData.role || "owner")
      : (projData.role || "owner");
    if (typeof setProjectRole === "function") setProjectRole(localId, resolvedRole);
    else _projectRole = resolvedRole;

    const taskData = await _fetch(`/projects/${serverId}/tasks`);
    const tasks = taskData?.tasks || [];

    allProjects[localId] = typeof buildRuntimeFallbackLoadedProjectSnapshot === "function"
      ? buildRuntimeFallbackLoadedProjectSnapshot(
          localId,
          p,
          tasks,
          resolvedRole,
          typeof getStoredProjectRole === "function" ? getStoredProjectRole : undefined,
        )
      : {
          proj: {
            name: p.name,
            sm: p.sm,
            sy: p.sy,
            nm: p.nm,
            baseline: p.baseline,
            baselineDate: p.baselineDate,
          },
          cats: p.cats || [],
          tasks,
          nextN: p.nextN || 1,
          _serverId: p._id,
          _role: typeof getStoredProjectRole === "function"
            ? getStoredProjectRole(localId, resolvedRole)
            : (typeof normalizeProjectRole === "function" ? normalizeProjectRole(_projectRole, _projectRole) : _projectRole),
        };

    loadCurrent();
    render();
    _updateReadOnlyUI();
  } catch (_) {}
}

let _syncProjTimer = null;
let _syncTasksTimer = null;

async function apiSyncProject() {
  if (!_authToken || !currentId || (typeof canEditTasks === "function" ? !canEditTasks(_getCurrentRole()) : !canEdit())) return;
  const p = typeof getCurrentProjectSnapshot === "function" ? getCurrentProjectSnapshot() : allProjects[currentId];
  const serverId = typeof getCurrentProjectServerId === "function" ? getCurrentProjectServerId() : p?._serverId;

  if (!serverId) { await apiCreateProject(); return; }

  clearTimeout(_syncProjTimer);
  _syncProjTimer = setTimeout(async () => {
    try {
      const syncRequest = typeof buildRuntimeFallbackProjectSyncRequest === "function"
        ? buildRuntimeFallbackProjectSyncRequest(p)
        : {
            projectPayload: {
              name: p.proj.name,
              sm: p.proj.sm,
              sy: p.proj.sy,
              nm: p.proj.nm,
              cats: p.cats,
              nextN: p.nextN,
              baseline: p.proj.baseline || null,
              baselineDate: p.proj.baselineDate || null,
            },
            tasksPayload: { tasks: p.tasks },
          };
      await _fetch(`/projects/${serverId}`, {
        method: "PUT",
        body: JSON.stringify(syncRequest.projectPayload),
      });
      _showSyncIndicator();
    } catch (_) {}
  }, 500);

  clearTimeout(_syncTasksTimer);
  _syncTasksTimer = setTimeout(async () => {
    try {
      const syncRequest = typeof buildRuntimeFallbackProjectSyncRequest === "function"
        ? buildRuntimeFallbackProjectSyncRequest(p)
        : {
            projectPayload: {},
            tasksPayload: { tasks: p.tasks },
          };
      await _fetch(`/projects/${serverId}/tasks/bulk`, {
        method: "PUT",
        body: JSON.stringify(syncRequest.tasksPayload),
      });
    } catch (_) {}
  }, 800);
}

async function apiCreateProject() {
  if (!_authToken || !currentId) return;
  const p = typeof getCurrentProjectSnapshot === "function" ? getCurrentProjectSnapshot() : allProjects[currentId];
  try {
    const createRequest = typeof buildRuntimeFallbackProjectCreateRequest === "function"
      ? buildRuntimeFallbackProjectCreateRequest(p)
      : {
          payload: {
            name: p.proj.name,
            sm: p.proj.sm,
            sy: p.proj.sy,
            nm: p.proj.nm,
            cats: p.cats,
            tasks: p.tasks,
            nextN: p.nextN,
          },
        };
    const data = await _fetch("/projects", {
      method: "POST",
      body: JSON.stringify(createRequest.payload),
    });
    if (data?.project) {
      if (p) p._serverId = data.project.id;
      if (typeof setProjectOwnerRole === "function") setProjectOwnerRole(currentId);
      else {
        allProjects[currentId]._role = "owner";
        _projectRole = "owner";
      }
      const payload = typeof buildRuntimeStorageBufferPayload === "function"
        ? buildRuntimeStorageBufferPayload(allProjects, currentId, null)
        : { allProjects, currentId };
      localStorage.setItem(SK_BUF, JSON.stringify(payload));
    }
  } catch (_) {}
}

async function apiDeleteProject(localId) {
  if (!_authToken) return;
  const serverId = typeof getProjectServerId === "function"
    ? getProjectServerId(localId)
    : allProjects[localId]?._serverId;
  if (!serverId) return;
  try {
    const deleteRequest = typeof buildRuntimeFallbackProjectDeleteRequest === "function"
      ? buildRuntimeFallbackProjectDeleteRequest(serverId)
      : { projectId: serverId };
    await _fetch(`/projects/${deleteRequest.projectId}`, { method: "DELETE" });
  } catch (_) {}
}

async function apiLogActivity() {
  return null;
}

async function apiGetActivityLog() {
  return [];
}

function _updateReadOnlyUI() {
  const readonly = isReadOnly();
  const role = _getCurrentRole() || "owner";
  const accessMeta = allProjects?.[currentId]?._access || null;
  const bannerModel = typeof buildRuntimeAccessBannerModel === "function"
    ? buildRuntimeAccessBannerModel(role, accessMeta)
    : {
        shouldShow: role !== "owner",
        roleLabel: typeof PROJECT_ROLE_LABELS !== "undefined" ? (PROJECT_ROLE_LABELS[role] || role) : role,
        roleHint: typeof getProjectRoleHint === "function" ? getProjectRoleHint(role) : "",
        sharedMetaText: accessMeta?.source === "shared"
          ? [accessMeta.ownerName || accessMeta.ownerEmail, accessMeta.invitedByName || accessMeta.invitedByEmail].filter(Boolean).join(" · ")
          : "",
      };

  const banner = document.getElementById("readonly-banner");
  if (banner) banner.style.display = readonly ? "flex" : "none";

  const headerBanner = document.getElementById("project-access-banner");
  if (headerBanner) {
    headerBanner.style.display = bannerModel.shouldShow ? "flex" : "none";
    headerBanner.className = `project-access-banner${readonly ? " is-readonly" : " is-limited"}`;
    headerBanner.innerHTML = bannerModel.shouldShow
      ? `<span class="project-access-pill">${bannerModel.roleLabel}</span><span class="project-access-text">${bannerModel.roleHint}${bannerModel.sharedMetaText ? ` ${bannerModel.sharedMetaText}` : ""}</span>`
      : "";
  }

  const gtbl = document.getElementById("gtbl-wrap");
  if (gtbl) {
    gtbl.style.pointerEvents = readonly ? "none" : "";
    gtbl.style.opacity = readonly ? "0.85" : "";
  }

  const addBtn = document.querySelector(".btn-acc[onclick='openAdd()']");
  if (addBtn) addBtn.style.display = readonly ? "none" : "";

  const shareBtn = document.getElementById("share-btn");
  if (shareBtn) {
    shareBtn.style.display =
      isLoggedIn() && canManageShares() ? "" : "none";
  }
}

async function apiGetShares() {
  const sid = typeof getCurrentProjectServerId === "function"
    ? getCurrentProjectServerId()
    : allProjects[currentId]?._serverId;
  if (!sid || !_authToken) return [];
  try {
    const data = await _fetch(`/projects/${sid}/shares`);
    return data?.shares || [];
  } catch { return []; }
}

async function apiShareProject(email, role = "viewer") {
  const sid = typeof getCurrentProjectServerId === "function"
    ? getCurrentProjectServerId()
    : allProjects[currentId]?._serverId;
  if (!sid) return;
  if (!canInviteUsers()) throw new Error("У вас немає прав на запрошення користувачів");
  const shareRole = normalizeProjectRole(role);
  if (!isShareableProjectRole(shareRole)) throw new Error("Непідтримувана роль доступу");
  return _fetch(`/projects/${sid}/shares`, {
    method: "POST",
    body: JSON.stringify({ email, role: shareRole }),
  });
}

async function apiUpdateShareRole(userId, role) {
  const sid = typeof getCurrentProjectServerId === "function"
    ? getCurrentProjectServerId()
    : allProjects[currentId]?._serverId;
  if (!sid) return;
  if (!canManageShares()) throw new Error("У вас немає прав на зміну доступу");
  const shareRole = normalizeProjectRole(role);
  if (!isShareableProjectRole(shareRole)) throw new Error("Непідтримувана роль доступу");
  return _fetch(`/projects/${sid}/shares/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ role: shareRole }),
  });
}

async function apiRemoveShare(userId) {
  const sid = typeof getCurrentProjectServerId === "function"
    ? getCurrentProjectServerId()
    : allProjects[currentId]?._serverId;
  if (!sid) return;
  if (!canManageShares()) throw new Error("У вас немає прав на видалення доступу");
  return _fetch(`/projects/${sid}/shares/${userId}`, { method: "DELETE" });
}

async function openShareModal() {
  if (!canManageShares()) {
    Swal.fire({ icon: "info", title: API_UI.share.accessDeniedTitle });
    return;
  }
  const shares = await apiGetShares();
  const roleOptions = SHAREABLE_PROJECT_ROLES.map(
    (role) => `<option value="${role}">${typeof getRuntimeProjectRoleLabel === "function" ? getRuntimeProjectRoleLabel(role) : PROJECT_ROLE_LABELS[role]}</option>`,
  ).join("");
  const list = shares.length
    ? shares
        .map(
          (s) => {
            const shareRole = normalizeProjectRole(s.role);
            return `<div class="share-row">
               <span class="share-name">${s.userId?.name || "—"}
                 <span class="share-email">${s.userId?.email || ""}</span>
               </span>
               <select class="cost-sel" onchange="apiUpdateShareRole('${s.userId?._id}',this.value)">
                 ${SHAREABLE_PROJECT_ROLES.map(
                   (role) => `<option value="${role}"${shareRole === role ? " selected" : ""}>${typeof getRuntimeProjectRoleLabel === "function" ? getRuntimeProjectRoleLabel(role) : PROJECT_ROLE_LABELS[role]}</option>`,
                 ).join("")}
               </select>
               <button class="cost-act-btn del"
                       onclick="apiRemoveShare('${s.userId?._id}');openShareModal()">✕</button>
             </div>`;
          },
        )
        .join("")
    : `<div class="share-empty">${API_UI.share.emptyText}</div>`;

  Swal.fire({
    title: API_UI.share.modalTitle,
    html: `<div class="share-modal-body">
      <p class="share-proj-name">${API_UI.share.projectLabel}: <b>${proj.name}</b></p>
      <div class="share-list">${list}</div>
      <hr class="share-divider">
      <div class="share-add-title">${API_UI.share.grantSectionTitle}</div>
      <div class="share-add-row">
        <input id="share-email" type="email" placeholder="email@example.com" class="share-email-inp">
        <select id="share-role" class="share-role-sel">
          ${roleOptions}
        </select>
      </div></div>`,
    showCancelButton: true,
    confirmButtonText: "Надати доступ",
    cancelButtonText: "Закрити",
    preConfirm: async () => {
      const email = document.getElementById("share-email").value.trim();
      const role = document.getElementById("share-role").value;
      if (!email) { Swal.showValidationMessage(API_UI.share.emailRequiredMessage); return false; }
      try {
        await apiShareProject(email, role);
      } catch (err) {
        Swal.showValidationMessage(err.message);
        return false;
      }
    },
  });
}

let _syncTimer = null;
function _showSyncIndicator() {
  if (typeof setUserSyncStatus === "function") {
    const plan = typeof buildRuntimeFallbackSyncIndicatorPlan === "function"
      ? buildRuntimeFallbackSyncIndicatorPlan()
      : { status: "syncing", timeoutMs: 1800 };
    setUserSyncStatus(plan.status);
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(() => {
      if (typeof refreshUserSyncStatus === "function") refreshUserSyncStatus();
      else setUserSyncStatus("ok");
    }, plan.timeoutMs);
    return;
  }
  const el = document.getElementById("sync-indicator");
  if (!el) return;
  el.textContent = "☁ збережено";
  el.style.opacity = "1";
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => { el.style.opacity = "0"; }, 2500);
}

function openAuthModal(tab = "login") {
  _renderAuthModal(tab);
  document.getElementById("auth-modal").style.display = "flex";
}

function closeAuthModal() {
  document.getElementById("auth-modal").style.display = "none";
}

function _renderAuthModal(tab) {
  const modalModel = typeof buildRuntimeFallbackAuthModalRenderModel === "function"
    ? buildRuntimeFallbackAuthModalRenderModel(tab, API_UI.auth)
    : {
        isLogin: tab === "login",
        loginTabClassName: `auth-tab${tab === "login" ? " active" : ""}`,
        registerTabClassName: `auth-tab${tab !== "login" ? " active" : ""}`,
        submitLabel: tab === "login" ? API_UI.auth.loginSubmitLabel : API_UI.auth.registerSubmitLabel,
        showNameField: tab !== "login",
      };
  document.getElementById("auth-modal-body").innerHTML = `
    <div class="auth-tabs">
      <button class="${modalModel.loginTabClassName}" onclick="_renderAuthModal('login')">${API_UI.auth.loginTabLabel}</button>
      <button class="${modalModel.registerTabClassName}" onclick="_renderAuthModal('register')">${API_UI.auth.registerTabLabel}</button>
    </div>
    ${modalModel.showNameField ? `<div class="fg"><label>${API_UI.auth.nameLabel}</label><input id="auth-name" placeholder="${API_UI.auth.namePlaceholder}"/></div>` : ""}
    <div class="fg"><label>Email</label><input id="auth-email" type="email" placeholder="example@mail.com"/></div>
    <div class="fg"><label>${API_UI.auth.passwordLabel}</label><input id="auth-pass" type="password" placeholder="${API_UI.auth.passwordPlaceholder}"/></div>
    <div id="auth-error" class="auth-error" style="display:none"></div>
    <button class="btn btn-acc auth-submit-btn" onclick="_submitAuth('${tab}')">
      ${modalModel.submitLabel}</button>`;
}

async function _submitAuth(tab) {
  const email = document.getElementById("auth-email")?.value?.trim();
  const pass = document.getElementById("auth-pass")?.value;
  const name = document.getElementById("auth-name")?.value?.trim();
  const errEl = document.getElementById("auth-error");
  const show = (msg) => {
    if (errEl) { errEl.textContent = msg; errEl.style.display = "block"; }
  };

  try {
    if (tab === "login") { await apiLogin(email, pass); }
    else {
      if (!name) { show(API_UI.auth.nameRequiredMessage); return; }
      await apiRegister(name, email, pass);
    }
    closeAuthModal();

    const me = await apiGetMe();
    if (me) {
      userProfile = {
        ...userProfile, ...me,
        defaults: { ...userProfile.defaults, ...me.defaults },
      };
      saveUser?.();
      if (typeof refreshUserSyncStatus === "function") refreshUserSyncStatus();
      else updateUserBtn?.();
    }
    await apiLoadProjects();
    Swal.fire({
      toast: true, position: "top-end", icon: "success",
      title: API_UI.auth.loginSuccessTitle(_apiUser?.name || "user"),
      showConfirmButton: false, timer: 3000,
    });
  } catch (err) {
    show(err.message || API_UI.auth.authErrorFallback);
  }
}

function updateAuthBtn() {
  const btn = document.getElementById("auth-status-btn");
  if (!btn) return;
  if (isLoggedIn() && _apiUser) {
    btn.textContent = `☁ ${_apiUser.name}`;
    btn.title = API_UI.auth.syncedTitle;
    btn.onclick = async () => {
      const r = await Swal.fire({
        icon: "question", title: API_UI.auth.syncedLogoutPromptTitle,
        text: API_UI.auth.syncedLogoutPromptText,
        showCancelButton: true, confirmButtonText: API_UI.auth.logoutConfirmButtonText, cancelButtonText: API_UI.share.cancelButtonText,
      });
      if (r.isConfirmed) {
        apiLogout();
        _projectRole = null;
        updateAuthBtn();
        _updateReadOnlyUI();
      }
    };
  } else {
    btn.textContent = API_UI.auth.loginButtonLabel;
    btn.onclick = () => openAuthModal("login");
  }
  _updateReadOnlyUI();
}

async function apiShareProject(email, role = "viewer") {
  const sid = typeof getCurrentProjectServerId === "function"
    ? getCurrentProjectServerId()
    : allProjects[currentId]?._serverId;
  if (!sid) return;
  if (!canInviteUsers()) throw new Error("У вас немає прав на запрошення користувачів");
  const shareRequest = typeof buildRuntimeFallbackShareGrantRequest === "function"
    ? buildRuntimeFallbackShareGrantRequest(email, role, isShareableProjectRole)
    : (() => {
        const shareRole = normalizeProjectRole(role);
        if (!isShareableProjectRole(shareRole)) throw new Error("Непідтримувана роль доступу");
        return { email, role: shareRole };
      })();
  return _fetch(`/projects/${sid}/shares`, {
    method: "POST",
    body: JSON.stringify(shareRequest),
  });
}

async function apiUpdateShareRole(userId, role) {
  const sid = typeof getCurrentProjectServerId === "function"
    ? getCurrentProjectServerId()
    : allProjects[currentId]?._serverId;
  if (!sid) return;
  if (!canManageShares()) throw new Error("У вас немає прав на зміну доступу");
  const shareRequest = typeof buildRuntimeFallbackShareRoleUpdateRequest === "function"
    ? buildRuntimeFallbackShareRoleUpdateRequest(role, isShareableProjectRole)
    : (() => {
        const shareRole = normalizeProjectRole(role);
        if (!isShareableProjectRole(shareRole)) throw new Error("Непідтримувана роль доступу");
        return { role: shareRole };
      })();
  return _fetch(`/projects/${sid}/shares/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(shareRequest),
  });
}

async function apiRemoveShare(userId) {
  const sid = typeof getCurrentProjectServerId === "function"
    ? getCurrentProjectServerId()
    : allProjects[currentId]?._serverId;
  if (!sid) return;
  if (!canManageShares()) throw new Error("У вас немає прав на видалення доступу");
  const removeRequest = typeof buildRuntimeFallbackShareRemoveRequest === "function"
    ? buildRuntimeFallbackShareRemoveRequest(userId)
    : { userId };
  return _fetch(`/projects/${sid}/shares/${removeRequest.userId}`, { method: "DELETE" });
}

async function openShareModal() {
  if (!canManageShares()) {
    Swal.fire({ icon: "info", title: API_UI.share.accessDeniedTitle });
    return;
  }
  const shares = await apiGetShares();
  const getRoleLabel = (role) => typeof getRuntimeProjectRoleLabel === "function" ? getRuntimeProjectRoleLabel(role) : PROJECT_ROLE_LABELS[role];
  const roleOptions = typeof buildRuntimeSupabaseShareRoleOptions === "function"
    ? buildRuntimeSupabaseShareRoleOptions(SHAREABLE_PROJECT_ROLES, getRoleLabel, "viewer")
    : SHAREABLE_PROJECT_ROLES.map(
        (role) => `<option value="${role}">${getRoleLabel(role)}</option>`,
      ).join("");
  const shareModalState = typeof buildRuntimeFallbackShareModalState === "function"
    ? buildRuntimeFallbackShareModalState(shares, getRoleLabel)
    : {
        items: shares.map((share) => {
          const normalizedRole = normalizeProjectRole(share.role);
          return {
            userId: share.userId?._id || "",
            displayName: share.userId?.name || "-",
            displayEmail: share.userId?.email || "",
            normalizedRole,
            roleLabel: getRoleLabel(normalizedRole),
          };
        }),
      };
  const list = shareModalState.items.length
    ? shareModalState.items.map((share) => `
        <div class="share-row">
          <span class="share-name">${share.displayName}
            <span class="share-email">${share.displayEmail}</span>
          </span>
          <select class="cost-sel" onchange="apiUpdateShareRole('${share.userId}',this.value)">
            ${typeof buildRuntimeSupabaseShareRoleOptions === "function"
              ? buildRuntimeSupabaseShareRoleOptions(SHAREABLE_PROJECT_ROLES, getRoleLabel, share.normalizedRole)
              : SHAREABLE_PROJECT_ROLES.map(
                  (role) => `<option value="${role}"${share.normalizedRole === role ? " selected" : ""}>${getRoleLabel(role)}</option>`,
                ).join("")}
          </select>
          <button class="cost-act-btn del" onclick="apiRemoveShare('${share.userId}');openShareModal()">✕</button>
        </div>`)
        .join("")
    : `<div class="share-empty">${API_UI.share.emptyText}</div>`;

  Swal.fire({
    title: API_UI.share.modalTitle,
    html: `<div class="share-modal-body">
      <p class="share-proj-name">${API_UI.share.projectLabel}: <b>${proj.name}</b></p>
      <div class="share-list">${list}</div>
      <hr class="share-divider">
      <div class="share-add-title">${API_UI.share.grantSectionTitle}</div>
      <div class="share-add-row">
        <input id="share-email" type="email" placeholder="email@example.com" class="share-email-inp">
        <select id="share-role" class="share-role-sel">
          ${roleOptions}
        </select>
      </div></div>`,
    showCancelButton: true,
    confirmButtonText: "Надати доступ",
    cancelButtonText: "Закрити",
    preConfirm: async () => {
      const email = document.getElementById("share-email").value.trim();
      const role = document.getElementById("share-role").value;
      if (!email) { Swal.showValidationMessage(API_UI.share.emailRequiredMessage); return false; }
      try {
        await apiShareProject(email, role);
      } catch (err) {
        Swal.showValidationMessage(err.message);
        return false;
      }
    },
  });
}

(async () => {
  if (_authToken) {
    _apiUser = await apiGetMe();
    if (_apiUser) {
      if (typeof refreshUserSyncStatus === "function") refreshUserSyncStatus();
      await apiLoadProjects();
    } else {
      apiLogout();
    }
  }
  updateAuthBtn();
})();

function updateAuthBtn() {
  const btn = document.getElementById("auth-status-btn");
  if (!btn) return;
  const buttonModel = typeof buildRuntimeFallbackAuthButtonModel === "function"
    ? buildRuntimeFallbackAuthButtonModel(isLoggedIn(), _apiUser?.name, API_UI.auth)
    : (isLoggedIn() && _apiUser
        ? { text: `вЃ ${_apiUser.name}`, title: API_UI.auth.syncedTitle, mode: "logout" }
        : { text: API_UI.auth.loginButtonLabel, title: "", mode: "login" });

  if (buttonModel.mode === "logout") {
    btn.textContent = buttonModel.text;
    btn.title = buttonModel.title;
    btn.onclick = async () => {
      const r = await Swal.fire({
        icon: "question",
        title: API_UI.auth.syncedLogoutPromptTitle,
        text: API_UI.auth.syncedLogoutPromptText,
        showCancelButton: true,
        confirmButtonText: API_UI.auth.logoutConfirmButtonText,
        cancelButtonText: API_UI.share.cancelButtonText,
      });
      if (r.isConfirmed) {
        apiLogout();
        _projectRole = null;
        updateAuthBtn();
        _updateReadOnlyUI();
      }
    };
  } else {
    btn.textContent = buttonModel.text;
    btn.title = buttonModel.title;
    btn.onclick = () => openAuthModal("login");
  }
  _updateReadOnlyUI();
}
