function render() {
  updateHeader();
  renderLegend();
  renderTable();
  updateProjSel();
  if (typeof _updateReadOnlyUI === "function") _updateReadOnlyUI();
  if (typeof refreshActivePane === "function") refreshActivePane();
  if (typeof checkOverdue === "function") checkOverdue();
}

function updateHeader() {
  const ml = getML();
  document.getElementById("head-dates").textContent = ml.length
    ? `${ml[0].name} ${ml[0].y} – ${ml[ml.length - 1].name} ${ml[ml.length - 1].y} · ${proj.nm} міс.`
    : "";
}

function updateProjSel() {
  const sel = document.getElementById("proj-sel");
  if (!sel) return;
  const entries = Object.entries(allProjects || {});
  const own = [];
  const shared = [];

  entries.forEach(([id, p]) => {
    const isShared = p?._access?.source === "shared" || (p?._role && p._role !== "owner");
    (isShared ? shared : own).push([id, p]);
  });

  const renderOptions = (list, isShared = false) =>
    list
      .map(([id, p]) => {
        const role = typeof normalizeProjectRole === "function" ? normalizeProjectRole(p?._role || "owner") : (p?._role || "owner");
        const roleLabel =
          isShared && typeof PROJECT_ROLE_LABELS !== "undefined"
            ? ` · ${PROJECT_ROLE_LABELS[role] || role}`
            : "";
        return `<option value="${id}"${id === currentId ? " selected" : ""}>${p.proj.name}${roleLabel}</option>`;
      })
      .join("");

  const ownMarkup = own.length ? `<optgroup label="Мої проєкти">${renderOptions(own)}</optgroup>` : "";
  const sharedMarkup = shared.length ? `<optgroup label="Розшарені">${renderOptions(shared, true)}</optgroup>` : "";

  sel.innerHTML = ownMarkup + sharedMarkup;
}

function renderLegend() {
  const hasFilter = filterCat !== null || hiddenCats.size > 0;
  const chips = cats
    .map((c, i) => {
      const isExclusive = filterCat === i;
      const isOff = hiddenCats.has(i);
      let cls = "cat-chip";
      if (isExclusive) cls += " active";
      else if (isOff) cls += " off";
      else if (hasFilter) cls += " dim";
      return `<button class="${cls}" onclick="toggleCat(${i},event)" style="--chip-color:${c.color}" title="Клік - тільки одна | Shift+клік - декілька"><span class="chip-dot"></span>${c.name}</button>`;
    })
    .join("");
  const reset = hasFilter
    ? `<button class="cat-chip-reset" onclick="resetCatFilter()">× Всі</button>`
    : "";
  document.getElementById("legend").innerHTML = chips + reset;
}

function renderGanttToolbar() {
  const tb = document.getElementById("gantt-toolbar");
  if (!tb) return;
  const reopenEl = document.getElementById("btn-overdue-reopen");
  const prevReopenVisible = reopenEl !== null && reopenEl.style.display !== "none";
  const contractorOptions = uniqContractors().map((c) => ({ value: c, label: c }));
  const payOptions = [
    { value: "debt", label: "Є залишок" },
    { value: "paid", label: "Оплачено" },
    { value: "over", label: "Переплата" },
    { value: "unpaid", label: "Без оплат" },
    { value: "hasPayments", label: "Є платежі" },
    { value: "noPayments", label: "Немає платежів" },
  ];
  const hasGanttFilters = !!(multiFilterValues(ganttFilters.contractor).length || multiFilterValues(ganttFilters.pay).length);
  tb.innerHTML = `
    <div class="gantt-nm-search-wrap">
      <i data-lucide="search" class="gantt-nm-search-icon"></i>
      <input type="text" id="task-search-inp" class="gantt-nm-search-inp"
             placeholder="Пошук по назві..."
             value="${taskSearch.replace(/"/g, '&quot;')}"
             oninput="onTaskSearch(this.value)"
             onkeydown="if(event.key==='Escape'){this.value='';onTaskSearch('');}">
      <button type="button" id="task-search-clear" class="gantt-nm-search-clear${taskSearch ? " show" : ""}"
              onclick="clearTaskSearch()" title="Очистити пошук">
        <i data-lucide="x"></i>
      </button>
    </div>
    <div class="gantt-filter-group">
      ${renderMultiFilter("ganttFilters.contractor", "Контрагент", "Усі контрагенти", contractorOptions, "renderTable", "gantt-multi mf-wide")}
      ${renderMultiFilter("ganttFilters.pay", "Оплати", "Усі оплати", payOptions, "renderTable", "gantt-multi")}
      ${hasGanttFilters ? `<button class="btn btn-sm" onclick="resetGanttFilters()" title="Скинути фільтри графіка"><i data-lucide="rotate-ccw"></i></button>` : ""}
    </div>
    <div class="toolbar-notes-gap"></div>
    <button id="btn-critical" class="btn btn-sm btn-tog${showCritical ? " on" : ""}"
            onclick="toggleCriticalPath()"><i data-lucide="activity"></i> Критичний шлях</button>
    <button id="btn-dep-arrows" class="btn btn-sm btn-tog${showDepArrows ? " on" : ""}"
            onclick="toggleDepArrows()" title="Відображати стрілки залежностей між роботами">
      <i data-lucide="share-2"></i> Залежності</button>
    <button class="btn btn-sm btn-tog" onclick="openDepList()" title="Список усіх залежностей проєкту">
      <i data-lucide="list"></i> Список</button>
    <div class="sep"></div>
    <button class="btn btn-sm btn-tog${groupBy === "cat" ? " on" : ""}"
            onclick="toggleGroupBy()" title="Групувати за категорією">
      <i data-lucide="layout-list"></i> Групи
    </button>
    <div class="sep"></div>
    <button class="btn btn-sm btn-tog" id="btn-overdue-reopen"
            onclick="checkOverdue(true)"
            style="display:${prevReopenVisible ? "" : "none"}"><i data-lucide="triangle-alert"></i> Прострочені</button>
    <div class="zoom-ctrl">
      <button class="btn btn-sm btn-icon" onclick="zoomOut()" title="Зменшити масштаб"><i data-lucide="zoom-out"></i></button>
      <span class="zoom-label">${zoomLevel === 25 ? "100%" : zoomLevel === 15 ? "60%" : "40%"}</span>
      <button class="btn btn-sm btn-icon" onclick="zoomIn()" title="Збільшити масштаб"><i data-lucide="zoom-in"></i></button>
      <span class="zoom-sep"></span>
      <button class="btn btn-sm btn-icon btn-tog${monoBarColor ? " on" : ""}"
              onclick="toggleMonoBar()" title="Монохромний режим барів (для друку)">
        <i data-lucide="droplets"></i>
      </button>
      ${monoBarColor ? `<input type="color" id="mono-color-inp" class="mono-color-inp"
             value="${monoBarColor}" oninput="setMonoColor(this.value)" title="Колір барів">` : ''}
    </div>`;
  lucide.createIcons({ nodes: [tb] });
}

function setGanttFilter(field, value) {
  ganttFilters[field] = value;
  _saveGanttFilters();
  renderTable();
}

function resetGanttFilters() {
  ganttFilters = { contractor: [], pay: [] };
  _saveGanttFilters();
  renderTable();
}

function _saveGanttFilters() {
  try {
    const ui = JSON.parse(localStorage.getItem(UI_SK) || "{}");
    ui.ganttFilters = ganttFilters;
    localStorage.setItem(UI_SK, JSON.stringify(ui));
  } catch (_) {}
}

function applyGanttFilters(t) {
  if (hiddenCats.has(t.cat)) return false;
  if (!multiFilterAny(ganttFilters.contractor, taskContractors(t))) return false;

  const payFilters = multiFilterValues(ganttFilters.pay);
  if (payFilters.length) {
    const s = taskCostSummary(t);
    const matchesPay =
      (payFilters.includes("debt") && s.budget > 0 && s.rest > 0.5) ||
      (payFilters.includes("paid") && s.budget > 0 && Math.abs(s.rest) <= 0.5) ||
      (payFilters.includes("over") && s.rest < -0.5) ||
      (payFilters.includes("unpaid") && s.budget > 0 && s.paid <= 0.5) ||
      (payFilters.includes("hasPayments") && (s.paid > 0.5 || s.payments > 0)) ||
      (payFilters.includes("noPayments") && s.paid <= 0.5 && s.payments === 0);
    if (!matchesPay) return false;
  }

  return true;
}

function toggleGroupBy() {
  groupBy = groupBy === "cat" ? "none" : "cat";
  renderTable();
}

function toggleGroup(catIdx) {
  if (collapsedGrps.has(catIdx)) collapsedGrps.delete(catIdx);
  else collapsedGrps.add(catIdx);
  renderTable();
}

function renderTable() {
  computeCriticalPath();
  renderGanttToolbar();

  const ml = getML();
  const tw = todayWk();
  const vs = visStart();
  const visMonthStart = Math.floor(vs / 4);
  const now = new Date();
  const curMonthIdx = (now.getFullYear() - proj.sy) * 12 + (now.getMonth() - proj.sm);

  const canAdd = typeof canEditTasks === "function" ? canEditTasks() : true;

  // Build year groups from visible months
  const visibleMonths = ml.slice(visMonthStart);
  const yearGroups = [];
  visibleMonths.forEach((m) => {
    const last = yearGroups[yearGroups.length - 1];
    if (last && last.year === m.y) last.cols += 4;
    else yearGroups.push({ year: m.y, cols: 4 });
  });

  // Row 1: fixed cols (rowspan=3) + year groups
  let h = `<table class="gt" id="gtbl"><thead><tr>
    <th class="th-n" rowspan="3" title="Перетягни для зміни порядку">#</th>
    <th class="th-nm" rowspan="3"><div class="th-nm-head"><span>Вид робіт</span>${canAdd ? `<button class="btn-add-task" onclick="openAdd()" title="Додати роботу">+ Робота</button>` : ""}</div></th>
    <th class="th-notes" rowspan="3" title="Нотатки"><i data-lucide="message-square"></i></th>`;
  yearGroups.forEach(({ year, cols }) => {
    h += `<th colspan="${cols}" class="th-yr">${year}</th>`;
  });
  h += `</tr>`;

  // Row 2: month names only (no year)
  h += `<tr>`;
  visibleMonths.forEach((m, i) => {
    const mi = visMonthStart + i;
    const isCur = mi === curMonthIdx;
    const pastBtn = isCur
      ? `<button class="btn-hidepast${hidePast ? " on" : ""}" onclick="toggleHidePast()" title="${hidePast ? "Показати" : "Сховати"} минулі тижні"><i data-lucide="chevron-left"></i></button>`
      : "";
    h += `<th colspan="4" class="th-mo${isCur ? " cur-mo" : ""}"><span class="mo-text">${m.name}</span>${pastBtn}</th>`;
  });
  h += `</tr>`;

  // Row 3: weeks
  h += `<tr>`;
  for (let i = vs; i < TW(); i++) {
    const isCurWk = Math.floor(i / 4) === curMonthIdx;
    h += `<th class="th-wk${i % 4 === 0 ? " ms" : ""}${isCurWk ? " cur-mo" : ""}">${(i % 4) + 1}</th>`;
  }
  h += `</tr></thead><tbody>`;

  const isCritFn = (ti) => showCritical && criticalSet.has(ti);

  if (groupBy === "cat") {
    cats.forEach((cat, catIdx) => {
      if (hiddenCats.has(catIdx)) return;
      const groupTasks = tasks.filter((t) => t.cat === catIdx && applyGanttFilters(t));
      if (!groupTasks.length) return;

      const isCollapsed = collapsedGrps.has(catIdx);
      const totalTasks = groupTasks.length;
      const doneTasks = groupTasks.filter((t) => t.prog === 100).length;
      const totalBudget = groupTasks.reduce((s, t) => s + (+t.budget || 0), 0);

      h += `<tr class="group-header-row" onclick="toggleGroup(${catIdx})">
        <td class="td-h" style="background:${cat.color}20"></td>
        <td class="td-n" style="background:${cat.color}20"></td>
        <td class="td-nm group-header-cell" style="background:${cat.color}18;border-right:3px solid ${cat.color}">
          <div class="nm-inner">
            <span class="group-chevron">${isCollapsed ? '<i data-lucide="chevron-right"></i>' : '<i data-lucide="chevron-down"></i>'}</span>
            <span class="group-dot" style="background:${cat.color}"></span>
            <span class="group-title">${cat.name}</span>
            <span class="group-stats">${doneTasks}/${totalTasks} виконано${totalBudget ? " · " + fmtM(totalBudget) + " грн" : ""}</span>
          </div>
        </td>
        <td class="td-notes" style="background:${cat.color}10"></td>
        ${Array.from({ length: TW() - vs }, (_, i) => `<td class="td-c group-header-timeline${(i + vs) % 4 === 0 ? " ms" : ""}" style="background:${cat.color}08"></td>`).join("")}
      </tr>`;

      if (!isCollapsed) {
        groupTasks.forEach((t) => {
          h += _renderTaskRow(t, tw, vs, isCritFn);
        });
      }
    });
  } else {
    tasks
      .filter(applyGanttFilters)
      .forEach((t) => {
        h += _renderTaskRow(t, tw, vs, isCritFn);
      });
  }

  h += `</tbody></table>`;
  document.getElementById("gtbl-wrap").innerHTML = h;
  lucide.createIcons();
  attachDrag();
  if (showDepArrows) requestAnimationFrame(renderDepArrows);
}

/** Рендерить один рядок задачі. */
function _renderTaskRow(t, tw, vs, isCritFn) {
  const ti = tasks.indexOf(t);
  const cs = t.ms * 4 + t.ws;
  const ce = t.me * 4 + t.we;
  if (ce < vs || cs >= TW()) return "";

  const cw = zoomLevel;
  const col = monoBarColor || CC(t.cat);
  const warns = checkDeps(t);
  const isCrit = isCritFn(ti);
  const blPos = getBaselinePos(t.id);

  const showFull = cs >= vs;
  const showPartial = !showFull && t.prog < 100 && ce >= vs; // ongoing task, started before visible area
  const showBar = showFull || showPartial;
  const barStart = showFull ? cs : vs;
  const bW = showBar ? (ce - barStart + 1) * cw : 0;
  const progW = showBar ? Math.round((t.prog * Math.max(0, bW - Math.min(12, cw * 0.4))) / 100) : 0;
  const isPartial = showPartial;

  const notesCount = t.notes?.filter((n) => !n.deleted).length || 0;
  const notesCellCls = notesCount > 0 ? "td-notes has-notes" : "td-notes";
  const notesIcon = notesCount > 0
    ? `<i data-lucide="message-square-text"></i><span class="notes-count">${notesCount}</span>`
    : `<i data-lucide="message-square"></i>`;

  const searchMatch = taskSearch && t.name.toLowerCase().includes(taskSearch);
  let h = `<tr id="tr${ti}"${searchMatch ? ' class="task-search-match"' : (taskSearch ? ' class="task-search-dim"' : '')}>
    <td class="td-n td-drag" data-ti="${ti}" title="Перетягни для зміни порядку">${t.n}</td>
    <td class="td-nm" onclick="openEdit(${ti})" title="${t.name}${warns.length ? " ⚠ " + warns.join("; ") : ""}">
      <div class="nm-inner">
        ${isCrit ? `<span class="crit-ic"></span>` : ""}
        ${warns.length ? `<span class="dep-ic" title="${warns.join("\n")}"><i data-lucide="triangle-alert"></i></span>` : ""}
        ${t.phases && t.phases.length > 1 ? `<span class="phase-badge" title="${t.phases.length} фаз">${t.prog}%</span>` : ""}
        <span class="nm-text">${t.name}</span>
        <span class="copy-btn" onclick="event.stopPropagation();copyTask(${ti})" title="Копіювати роботу"><i data-lucide="copy"></i></span>
        <span class="del-btn" onclick="event.stopPropagation();delTask(${ti})"><i data-lucide="x"></i></span>
      </div>
    </td>
    <td class="${notesCellCls}" onclick="event.stopPropagation();openNotesModal(${ti})"
        title="${notesCount > 0 ? notesCount + " нотаток" : "Нотатки"}">${notesIcon}</td>`;

  for (let ci = vs; ci < TW(); ci++) {
    h += `<td class="td-c${ci % 4 === 0 ? " ms" : ""}${ci === tw ? " today-col" : ""}" data-ti="${ti}" data-ci="${ci}">`;
    if (ci === tw) h += `<div class="today-line"></div>`;

    if (blPos) {
      const becs2 = Math.max(blPos.ms * 4 + blPos.ws, vs);
      const bce2 = blPos.me * 4 + blPos.we;
      if (ci === becs2 && bce2 >= vs)
        h += `<div class="bar-baseline" style="left:0;width:${(bce2 - becs2 + 1) * cw}px"></div>`;
    }

    const hndl = `<svg width="4" height="8" viewBox="0 0 4 8">
      <line x1="1" y1="1" x2="1" y2="7" stroke="rgba(255,255,255,.5)" stroke-width="1"/>
      <line x1="3" y1="1" x2="3" y2="7" stroke="rgba(255,255,255,.5)" stroke-width="1"/>
    </svg>`;

    const phases = t.phases && t.phases.length > 1 ? t.phases : null;
    if (phases) {
      phases.forEach((ph, phi) => {
        const pcs = ph.ms * 4 + ph.ws;
        const pce = ph.me * 4 + ph.we;
        if (pce < vs || pcs >= TW()) return;
        const pp = ph.prog || 0;
        const phShowFull = pcs >= vs;
        const phShowPartial = !phShowFull && pp < 100 && pce >= vs;
        if (!phShowFull && !phShowPartial) return;
        const phStart = phShowFull ? pcs : vs;
        if (ci !== phStart) return;
        const pbW = (pce - phStart + 1) * cw;
        const ppW = Math.round((pp * Math.max(0, pbW - Math.min(12, cw * 0.4))) / 100);
        const phCol = monoBarColor || CC(t.cat);
        h += `<div class="bar${isCrit ? " critical" : ""}${phShowPartial ? " bar-partial" : ""}" id="bar${ti}-${phi}" data-ti="${ti}"
               style="left:0;width:${pbW}px;background:${phCol}" title="Фаза ${phi + 1}: ${pp}%">
          ${phShowFull ? `<div class="bh" data-ti="${ti}" data-side="L">${hndl}</div>` : ''}
          ${pp > 0 ? `<div class="prog-fill" style="width:${ppW}px"></div>` : ""}
          <span class="bl">${pp > 0 ? pp + "%" : "ф" + (phi + 1)}</span>
          <div class="bh" data-ti="${ti}" data-side="R">${hndl}</div>
        </div>`;
      });
    } else if (showBar && ci === barStart) {
      h += `<div class="bar${isCrit ? " critical" : ""}${isPartial ? " bar-partial" : ""}" id="bar${ti}" data-ti="${ti}"
             onclick="handleBarClick(event,${ti})"
             style="left:0;width:${bW}px;background:${col};cursor:pointer">
        ${!isPartial ? `<div class="bh" data-ti="${ti}" data-side="L">${hndl}</div>` : ''}
        ${t.prog > 0 ? `<div class="prog-fill" style="width:${progW}px"></div>` : ""}
        <span class="bl">${t.prog > 0 ? t.prog + "%" : ""}</span>
        <div class="bh" data-ti="${ti}" data-side="R">${hndl}</div>
      </div>`;
    }
    h += `</td>`;
  }
  h += `</tr>`;
  return h;
}
