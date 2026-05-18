/**
 * Supabase адаптер — активний бекенд.
 * Підключати ТІЛЬКИ ОДИН з двох: supabase-api.js АБО api.js.
 * Таблиці: profiles, projects, project_shares, tasks.
 * RPC: upsert_tasks(p_project_id, p_tasks), get_user_id_by_email(p_email).
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

function isLoggedIn() { return !!_sbUser; }

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
  if (!data.user) throw new Error("Перевірте пошту для підтвердження реєстрації");
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
  // Спочатку синхронізуємо незбережені зміни
  if (currentId && isLoggedIn()) {
    const currentProject = getCurrentProjectSnapshot();
    const lv = currentProject?._localVersion || 0;
    const sv = currentProject?._serverVersion || 0;
    if (lv > sv) {
      try { await apiSyncProject(currentId); } catch (_) {}
    }
  }

  await sb.auth.signOut({ scope: "local" });
  _sbUser = _sbProfile = _projectRole = null;

  // Чистимо буфер — не залишаємо чужі дані наступному юзеру
  try { localStorage.removeItem(SK_BUF); } catch (_) {}

  // Скидаємо стан до чистого проєкту
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

async function apiLoadProjects() {
  const authUser = await _getCurrentAuthUser();
  if (!authUser) return;
  const seq = ++_apiLoadProjectsSeq;
  const bufferAtStart = (() => {
    try { return localStorage.getItem(SK_BUF) || ""; } catch (_) { return ""; }
  })();

  try {
    // ── Крок 1: аналізуємо буфер ────────────────────────────────────────────
    let bufUserId = null;
    let bufCurrentId = null;
    const offlineNew    = {}; // без _serverId — створені офлайн, треба відправити
    const localSynced   = {}; // з _serverId + версії — можливо є незбережені зміни

    try {
      const buf = JSON.parse(localStorage.getItem(SK_BUF) || "{}");
      bufUserId = buf._userId || null;
      bufCurrentId = buf.currentId || null;
      const isOwnBuf = !bufUserId || bufUserId === authUser.id;

      Object.entries(buf.allProjects || {}).forEach(([id, p]) => {
        if (!p._serverId && isOwnBuf) {
          // Офлайн-проєкт поточного юзера (або анонімний) → відправимо на сервер
          offlineNew[id] = p;
        } else if (p._serverId && bufUserId === authUser.id) {
          // Проєкт із попереднього сеансу цього ж юзера → збережемо версії
          localSynced[id] = p;
        }
        // Чужі проєкти (bufUserId !== _sbUser.id) → ігноруємо
      });
    } catch (_) {}

    // ── Крок 2: завантажуємо список із сервера ───────────────────────────────
    const { data: own, error: e1 } = await sb
      .from("projects")
      .select("id,name,sm,sy,nm,is_archived,updated_at")
      .eq("owner_id", authUser.id)
      .eq("is_archived", false)
      .order("updated_at", { ascending: false });
    if (e1) throw e1;

    const { data: shared, error: e2 } = await sb
      .from("project_shares")
      .select("role, project:projects(id,name,sm,sy,nm,is_archived,updated_at)")
      .eq("user_id", authUser.id);
    if (e2) throw e2;

    if (seq !== _apiLoadProjectsSeq) return;
    const bufferNow = (() => {
      try { return localStorage.getItem(SK_BUF) || ""; } catch (_) { return ""; }
    })();
    if (bufferNow !== bufferAtStart) {
      await apiLoadProjects();
      return;
    }

    // ── Крок 3: будуємо чистий allProjects ──────────────────────────────────
    // Починаємо з офлайн-проєктів (вони не мають аналогів на сервері)
    allProjects = { ...offlineNew };

    const addServer = (list, isShared = false) => {
      (list || []).forEach((item) => {
        const p = isShared ? item.project : item;
        if (!p) return;

        // Шукаємо локальну копію цього серверного проєкту (за _serverId)
        const local = Object.entries(localSynced)
          .find(([, lp]) => lp._serverId === p.id);

        if (local) {
          // Є локальний стан з версіями → залишаємо (apiLoadProject вирішить sync/load)
          allProjects[local[0]] = local[1];
        } else {
          // Новий для нас серверний проєкт → стаб, дані підтягнуться через apiLoadProject
          allProjects[p.id] = {
            proj: { name: p.name, sm: p.sm, sy: p.sy, nm: p.nm },
            cats: [], tasks: [], nextN: 1,
            _serverId: p.id,
            _role:          isShared ? normalizeProjectRole(item.role) : "owner",
            _localVersion:  0,
            _serverVersion: 0,
          };
        }
      });
    };

    addServer(own);
    addServer(shared, true);

    if (!Object.keys(allProjects).length) initDefaultProject();
    if (bufCurrentId && allProjects[bufCurrentId]) currentId = bufCurrentId;
    else if (!currentId || !allProjects[currentId]) currentId = Object.keys(allProjects)[0];

    updateProjSel();
    loadCurrent();
    render();
    if (typeof refreshUserSyncStatus === "function") refreshUserSyncStatus();

    // ── Крок 4: синхронізуємо поточний проєкт ───────────────────────────────
    if (currentId && allProjects[currentId]) {
      await apiLoadProject(currentId);
    }

    // ── Крок 5: відправляємо офлайн-проєкти на сервер ───────────────────────
    for (const id of Object.keys(offlineNew)) {
      await apiCreateProject(id);
    }

  } catch (_) {}
}

/**
 * Будує payload для upsert_tasks.
 * Імена ключів JSON відповідають тому, що читає SQL-функція (t->>'...').
 * Числові поля явно приводимо до цілих — функція очікує smallint/integer.
 */
function _buildTasksPayload(tasks) {
  return (tasks || []).map((t, idx) => ({
    id:        t.id   || null,
    n:         Math.trunc(t.n   || 0),
    order:     idx,
    name:      t.name || "",
    cat:       Math.trunc(t.cat  || 0),
    ms:        Math.trunc(t.ms   || 0),
    ws:        Math.trunc(t.ws   || 0),
    me:        Math.trunc(t.me   || 0),
    we:        Math.trunc(t.we   || 0),
    prog:      Math.trunc(t.prog || 0),   // завжди ціле — smallint у БД
    budget:    Number(t.budget)  || 0,
    spent:     Number(t.spent)   || 0,
    deps:      t.deps    || [],
    phases:    t.phases  || null,
    costItems: t.costItems || null,       // саме так читає SQL-функція: t->'costItems'
    notes:     t.notes   || [],
  }));
}

/** Записує поточний стан allProjects у буфер (з userId для ізоляції між акаунтами). */
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
      allProjects, currentId, _userId: _sbUser?.id || null,
    }));
  } catch (_) {}
}

/**
 * Завантажує проєкт із сервера.
 * Логіка:
 *   _localVersion > _serverVersion → є незбережені локальні зміни → push, не завантажуємо.
 *   _localVersion === _serverVersion → нема змін → завантажуємо з сервера.
 */
async function apiLoadProject(localId) {
  const authUser = await _getCurrentAuthUser();
  if (!authUser) return;
  const localProject = getProjectSnapshot(localId);
  const serverId = getProjectServerId(localId);
  if (!serverId) return;

  const lv = localProject?._localVersion || 0;
  const sv = localProject?._serverVersion || 0;

  if (lv > sv) {
    // Є несинхронізовані локальні зміни — відправляємо на сервер.
    await apiSyncProject(localId);
    return;
  }

  // Локальний стан синхронізований — завантажуємо з сервера (джерело правди).
  try {
    const { data, error } = await sb
      .from("projects")
      .select("id,name,sm,sy,nm,cats,next_n,baseline,baseline_date,owner_id")
      .eq("id", serverId)
      .single();
    if (error) throw error;

    let resolvedRole = "owner";
    if (data.owner_id !== authUser.id) {
      const { data: share } = await sb
        .from("project_shares")
        .select("role")
        .eq("project_id", serverId)
        .eq("user_id", authUser.id)
        .single();
      resolvedRole = normalizeProjectRole(share?.role || "viewer");
    }
    setProjectRole(localId, resolvedRole);

    const { data: taskRows, error: te } = await sb
      .from("tasks")
      .select("id,n,order,name,cat,ms,ws,me,we,prog,budget,spent,deps,phases,cost_items,notes")
      .eq("project_id", serverId)
      .order("order", { ascending: true });
    if (te) throw te;

    const loadedTasks = (taskRows || []).map((t) => ({
      id: t.id, n: t.n, name: t.name, cat: t.cat,
      ms: t.ms, ws: t.ws, me: t.me, we: t.we, prog: t.prog,
      budget: Number(t.budget), spent: Number(t.spent),
      deps: t.deps || [], phases: t.phases || null,
      costItems: t.cost_items || null, notes: t.notes || [],
    }));

    // Після завантаження з сервера версії вирівнюємо → lv === sv → "в синхроні"
    const syncedVersion = lv;
    allProjects[localId] = {
      proj: {
        name: data.name, sm: data.sm, sy: data.sy, nm: data.nm,
        baseline: data.baseline, baselineDate: data.baseline_date,
      },
      cats:  data.cats || [],
      tasks: loadedTasks,
      nextN: data.next_n || 1,
      _serverId:      data.id,
      _role:          getStoredProjectRole(localId, resolvedRole),
      _localVersion:  syncedVersion,
      _serverVersion: syncedVersion,
    };
    _saveBuffer();
    loadCurrent();
    render();
    _updateReadOnlyUI();
    if (typeof refreshUserSyncStatus === "function") refreshUserSyncStatus();
  } catch (_) {}
}

/**
 * Відправляє проєкт на сервер.
 * Приймає idToSync — щоб коректно працювати після switchProject,
 * коли currentId вже змінився, а дебаунс ще не спрацював.
 */
async function apiSyncProject(idToSync) {
  const authUser = await _getCurrentAuthUser();
  if (!authUser) return;
  const snapId  = idToSync || currentId;
  if (!snapId) return;
  const p       = getProjectSnapshot(snapId);
  if (!p) return;
  const serverId = getProjectServerId(snapId);
  if (!serverId) { await apiCreateProject(snapId); return; }
  const role = getStoredProjectRole(snapId, "viewer");
  if (!canEditTasks(role)) return;

  try {
    // Перевіряємо, що проєкт ще існує на сервері
    const { data: existing, error: checkErr } = await sb
      .from("projects").select("id").eq("id", serverId).maybeSingle();
    if (checkErr) throw checkErr;

    if (!existing) {
      p._serverId = null;
      await apiCreateProject(snapId);
      return;
    }

    // Паралельно оновлюємо метадані проєкту і задачі
    const [projRes, tasksRes] = await Promise.all([
      sb.from("projects").update({
        name:          p.proj.name,
        sm:            p.proj.sm,
        sy:            p.proj.sy,
        nm:            p.proj.nm,
        cats:          p.cats,
        next_n:        p.nextN,
        baseline:      p.proj.baseline      || null,
        baseline_date: p.proj.baselineDate  || null,
        updated_at:    new Date().toISOString(),
      }).eq("id", serverId),
      sb.rpc("upsert_tasks", {
        p_project_id: serverId,
        p_tasks:      _buildTasksPayload(p.tasks),
      }),
    ]);

    if (projRes.error)  throw projRes.error;
    if (tasksRes.error) throw tasksRes.error;
    await _assertSyncedTaskCount(serverId, (p.tasks || []).length);

    // Обидва запити успішні — позначаємо проєкт як синхронізований.
    // _serverVersion = _localVersion → наступний apiLoadProject не перезапише дані.
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
  const p = getProjectSnapshot(snapId);
  if (!snapId || !p) return;

  const projectPayload = {
    owner_id:      authUser.id,
    name:          p.proj.name,
    sm:            p.proj.sm,
    sy:            p.proj.sy,
    nm:            p.proj.nm,
    cats:          p.cats,
    next_n:        p.nextN,
    baseline:      p.proj.baseline     || null,
    baseline_date: p.proj.baselineDate || null,
  };

  const { error: insertError } = await sb
    .from("projects")
    .insert(projectPayload);

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

  p._serverId = data.id;
  setProjectOwnerRole(snapId);
  _saveBuffer();

  try {
    if ((p.tasks || []).length > 0) {
      const { error: tasksError } = await sb.rpc("upsert_tasks", {
        p_project_id: data.id,
        p_tasks:      _buildTasksPayload(p.tasks),
      });
      if (tasksError) throw tasksError;
    }
    await _assertSyncedTaskCount(data.id, (p.tasks || []).length);

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

  const entityType = payload.entityType || "project";
  const entityId = payload.entityId != null ? String(payload.entityId) : null;
  const details = { ...payload };
  delete details.entityType;
  delete details.entityId;

  const { error } = await sb.from("activity_log").insert({
    project_id: serverId,
    actor_id: authUser.id,
    actor_name: _sbProfile?.name || authUser?.user_metadata?.name || null,
    actor_email: authUser?.email || null,
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId,
    payload: details,
  });

  if (error) throw error;
}

/** Повертає список користувачів з доступом до поточного проєкту. */
async function apiGetShares() {
  const authUser = await _getCurrentAuthUser();
  const serverId = getCurrentProjectServerId();
  if (!serverId || !authUser) return [];

  const { data, error } = await sb
    .from("project_shares")
    .select("id, role, user:profiles(id,name,email)")
    .eq("project_id", serverId);

  if (error) return [];
  return data || [];
}

/** Надає доступ до проєкту за email. */
async function apiShareProject(email, role = "viewer") {
  const authUser = await _getCurrentAuthUser();
  const serverId = getCurrentProjectServerId();
  if (!serverId || !authUser) return;
  if (!canInviteUsers()) throw new Error("У вас немає прав на запрошення користувачів");

  const shareRole = normalizeProjectRole(role);
  if (!isShareableProjectRole(shareRole)) throw new Error("Непідтримувана роль доступу");

  const { data: profile } = await sb
    .from("profiles")
    .select("id, name")
    .eq(
      "id",
      (
        await sb
          .from("profiles")
          .select("id")
          .eq("id", (await sb.rpc("get_user_id_by_email", { p_email: email })).data)
          .single()
      ).data?.id,
    )
    .single();

  const { error } = await sb.from("project_shares").upsert(
    {
      project_id: serverId,
      user_id: profile?.id,
      role: shareRole,
      invited_by: authUser.id,
    },
    { onConflict: "project_id,user_id" },
  );

  if (error) throw new Error(error.message);
  await logShareActivity(AUDIT_EVENT_TYPES.SHARE_GRANTED, profile?.id || email, {
    email,
    role: shareRole,
  });
}

/** Змінює роль користувача у спільному доступі. */
async function apiUpdateShareRole(shareId, role) {
  if (!canManageShares()) throw new Error("У вас немає прав на зміну доступу");
  const shareRole = normalizeProjectRole(role);
  if (!isShareableProjectRole(shareRole)) throw new Error("Непідтримувана роль доступу");

  const { error } = await sb.from("project_shares").update({ role: shareRole }).eq("id", shareId);
  if (error) throw new Error(error.message);
  await logShareActivity(AUDIT_EVENT_TYPES.SHARE_ROLE_UPDATED, shareId, {
    role: shareRole,
  });
}

/** Видаляє запис спільного доступу. */
async function apiRemoveShare(shareId) {
  if (!canManageShares()) throw new Error("У вас немає прав на видалення доступу");
  const { error } = await sb.from("project_shares").delete().eq("id", shareId);
  if (error) throw new Error(error.message);
  await logShareActivity(AUDIT_EVENT_TYPES.SHARE_REVOKED, shareId);
}

/** Блокує UI-дії відповідно до capability поточної ролі. */
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
  return data || [];
}

function _updateReadOnlyUI() {
  const readonly = !canEditTasks();
  const canShare = canManageShares();

  const banner = document.getElementById("readonly-banner");
  if (banner) banner.style.display = readonly ? "flex" : "none";

  const gtbl = document.getElementById("gtbl-wrap");
  if (gtbl) {
    gtbl.style.pointerEvents = readonly ? "none" : "";
    gtbl.style.opacity = readonly ? "0.85" : "";
    gtbl.title = readonly ? "Режим перегляду — редагування заблоковано" : "";
  }

  const addBtn = document.querySelector(".btn-acc[onclick='openAdd()']");
  if (addBtn) addBtn.style.display = readonly ? "none" : "";

  const shareBtn = document.getElementById("share-btn");
  if (shareBtn) shareBtn.style.display = isLoggedIn() && canShare ? "" : "none";
}

async function openShareModal() {
  const shares = await apiGetShares();

  if (!canManageShares()) {
    Swal.fire({ icon: "info", title: "У вас немає прав на керування доступом" });
    return;
  }

  const roleOptions = SHAREABLE_PROJECT_ROLES.map(
    (role) => `<option value="${role}">${PROJECT_ROLE_LABELS[role]}</option>`,
  ).join("");

  const list = shares.length
    ? shares
        .map(
          (s) => {
            const shareRole = normalizeProjectRole(s.role);
            return `
        <div class="share-row">
          <span>${s.user?.name || "—"}</span>
          <select class="cost-sel" onchange="apiUpdateShareRole('${s.id}',this.value)">
            ${SHAREABLE_PROJECT_ROLES.map(
              (role) => `<option value="${role}"${shareRole === role ? " selected" : ""}>${PROJECT_ROLE_LABELS[role]}</option>`,
            ).join("")}
          </select>
          <button class="cost-act-btn del" onclick="apiRemoveShare('${s.id}');openShareModal()">✕</button>
        </div>`;
          },
        )
        .join("")
    : `<div class="share-empty">Нікому не надано доступ</div>`;

  Swal.fire({
    title: "👥 Спільний доступ",
    html: `
      <div class="share-modal-body">
        <div class="share-proj-name">Проєкт: <b>${proj.name}</b></div>
        <div class="share-list">${list}</div>
        <hr class="share-divider">
        <div class="share-add-title">Надати доступ:</div>
        <div class="share-add-row">
          <input id="share-email" type="email" placeholder="email@example.com" class="share-email-inp">
          <select id="share-role" class="share-role-sel">
            ${roleOptions}
          </select>
        </div>
        <div id="share-err" class="share-err"></div>
      </div>`,
    showCancelButton: true,
    confirmButtonText: "Надати доступ",
    cancelButtonText: "Закрити",
    preConfirm: async () => {
      const email = document.getElementById("share-email").value.trim();
      const role = document.getElementById("share-role").value;
      if (!email) { Swal.showValidationMessage("Введіть email"); return false; }
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
