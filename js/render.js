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
  document.getElementById("head-dates").textContent = typeof buildRuntimeHeaderDateText === "function"
    ? buildRuntimeHeaderDateText(ml, proj.nm)
    : "";
}

function updateProjSel() {
  const sel = document.getElementById("proj-sel");
  if (!sel) return;
  const selectLabels = typeof buildRuntimeProjectSelectLabels === "function"
    ? buildRuntimeProjectSelectLabels()
    : { ownGroupLabel: "Мої проєкти", sharedGroupLabel: "Розшарені", sharedRoleSeparator: " · " };
  const entries = Object.entries(allProjects || {});
  const grouped = typeof groupProjectEntriesByAccess === "function"
    ? groupProjectEntriesByAccess(entries)
    : { own: entries, shared: [] };
  const own = grouped.own || [];
  const shared = grouped.shared || [];

  const renderOptions = (list, isShared = false) =>
    list
      .map(([id, p]) => {
        const role = typeof normalizeProjectRole === "function" ? normalizeProjectRole(p?._role || "owner") : (p?._role || "owner");
        const roleLabel = isShared
          ? `${selectLabels.sharedRoleSeparator}${typeof getRuntimeProjectRoleLabel === "function" ? getRuntimeProjectRoleLabel(role) : role}`
          : "";
        return `<option value="${id}"${id === currentId ? " selected" : ""}>${p.proj.name}${roleLabel}</option>`;
      })
      .join("");

  const ownMarkup = own.length ? `<optgroup label="${selectLabels.ownGroupLabel}">${renderOptions(own)}</optgroup>` : "";
  const sharedMarkup = shared.length ? `<optgroup label="${selectLabels.sharedGroupLabel}">${renderOptions(shared, true)}</optgroup>` : "";
  sel.innerHTML = ownMarkup + sharedMarkup;
}

function renderLegend() {
  const legend = typeof buildRuntimeLegendItems === "function"
    ? buildRuntimeLegendItems(cats, filterCat, hiddenCats)
    : { hasFilter: false, items: [] };
  const chips = legend.items
    .map((item) => `<button class="${item.className}" onclick="toggleCat(${item.index},event)" style="--chip-color:${item.color}" title="Клік - тільки одна | Shift+клік - декілька"><span class="chip-dot"></span>${item.name}</button>`)
    .join("");
  const reset = legend.hasFilter
    ? `<button class="cat-chip-reset" onclick="resetCatFilter()">Г— Всі</button>`
    : "";
  document.getElementById("legend").innerHTML = chips + reset;
}

function renderGanttToolbar() {
  const tb = document.getElementById("gantt-toolbar");
  if (!tb) return;
  const toolbarLabels = typeof buildRuntimeGanttToolbarLabels === "function"
    ? buildRuntimeGanttToolbarLabels()
    : {
        searchPlaceholder: "Пошук по назві...",
        clearSearchTitle: "Очистити пошук",
        contractorLabel: "Контрагент",
        allContractorsLabel: "Усі контрагенти",
        paymentLabel: "Оплати",
        allPaymentsLabel: "Усі оплати",
        debtLabel: "Є залишок",
        paidLabel: "Оплачено",
        overpaidLabel: "Переплата",
        unpaidLabel: "Без оплат",
        hasPaymentsLabel: "Є платежі",
        noPaymentsLabel: "Немає платежів",
        resetFiltersTitle: "Скинути фільтри графіка",
        criticalPathLabel: "Критичний шлях",
        dependencyArrowsTitle: "Відображати стрілки залежностей між роботами",
        dependencyArrowsLabel: "Залежності",
        dependencyListTitle: "Список усіх залежностей проєкту",
        dependencyListLabel: "Список",
        groupByCategoryTitle: "Групувати за категорією",
        groupByCategoryLabel: "Групи",
        overdueLabel: "Прострочені",
        zoomOutTitle: "Зменшити масштаб",
        zoomInTitle: "Збільшити масштаб",
        monoBarTitle: "Монохромний режим барів (для друку)",
        monoBarColorTitle: "Колір барів",
      };
  const reopenEl = document.getElementById("btn-overdue-reopen");
  const prevReopenVisible = reopenEl !== null && reopenEl.style.display !== "none";
  const contractorOptions = uniqContractors().map((c) => ({ value: c, label: c }));
  const payOptions = [
    { value: "debt", label: toolbarLabels.debtLabel },
    { value: "paid", label: toolbarLabels.paidLabel },
    { value: "over", label: toolbarLabels.overpaidLabel },
    { value: "unpaid", label: toolbarLabels.unpaidLabel },
    { value: "hasPayments", label: toolbarLabels.hasPaymentsLabel },
    { value: "noPayments", label: toolbarLabels.noPaymentsLabel },
  ];
  const hasGanttFilters = !!(multiFilterValues(ganttFilters.contractor).length || multiFilterValues(ganttFilters.pay).length);
  tb.innerHTML = `
    <div class="gantt-nm-search-wrap">
      <i data-lucide="search" class="gantt-nm-search-icon"></i>
      <input type="text" id="task-search-inp" class="gantt-nm-search-inp"
             placeholder="${toolbarLabels.searchPlaceholder}"
             value="${taskSearch.replace(/"/g, '&quot;')}"
             oninput="onTaskSearch(this.value)"
             onkeydown="if(event.key==='Escape'){this.value='';onTaskSearch('');}">
      <button type="button" id="task-search-clear" class="gantt-nm-search-clear${taskSearch ? " show" : ""}"
              onclick="clearTaskSearch()" title="${toolbarLabels.clearSearchTitle}">
        <i data-lucide="x"></i>
      </button>
    </div>
    <div class="gantt-filter-group">
      ${renderMultiFilter("ganttFilters.contractor", toolbarLabels.contractorLabel, toolbarLabels.allContractorsLabel, contractorOptions, "renderTable", "gantt-multi mf-wide")}
      ${renderMultiFilter("ganttFilters.pay", toolbarLabels.paymentLabel, toolbarLabels.allPaymentsLabel, payOptions, "renderTable", "gantt-multi")}
      ${hasGanttFilters ? `<button class="btn btn-sm" onclick="resetGanttFilters()" title="${toolbarLabels.resetFiltersTitle}"><i data-lucide="rotate-ccw"></i></button>` : ""}
    </div>
    <div class="toolbar-notes-gap"></div>
    <button id="btn-critical" class="btn btn-sm btn-tog${showCritical ? " on" : ""}"
            onclick="toggleCriticalPath()"><i data-lucide="activity"></i> ${toolbarLabels.criticalPathLabel}</button>
    <button id="btn-dep-arrows" class="btn btn-sm btn-tog${showDepArrows ? " on" : ""}"
            onclick="toggleDepArrows()" title="${toolbarLabels.dependencyArrowsTitle}">
      <i data-lucide="share-2"></i> ${toolbarLabels.dependencyArrowsLabel}</button>
    <button class="btn btn-sm btn-tog" onclick="openDepList()" title="${toolbarLabels.dependencyListTitle}">
      <i data-lucide="list"></i> ${toolbarLabels.dependencyListLabel}</button>
    <div class="sep"></div>
    <button class="btn btn-sm btn-tog${groupBy === "cat" ? " on" : ""}"
            onclick="toggleGroupBy()" title="${toolbarLabels.groupByCategoryTitle}">
      <i data-lucide="layout-list"></i> ${toolbarLabels.groupByCategoryLabel}
    </button>
    <div class="sep"></div>
    <button class="btn btn-sm btn-tog" id="btn-overdue-reopen"
             onclick="checkOverdue(true)"
             style="display:${prevReopenVisible ? "" : "none"}"><i data-lucide="triangle-alert"></i> ${toolbarLabels.overdueLabel}</button>
    <div class="zoom-ctrl">
      <button class="btn btn-sm btn-icon" onclick="zoomOut()" title="${toolbarLabels.zoomOutTitle}"><i data-lucide="zoom-out"></i></button>
      <span class="zoom-label">${zoomLevel === 25 ? "100%" : zoomLevel === 15 ? "60%" : "40%"}</span>
      <button class="btn btn-sm btn-icon" onclick="zoomIn()" title="${toolbarLabels.zoomInTitle}"><i data-lucide="zoom-in"></i></button>
      <span class="zoom-sep"></span>
      <button class="btn btn-sm btn-icon btn-tog${monoBarColor ? " on" : ""}"
              onclick="toggleMonoBar()" title="${toolbarLabels.monoBarTitle}">
        <i data-lucide="droplets"></i>
      </button>
      ${monoBarColor ? `<input type="color" id="mono-color-inp" class="mono-color-inp"
             value="${monoBarColor}" oninput="setMonoColor(this.value)" title="${toolbarLabels.monoBarColorTitle}">` : ''}
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
  const tableLabels = typeof buildRuntimeTableLabels === "function"
    ? buildRuntimeTableLabels()
    : {
        reorderTitle: "Перетягни для зміни порядку",
        workTypeHeader: "Вид робіт",
        addTaskTitle: "Додати роботу",
        addTaskLabel: "+ Робота",
        notesTitle: "Нотатки",
        hidePastShowTitle: "Показати минулі тижні",
        hidePastHideTitle: "Сховати минулі тижні",
        groupDoneLabel: (done, total, budgetText) => `${done}/${total} виконано${budgetText ? " · " + budgetText : ""}`,
        copyTaskTitle: "Копіювати роботу",
        notesCountLabel: (count) => `${count} нотаток`,
        notesDefaultLabel: "Нотатки",
        phaseCountTitle: (count) => `${count} фаз`,
        phaseBarTitle: (index, progress) => `Фаза ${index + 1}: ${progress}%`,
      };

  const ml = getML();
  const tw = todayWk();
  const vs = visStart();
  const visMonthStart = Math.floor(vs / 4);
  const now = new Date();
  const curMonthIdx = (now.getFullYear() - proj.sy) * 12 + (now.getMonth() - proj.sm);
  const canAdd = typeof canEditTasks === "function" ? canEditTasks() : true;

  const visibleMonths = ml.slice(visMonthStart);
  const yearGroups = typeof buildRuntimeVisibleYearGroups === "function"
    ? buildRuntimeVisibleYearGroups(visibleMonths)
    : [];

  let h = `<table class="gt" id="gtbl"><thead><tr>
    <th class="th-n" rowspan="3" title="${tableLabels.reorderTitle}">#</th>
    <th class="th-nm" rowspan="3"><div class="th-nm-head"><span>${tableLabels.workTypeHeader}</span>${canAdd ? `<button class="btn-add-task" onclick="openAdd()" title="${tableLabels.addTaskTitle}">${tableLabels.addTaskLabel}</button>` : ""}</div></th>
    <th class="th-notes" rowspan="3" title="${tableLabels.notesTitle}"><i data-lucide="message-square"></i></th>`;
  yearGroups.forEach(({ year, cols }) => {
    h += `<th colspan="${cols}" class="th-yr">${year}</th>`;
  });
  h += `</tr>`;

  h += `<tr>`;
  visibleMonths.forEach((m, i) => {
    const mi = visMonthStart + i;
    const isCur = mi === curMonthIdx;
    const pastBtn = isCur
      ? `<button class="btn-hidepast${hidePast ? " on" : ""}" onclick="toggleHidePast()" title="${hidePast ? tableLabels.hidePastShowTitle : tableLabels.hidePastHideTitle}"><i data-lucide="chevron-left"></i></button>`
      : "";
    h += `<th colspan="4" class="th-mo${isCur ? " cur-mo" : ""}"><span class="mo-text">${m.name}</span>${pastBtn}</th>`;
  });
  h += `</tr>`;

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
      const totalBudget = groupTasks.reduce((sum, task) => sum + (+task.budget || 0), 0);

      h += `<tr class="group-header-row" onclick="toggleGroup(${catIdx})">
        <td class="td-h" style="background:${cat.color}20"></td>
        <td class="td-n" style="background:${cat.color}20"></td>
        <td class="td-nm group-header-cell" style="background:${cat.color}18;border-right:3px solid ${cat.color}">
          <div class="nm-inner">
            <span class="group-chevron">${isCollapsed ? '<i data-lucide="chevron-right"></i>' : '<i data-lucide="chevron-down"></i>'}</span>
            <span class="group-dot" style="background:${cat.color}"></span>
            <span class="group-title">${cat.name}</span>
            <span class="group-stats">${tableLabels.groupDoneLabel(doneTasks, totalTasks, totalBudget ? fmtM(totalBudget) + " грн" : "")}</span>
          </div>
        </td>
        <td class="td-notes" style="background:${cat.color}10"></td>
        ${Array.from({ length: TW() - vs }, (_, i) => `<td class="td-c group-header-timeline${(i + vs) % 4 === 0 ? " ms" : ""}" style="background:${cat.color}08"></td>`).join("")}
      </tr>`;

      if (!isCollapsed) {
        groupTasks.forEach((task) => {
          h += _renderTaskRow(task, tw, vs, isCritFn);
        });
      }
    });
  } else {
    tasks.filter(applyGanttFilters).forEach((task) => {
      h += _renderTaskRow(task, tw, vs, isCritFn);
    });
  }

  h += `</tbody></table>`;
  document.getElementById("gtbl-wrap").innerHTML = h;
  lucide.createIcons();
  attachDrag();
  if (showDepArrows) requestAnimationFrame(renderDepArrows);
}

function _renderTaskRow(t, tw, vs, isCritFn) {
  const tableLabels = typeof buildRuntimeTableLabels === "function"
    ? buildRuntimeTableLabels()
    : {
        reorderTitle: "Перетягни для зміни порядку",
        workTypeHeader: "Вид робіт",
        addTaskTitle: "Додати роботу",
        addTaskLabel: "+ Робота",
        notesTitle: "Нотатки",
        hidePastShowTitle: "Показати минулі тижні",
        hidePastHideTitle: "Сховати минулі тижні",
        groupDoneLabel: (done, total, budgetText) => `${done}/${total} виконано${budgetText ? " · " + budgetText : ""}`,
        copyTaskTitle: "Копіювати роботу",
        notesCountLabel: (count) => `${count} нотаток`,
        notesDefaultLabel: "Нотатки",
        phaseCountTitle: (count) => `${count} фаз`,
        phaseBarTitle: (index, progress) => `Фаза ${index + 1}: ${progress}%`,
      };

  const ti = tasks.indexOf(t);
  const cw = zoomLevel;
  const col = monoBarColor || CC(t.cat);
  const warns = checkDeps(t);
  const blPos = getBaselinePos(t.id);
  const taskWindow = typeof buildRuntimeTaskWindowModel === "function"
    ? buildRuntimeTaskWindowModel({
        task: t,
        visStart: vs,
        totalWeeks: TW(),
        zoomLevel: cw,
        taskSearch,
        warnings: warns,
        baselinePos: blPos,
        isCritical: isCritFn(ti),
      })
    : null;
  if (!taskWindow) return "";

  const notesIcon = taskWindow.notesCount > 0
    ? `<i data-lucide="message-square-text"></i><span class="notes-count">${taskWindow.notesCount}</span>`
    : `<i data-lucide="message-square"></i>`;

  let h = `<tr id="tr${ti}"${taskWindow.searchClass ? ` class="${taskWindow.searchClass}"` : ""}>
    <td class="td-n td-drag" data-ti="${ti}" title="${tableLabels.reorderTitle}">${t.n}</td>
    <td class="td-nm" onclick="openEdit(${ti})" title="${t.name}${taskWindow.warningsTitleSuffix}">
      <div class="nm-inner">
        ${taskWindow.isCritical ? `<span class="crit-ic"></span>` : ""}
        ${warns.length ? `<span class="dep-ic" title="${warns.join("\n")}"><i data-lucide="triangle-alert"></i></span>` : ""}
        ${t.phases && t.phases.length > 1 ? `<span class="phase-badge" title="${tableLabels.phaseCountTitle(t.phases.length)}">${t.prog}%</span>` : ""}
        <span class="nm-text">${t.name}</span>
        <span class="copy-btn" onclick="event.stopPropagation();copyTask(${ti})" title="${tableLabels.copyTaskTitle}"><i data-lucide="copy"></i></span>
        <span class="del-btn" onclick="event.stopPropagation();delTask(${ti})"><i data-lucide="x"></i></span>
      </div>
    </td>
    <td class="${taskWindow.notesCellClass}" onclick="event.stopPropagation();openNotesModal(${ti})"
        title="${taskWindow.notesCount > 0 ? tableLabels.notesCountLabel(taskWindow.notesCount) : tableLabels.notesDefaultLabel}">${notesIcon}</td>`;

  for (let ci = vs; ci < TW(); ci++) {
    h += `<td class="td-c${ci % 4 === 0 ? " ms" : ""}${ci === tw ? " today-col" : ""}" data-ti="${ti}" data-ci="${ci}">`;
    if (ci === tw) h += `<div class="today-line"></div>`;

    if (blPos && taskWindow.baselineStart !== null && ci === taskWindow.baselineStart && taskWindow.baselineWidth > 0) {
      h += `<div class="bar-baseline" style="left:0;width:${taskWindow.baselineWidth}px"></div>`;
    }

    const hndl = `<svg width="4" height="8" viewBox="0 0 4 8">
      <line x1="1" y1="1" x2="1" y2="7" stroke="rgba(255,255,255,.5)" stroke-width="1"/>
      <line x1="3" y1="1" x2="3" y2="7" stroke="rgba(255,255,255,.5)" stroke-width="1"/>
    </svg>`;

    const phases = taskWindow.phases.length ? taskWindow.phases : null;
    if (phases) {
      phases.forEach((ph, phi) => {
        if (ci !== ph.start) return;
        const phCol = monoBarColor || CC(t.cat);
        h += `<div class="bar${taskWindow.isCritical ? " critical" : ""}${ph.isPartial ? " bar-partial" : ""}" id="bar${ti}-${phi}" data-ti="${ti}"
               style="left:0;width:${ph.width}px;background:${phCol}" title="${tableLabels.phaseBarTitle(phi, ph.progress)}">
          ${ph.showFull ? `<div class="bh" data-ti="${ti}" data-side="L">${hndl}</div>` : ""}
          ${ph.progress > 0 ? `<div class="prog-fill" style="width:${ph.progressWidth}px"></div>` : ""}
          <span class="bl">${ph.progress > 0 ? ph.progress + "%" : "ф" + (phi + 1)}</span>
          <div class="bh" data-ti="${ti}" data-side="R">${hndl}</div>
        </div>`;
      });
    } else if (taskWindow.bar && ci === taskWindow.bar.start) {
      h += `<div class="bar${taskWindow.isCritical ? " critical" : ""}${taskWindow.bar.isPartial ? " bar-partial" : ""}" id="bar${ti}" data-ti="${ti}"
             onclick="handleBarClick(event,${ti})"
             style="left:0;width:${taskWindow.bar.width}px;background:${col};cursor:pointer">
        ${taskWindow.bar.showFull ? `<div class="bh" data-ti="${ti}" data-side="L">${hndl}</div>` : ""}
        ${t.prog > 0 ? `<div class="prog-fill" style="width:${taskWindow.bar.progressWidth}px"></div>` : ""}
        <span class="bl">${t.prog > 0 ? t.prog + "%" : ""}</span>
        <div class="bh" data-ti="${ti}" data-side="R">${hndl}</div>
      </div>`;
    }
    h += `</td>`;
  }
  h += `</tr>`;
  return h;
}
