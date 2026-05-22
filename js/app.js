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
function switchTab(id, el) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  document.querySelectorAll(".pane").forEach((p) => p.classList.remove("active"));
  el.classList.add("active");
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
}

function restoreActiveTab() {
  let activeTab = "gantt";
  try {
    activeTab = JSON.parse(localStorage.getItem(UI_SK) || "{}").activeTab || "gantt";
  } catch (_) {}
  const tab = [...document.querySelectorAll(".tab")].find((el) => el.getAttribute("onclick")?.includes(`'${activeTab}'`));
  if (tab) switchTab(activeTab, tab);
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
}
function closeToolsMenu() {
  document.getElementById("tools-dropdown")?.classList.remove("open");
}
function toggleContractorToolsMenu() {
  document.getElementById("contractor-tools-dropdown")?.classList.toggle("open");
}
function closeContractorToolsMenu() {
  document.getElementById("contractor-tools-dropdown")?.classList.remove("open");
}
document.addEventListener("click", (e) => {
  if (!e.target.closest("#tools-menu")) closeToolsMenu();
  if (!e.target.closest("#contractor-tools-menu")) closeContractorToolsMenu();
});

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
  const appUi = APP_UI;
  const copy = {
    ...src,
    id: genId(),
    n: nextN++,
    name: src.name + appUi.copiedTaskSuffix,
    notes: [],
    phases: src.phases ? src.phases.map((p) => ({ ...p })) : null,
    costItems: taskCostItems(src).length ? taskCostItems(src).map((c) => ({ ...c })) : null,
    deps: [],
  };
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
  const ml = getML();

  const header = APP_UI.scheduleHeader;

  const rows = tasks.map((t) => [
    t.n,
    t.name,
    CN(t.cat),
    t.contr || "",
    `${ml[t.ms]?.name || ""} ${ml[t.ms]?.y || ""}`.trim(),
    t.ws + 1,
    `${ml[t.me]?.name || ""} ${ml[t.me]?.y || ""}`.trim(),
    t.we + 1,
    dur(t),
    t.prog,
    +t.budget || 0,
    +t.spent || 0,
    (+t.budget || 0) - (+t.spent || 0),
    (t.deps || [])
      .map((d) =>
        typeof d === "number"
          ? d
          : `${d.n}(${d.type}${d.type === "SS" ? "+" + d.threshold + "%" : ""})`,
      )
      .join(", "),
  ]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);

  ws["!cols"] = [
    { wch: 5 }, { wch: 36 }, { wch: 22 }, { wch: 18 },
    { wch: 16 }, { wch: 7 }, { wch: 16 }, { wch: 7 },
    { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 18 },
  ];
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  XLSX.utils.book_append_sheet(wb, ws, APP_UI.workbookSheets.schedule);

  const finHeader = APP_UI.summaryHeader;
  const finRows = cats.map((c, i) => {
    const ct = tasks.filter((t) => t.cat === i);
    const b = ct.reduce((s, t) => s + (+t.budget || 0), 0);
    const sp = ct.reduce((s, t) => s + (+t.spent || 0), 0);
    const pg = ct.length
      ? Math.round(ct.reduce((s, t) => s + t.prog, 0) / ct.length)
      : 0;
    return [c.name, ct.length, b, sp, b - sp, pg];
  });
  const wsFin = XLSX.utils.aoa_to_sheet([finHeader, ...finRows]);
  wsFin["!cols"] = [
    { wch: 24 }, { wch: 12 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsFin, APP_UI.workbookSheets.summary);

  const costHeader = APP_UI.estimateHeader;
  const costRows = [];
  tasks.forEach((t) => {
    taskCostItems(t).forEach((it) => {
      const qty = it.qty == null ? 1 : (+it.qty || 0);
      const paid = (it.payments || []).reduce(
        (s, p) => s + (+p.amount || 0),
        0,
      );
      costRows.push([
        t.n,
        t.name,
        COST_TYPES?.[it.type]?.label || it.type,
        it.name,
        it.supplier,
        it.unit,
        qty,
        it.unitPrice || 0,
        qty * (+it.unitPrice || 0),
        paid,
      ]);
    });
  });
  if (costRows.length) {
    const wsC = XLSX.utils.aoa_to_sheet([costHeader, ...costRows]);
    wsC["!cols"] = [
      { wch: 5 }, { wch: 30 }, { wch: 14 }, { wch: 28 },
      { wch: 20 }, { wch: 6 }, { wch: 7 }, { wch: 10 },
      { wch: 14 }, { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, wsC, APP_UI.workbookSheets.estimate);
  }

  const payHeader = APP_UI.paymentsHeader;
  const payRows = [];
  tasks.forEach((t) => {
    taskCostItems(t).forEach((it) => {
      (it.payments || []).forEach((p) => {
        payRows.push([
          t.n,
          t.name,
          it.supplier || "",
          COST_TYPES?.[it.type]?.label || it.type || "",
          it.name || "",
          p.date || "",
          PAYMENT_TYPES?.[p.type] || p.type || "",
          +p.amount || 0,
          p.note || "",
        ]);
      });
    });
  });
  if (payRows.length) {
    const wsP = XLSX.utils.aoa_to_sheet([payHeader, ...payRows]);
    wsP["!cols"] = [
      { wch: 5 }, { wch: 30 }, { wch: 24 }, { wch: 14 }, { wch: 28 },
      { wch: 13 }, { wch: 12 }, { wch: 16 }, { wch: 28 },
    ];
    XLSX.utils.book_append_sheet(wb, wsP, APP_UI.workbookSheets.payments);
  }

  XLSX.writeFile(wb, `${proj.name}.xlsx`);
}

function exportJSON() {
  dl(
    `${proj.name}.json`,
    JSON.stringify({ proj, cats, tasks }, null, 2),
    "application/json",
  );
}

function _projectNameExists(name) {
  const needle = String(name || "").trim().toLowerCase();
  if (!needle) return false;
  return Object.values(allProjects || {}).some((p) =>
    String(p?.proj?.name || "").trim().toLowerCase() === needle
  );
}

function _uniqueProjectName(baseName) {
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
function _normalizeImportedBaseline(baseline, idMap) {
  if (!Array.isArray(baseline)) return baseline || null;
  return baseline
    .map((b) => {
      const mappedId = idMap.get(String(b?.id)) || idMap.get(String(b?.n));
      if (!mappedId) return null;
      return { ...b, id: mappedId };
    })
    .filter(Boolean);
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
        if (currentId) saveAll();

        const id = "p_" + Date.now();
        const idMap = new Map();
        d.tasks.forEach((t, idx) => {
          const nextId = genId();
          if (t.id) idMap.set(String(t.id), nextId);
          if (t.n !== undefined) idMap.set(String(t.n), nextId);
          idMap.set(String(idx + 1), nextId);
        });

        const normalizeDeps = (deps) =>
          (deps || [])
            .map((dep) => {
              const rawId = dep && typeof dep === "object"
                ? dep.id || dep.n
                : dep;
              const mappedId = idMap.get(String(rawId));
              if (!mappedId) return null;
              return {
                id: mappedId,
                type: dep?.type || "FS",
                threshold: dep?.threshold || 0,
              };
            })
            .filter(Boolean);

        const importedTasks = d.tasks.map((t, idx) => {
          const taskId = idMap.get(String(t.id || t.n || idx + 1)) || genId();
          const normalized = {
            ...t,
            id: taskId,
            n: Number.isFinite(+t.n) ? +t.n : idx + 1,
            cat: Number.isFinite(+t.cat) ? +t.cat : 0,
            ms: Number.isFinite(+t.ms) ? +t.ms : 0,
            ws: Number.isFinite(+t.ws) ? +t.ws : 0,
            me: Number.isFinite(+t.me) ? +t.me : 0,
            we: Number.isFinite(+t.we) ? +t.we : 0,
            prog: Number.isFinite(+t.prog) ? +t.prog : 0,
            budget: Number(t.budget) || 0,
            spent: Number(t.spent) || 0,
            deps: normalizeDeps(t.deps),
            phases: t.phases || null,
            costItems: Array.isArray(t.costItems) ? t.costItems : Array.isArray(t.cost_items) ? t.cost_items : null,
            notes: t.notes || [],
          };
          delete normalized.cost_items;
          return normalized;
        });
        const maxN = importedTasks.reduce((m, t) => Math.max(m, +t.n || 0), 0);
        const importedProj = d.proj || { ...DEF_PROJ, name: f.name.replace(".json", "") };
        const resolvedName = await _resolveImportProjectName(importedProj.name || f.name.replace(".json", ""));
        if (!resolvedName) return;

        allProjects[id] = {
          proj: {
            ...importedProj,
            name: resolvedName,
            baseline: _normalizeImportedBaseline(importedProj.baseline, idMap),
          },
          cats: d.cats || DEF_CATS.map((c) => ({ ...c })),
          tasks: importedTasks,
          nextN: maxN + 1,
          ...(typeof buildRuntimeInitialProjectSnapshotMeta === "function"
            ? buildRuntimeInitialProjectSnapshotMeta({ _role: "owner" })
            : {
                _localUpdatedAt: new Date().toISOString(),
                _localVersion: 1,
                _serverVersion: 0,
                _role: "owner",
              }),
        };
        currentId = id;
        if (typeof _projectRole !== "undefined") _projectRole = "owner";
        loadCurrent();
        saveAll();
        hiddenCats = new Set();
        render();
        updateProjSel();
        if (typeof _updateReadOnlyUI === "function") _updateReadOnlyUI();
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: appUi.importSuccessTitle(allProjects[id].proj.name),
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

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    [
      closeModal,
      closeProjModal,
      closeCatModal,
      closeProjMgr,
      closeChartEdit,
      closeUserModal,
      closePhaseModal,
      closePrintDialog,
      closeNotesModal,
      closeCostModal,
      typeof closeContractorEntryModal === "function" ? closeContractorEntryModal : null,
      typeof closeAuthModal === "function" ? closeAuthModal : null,
    ].forEach((fn) => fn && fn());
  }
  if (e.key === "Enter" && e.ctrlKey) {
    if (document.getElementById("modal").style.display !== "none") saveTask();
    if (document.getElementById("proj-modal").style.display !== "none")
      saveProjSettings();
    if (document.getElementById("cat-modal").style.display !== "none")
      saveCats();
    if (document.getElementById("chart-edit-modal").style.display !== "none")
      applyChartEdit();
    if (document.getElementById("contractor-entry-modal")?.style.display !== "none")
      saveContractorEntry();
  }
});

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
        <button class="ob-show-more" id="ob-show-more-btn"
                onclick="toggleOverdueExpand()">
          ${APP_UI.overdueShowMoreLabel(overdue.length - PREVIEW)}
        </button>`
          : ""
      }
    </div>
    <span class="ob-close" onclick="closeOverdueBanner()" title="${APP_UI.overdueCloseTitle}"><i data-lucide="x"></i></span>`;

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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
});
window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
});
