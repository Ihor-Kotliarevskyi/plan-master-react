const USER_SK = "gantt_pro_user_v1";

// 'offline' | 'ok' | 'syncing' | 'error' | 'warn'
let _userSyncStatus = "offline";

function setUserSyncStatus(status) {
  _userSyncStatus = status;
  updateUserBtn();
}

function getProjectSyncState(projectId = currentId) {
  const snap = projectId && allProjects ? allProjects[projectId] : null;
  if (typeof getRuntimeProjectSyncState === "function") {
    return getRuntimeProjectSyncState(snap);
  }
  const localVersion = snap?._localVersion || 0;
  const serverVersion = snap?._serverVersion || 0;
  const hasServerCopy = !!snap?._serverId;
  const hasLocalChanges = hasServerCopy ? localVersion > serverVersion : localVersion > 0;
  const updatedAt = snap?._localUpdatedAt || null;

  return {
    snap,
    hasServerCopy,
    hasLocalChanges,
    localVersion,
    serverVersion,
    updatedAt,
  };
}

function getCurrentSyncBadge() {
  const loggedIn = typeof isLoggedIn === "function" && isLoggedIn();
  const projectSyncState = getProjectSyncState();
  if (typeof getRuntimeSyncBadge === "function") {
    return getRuntimeSyncBadge(loggedIn, _userSyncStatus, projectSyncState);
  }
  if (!loggedIn) return { status: "offline", label: "Синхронізація вимкнена" };
  if (_userSyncStatus === "error") return { status: "error", label: "Помилка синхронізації" };
  if (_userSyncStatus === "syncing") return { status: "syncing", label: "Триває синхронізація" };
  if (projectSyncState.hasLocalChanges) {
    return { status: "warn", label: "Є локальні зміни, що ще не відправлені" };
  }
  return { status: "ok", label: "Синхронізація увімкнена" };
}

function refreshUserSyncStatus(preferredStatus = null) {
  const loggedIn = typeof isLoggedIn === "function" && isLoggedIn();
  const projectSyncState = getProjectSyncState();
  let nextStatus = preferredStatus;

  if (typeof resolveRuntimeSyncStatus === "function") {
    nextStatus = resolveRuntimeSyncStatus(preferredStatus, {
      loggedIn,
      online: navigator.onLine,
      projectSyncState,
    });
  }

  if (!nextStatus) {
    if (!loggedIn) nextStatus = "offline";
    else if (!navigator.onLine) nextStatus = "warn";
    else nextStatus = projectSyncState.hasLocalChanges ? "warn" : "ok";
  }

  _userSyncStatus = nextStatus;
  updateUserBtn();
  return nextStatus;
}


const ROLES = {
  guest: { label: "Гість", cls: "guest" },
  user: { label: "Користувач", cls: "user" },
  admin: { label: "Адміністратор", cls: "admin" },
};

const DEF_USER = {
  name: "Користувач",
  email: "",
  role: "user",
  avatar: null,
  theme: "light",
  defaults: { sm: 0, sy: new Date().getFullYear(), nm: 12 },
};

let userProfile = { ...DEF_USER };

function loadUser() {
  try {
    const d = JSON.parse(localStorage.getItem(USER_SK));
    if (d)
      userProfile = {
        ...DEF_USER,
        ...d,
        defaults: { ...DEF_USER.defaults, ...(d.defaults || {}) },
      };
  } catch (_) {}
  applyTheme(userProfile.theme);
  updateUserBtn();
}

function saveUser() {
  try {
    localStorage.setItem(USER_SK, JSON.stringify(userProfile));
  } catch (_) {}
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
  userProfile.theme = theme;
  const btn = document.getElementById("theme-toggle");
  if (btn) {
    const themeToggle =
      typeof buildRuntimeThemeToggleModel === "function"
        ? buildRuntimeThemeToggleModel(theme)
        : {
            icon: theme === "dark" ? "sun" : "moon",
            label: theme === "dark" ? "Light" : "Dark",
          };
    btn.querySelector(".theme-icon").innerHTML =
      `<i data-lucide="${themeToggle.icon}"></i>`;
    btn.querySelector(".theme-label").textContent = themeToggle.label;
    lucide.createIcons({ nodes: [btn] });
  }
}

function toggleTheme() {
  const next = userProfile.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  saveUser();
  if (typeof isLoggedIn === "function" && isLoggedIn()) {
    apiUpdateProfile({ theme: next }).catch(() => {});
  }
}

function updateUserBtn() {
  const btn = document.getElementById("user-btn");
  if (!btn) return;

  const loggedIn = typeof isLoggedIn === "function" && isLoggedIn();
  const profile = loggedIn && typeof _sbProfile !== "undefined" ? _sbProfile : null;
  const identity =
    typeof buildRuntimeUserIdentityModel === "function"
      ? buildRuntimeUserIdentityModel({
          name: profile?.name || userProfile.name,
          email: profile?.email || userProfile.email,
          avatar: profile?.avatar || userProfile.avatar,
          theme: userProfile.theme,
        }, "Profile")
      : {
          displayName: profile?.name || userProfile.name || "Profile",
          initial: ((profile?.name || userProfile.name || "?")[0] || "?").toUpperCase(),
          avatarUrl: profile?.avatar || userProfile.avatar || null,
        };

  const avatarHTML = identity.avatarUrl
    ? `<img src="${identity.avatarUrl}" alt="avatar" class="user-avatar-img" />`
    : identity.initial;

  const status = getCurrentSyncBadge().status;
  btn.innerHTML = `
    <div class="user-avatar-wrap">
      <div class="user-avatar">${avatarHTML}</div>
    </div>
    <span>${identity.displayName}</span>`;
  btn.className = `user-btn status-${status}${status === "syncing" ? " syncing" : ""}`;
}

function openUserModal() {
  _renderUserModal();
  document.getElementById("user-modal").style.display = "flex";
}

function closeUserModal() {
  document.getElementById("user-modal").style.display = "none";
}

function _renderUserModal() {
  const loggedIn = typeof isLoggedIn === "function" && isLoggedIn();
  const sbp = loggedIn && typeof _sbProfile !== "undefined" ? _sbProfile : null;

  const p = {
    name: sbp?.name || userProfile.name,
    email:
      sbp?.email ||
      userProfile.email ||
      (sbp ? (typeof _sbUser !== "undefined" ? _sbUser?.email : "") : ""),
    avatar: sbp?.avatar || userProfile.avatar,
    theme: userProfile.theme,
    defaults: userProfile.defaults,
  };

  const identity =
    typeof buildRuntimeUserIdentityModel === "function"
      ? buildRuntimeUserIdentityModel(p, "Profile")
      : {
          displayName: p.name || "Profile",
          emailText: p.email || "",
          initial: ((p.name || "?")[0] || "?").toUpperCase(),
          avatarUrl: p.avatar || null,
          themeToggle: {
            icon: p.theme === "dark" ? "sun" : "moon",
            label: p.theme === "dark" ? "Light" : "Dark",
          },
        };

  const avatarLarge = identity.avatarUrl
    ? `<img src="${identity.avatarUrl}" alt="avatar" class="user-avatar-large-img" />`
    : `<span id="um-avatar-initial">${identity.initial}</span>`;

  const defaultsPanel =
    typeof buildRuntimeProjectDefaultsPanelModel === "function"
      ? buildRuntimeProjectDefaultsPanelModel()
      : {
          sectionTitle: "Project defaults",
          startMonthLabel: "Start month",
          startYearLabel: "Start year",
          durationLabel: "Duration (months)",
        };

  const themePanel =
    typeof buildRuntimeThemePanelModel === "function"
      ? buildRuntimeThemePanelModel()
      : {
          sectionTitle: "Appearance",
          themeLabel: "Theme",
        };

  const baselinePanel =
    typeof buildRuntimeBaselinePanelModel === "function"
      ? buildRuntimeBaselinePanelModel({
          hasBaseline: !!proj.baseline,
          baselineDate: proj.baselineDate || null,
          showBaseline: !!showBaseline,
        })
      : {
          sectionTitle: "Baseline",
          hasBaseline: !!proj.baseline,
          savedLabel: `Saved: ${proj.baselineDate || "-"}`,
          toggleLabel: showBaseline ? "Hide" : "Show",
          saveActionLabel: proj.baseline ? "Overwrite" : "Save baseline",
          deleteActionLabel: "Delete",
          emptyHint: "Baseline is not saved yet. Save the current task positions to compare plan vs actual later.",
          showBaseline: !!showBaseline,
        };


  document.getElementById("user-modal-body").innerHTML = `
    <div class="um-cols">

      <!-- Ліворуч: налаштування -->
      <div class="um-col">
        <div class="settings-section">
          <div class="settings-section-title">${defaultsPanel.sectionTitle}</div>
          <div class="settings-section-body">
            <div class="setting-row">
              <label>${defaultsPanel.startMonthLabel}</label>
              <select id="um-sm">
                ${MN.map((m, i) => `<option value="${i}"${p.defaults.sm === i ? " selected" : ""}>${m}</option>`).join("")}
              </select>
            </div>
            <div class="setting-row">
              <label>${defaultsPanel.startYearLabel}</label>
              <input type="number" id="um-sy" value="${p.defaults.sy}" min="2020" max="2040" />
            </div>
            <div class="setting-row">
              <label>${defaultsPanel.durationLabel}</label>
              <input type="number" id="um-nm" value="${p.defaults.nm}" min="3" max="120" />
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">${themePanel.sectionTitle}</div>
          <div class="settings-section-body">
            <div class="setting-row">
              <label>${themePanel.themeLabel}</label>
              <button class="theme-toggle" style="border:none" data-user-action="toggle-theme">
                <span class="theme-icon"><i data-lucide="${identity.themeToggle.icon}"></i></span>
                <span class="theme-label">${identity.themeToggle.label}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">${baselinePanel.sectionTitle}</div>
          <div class="settings-section-body">
            ${(() => {
              return baselinePanel.hasBaseline
                ? `
              <div class="setting-row">
                <label class="baseline-saved-lbl">${baselinePanel.savedLabel}</label>
                <button class="btn btn-sm btn-tog${baselinePanel.showBaseline ? " on" : ""}"
                        data-user-action="toggle-baseline">
                  ${baselinePanel.showBaseline ? '<i data-lucide="eye-off"></i>' : '<i data-lucide="eye"></i>'} ${baselinePanel.toggleLabel}
                </button>
              </div>
              <div class="baseline-actions">
                <button class="btn btn-sm" data-user-action="save-baseline"><i data-lucide="rotate-ccw"></i> ${baselinePanel.saveActionLabel}</button>
                <button class="btn btn-sm btn-danger" data-user-action="clear-baseline"><i data-lucide="trash-2"></i> ${baselinePanel.deleteActionLabel}</button>
              </div>`
                : `
              <div class="baseline-empty-hint">
                ${baselinePanel.emptyHint}
              </div>
              <button class="btn btn-acc btn-sm" data-user-action="save-baseline"><i data-lucide="save"></i> ${baselinePanel.saveActionLabel}</button>`;
            })()}
          </div>
        </div>
      </div>

      <!-- Праворуч: профіль користувача -->
      <div class="um-col">
        <div class="um-user-card">
          <div class="user-avatar-large" id="um-avatar-preview">${avatarLarge}</div>
          <div class="um-user-info">
            <label for="um-name" class="user-inline-label">Ім'я</label>
            <input
              id="um-name"
              class="user-inline-input"
              value="${_esc(identity.displayName)}"
              placeholder="Введіть ім'я"
              data-user-input="name-preview"
            />
            <span class="user-email-hint">${_esc(p.email) || "email не вказано"}</span>
            <div class="user-avatar-actions">
              <label class="avatar-upload-btn">
                <i data-lucide="camera"></i> Фото
                <input type="file" accept="image/*" style="display:none" data-user-input="avatar-upload" />
              </label>
              ${p.avatar ? `<button class="avatar-clear-btn" data-user-action="clear-avatar"><i data-lucide="x"></i></button>` : ""}
            </div>
          </div>
        </div>

        ${_renderAccountSection(loggedIn, sbp, p)}
      </div>

    </div>`;
  lucide.createIcons({ nodes: [document.getElementById("user-modal-body")] });
}

function _renderAccountSection(loggedIn, sbp, p) {
  const syncBadge = getCurrentSyncBadge();
  const projectSync = getProjectSyncState();
  const currentRole = typeof getStoredProjectRole === "function"
    ? getStoredProjectRole(currentId, "owner")
    : "owner";
  const syncPanel =
    typeof buildRuntimeAccountSyncPanelModel === "function"
      ? buildRuntimeAccountSyncPanelModel(projectSync, currentRole, "-")
      : {
          roleLabel:
            typeof getRuntimeProjectRoleLabel === "function"
              ? getRuntimeProjectRoleLabel(currentRole)
              : (typeof PROJECT_ROLE_LABELS !== "undefined" ? PROJECT_ROLE_LABELS[currentRole] || currentRole : currentRole),
          projectName: projectSync.snap?.proj?.name || "-",
          hasServerCopyText: projectSync.hasServerCopy ? "yes" : "no",
          localVersionText: String(projectSync.localVersion),
          serverVersionText: String(projectSync.serverVersion),
          updatedAtText: projectSync.updatedAt || "",
        };
  const accountSection =
    typeof buildRuntimeAccountSectionModel === "function"
      ? buildRuntimeAccountSectionModel()
      : {
          sectionTitle: "Cloud account",
          emailLabel: "Email",
          logoutLabel: "Log out",
          auditLogLabel: "Activity log",
          projectLabel: "Project",
          roleLabel: "Role",
          cloudCopyLabel: "Cloud copy",
          localVersionLabel: "Local version",
          serverVersionLabel: "Server version",
          lastLocalChangeLabel: "Last local change",
        };
  const syncMeta = syncPanel.updatedAtText
    ? `<div class="account-sync-meta">${accountSection.lastLocalChangeLabel}: ${new Date(syncPanel.updatedAtText).toLocaleString("uk-UA")}</div>`
    : "";
  const syncDetails = projectSync.snap
    ? `<div class="account-sync-details">
        <div><b>${accountSection.projectLabel}:</b> ${_esc(syncPanel.projectName)}</div>
        <div><b>${accountSection.roleLabel}:</b> ${_esc(syncPanel.roleLabel)}</div>
        <div><b>${accountSection.cloudCopyLabel}:</b> ${syncPanel.hasServerCopyText}</div>
        <div><b>${accountSection.localVersionLabel}:</b> ${syncPanel.localVersionText}</div>
        <div><b>${accountSection.serverVersionLabel}:</b> ${syncPanel.serverVersionText}</div>
      </div>`
    : "";
  const auditBtn =
    typeof canViewAuditLog === "function" && canViewAuditLog()
      ? `<button class="btn btn-sm" data-user-action="open-audit-log"><i data-lucide="history"></i> ${accountSection.auditLogLabel}</button>`
      : "";
  if (loggedIn && sbp) {
    return `
    <div class="settings-section">
      <div class="settings-section-title">${accountSection.sectionTitle}</div>
      <div class="settings-section-body">
        <div class="setting-row">
          <label>${accountSection.emailLabel}</label>
          <span class="account-email">${_esc(p.email)}</span>
        </div>
        <div class="setting-row" style="margin-top:8px">
          <label class="sync-enabled-lbl">● ${_esc(syncBadge.label)}</label>
          <button class="btn btn-sm btn-danger" data-user-action="logout">
            ${accountSection.logoutLabel}
          </button>
        </div>
        ${auditBtn ? `<div class="account-actions">${auditBtn}</div>` : ""}
        ${syncDetails}
        ${syncMeta}
      </div>
    </div>`;
  }

  return `
    <div class="settings-section">
      <div class="settings-section-title">${accountSection.sectionTitle}</div>
      <div class="settings-section-body">
        <p class="auth-hint">
          ${_esc(typeof buildRuntimeAuthFormModel === "function" ? buildRuntimeAuthFormModel("login").hintText : "Sign in to save projects in the cloud and access them from any device.")}
        </p>
        <div class="auth-tabs">
          <button id="atab-login" class="btn btn-sm btn-acc" data-user-action="switch-auth-tab" data-auth-tab="login" style="flex:1">${_esc(typeof buildRuntimeAuthFormModel === "function" ? buildRuntimeAuthFormModel("login").loginTabLabel : "Sign in")}</button>
          <button id="atab-register" class="btn btn-sm" data-user-action="switch-auth-tab" data-auth-tab="register" style="flex:1">${_esc(typeof buildRuntimeAuthFormModel === "function" ? buildRuntimeAuthFormModel("login").registerTabLabel : "Register")}</button>
        </div>
        <div id="auth-tab-body">${_renderAuthForm("login")}</div>
      </div>
    </div>`;
}

function _renderAuthForm(tab) {
  const model =
    typeof buildRuntimeAuthFormModel === "function"
      ? buildRuntimeAuthFormModel(tab)
      : {
          isLogin: tab === "login",
          nameLabel: "Name",
          namePlaceholder: "Your name",
          emailLabel: "Email",
          emailPlaceholder: "example@mail.com",
          passwordLabel: "Password",
          passwordPlaceholder: "Minimum 6 characters",
          submitLabel: tab === "login" ? "Sign in" : "Register",
        };
  return `
    <div class="auth-form auth-form-scroll">
      ${!model.isLogin ? `<div class="fg"><label>${_esc(model.nameLabel)}</label><input id="auth-name" placeholder="${_esc(model.namePlaceholder)}"/></div>` : ""}
      <div class="fg"><label>${_esc(model.emailLabel)}</label><input id="auth-email" type="email" placeholder="${_esc(model.emailPlaceholder)}"/></div>
      <div class="fg"><label>${_esc(model.passwordLabel)}</label><input id="auth-pass" type="password" placeholder="${_esc(model.passwordPlaceholder)}"/></div>
      <div id="auth-error" class="auth-error" style="display:none"></div>
      <button class="btn btn-acc auth-submit-btn" type="button" data-user-action="submit-auth" data-auth-tab="${tab}">
        ${_esc(model.submitLabel)}
      </button>
    </div>`;
}

function _switchAuthTab(tab) {
  document.getElementById("atab-login").className =
    (typeof getRuntimeAuthTabButtonClass === "function" ? getRuntimeAuthTabButtonClass("login", tab) : ("btn btn-sm" + (tab === "login" ? " btn-acc" : "")));
  document.getElementById("atab-register").className =
    (typeof getRuntimeAuthTabButtonClass === "function" ? getRuntimeAuthTabButtonClass("register", tab) : ("btn btn-sm" + (tab === "register" ? " btn-acc" : "")));
  document.getElementById("auth-tab-body").innerHTML = _renderAuthForm(tab);
}

function _syncUserNamePreview(value) {
  const nextName = (value || "").trim();
  const avatarInitial = document.getElementById("um-avatar-initial");
  if (avatarInitial) avatarInitial.textContent = (nextName || "?")[0].toUpperCase();
}

function _formatAuditEventLabel(eventType) {
  const map = {
    "task.created": "Створено задачу",
    "task.updated": "Оновлено задачу",
    "task.deleted": "Видалено задачу",
    "project.settings_updated": "Оновлено налаштування проєкту",
    "project.baseline_saved": "Збережено базовий план",
    "project.baseline_cleared": "Видалено базовий план",
    "share.granted": "Надано доступ",
    "share.role_updated": "Оновлено роль доступу",
    "share.revoked": "Скасовано доступ",
  };
  return map[eventType] || eventType || "Подія";
}

function _formatAuditSubject(entry) {
  if (!entry) return "—";
  if (entry.entity_type === "task") {
    return entry.payload?.taskName || `Задача #${entry.payload?.taskN ?? "?"}`;
  }
  if (entry.entity_type === "share") {
    return entry.payload?.email || entry.entity_id || "Спільний доступ";
  }
  return proj?.name || "Поточний проєкт";
}

function _getAuditLogModalModel() {
  if (typeof buildRuntimeAuditLogModalModel === "function") {
    return buildRuntimeAuditLogModalModel();
  }
  return {
    accessDeniedTitle: "? ??? ????? ???? ?? ???????? ??????? ????",
    loadFailedTitle: "?? ??????? ??????????? ??????",
    missingMigrationHint: "?????, ?? ?? ???????? ???????? 003_activity_log_foundation.sql.",
    retryHint: "????????? ???????",
    actorCaption: "???",
    subjectCaption: "??'???",
    emptyHint: "??? ????????? ??????? ?? ????? ???????????? ?????.",
    modalTitle: "?????? ????",
    closeButtonLabel: "???????",
  };
}

function _getAuthFlowMessages() {
  if (typeof buildRuntimeAuthFlowMessages === "function") {
    return buildRuntimeAuthFlowMessages();
  }
  return {
    nameRequired: "??????? ??'?",
    loginSuccessTitle: "???? ????????",
    localDataFoundTitle: "???????? ???????? ????",
    localProjectIntro: "?? ????????? ??? ???????. ???????? ????????? ??????:",
    modifiedLabel: "???????",
    localDataQuestion: "?? ??????? ? ?????????? ???????",
    loadCloudConfirmLabel: "? ??????????? ? ?????",
    saveLocalToCloudLabel: "?? ???????? ???????? ? ?????",
    projectsBootstrapWarningTitle: "???? ????????, ??? ??????? ?? ?????????????",
    projectsBootstrapWarningText: "????????? ???? ???? ????? ? ????????? ??????? ????????",
    syncEnabledTitle: "???????! ? ????????????? ?????????",
    emailConfirmationInfoTitle: "Підтвердьте email",
    emailConfirmationInfoText: "Ми надіслали лист із підтвердженням. Відкрийте посилання з листа, потім поверніться в застосунок і увійдіть.",
  };
}

function _isEmailConfirmationMessage(message) {
  const text = String(message || "").toLowerCase();
  return text.includes("confirm registration")
    || text.includes("confirm your email")
    || text.includes("check your email")
    || text.includes("підтверд")
    || text.includes("пошту");
}

function _getProfileFeedbackMessages() {
  if (typeof buildRuntimeProfileFeedbackMessages === "function") {
    return buildRuntimeProfileFeedbackMessages();
  }
  return {
    profileSavedTitle: "??????? ?????????",
    avatarTooLargeTitle: "???? ?????????",
    avatarTooLargeText: "???????? 2 ??.",
  };
}

async function openAuditLogModal() {
  const auditModal = _getAuditLogModalModel();
  if (typeof canViewAuditLog === "function" && !canViewAuditLog()) {
    Swal.fire({ icon: "info", title: auditModal.accessDeniedTitle });
    return;
  }
  if (typeof apiGetActivityLog !== "function") return;

  let events = [];
  try {
    events = await apiGetActivityLog(25);
  } catch (err) {
    const hint = String(err?.message || "").includes("activity_log")
      ? auditModal.missingMigrationHint
      : (err.message || auditModal.retryHint);
    Swal.fire({ icon: "error", title: auditModal.loadFailedTitle, text: hint });
    return;
  }

  const list = events.length
    ? events.map((entry) => `
        <div class="audit-row">
          <div class="audit-row-head">
            <span class="audit-event">${_esc(_formatAuditEventLabel(entry.event_type))}</span>
            <span class="audit-time">${_esc(new Date(entry.created_at).toLocaleString("uk-UA"))}</span>
          </div>
          <div class="audit-row-meta">
            <span><b>${_esc(auditModal.actorCaption)}:</b> ${_esc(_getAuditActorLabel(entry))}</span>
            <span><b>${_esc(auditModal.subjectCaption)}:</b> ${_esc(_formatAuditSubject(entry))}</span>
          </div>
        </div>
      `).join("")
    : `<div class="audit-empty">${_esc(auditModal.emptyHint)}</div>`;

  await Swal.fire({
    title: auditModal.modalTitle,
    html: `<div class="audit-list">${list}</div>`,
    width: 760,
    confirmButtonText: auditModal.closeButtonLabel,
  });
}

async function _submitAuthInCabinet(tab) {
  const email = document.getElementById("auth-email")?.value?.trim();
  const pass = document.getElementById("auth-pass")?.value;
  const name = document.getElementById("auth-name")?.value?.trim();
  const errEl = document.getElementById("auth-error");
  const authMessages = _getAuthFlowMessages();
  const setStage = (msg) => {
    if (errEl) {
      errEl.textContent = `[debug] ${msg}`;
      errEl.style.display = "block";
      errEl.style.color = "var(--txt2)";
    }
    console.log("[auth-debug]", msg);
  };
  const showErr = (msg) => {
    if (errEl) {
      errEl.textContent = msg;
      errEl.style.display = "block";
      errEl.style.color = "";
    }
  };

  try {
    if (tab === "login") {
      setStage("calling apiLogin");
      await apiLogin(email, pass);
      setStage("apiLogin success");
    } else {
      if (!name) { showErr(authMessages.nameRequired); return; }
      setStage("calling apiRegister");
      await apiRegister(name, email, pass);
      setStage("apiRegister success");
    }

    const activeProfile =
      typeof apiGetMe === "function"
        ? (await apiGetMe().catch(() => null)) || _sbProfile
        : _sbProfile;
    setStage(`profile resolved: ${activeProfile?.email || "none"}`);

    if (activeProfile) {
      userProfile = {
        ...userProfile,
        name: activeProfile.name,
        avatar: activeProfile.avatar,
        theme: activeProfile.theme || userProfile.theme,
        defaults: {
          sm: activeProfile.default_sm ?? userProfile.defaults.sm,
          sy: activeProfile.default_sy ?? userProfile.defaults.sy,
          nm: activeProfile.default_nm ?? userProfile.defaults.nm,
        },
      };
      applyTheme(userProfile.theme);
      saveUser();
    }

    if (typeof refreshUserSyncStatus === "function") refreshUserSyncStatus();
    else updateUserBtn();
    setStage(`ui updated: loggedIn=${typeof isLoggedIn === "function" ? isLoggedIn() : "?"}`);

    if (tab === "login" && typeof isLoggedIn === "function" && isLoggedIn()) {
      setStage("closing modal after login");
      closeUserModal();
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: authMessages.loginSuccessTitle,
        showConfirmButton: false,
        timer: 2200,
      });
    } else {
      if (tab !== "login" && !(typeof isLoggedIn === "function" && isLoggedIn())) {
        await Swal.fire({
          icon: "info",
          title: authMessages.emailConfirmationInfoTitle,
          text: authMessages.emailConfirmationInfoText,
          confirmButtonText: "Добре",
        });
        _switchAuthTab("login");
        return;
      }
      _renderUserModal();
    }

    const localProjectState = getProjectSyncState();
    const localUnsynced =
      currentId &&
      localProjectState.snap &&
      !localProjectState.hasServerCopy &&
      localProjectState.updatedAt &&
      localProjectState.snap.tasks?.length > 0;

    if (localUnsynced) {
      const { isConfirmed } = await Swal.fire({
        icon: "question",
        title: authMessages.localDataFoundTitle,
        html: `
          <div class="swal-info-text">
            <p>${authMessages.localProjectIntro}</p>
            <b>${proj.name || "??? ?????"}</b>
            <p class="swal-meta">${authMessages.modifiedLabel}: ${new Date(localProjectState.updatedAt).toLocaleString("uk-UA")}</p>
            <p>${authMessages.localDataQuestion}</p>
          </div>`,
        showCancelButton: true,
        confirmButtonText: authMessages.loadCloudConfirmLabel,
        cancelButtonText: authMessages.saveLocalToCloudLabel,
        reverseButtons: true,
      });

      if (!isConfirmed) {
        await apiCreateProject();
      }
    }

    try {
      setStage("loading projects");
      await apiLoadProjects();
      setStage("projects loaded");
    } catch (loadErr) {
      setStage(`projects failed: ${loadErr?.message || "unknown error"}`);
      console.error("Post-login project bootstrap failed", loadErr);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "warning",
        title: authMessages.projectsBootstrapWarningTitle,
        text: loadErr?.message || authMessages.projectsBootstrapWarningText,
        showConfirmButton: false,
        timer: 4500,
      });
    }
    if (tab !== "login") _renderUserModal();

    Swal.fire({
      toast: true, position: "top-end", icon: "success",
      title: authMessages.syncEnabledTitle,
      showConfirmButton: false, timer: 3000,
    });
  } catch (err) {
    if (tab !== "login" && _isEmailConfirmationMessage(err?.message)) {
      await Swal.fire({
        icon: "info",
        title: authMessages.emailConfirmationInfoTitle,
        text: authMessages.emailConfirmationInfoText,
        confirmButtonText: "Добре",
      });
      _switchAuthTab("login");
      return;
    }
    showErr(err.message || "???????");
  }
}

async function saveUserProfile() {
  const profileFeedback = _getProfileFeedbackMessages();
  const nameVal = document.getElementById("um-name")?.value.trim();
  if (nameVal) userProfile.name = nameVal;
  userProfile.defaults.sm = +document.getElementById("um-sm").value;
  userProfile.defaults.sy = +document.getElementById("um-sy").value;
  userProfile.defaults.nm = +document.getElementById("um-nm").value;
  saveUser();
  updateUserBtn();
  closeUserModal();

  if (typeof isLoggedIn === "function" && isLoggedIn()) {
    try {
      await apiUpdateProfile({ name: userProfile.name, defaults: userProfile.defaults });
    } catch (_) {}
  }

  Swal.fire({
    toast: true, position: "top-end", icon: "success",
    title: profileFeedback.profileSavedTitle,
    showConfirmButton: false, timer: 2000,
  });
}

function handleAvatarUpload(e) {
  const profileFeedback = _getProfileFeedbackMessages();
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    Swal.fire({ icon: "warning", title: profileFeedback.avatarTooLargeTitle, text: profileFeedback.avatarTooLargeText });
    return;
  }
  const reader = new FileReader();
  reader.onload = async (ev) => {
    userProfile.avatar = ev.target.result;
    saveUser();
    updateUserBtn();
    _renderUserModal();
    if (typeof isLoggedIn === "function" && isLoggedIn()) {
      try { await apiUpdateProfile({ avatar: userProfile.avatar }); } catch (_) {}
    }
  };
  reader.readAsDataURL(file);
}

function clearAvatar() {
  userProfile.avatar = null;
  saveUser();
  updateUserBtn();
  _renderUserModal();
  if (typeof isLoggedIn === "function" && isLoggedIn()) {
    apiUpdateProfile({ avatar: null }).catch(() => {});
  }
}

/** Перенаправляє виклики зі старих посилань на openUserModal. */
function openAuthModal() { openUserModal(); }

_formatAuditEventLabel = function(eventType) {
  if (typeof getRuntimeAuditEventLabel === "function") {
    return getRuntimeAuditEventLabel(eventType);
  }
  return eventType || "Event";
};

_formatAuditSubject = function(entry) {
  if (typeof getRuntimeAuditSubjectLabel === "function") {
    return getRuntimeAuditSubjectLabel({
      entityType: entry?.entity_type,
      entityId: entry?.entity_id,
      payload: entry?.payload || {},
    }, proj?.name || "Current project");
  }
  return proj?.name || "Current project";
};

function _getAuditActorLabel(entry) {
  if (typeof getRuntimeAuditActorLabel === "function") {
    return getRuntimeAuditActorLabel({
      actorName: entry?.actor_name,
      actorEmail: entry?.actor_email,
    });
  }
  return entry?.actor_name || entry?.actor_email || "-";
}

loadUser();
