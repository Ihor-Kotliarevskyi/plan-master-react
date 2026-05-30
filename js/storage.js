/**
 * Концепція зберігання:
 * SK_BUF — єдиний ключ localStorage, виступає як write-ahead buffer.
 * Сервер — джерело правди для залогінених користувачів.
 * Після успішного sync на сервер _serverVersion = _localVersion,
 * і наступний apiLoadProject не перезапише локальні дані.
 * Для незалогінених — SK_BUF є постійним сховищем.
 */
const SK_BUF = "gantt_buf";
const UI_SK  = "gantt_pro_ui";

let _syncDebounceTimer = null;
const STORAGE_UI = typeof buildRuntimeStorageUiModel === "function"
  ? buildRuntimeStorageUiModel()
  : {
      offlineIndicatorText: "⚠ офлайн — зміни збережено локально",
    };

function saveAll() {
  if (!currentId) return;

  const snapId  = currentId; // захоплюємо до будь-яких async операцій
  const prev    = allProjects[snapId];
  const nextMeta = typeof buildRuntimeProjectSnapshotMeta === "function"
    ? buildRuntimeProjectSnapshotMeta(prev)
    : null;

  allProjects[snapId] = {
    proj:  { ...proj },
    cats:  cats.map((c) => ({ ...c })),
    tasks: tasks.map((t) => ({ ...t })),
    nextN,
    ...(nextMeta || {
      _localUpdatedAt: new Date().toISOString(),
      _localVersion:  (prev?._localVersion  || 0) + 1,
      _serverVersion: prev?._serverVersion  || 0,
      ...(prev?._serverId ? { _serverId: prev._serverId } : {}),
      ...(prev?._role
        ? {
            _role:
              typeof normalizeProjectRole === "function"
                ? normalizeProjectRole(prev._role, prev._role)
                : prev._role,
          }
        : {}),
    }),
  };

  try {
    const _userId = (typeof isLoggedIn === "function" && isLoggedIn() && typeof _sbUser !== "undefined")
      ? _sbUser?.id : null;
    const payload = typeof buildRuntimeStorageBufferPayload === "function"
      ? buildRuntimeStorageBufferPayload(allProjects, currentId, _userId)
      : { allProjects, currentId, _userId };
    localStorage.setItem(SK_BUF, JSON.stringify(payload));
  } catch (_) {}

  if (typeof apiSyncProject === "function" &&
      typeof isLoggedIn    === "function" &&
      isLoggedIn()) {
    if (typeof setUserSyncStatus === "function") setUserSyncStatus("warn");
    clearTimeout(_syncDebounceTimer);
    // передаємо snapId, щоб дебаунс не використовував currentId,
    // який міг змінитись після switchProject
    _syncDebounceTimer = setTimeout(() => apiSyncProject(snapId), 800);
  }
}

function _isValidBufferedProjectSnapshot(snapshot) {
  return !!(
    snapshot &&
    snapshot.proj &&
    Array.isArray(snapshot.cats) &&
    Array.isArray(snapshot.tasks)
  );
}

function _repairBufferedProjects(projectMap) {
  return Object.fromEntries(
    Object.entries(projectMap || {}).filter(([, snapshot]) => _isValidBufferedProjectSnapshot(snapshot)),
  );
}

function loadAll() {
  // UI-налаштування (зум, фільтри) — незмінно
  try {
    const ui = JSON.parse(localStorage.getItem(UI_SK));
    if (ui?.hidePast  !== undefined) hidePast  = ui.hidePast;
    if (Array.isArray(ui?.hiddenCats)) hiddenCats = new Set(ui.hiddenCats);
    if (ui?.filterCat !== undefined) filterCat = ui.filterCat;
    if (ui?.ganttFilters) ganttFilters = { ...ganttFilters, ...ui.ganttFilters };
    if (ui?.finActiveTab) finActiveTab = ui.finActiveTab;
    if (ui?.showWeeklyCostBars !== undefined) showWeeklyCostBars = ui.showWeeklyCostBars;
    if (ui?.financeChartHeight) financeChartHeight = ui.financeChartHeight;
    if (ui?.zoomLevel) {
      zoomLevel = ui.zoomLevel;
      document.documentElement.style.setProperty("--cw", zoomLevel + "px");
    }
  } catch (_) {}

  // Міграція: якщо є старий ключ а нового ще немає — переносимо
  try {
    if (!localStorage.getItem(SK_BUF) && localStorage.getItem("gantt_pro_v4")) {
      localStorage.setItem(SK_BUF, localStorage.getItem("gantt_pro_v4"));
      localStorage.removeItem("gantt_pro_v4");
    }
  } catch (_) {}

  // Завантаження з буфера
  try {
    const d = JSON.parse(localStorage.getItem(SK_BUF));
    if (d?.allProjects && Object.keys(d.allProjects).length) {
      allProjects = _repairBufferedProjects(d.allProjects);
      if (typeof normalizeRuntimeBufferedProjectRoles === "function") {
        normalizeRuntimeBufferedProjectRoles(allProjects);
      } else if (typeof normalizeProjectRole === "function") {
        Object.values(allProjects).forEach((projectSnap) => {
          if (projectSnap && projectSnap._role) {
            projectSnap._role = normalizeProjectRole(projectSnap._role, projectSnap._role);
          }
        });
      }
      const projectIds = Object.keys(allProjects || {});
      if (!projectIds.length) {
        initDefaultProject();
      } else {
        currentId = allProjects[d.currentId] ? d.currentId : projectIds[0];
        try {
          const payload = typeof buildRuntimeStorageBufferPayload === "function"
            ? buildRuntimeStorageBufferPayload(allProjects, currentId, d._userId || null)
            : { allProjects, currentId, _userId: d._userId || null };
          localStorage.setItem(SK_BUF, JSON.stringify(payload));
        } catch (_) {}
      }
    } else {
      initDefaultProject();
    }
  } catch (_) {
    initDefaultProject();
  }
  loadCurrent();
}

function initDefaultProject() {
  const id = "p_" + Date.now();
  const sy = new Date().getFullYear();
  allProjects = {
    [id]: {
      proj:  { ...DEF_PROJ, sy },
      cats:  DEF_CATS.map((c) => ({ ...c })),
      tasks: [],
      nextN: 1,
      ...(typeof buildRuntimeInitialProjectSnapshotMeta === "function"
        ? buildRuntimeInitialProjectSnapshotMeta()
        : {
            _localUpdatedAt: new Date().toISOString(),
            _localVersion:  1,
            _serverVersion: 0,
          }),
    },
  };
  currentId = id;
}

function _migrateProject() {
  let changed = false;

  const refToId = {};
  tasks.forEach((t) => {
    const oldId = t.id ? String(t.id) : "";
    if (!isUuid(t.id)) {
      t.id = genId();
      changed = true;
    }
    if (oldId) refToId[oldId] = t.id;
    if (t.n !== undefined) refToId[String(t.n)] = t.id;
  });

  const nToId = {};
  tasks.forEach((t) => { nToId[t.n] = t.id; });

  tasks.forEach((t) => {
    if (!t.deps?.length) return;
    t.deps = t.deps.map((dep) => {
      const rawId = dep && typeof dep === "object" ? dep.id || dep.n : dep;
      const id = refToId[String(rawId)] || nToId[rawId] || (isUuid(rawId) ? String(rawId) : null);
      if (!id) return null;
      if (dep && typeof dep === "object" && dep.id === id && isUuid(id)) return dep;
      changed = true;
      return { id, type: dep?.type || "FS", threshold: dep?.threshold || 0 };
    }).filter(Boolean);
  });

  if (proj.baseline && Array.isArray(proj.baseline) && proj.baseline.some((b) => !b.id)) {
    proj.baseline = proj.baseline.map((b) => {
      if (b.id) return b;
      const id = nToId[b.n];
      return id ? { ...b, id } : null;
    }).filter(Boolean);
    changed = true;
  }

  return changed;
}

function loadCurrent() {
  const p = allProjects[currentId];
  if (!p) return;
  proj  = { ...p.proj };
  cats  = p.cats.map((c) => ({ ...c }));
  tasks = p.tasks.map((t) => ({ ...t }));
  nextN = p.nextN || Math.max(0, ...tasks.map((t) => t.n)) + 1;
  if (_migrateProject()) saveAll();
}

function _updateOnlineStatus() {
  const el = document.getElementById("sync-indicator");
  if (!el) return;
  if (!navigator.onLine) {
    el.textContent = STORAGE_UI.offlineIndicatorText;
    el.style.opacity = "1";
    el.style.color = "var(--warn, #e67e00)";
    if (typeof refreshUserSyncStatus === "function" &&
        typeof isLoggedIn === "function" &&
        isLoggedIn()) {
      refreshUserSyncStatus("warn");
    }
  } else {
    el.textContent = "";
    el.style.opacity = "0";
    el.style.color = "";
    if (typeof refreshUserSyncStatus === "function" &&
        typeof isLoggedIn === "function" &&
        isLoggedIn()) {
      refreshUserSyncStatus();
    }
    if (typeof apiSyncProject === "function" &&
        typeof isLoggedIn    === "function" &&
        isLoggedIn()) {
      apiSyncProject(currentId);
    }
  }
}

window.addEventListener("online",  _updateOnlineStatus);
window.addEventListener("offline", _updateOnlineStatus);

function switchProject(id) {
  saveAll(); // зберігає поточний проєкт зі збільшеним _localVersion
  currentId = id;
  loadCurrent();
  hiddenCats = new Set();
  render();
  updateProjSel();
  if (typeof refreshUserSyncStatus === "function") refreshUserSyncStatus();

  if (typeof apiLoadProject === "function" &&
      typeof isLoggedIn    === "function" &&
      isLoggedIn()) {
    apiLoadProject(id);
  }
}
