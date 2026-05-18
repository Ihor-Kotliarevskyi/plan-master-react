const USER_SK = "gantt_pro_user_v1";

// 'offline' | 'ok' | 'syncing' | 'error' | 'warn'
let _userSyncStatus = "offline";

function setUserSyncStatus(status) {
  _userSyncStatus = status;
  updateUserBtn();
}

function getProjectSyncState(projectId = currentId) {
  const snap = projectId && allProjects ? allProjects[projectId] : null;
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
  if (!loggedIn) return { status: "offline", label: "Синхронізація вимкнена" };
  if (_userSyncStatus === "error") return { status: "error", label: "Помилка синхронізації" };
  if (_userSyncStatus === "syncing") return { status: "syncing", label: "Триває синхронізація" };
  if (getProjectSyncState().hasLocalChanges) {
    return { status: "warn", label: "Є локальні зміни, що ще не відправлені" };
  }
  return { status: "ok", label: "Синхронізація увімкнена" };
}

function refreshUserSyncStatus(preferredStatus = null) {
  const loggedIn = typeof isLoggedIn === "function" && isLoggedIn();
  let nextStatus = preferredStatus;

  if (!nextStatus) {
    if (!loggedIn) nextStatus = "offline";
    else if (!navigator.onLine) nextStatus = "warn";
    else nextStatus = getProjectSyncState().hasLocalChanges ? "warn" : "ok";
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
    btn.querySelector(".theme-icon").innerHTML =
      `<i data-lucide="${theme === "dark" ? "sun" : "moon"}"></i>`;
    btn.querySelector(".theme-label").textContent = theme === "dark" ? "Світла" : "Темна";
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
  const name = profile?.name || userProfile.name || "Профіль";
  const avatar = profile?.avatar || userProfile.avatar;
  const initial = (name || "?")[0].toUpperCase();

  const avatarHTML = avatar
    ? `<img src="${avatar}" alt="avatar" class="user-avatar-img" />`
    : initial;

  const status = getCurrentSyncBadge().status;
  btn.innerHTML = `
    <div class="user-avatar-wrap">
      <div class="user-avatar">${avatarHTML}</div>
    </div>
    <span>${name}</span>`;
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

  const initial = (p.name || "?")[0].toUpperCase();
  const avatarLarge = p.avatar
    ? `<img src="${p.avatar}" alt="avatar" class="user-avatar-large-img" />`
    : `<span id="um-avatar-initial">${initial}</span>`;

  document.getElementById("user-modal-body").innerHTML = `
    <div class="um-cols">

      <!-- Ліворуч: налаштування -->
      <div class="um-col">
        <div class="settings-section">
          <div class="settings-section-title">Нові проєкти за замовчуванням</div>
          <div class="settings-section-body">
            <div class="setting-row">
              <label>Початковий місяць</label>
              <select id="um-sm">
                ${MN.map((m, i) => `<option value="${i}"${p.defaults.sm === i ? " selected" : ""}>${m}</option>`).join("")}
              </select>
            </div>
            <div class="setting-row">
              <label>Початковий рік</label>
              <input type="number" id="um-sy" value="${p.defaults.sy}" min="2020" max="2040" />
            </div>
            <div class="setting-row">
              <label>Тривалість (міс.)</label>
              <input type="number" id="um-nm" value="${p.defaults.nm}" min="3" max="120" />
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">Зовнішній вигляд</div>
          <div class="settings-section-body">
            <div class="setting-row">
              <label>Кольорова тема</label>
              <button class="theme-toggle" style="border:none" onclick="toggleTheme();_renderUserModal()">
                <span class="theme-icon"><i data-lucide="${p.theme === "dark" ? "sun" : "moon"}"></i></span>
                <span class="theme-label">${p.theme === "dark" ? "Світла" : "Темна"}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">Базовий план проєкту</div>
          <div class="settings-section-body">
            ${
              proj.baseline
                ? `
              <div class="setting-row">
                <label class="baseline-saved-lbl">✅ Збережено: ${proj.baselineDate || "—"}</label>
                <button class="btn btn-sm btn-tog${showBaseline ? " on" : ""}"
                        onclick="toggleBaseline();_renderUserModal()">
                  ${showBaseline ? '<i data-lucide="eye-off"></i> Приховати' : '<i data-lucide="eye"></i> Показати'}
                </button>
              </div>
              <div class="baseline-actions">
                <button class="btn btn-sm" onclick="saveBaseline();_renderUserModal()"><i data-lucide="rotate-ccw"></i> Перезаписати</button>
                <button class="btn btn-sm btn-danger" onclick="clearBaseline();_renderUserModal()"><i data-lucide="trash-2"></i> Видалити</button>
              </div>`
                : `
              <div class="baseline-empty-hint">
                Базовий план не збережено. Зафіксуйте поточні позиції задач для порівняння план/факт.
              </div>
              <button class="btn btn-acc btn-sm" onclick="saveBaseline();_renderUserModal()"><i data-lucide="save"></i> Зберегти базовий план</button>`
            }
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
              value="${_esc(p.name)}"
              placeholder="Введіть ім'я"
              oninput="_syncUserNamePreview(this.value)"
            />
            <span class="user-email-hint">${_esc(p.email) || "email не вказано"}</span>
            <div class="user-avatar-actions">
              <label class="avatar-upload-btn">
                <i data-lucide="camera"></i> Фото
                <input type="file" accept="image/*" style="display:none"
                       onchange="handleAvatarUpload(event)" />
              </label>
              ${p.avatar ? `<button class="avatar-clear-btn" onclick="clearAvatar()"><i data-lucide="x"></i></button>` : ""}
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
  const roleLabel =
    typeof PROJECT_ROLE_LABELS !== "undefined" ? PROJECT_ROLE_LABELS[currentRole] || currentRole : currentRole;
  const syncMeta = projectSync.updatedAt
    ? `<div class="account-sync-meta">Остання локальна зміна: ${new Date(projectSync.updatedAt).toLocaleString("uk-UA")}</div>`
    : "";
  const syncDetails = projectSync.snap
    ? `<div class="account-sync-details">
        <div><b>Проєкт:</b> ${_esc(projectSync.snap.proj?.name || "—")}</div>
        <div><b>Роль:</b> ${_esc(roleLabel)}</div>
        <div><b>Хмарна копія:</b> ${projectSync.hasServerCopy ? "так" : "ні"}</div>
        <div><b>Локальна версія:</b> ${projectSync.localVersion}</div>
        <div><b>Серверна версія:</b> ${projectSync.serverVersion}</div>
      </div>`
    : "";
  const auditBtn =
    typeof canViewAuditLog === "function" && canViewAuditLog()
      ? `<button class="btn btn-sm" onclick="openAuditLogModal()"><i data-lucide="history"></i> Журнал змін</button>`
      : "";
  if (loggedIn && sbp) {
    return `
    <div class="settings-section">
      <div class="settings-section-title">☁ Хмарний акаунт</div>
      <div class="settings-section-body">
        <div class="setting-row">
          <label>Email</label>
          <span class="account-email">${_esc(p.email)}</span>
        </div>
        <div class="setting-row" style="margin-top:8px">
          <label class="sync-enabled-lbl">● ${_esc(syncBadge.label)}</label>
          <button class="btn btn-sm btn-danger"
            onclick="closeUserModal();apiLogout().then(()=>{ updateUserBtn(); })">
            Вийти
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
      <div class="settings-section-title">☁ Хмарний акаунт</div>
      <div class="settings-section-body">
        <p class="auth-hint">
          Увійдіть щоб зберігати проєкти на сервері та мати доступ з будь-якого пристрою.
        </p>
        <div class="auth-tabs">
          <button id="atab-login" class="btn btn-sm btn-acc" onclick="_switchAuthTab('login')" style="flex:1">Увійти</button>
          <button id="atab-register" class="btn btn-sm" onclick="_switchAuthTab('register')" style="flex:1">Реєстрація</button>
        </div>
        <div id="auth-tab-body">${_renderAuthForm("login")}</div>
      </div>
    </div>`;
}

function _renderAuthForm(tab) {
  const isLogin = tab === "login";
  return `
    <div class="auth-form">
      ${!isLogin ? `<div class="fg"><label>Ім'я</label><input id="auth-name" placeholder="Ваше ім'я"/></div>` : ""}
      <div class="fg"><label>Email</label><input id="auth-email" type="email" placeholder="example@mail.com"/></div>
      <div class="fg"><label>Пароль</label><input id="auth-pass" type="password" placeholder="Мінімум 6 символів"/></div>
      <div id="auth-error" class="auth-error" style="display:none"></div>
      <button class="btn btn-acc auth-submit-btn" type="button" onclick="_submitAuthInCabinet('${tab}')">
        ${isLogin ? "Увійти" : "Зареєструватись"}
      </button>
    </div>`;
}

function _switchAuthTab(tab) {
  document.getElementById("atab-login").className =
    "btn btn-sm" + (tab === "login" ? " btn-acc" : "");
  document.getElementById("atab-register").className =
    "btn btn-sm" + (tab === "register" ? " btn-acc" : "");
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

async function openAuditLogModal() {
  if (typeof canViewAuditLog === "function" && !canViewAuditLog()) {
    Swal.fire({ icon: "info", title: "У вас немає прав на перегляд журналу змін" });
    return;
  }
  if (typeof apiGetActivityLog !== "function") return;

  let events = [];
  try {
    events = await apiGetActivityLog(25);
  } catch (err) {
    Swal.fire({ icon: "error", title: "Не вдалося завантажити журнал", text: err.message || "Спробуйте пізніше" });
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
            <span><b>Хто:</b> ${_esc(entry.actor_name || entry.actor_email || "—")}</span>
            <span><b>Об'єкт:</b> ${_esc(_formatAuditSubject(entry))}</span>
          </div>
        </div>
      `).join("")
    : `<div class="audit-empty">Для поточного проєкту ще немає зафіксованих подій.</div>`;

  await Swal.fire({
    title: "Журнал змін",
    html: `<div class="audit-list">${list}</div>`,
    width: 760,
    confirmButtonText: "Закрити",
  });
}

async function _submitAuthInCabinet(tab) {
  const email = document.getElementById("auth-email")?.value?.trim();
  const pass = document.getElementById("auth-pass")?.value;
  const name = document.getElementById("auth-name")?.value?.trim();
  const errEl = document.getElementById("auth-error");
  const showErr = (msg) => {
    if (errEl) {
      errEl.textContent = msg;
      errEl.style.display = "block";
    }
  };

  try {
    if (tab === "login") {
      await apiLogin(email, pass);
    } else {
      if (!name) { showErr("Введіть ім'я"); return; }
      await apiRegister(name, email, pass);
    }

    if (typeof _sbProfile !== "undefined" && _sbProfile) {
      userProfile = {
        ...userProfile,
        name: _sbProfile.name,
        avatar: _sbProfile.avatar,
        theme: _sbProfile.theme || userProfile.theme,
        defaults: {
          sm: _sbProfile.default_sm ?? userProfile.defaults.sm,
          sy: _sbProfile.default_sy ?? userProfile.defaults.sy,
          nm: _sbProfile.default_nm ?? userProfile.defaults.nm,
        },
      };
      applyTheme(userProfile.theme);
      saveUser();
    }

    updateUserBtn();

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
        title: "Знайдено локальні дані",
        html: `
          <div class="swal-info-text">
            <p>Ви працювали без акаунту. Знайдено локальний проєкт:</p>
            <b>${proj.name || "Без назви"}</b>
            <p class="swal-meta">Змінено: ${new Date(localProjectState.updatedAt).toLocaleString("uk-UA")}</p>
            <p>Що зробити з локальними даними?</p>
          </div>`,
        showCancelButton: true,
        confirmButtonText: "☁ Завантажити з хмари",
        cancelButtonText: "📱 Зберегти локальні в хмару",
        reverseButtons: true,
      });

      if (!isConfirmed) {
        await apiCreateProject();
      }
    }

    await apiLoadProjects();
    _renderUserModal();

    Swal.fire({
      toast: true, position: "top-end", icon: "success",
      title: "Вітаємо! ☁ Синхронізацію увімкнено",
      showConfirmButton: false, timer: 3000,
    });
  } catch (err) {
    showErr(err.message || "Помилка");
  }
}

/** Зберігає зміни профілю користувача. */
async function saveUserProfile() {
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
    title: "Профіль збережено",
    showConfirmButton: false, timer: 2000,
  });
}

function handleAvatarUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    Swal.fire({ icon: "warning", title: "Файл завеликий", text: "Максимум 2 МБ." });
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

loadUser();
