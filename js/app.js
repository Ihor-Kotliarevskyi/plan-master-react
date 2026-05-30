const APP_UI = typeof buildRuntimeAppUiModel === "function"
  ? buildRuntimeAppUiModel()
  : {
      importedProjectFallbackName: "Imported project",
      copiedTaskSuffix: " (copy)",
      duplicateProjectTitle: "A project with this name already exists",
      duplicateProjectText: "Choose a different name for the imported project.",
      importConfirmButtonText: "Import",
      cancelButtonText: "Cancel",
      requiredProjectNameMessage: "Enter project name",
      duplicateProjectNameMessage: "A project with this name already exists",
      numberedCopySuffix: (count) => ` (copy ${count})`,
      importSuccessTitle: (projectName) => `Imported: \"${projectName}\"`,
      importInvalidTitle: "Error",
      importInvalidText: "Could not read the file. Check the JSON format.",
      workbookSheets: { schedule: "Schedule", summary: "Summary", estimate: "Estimate", payments: "Payments" },
      scheduleHeader: [
        "#", "Name", "Category", "Contractor",
        "Start (month)", "Start (week)",
        "End (month)", "End (week)",
        "Duration (weeks)", "Progress (%)",
        "Budget", "Spent", "Remaining",
        "Dependencies",
      ],
      summaryHeader: [
        "Category", "Task count", "Budget",
        "Spent", "Remaining", "Avg progress (%)",
      ],
      estimateHeader: [
        "#", "Task name", "Type", "Material/Service",
        "Supplier", "Unit", "Qty", "Unit price",
        "Estimate", "Paid",
      ],
      paymentsHeader: [
        "#", "Task name", "Contractor", "Item type", "Material/Service",
        "Payment date", "Payment type", "Payment amount", "Note",
      ],
      overdueWeeksLabel: (weeks) => `${weeks} w`,
      overdueMonthsLabel: (months) => `${months} mo`,
      overdueRemainingLabel: (remaining) => `remaining <b>${remaining}%</b>`,
      overdueLateLabel: (duration) => `overdue <b>${duration}</b>`,
      overdueTitle: (count) => `Overdue: ${count}`,
      overdueShowMoreLabel: (count) => `Show ${count} more`,
      overdueCollapseLabel: "Collapse",
      overdueCloseTitle: "Close",
    };

const APP_SHELL_TABS = [
  { id: "gantt", label: "Графік", icon: "gantt-chart" },
  { id: "finance", label: "Фінанси", icon: "wallet" },
  { id: "contractors", label: "Контрагенти", icon: "users-round" },
  { id: "charts", label: "Аналітика", icon: "bar-chart-2" },
];

function isReactMainShellEnabled() {
  return document.body?.dataset?.reactTransitionMainShell === "enabled";
}

function syncReactAppShellBridge() {
  document.dispatchEvent(new CustomEvent("plan-master:app-shell-sync"));
}

function getActiveAppTabId() {
  return document.querySelector(".pane.active")?.id?.replace("pane-", "") || "gantt";
}

function getAppShellProjectSelectState() {
  const selectLabels = typeof buildRuntimeProjectSelectLabels === "function"
    ? buildRuntimeProjectSelectLabels()
    : { ownGroupLabel: "Мої проєкти", sharedGroupLabel: "Розшарені", sharedRoleSeparator: " В· " };
  const entries = Object.entries(allProjects || {});
  const grouped = typeof groupProjectEntriesByAccess === "function"
    ? groupProjectEntriesByAccess(entries)
    : { own: entries, shared: [] };
  const selectState = typeof buildRuntimeProjectSelectState === "function"
    ? buildRuntimeProjectSelectState({
        ownEntries: grouped.own || [],
        sharedEntries: grouped.shared || [],
        currentId,
        getRoleLabel: (role) => typeof getRuntimeProjectRoleLabel === "function" ? getRuntimeProjectRoleLabel(role) : role,
        sharedRoleSeparator: selectLabels.sharedRoleSeparator,
        normalizeRole: (role) => typeof normalizeProjectRole === "function" ? normalizeProjectRole(role) : role,
      })
    : { own: [], shared: [] };
  return {
    labels: selectLabels,
    state: selectState,
  };
}

function getAppShellBridgeSnapshot() {
  const projectSelect = getAppShellProjectSelectState();
  const activeTab = getActiveAppTabId();
  const profile = typeof getActiveUserCabinetProfile === "function"
    ? getActiveUserCabinetProfile()
    : {
        loggedIn: typeof isLoggedIn === "function" && isLoggedIn(),
        profile: {
          name: typeof userProfile !== "undefined" ? userProfile?.name : "Профіль",
          email: typeof userProfile !== "undefined" ? userProfile?.email : "",
          avatar: typeof userProfile !== "undefined" ? userProfile?.avatar : null,
          theme: typeof userProfile !== "undefined" ? userProfile?.theme : "light",
          defaults: typeof userProfile !== "undefined" ? userProfile?.defaults : null,
        },
      };
  const identity = typeof buildRuntimeUserIdentityModel === "function"
    ? buildRuntimeUserIdentityModel(profile.profile, "Профіль")
    : {
        displayName: profile.profile?.name || "Профіль",
        emailText: profile.profile?.email || "",
        initial: ((profile.profile?.name || "П")[0] || "П").toUpperCase(),
        avatarUrl: profile.profile?.avatar || null,
        themeToggle: typeof buildRuntimeThemeToggleModel === "function"
          ? buildRuntimeThemeToggleModel(profile.profile?.theme)
          : { theme: "light", icon: "moon", label: "Темна" },
      };
  const syncBadge = typeof getCurrentSyncBadge === "function"
    ? getCurrentSyncBadge()
    : { status: "offline", label: "" };
  const role = typeof getStoredProjectRole === "function"
    ? getStoredProjectRole(currentId, "owner")
    : allProjects?.[currentId]?._role || "owner";
  const accessMeta = allProjects?.[currentId]?._access || null;
  const accessBanner = typeof buildRuntimeAccessBannerModel === "function"
    ? buildRuntimeAccessBannerModel(role, accessMeta)
    : {
        shouldShow: role !== "owner",
        roleLabel: typeof getRuntimeProjectRoleLabel === "function" ? getRuntimeProjectRoleLabel(role) : role,
        roleHint: typeof getProjectRoleHint === "function" ? getProjectRoleHint(role) : "",
        sharedMetaText: typeof buildRuntimeSharedProjectMetaText === "function"
          ? buildRuntimeSharedProjectMetaText(accessMeta)
          : "",
      };

  return {
    activeTab,
    tabs: APP_SHELL_TABS.map((tab) => ({ ...tab, isActive: tab.id === activeTab })),
    projectSelect,
    projectDates: typeof buildRuntimeHeaderDateText === "function"
      ? buildRuntimeHeaderDateText(getML(), proj.nm)
      : "",
    identity,
    syncBadge,
    shareVisible: typeof isLoggedIn === "function" && isLoggedIn() && typeof canManageShares === "function" && canManageShares(),
    accessBanner,
    capturedAt: new Date().toISOString(),
  };
}

function _buildCopiedTask(task, nextTaskNumber) {
  if (typeof buildRuntimeCopiedTask === "function") {
    return buildRuntimeCopiedTask({
      task,
      nextN: nextTaskNumber,
      newId: genId(),
      copiedTaskSuffix: APP_UI.copiedTaskSuffix,
    });
  }
  return {
    ...task,
    id: genId(),
    n: nextTaskNumber,
    name: task.name + APP_UI.copiedTaskSuffix,
    notes: [],
    phases: task.phases ? task.phases.map((phase) => ({ ...phase })) : null,
    costItems: taskCostItems(task).length ? taskCostItems(task).map((item) => ({ ...item })) : null,
    deps: [],
  };
}

function _projectNameExists(name) {
  if (typeof checkRuntimeProjectNameExists === "function") {
    return checkRuntimeProjectNameExists(allProjects || {}, name);
  }
  const needle = String(name || "").trim().toLowerCase();
  if (!needle) return false;
  return Object.values(allProjects || {}).some((p) =>
    String(p?.proj?.name || "").trim().toLowerCase() === needle
  );
}

function _uniqueProjectName(baseName) {
  if (typeof buildRuntimeUniqueProjectName === "function") {
    return buildRuntimeUniqueProjectName({
      projects: allProjects || {},
      baseName,
      fallbackName: APP_UI.importedProjectFallbackName,
      copiedTaskSuffix: APP_UI.copiedTaskSuffix,
      numberedCopySuffix: APP_UI.numberedCopySuffix,
    });
  }
  const cleanBase = String(baseName || APP_UI.importedProjectFallbackName).trim() || APP_UI.importedProjectFallbackName;
  if (!_projectNameExists(cleanBase)) return cleanBase;
  const firstCopy = `${cleanBase}${APP_UI.copiedTaskSuffix}`;
  if (!_projectNameExists(firstCopy)) return firstCopy;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${cleanBase}${APP_UI.numberedCopySuffix(i)}`;
    if (!_projectNameExists(candidate)) return candidate;
  }
  return `${cleanBase}${APP_UI.numberedCopySuffix(Date.now())}`;
}

function _normalizeImportedBaseline(baseline, idMap) {
  if (typeof buildRuntimeNormalizeImportedBaseline === "function") {
    return buildRuntimeNormalizeImportedBaseline(baseline, idMap);
  }
  if (!Array.isArray(baseline)) return baseline || null;
  return baseline
    .map((b) => {
      const mappedId = idMap.get(String(b?.id)) || idMap.get(String(b?.n));
      if (!mappedId) return null;
      return { ...b, id: mappedId };
    })
    .filter(Boolean);
}

function _buildImportedProjectSnapshot(data, fallbackProjectName, resolvedName) {
  const meta = typeof buildRuntimeInitialProjectSnapshotMeta === "function"
    ? buildRuntimeInitialProjectSnapshotMeta({ _role: "owner" })
    : {
        _localUpdatedAt: new Date().toISOString(),
        _localVersion: 1,
        _serverVersion: 0,
        _role: "owner",
      };

  if (typeof buildRuntimeImportedProjectSnapshot === "function") {
    return buildRuntimeImportedProjectSnapshot({
      data,
      fallbackProjectName,
      resolvedName,
      fallbackCategories: DEF_CATS,
      generatedTaskIds: (Array.isArray(data?.tasks) ? data.tasks : []).map(() => genId()),
      meta,
    });
  }

  const idMap = new Map();
  (Array.isArray(data?.tasks) ? data.tasks : []).forEach((task, idx) => {
    const nextId = genId();
    if (task?.id) idMap.set(String(task.id), nextId);
    if (task?.n !== undefined) idMap.set(String(task.n), nextId);
    idMap.set(String(idx + 1), nextId);
  });

  const normalizeDeps = (deps) =>
    (deps || [])
      .map((dep) => {
        const rawId = dep && typeof dep === "object" ? dep.id || dep.n : dep;
        const mappedId = idMap.get(String(rawId));
        if (!mappedId) return null;
        return {
          id: mappedId,
          type: dep?.type || "FS",
          threshold: dep?.threshold || 0,
        };
      })
      .filter(Boolean);

  const importedTasks = (Array.isArray(data?.tasks) ? data.tasks : []).map((task, idx) => {
    const taskId = idMap.get(String(task?.id || task?.n || idx + 1)) || genId();
    const normalized = {
      ...task,
      id: taskId,
      n: Number.isFinite(+task?.n) ? +task.n : idx + 1,
      cat: Number.isFinite(+task?.cat) ? +task.cat : 0,
      ms: Number.isFinite(+task?.ms) ? +task.ms : 0,
      ws: Number.isFinite(+task?.ws) ? +task.ws : 0,
      me: Number.isFinite(+task?.me) ? +task.me : 0,
      we: Number.isFinite(+task?.we) ? +task.we : 0,
      prog: Number.isFinite(+task?.prog) ? +task.prog : 0,
      budget: Number(task?.budget) || 0,
      spent: Number(task?.spent) || 0,
      deps: normalizeDeps(task?.deps),
      phases: task?.phases || null,
      costItems: Array.isArray(task?.costItems) ? task.costItems : Array.isArray(task?.cost_items) ? task.cost_items : null,
      notes: task?.notes || [],
    };
    delete normalized.cost_items;
    return normalized;
  });

  const maxN = importedTasks.reduce((m, task) => Math.max(m, +task.n || 0), 0);
  const importedProj = data?.proj || { ...DEF_PROJ, name: fallbackProjectName };
  return {
    proj: {
      ...importedProj,
      name: resolvedName,
      baseline: _normalizeImportedBaseline(importedProj.baseline, idMap),
    },
    cats: data?.cats || DEF_CATS.map((c) => ({ ...c })),
    tasks: importedTasks,
    nextN: maxN + 1,
    ...meta,
  };
}
function switchTab(id, el = null) {
  const tabElement = el || document.querySelector(`.tab[data-app-shell-action="switch-tab"][data-tab-id="${id}"]`);
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  document.querySelectorAll(".pane").forEach((p) => p.classList.remove("active"));
  tabElement?.classList.add("active");
  document.getElementById("pane-" + id).classList.add("active");
  document.body.classList.toggle("finance-active", id === "finance");
  document.body.classList.toggle("contractors-active", id === "contractors");
  try {
    const ui = JSON.parse(localStorage.getItem(UI_SK) || "{}");
    ui.activeTab = id;
    localStorage.setItem(UI_SK, JSON.stringify(ui));
  } catch (_) {}
  if (id === "finance") {
    renderFinFilters();
    renderFinance();
  }
  if (id === "contractors") {
    renderContractors();
  }
  if (id === "charts") {
    updateCbCatFilter();
    renderAutoCharts();
  }
  syncReactAppShellBridge();
}

function restoreActiveTab() {
  let activeTab = "gantt";
  try {
    activeTab = JSON.parse(localStorage.getItem(UI_SK) || "{}").activeTab || "gantt";
  } catch (_) {}
  switchTab(activeTab);
}

function refreshActivePane() {
  const pane = document.querySelector(".pane.active")?.id?.replace("pane-", "") || "gantt";
  document.body.classList.toggle("finance-active", pane === "finance");
  document.body.classList.toggle("contractors-active", pane === "contractors");
  if (pane === "finance") {
    renderFinFilters();
    renderFinance();
  }
  if (pane === "contractors") {
    renderContractors();
  }
  if (pane === "charts") {
    updateCbCatFilter();
    renderAutoCharts();
  }
  syncReactAppShellBridge();
}

const ZOOM_LEVELS = [10, 15, 25];
let zoomLevel = 25;

function applyZoom(px) {
  zoomLevel = px;
  document.documentElement.style.setProperty("--cw", px + "px");
  try {
    const ui = JSON.parse(localStorage.getItem(UI_SK) || "{}");
    ui.zoomLevel = px;
    localStorage.setItem(UI_SK, JSON.stringify(ui));
  } catch (_) {}
  renderTable();
}

function zoomIn() {
  const next = ZOOM_LEVELS.find((l) => l > zoomLevel) || ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
  applyZoom(next);
}

function zoomOut() {
  const prev = [...ZOOM_LEVELS].reverse().find((l) => l < zoomLevel) || ZOOM_LEVELS[0];
  applyZoom(prev);
}

function toggleHidePast() {
  hidePast = !hidePast;
  try {
    const ui = JSON.parse(localStorage.getItem(UI_SK) || "{}");
    ui.hidePast = hidePast;
    localStorage.setItem(UI_SK, JSON.stringify(ui));
  } catch (_) {}
  renderTable();
}

function toggleMonoBar() {
  monoBarColor = monoBarColor ? null : '#9ca3af';
  renderTable();
}

function setMonoColor(color) {
  monoBarColor = color;
  document.querySelectorAll('.bar').forEach(b => { b.style.background = color; });
}

function onTaskSearch(q) {
  taskSearch = q.trim().toLowerCase();
  const clearBtn = document.getElementById("task-search-clear");
  if (clearBtn) clearBtn.classList.toggle("show", !!taskSearch);
  document.querySelectorAll('#gtbl tbody tr').forEach(tr => {
    if (!tr.id?.startsWith('tr')) return;
    const ti = parseInt(tr.id.slice(2));
    if (isNaN(ti)) return;
    const t = tasks[ti];
    if (!t) return;
    const matches = taskSearch && t.name.toLowerCase().includes(taskSearch);
    tr.classList.toggle('task-search-match', !!matches);
    tr.classList.toggle('task-search-dim', !!(taskSearch && !matches));
  });
}

function clearTaskSearch() {
  const inp = document.getElementById("task-search-inp");
  if (inp) inp.value = "";
  onTaskSearch("");
}

function numStep(id, delta) {
  const el = document.getElementById(id);
  if (!el) return;
  const val = Number(el.value) + delta;
  const min = el.min !== "" ? Number(el.min) : -Infinity;
  const max = el.max !== "" ? Number(el.max) : Infinity;
  el.value = Math.min(max, Math.max(min, val));
}

function toggleToolsMenu() {
  document.getElementById("tools-dropdown")?.classList.toggle("open");
  syncReactAppShellBridge();
}
function closeToolsMenu() {
  document.getElementById("tools-dropdown")?.classList.remove("open");
  syncReactAppShellBridge();
}
function toggleContractorToolsMenu() {
  document.getElementById("contractor-tools-dropdown")?.classList.toggle("open");
}
function closeContractorToolsMenu() {
  document.getElementById("contractor-tools-dropdown")?.classList.remove("open");
}

function toggleCat(i, e) {
  if (e?.shiftKey) {
    // Shift+клік: мульти-вибір
    filterCat = null;
    hiddenCats.has(i) ? hiddenCats.delete(i) : hiddenCats.add(i);
  } else if (filterCat === i) {
    // Клік на вже активний фільтр → скинути
    filterCat = null;
    hiddenCats.clear();
  } else {
    // Ексклюзивний фільтр: показати тільки цю категорію
    filterCat = i;
    hiddenCats.clear();
    cats.forEach((_, idx) => { if (idx !== i) hiddenCats.add(idx); });
  }
  _saveFilterState();
  renderLegend();
  renderTable();
  const activeTab = document.querySelector(".tab.active")?.textContent || "";
  if (activeTab.includes("Фінанси")) renderFinance();
  if (activeTab.includes("Аналітика")) renderAutoCharts();
}

function copyTask(ti) {
  const src = tasks[ti];
  const copy = _buildCopiedTask(src, nextN++);
  tasks.splice(ti + 1, 0, copy);
  saveAll();
  renderTable();
}

function resetCatFilter() {
  filterCat = null;
  hiddenCats.clear();
  _saveFilterState();
  renderLegend();
  renderTable();
  const activeTab = document.querySelector(".tab.active")?.textContent || "";
  if (activeTab.includes("Фінанси")) renderFinance();
  if (activeTab.includes("Аналітика")) renderAutoCharts();
}

function _saveFilterState() {
  try {
    const ui = JSON.parse(localStorage.getItem(UI_SK) || "{}");
    ui.hiddenCats = [...hiddenCats];
    ui.filterCat = filterCat;
    localStorage.setItem(UI_SK, JSON.stringify(ui));
  } catch (_) {}
}

function exportXLSX() {
  const workbook = typeof buildRuntimeProjectWorkbookExport === "function"
    ? buildRuntimeProjectWorkbookExport({
        projectName: proj.name,
        tasks,
        categories: cats,
        monthLabels: getML(),
        scheduleHeader: APP_UI.scheduleHeader,
        summaryHeader: APP_UI.summaryHeader,
        estimateHeader: APP_UI.estimateHeader,
        paymentsHeader: APP_UI.paymentsHeader,
        workbookSheets: APP_UI.workbookSheets,
        getCategoryName: (index) => CN(index),
        getTaskDuration: (task) => dur(task),
        getTaskCostItems: (task) => taskCostItems(task),
        costTypeLabels: Object.fromEntries(
          Object.entries(COST_TYPES || {}).map(([key, value]) => [key, value?.label || key]),
        ),
        paymentTypeLabels: PAYMENT_TYPES || {},
      })
    : null;

  const wb = XLSX.utils.book_new();
  (workbook?.sheets || []).forEach((sheet) => {
    const ws = XLSX.utils.aoa_to_sheet(sheet.rows);
    ws["!cols"] = sheet.cols;
    if (sheet.freeze) ws["!freeze"] = sheet.freeze;
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  });
  XLSX.writeFile(wb, workbook?.filename || `${proj.name}.xlsx`);
}

function exportJSON() {
  dl(
    `${proj.name}.json`,
    JSON.stringify({ proj, cats, tasks }, null, 2),
    "application/json",
  );
}

async function _resolveImportProjectName(baseName) {
  const name = String(baseName || APP_UI.importedProjectFallbackName).trim() || APP_UI.importedProjectFallbackName;
  if (!_projectNameExists(name)) return name;

  const suggested = _uniqueProjectName(name);
  const result = await Swal.fire({
    icon: "question",
    title: APP_UI.duplicateProjectTitle,
    text: APP_UI.duplicateProjectText,
    input: "text",
    inputValue: suggested,
    showCancelButton: true,
    confirmButtonText: APP_UI.importConfirmButtonText,
    cancelButtonText: APP_UI.cancelButtonText,
    inputValidator: (value) => {
      const nextName = String(value || "").trim();
      if (!nextName) return APP_UI.requiredProjectNameMessage;
      if (_projectNameExists(nextName)) return APP_UI.duplicateProjectNameMessage;
      return null;
    },
  });

  return result.isConfirmed ? String(result.value || suggested).trim() : null;
}

function importJSON(e) {
  const f = e.target.files[0];
  if (!f) return;
  const appUi = APP_UI;
  const r = new FileReader();
  r.onload = async (ev) => {
    try {
      const d = JSON.parse(ev.target.result);
      if (Array.isArray(d.tasks)) {
        const importState = typeof buildRuntimeResolveImportSource === "function"
          ? buildRuntimeResolveImportSource({
              data: d,
              fileName: f.name,
              fallbackProjectName: APP_UI.importedProjectFallbackName,
              currentId,
            })
          : {
              shouldSaveCurrent: Boolean(currentId),
              importBaseName: f.name.replace(/\.json$/i, ""),
              projectName: d?.proj?.name || f.name.replace(/\.json$/i, ""),
              newProjectId: "p_" + Date.now(),
            };
        if (importState.shouldSaveCurrent) saveAll();

        const resolvedName = await _resolveImportProjectName(importState.projectName);
        if (!resolvedName) return;

        const snapshot = _buildImportedProjectSnapshot(
          d,
          importState.importBaseName,
          resolvedName,
        );
        const activation = typeof buildRuntimeImportedProjectActivationState === "function"
          ? buildRuntimeImportedProjectActivationState({
              projects: allProjects || {},
              projectId: importState.newProjectId,
              snapshot,
              role: "owner",
            })
          : {
              projects: {
                ...(allProjects || {}),
                [importState.newProjectId]: snapshot,
              },
              currentId: importState.newProjectId,
              role: "owner",
              hiddenCats: [],
            };
        allProjects = activation.projects;
        currentId = activation.currentId;
        if (typeof _projectRole !== "undefined") _projectRole = activation.role;
        loadCurrent();
        saveAll();
        hiddenCats = new Set(activation.hiddenCats || []);
        render();
        updateProjSel();
        if (typeof _updateReadOnlyUI === "function") _updateReadOnlyUI();
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: appUi.importSuccessTitle(snapshot.proj.name),
          showConfirmButton: false,
          timer: 3000,
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: appUi.importInvalidTitle,
        text: appUi.importInvalidText,
      });
    }
  };
  r.readAsText(f);
  e.target.value = "";
}


loadAll();
render();
restoreActiveTab();
checkOverdue();

function _formatOverdueDur(weeks) {
  if (weeks <= 0) return "";
  if (weeks < 6) return APP_UI.overdueWeeksLabel(weeks);
  const months = Math.round(weeks / 4);
  return APP_UI.overdueMonthsLabel(months);
}
/** Перевіряє прострочені задачі та показує/ховає банер. */
function checkOverdue(forceShow = false) {
  const tw = todayWk();
  const banner = document.getElementById("overdue-banner");
  const reopenBtn = document.getElementById("btn-overdue-reopen");
  if (!banner) return;
  if (banner.dataset.projectId !== currentId) {
    banner.dataset.projectId = currentId || "";
    banner.dataset.closed = "0";
    banner.classList.remove("show");
    if (reopenBtn) reopenBtn.style.display = "none";
  }

  if (!currentId || !allProjects[currentId] || tw < 0) {
    banner.classList.remove("show");
    if (reopenBtn) reopenBtn.style.display = "none";
    return;
  }

  const overdue = tasks.filter(
    (t) => t.prog < 100 && t.me * 4 + t.we < tw && !hiddenCats.has(t.cat),
  );

  if (!overdue.length) {
    banner.classList.remove("show");
    if (reopenBtn) reopenBtn.style.display = "none";
    return;
  }

  if (!forceShow && banner.dataset.closed === "1") {
    if (reopenBtn) reopenBtn.style.display = "";
    return;
  }

  const PREVIEW = 3;
  const allItems = overdue.map((t) => {
    const overdueWks = tw - (t.me * 4 + t.we);
    const remaining = 100 - t.prog;
    const durStr = _formatOverdueDur(overdueWks);
    return `<div class="ob-item">
      <span class="ob-num">#${t.n}</span>
      <span class="ob-name">${t.name}</span>
      <span class="ob-stat">${APP_UI.overdueRemainingLabel(remaining)}</span>
      <span class="ob-stat" style="color:var(--err)">${APP_UI.overdueLateLabel(durStr)}</span>
    </div>`;
  });

  const previewHTML = allItems.slice(0, PREVIEW).join("");
  const hiddenHTML = allItems.slice(PREVIEW).join("");
  const hasMore = overdue.length > PREVIEW;

  banner.dataset.closed = "0";
  banner.innerHTML = `
    <span class="ob-icon"><i data-lucide="triangle-alert"></i></span>
    <div class="ob-body">
      <div class="ob-title">${APP_UI.overdueTitle(overdue.length)}</div>
      <div class="ob-list" id="ob-list-preview">${previewHTML}</div>
      ${
        hasMore
          ? `
        <div class="ob-list" id="ob-list-hidden" style="display:none">${hiddenHTML}</div>
        <button class="ob-show-more" id="ob-show-more-btn" data-overdue-action="toggle-expand">
          ${APP_UI.overdueShowMoreLabel(overdue.length - PREVIEW)}
        </button>`
          : ""
      }
    </div>
    <span class="ob-close" data-overdue-action="close-banner" title="${APP_UI.overdueCloseTitle}"><i data-lucide="x"></i></span>`;

  banner.classList.add("show");
  lucide.createIcons({ nodes: [banner] });
  if (reopenBtn) reopenBtn.style.display = "none";
}
function toggleOverdueExpand() {
  const hidden = document.getElementById("ob-list-hidden");
  const btn = document.getElementById("ob-show-more-btn");
  if (!hidden || !btn) return;
  const isOpen = hidden.style.display !== "none";
  hidden.style.display = isOpen ? "none" : "block";
  btn.textContent = isOpen
    ? APP_UI.overdueShowMoreLabel(hidden.querySelectorAll(".ob-item").length)
    : APP_UI.overdueCollapseLabel;
}

function closeOverdueBanner() {
  const banner = document.getElementById("overdue-banner");
  const reopenBtn = document.getElementById("btn-overdue-reopen");
  if (banner) {
    banner.classList.remove("show");
    banner.dataset.closed = "1";
  }
  if (reopenBtn) reopenBtn.style.display = "";
}

window.deferredPrompt = window.deferredPrompt || null;
