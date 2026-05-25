let finActiveTab = "overview";
let sCurveChart = null;
let weeklyCostChart = null;
let _finResize = null;
let showWeeklyCostBars = false;
let financeChartHeight = 260;
const FINANCE_UI = typeof buildRuntimeFinanceUiModel === "function"
  ? buildRuntimeFinanceUiModel()
  : {
      statusOptions: [
        { value: "done", label: "Завершено (100%)" },
        { value: "active", label: "В роботі" },
        { value: "pending", label: "Не розпочато" },
        { value: "warn", label: "З порушеннями" },
      ],
      filters: {
        overviewTabLabel: "Графік",
        tableTabLabel: "Таблиця",
        searchPlaceholder: "Пошук у фінансах...",
        clearSearchTitle: "Очистити пошук",
        categoryLabel: "Категорія",
        categoryAllLabel: "Усі категорії",
        statusLabel: "Статус",
        statusAllLabel: "Усі",
        contractorLabel: "Підрядник",
        contractorAllLabel: "Усі",
        budgetMinLabel: "Бюджет від",
        budgetMaxLabel: "Бюджет до",
        budgetMinPlaceholder: "0",
        budgetMaxPlaceholder: "∞",
        onlyBudgetLabel: "Тільки з бюджетом",
        resetFiltersTitle: "Скинути фільтри фінансів",
        evmToggleLabel: "EVM",
        evmToggleTitle: "Показати/сховати EVM метрики",
        deleteTasksLabel: "Видалити роботи",
        deleteTasksTitle: "Видалити всі роботи за поточними фільтрами",
      },
      deleteDialogs: {
        noTasksTitle: "Немає робіт для видалення",
        confirmTitle: "Підтвердьте видалення",
        continueLabel: "Продовжити",
        finalTitle: "Фінальне підтвердження",
        finalInputLabel: 'Введіть "ВИДАЛИТИ", щоб остаточно підтвердити',
        finalConfirmLabel: "Видалити",
        cancelLabel: "Скасувати",
        validationMessage: 'Введіть слово "ВИДАЛИТИ"',
        filteredScopeLabel: "роботи за поточними фільтрами",
        fullScopeLabel: "усі роботи проєкту",
      },
      chart: {
        plannedLabel: "План, грн",
        actualLabel: "Факт, грн",
        projectedLabel: "Прогноз, грн",
        tooltipCurrencyUnit: "грн",
      },
    };

const FIN_COL_SK = "gantt_fin_col_widths";
const FIN_COL_DEFAULTS = {
  n: 54,
  name: 280,
  cat: 170,
  dur: 80,
  budget: 120,
  spent: 120,
  rest: 120,
  pct: 150,
  rate: 120,
  prog: 150,
};

function _getFinColumns() {
  return [
    { k: "n", l: "№" },
    { k: "name", l: "Назва" },
    { k: "cat", l: "Категорія" },
    { k: "dur", l: "Тижд." },
    { k: "budget", l: "Бюджет" },
    { k: "spent", l: "Витрачено" },
    { k: "pct", l: "Освоєно" },
    { k: "rest", l: "Залишок" },
    { k: "rate", l: "грн/тижд." },
    { k: "prog", l: "Виконання" },
  ];
}

function _getFinColWidths() {
  try {
    return { ...FIN_COL_DEFAULTS, ...(JSON.parse(localStorage.getItem(FIN_COL_SK) || "{}")) };
  } catch (_) {
    return { ...FIN_COL_DEFAULTS };
  }
}

function _saveFinColWidths(widths) {
  try {
    localStorage.setItem(FIN_COL_SK, JSON.stringify(widths));
  } catch (_) {}
}

function toggleWeeklyCostBars() {
  showWeeklyCostBars = !showWeeklyCostBars;
  try {
    const ui = JSON.parse(localStorage.getItem(UI_SK) || "{}");
    ui.showWeeklyCostBars = showWeeklyCostBars;
    localStorage.setItem(UI_SK, JSON.stringify(ui));
  } catch (_) {}
  renderSCurve();
}

function _applyFinanceChartHeight() {
  const mainHeight = Math.max(220, Math.min(560, financeChartHeight));
  const weeklyHeight = Math.max(170, Math.round(mainHeight * 0.75));
  document.documentElement.style.setProperty("--finance-chart-h", `${mainHeight}px`);
  document.documentElement.style.setProperty("--weekly-chart-h", `${weeklyHeight}px`);
}

function adjustFinanceChartHeight(delta) {
  financeChartHeight = Math.max(220, Math.min(560, financeChartHeight + delta));
  try {
    const ui = JSON.parse(localStorage.getItem(UI_SK) || "{}");
    ui.financeChartHeight = financeChartHeight;
    localStorage.setItem(UI_SK, JSON.stringify(ui));
  } catch (_) {}
  _applyFinanceChartHeight();
  _syncFinanceChartLayout();
}

function _syncFinanceChartLayout() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      try {
        sCurveChart?.resize();
        sCurveChart?.update("none");
        weeklyCostChart?.resize();
        weeklyCostChart?.update("none");
      } catch (_) {}
    });
  });
}

function _financeWeekLabels(ml, weekCount) {
  return Array.from({ length: weekCount }, (_, wk) => {
    const m = ml[Math.floor(wk / 4)];
    return `${m?.name.slice(0, 3) || ""} ${wk % 4 + 1}`;
  });
}

function _financeMonthTick(value, index, ticks, ml) {
  const wk = Number(value);
  if (!Number.isFinite(wk) || wk < 0 || wk % 4 !== 0) return "";
  const month = ml[Math.floor(wk / 4)];
  if (!month) return "";
  const prev = wk >= 4 ? ml[Math.floor((wk - 4) / 4)] : null;
  const yearPart = !prev || prev.y !== month.y ? ` ${month.y}` : "";
  return `${month.name.slice(0, 3)}${yearPart}`;
}

function switchFinTab(tab) {
  finActiveTab = tab === "table" ? "table" : "overview";
  try {
    const ui = JSON.parse(localStorage.getItem(UI_SK) || "{}");
    ui.finActiveTab = finActiveTab;
    localStorage.setItem(UI_SK, JSON.stringify(ui));
  } catch (_) {}
  document.getElementById("fin-tab-overview")?.classList.toggle("active", finActiveTab === "overview");
  document.getElementById("fin-tab-table")?.classList.toggle("active", finActiveTab === "table");
  document.getElementById("fin-pane-overview")?.classList.toggle("active", finActiveTab === "overview");
  document.getElementById("fin-pane-table")?.classList.toggle("active", finActiveTab === "table");
  if (finActiveTab === "overview") requestAnimationFrame(renderSCurve);
}

function renderFinFilters() {
  const contrs = uniqContractors();
  const catOptions = cats.map((c, i) => ({ value: i, label: c.name }));
  const statusOptions = FINANCE_UI.statusOptions;
  const contractorOptions = contrs.map((c) => ({ value: c, label: c }));
  const hasFinFilters = _hasFinanceFilters();
  document.getElementById("fin-filters").innerHTML = `
    <div class="fin-filter-tabs">
      <button class="fin-tab" id="fin-tab-overview" data-finance-surface-action="switch-tab" data-fin-tab="overview" type="button">
        <i data-lucide="trending-up"></i> ${FINANCE_UI.filters.overviewTabLabel}
      </button>
      <button class="fin-tab" id="fin-tab-table" data-finance-surface-action="switch-tab" data-fin-tab="table" type="button">
        <i data-lucide="table-2"></i> ${FINANCE_UI.filters.tableTabLabel}
      </button>
    </div>
    <div class="fin-search-wrap">
      <i data-lucide="search" class="fin-search-icon"></i>
      <input type="text" id="fin-search-inp" class="fin-search-inp"
             placeholder="${FINANCE_UI.filters.searchPlaceholder}"
             value="${htmlEsc(finFilters.q || "")}"
             data-finance-surface-input="search">
      <button type="button" id="fin-search-clear" class="fin-search-clear${finFilters.q ? " show" : ""}"
              data-finance-surface-action="clear-search" title="${FINANCE_UI.filters.clearSearchTitle}">
        <i data-lucide="x"></i>
      </button>
    </div>
    ${renderMultiFilter("finFilters.cat", FINANCE_UI.filters.categoryLabel, FINANCE_UI.filters.categoryAllLabel, catOptions, "renderFinance", "ff-multi")}
    ${renderMultiFilter("finFilters.stat", FINANCE_UI.filters.statusLabel, FINANCE_UI.filters.statusAllLabel, statusOptions, "renderFinance", "ff-multi")}
    ${renderMultiFilter("finFilters.contr", FINANCE_UI.filters.contractorLabel, FINANCE_UI.filters.contractorAllLabel, contractorOptions, "renderFinance", "ff-multi mf-wide")}
    <div class="ff-group">
      <label>${FINANCE_UI.filters.budgetMinLabel}</label>
      <input type="number" min="0" step="10000" value="${finFilters.budgetMin}" class="ff-input-narrow"
             placeholder="${FINANCE_UI.filters.budgetMinPlaceholder}" data-finance-surface-input="budget-min">
    </div>
    <div class="ff-group">
      <label>${FINANCE_UI.filters.budgetMaxLabel}</label>
      <input type="number" min="0" step="10000" value="${finFilters.budgetMax}" class="ff-input-narrow"
             placeholder="${FINANCE_UI.filters.budgetMaxPlaceholder}" data-finance-surface-input="budget-max">
    </div>
    <div class="ff-group ff-group-actions">
      <label class="ff-checkbox">
        <input type="checkbox" ${finFilters.onlyBudget ? "checked" : ""}
               data-finance-surface-input="only-budget"> ${FINANCE_UI.filters.onlyBudgetLabel}
      </label>
      ${hasFinFilters ? `<button class="btn btn-sm" data-finance-surface-action="reset-filters" title="${FINANCE_UI.filters.resetFiltersTitle}"><i data-lucide="rotate-ccw"></i></button>` : ""}
      <button class="btn btn-sm btn-tog${showEVM ? " on" : ""}"
              data-finance-surface-action="toggle-evm" title="${FINANCE_UI.filters.evmToggleTitle}">
        <i data-lucide="bar-chart-2"></i> ${FINANCE_UI.filters.evmToggleLabel}
      </button>
      <button class="btn btn-sm danger" data-finance-surface-action="delete-visible-tasks" title="${FINANCE_UI.filters.deleteTasksTitle}">
        <i data-lucide="trash"></i> ${FINANCE_UI.filters.deleteTasksLabel}
      </button>
    </div>`;
  lucide.createIcons({ nodes: [document.getElementById("fin-filters")] });
}

function _hasFinanceFilters() {
  if (typeof buildRuntimeHasFinanceFilters === "function") {
    return buildRuntimeHasFinanceFilters(finFilters, multiFilterValues);
  }
  return !!(
    multiFilterValues(finFilters.cat).length ||
    multiFilterValues(finFilters.stat).length ||
    multiFilterValues(finFilters.contr).length ||
    finFilters.budgetMin !== "" ||
    finFilters.budgetMax !== "" ||
    finFilters.onlyBudget
  );
}

function resetFinanceFilters() {
  finFilters = { ...finFilters, cat: [], stat: [], contr: [], budgetMin: "", budgetMax: "", onlyBudget: false };
  renderFinFilters();
  renderFinance();
}

function setFinanceBudgetFilter(field, value) {
  if (field !== "budgetMin" && field !== "budgetMax") return;
  finFilters[field] = value;
  renderFinFilters();
  renderFinance();
}

function setFinanceOnlyBudget(value) {
  finFilters.onlyBudget = !!value;
  renderFinFilters();
  renderFinance();
}

function toggleFinanceEVM() {
  showEVM = !showEVM;
  renderFinance();
}

function onFinSearch(q) {
  finFilters.q = String(q || "").trim();
  document.getElementById("fin-search-clear")?.classList.toggle("show", !!finFilters.q);
  renderFinance();
}

function clearFinSearch() {
  finFilters.q = "";
  const inp = document.getElementById("fin-search-inp");
  if (inp) inp.value = "";
  document.getElementById("fin-search-clear")?.classList.remove("show");
  renderFinance();
}

async function deleteVisibleFinanceTasks() {
  if (typeof canEditTasks === "function" && !canEditTasks()) return;

  const rows = _getFinanceRows();
  const indexes = Array.from(new Set(rows.map((row) => row.ti)))
    .filter((ti) => Number.isInteger(ti) && tasks[ti])
    .sort((a, b) => b - a);

  if (!indexes.length) {
    Swal.fire({ icon: "info", title: FINANCE_UI.deleteDialogs.noTasksTitle });
    return;
  }

  const summary = typeof buildRuntimeSummarizeFinanceDeletion === "function"
    ? buildRuntimeSummarizeFinanceDeletion(indexes, tasks, taskCostItems)
    : indexes.reduce((acc, ti) => {
        const task = tasks[ti];
        const items = taskCostItems(task);
        acc.tasks += 1;
        acc.budget += +task.budget || 0;
        acc.spent += +task.spent || 0;
        acc.items += items.length;
        items.forEach((item) => {
          acc.acts += (item.acts || []).length;
          acc.payments += (item.payments || []).length;
        });
        return acc;
      }, { tasks: 0, budget: 0, spent: 0, items: 0, acts: 0, payments: 0 });

  const scope = typeof buildRuntimeResolveFinanceDeletionScope === "function"
    ? buildRuntimeResolveFinanceDeletionScope(
        _hasFinanceFilters(),
        finFilters.q,
        {
          filteredScopeLabel: FINANCE_UI.deleteDialogs.filteredScopeLabel,
          fullScopeLabel: FINANCE_UI.deleteDialogs.fullScopeLabel,
        },
      )
    : (_hasFinanceFilters() || finFilters.q
        ? FINANCE_UI.deleteDialogs.filteredScopeLabel
        : FINANCE_UI.deleteDialogs.fullScopeLabel);
  const confirmOne = await Swal.fire({
    icon: "warning",
    title: FINANCE_UI.deleteDialogs.confirmTitle,
    html: `
      <div style="text-align:left">
        Буде видалено: <b>${summary.tasks}</b> робіт.<br>
        Позицій кошторису: <b>${summary.items}</b><br>
        Платежів: <b>${summary.payments}</b><br>
        Актів: <b>${summary.acts}</b><br>
        Бюджет: <b>${fmtM(Math.round(summary.budget))}</b><br>
        Витрачено: <b>${fmtM(Math.round(summary.spent))}</b><br><br>
        Сценарій: <b>${htmlEsc(scope)}</b>
      </div>`,
    showCancelButton: true,
    confirmButtonText: FINANCE_UI.deleteDialogs.continueLabel,
    cancelButtonText: FINANCE_UI.deleteDialogs.cancelLabel,
    confirmButtonColor: "#dc2626",
  });
  if (!confirmOne.isConfirmed) return;

  const confirmTwo = await Swal.fire({
    icon: "warning",
    title: FINANCE_UI.deleteDialogs.finalTitle,
    input: "text",
    inputLabel: FINANCE_UI.deleteDialogs.finalInputLabel,
    showCancelButton: true,
    confirmButtonText: FINANCE_UI.deleteDialogs.finalConfirmLabel,
    cancelButtonText: FINANCE_UI.deleteDialogs.cancelLabel,
    confirmButtonColor: "#dc2626",
    preConfirm: (value) => {
      if (String(value || "").trim().toUpperCase() !== "ВИДАЛИТИ") {
        Swal.showValidationMessage(FINANCE_UI.deleteDialogs.validationMessage);
        return false;
      }
      return true;
    },
  });
  if (!confirmTwo.isConfirmed) return;

  tasks = typeof buildRuntimeApplyFinanceDeletion === "function"
    ? buildRuntimeApplyFinanceDeletion(tasks, indexes)
    : tasks.filter((_, index) => !indexes.includes(index));
  saveAll();
  render();
  renderFinFilters();
  renderFinance();
}

function applyFinFilters(t) {
  if (finFilters.q && !_financeSearchText(t).includes(finFilters.q.toLocaleLowerCase("uk-UA"))) return false;
  if (!multiFilterHas(finFilters.cat, String(t.cat))) return false;
  const statuses = multiFilterValues(finFilters.stat);
  if (statuses.length) {
    const matchesStatus =
      (statuses.includes("done") && t.prog >= 100) ||
      (statuses.includes("active") && t.prog > 0 && t.prog < 100) ||
      (statuses.includes("pending") && t.prog === 0) ||
      (statuses.includes("warn") && checkDeps(t).length > 0);
    if (!matchesStatus) return false;
  }
  const contrFilter = multiFilterValues(finFilters.contr);
  if (contrFilter.length) {
    const contractors = typeof taskContractors === "function" ? taskContractors(t) : [t.contr || ""];
    if (!multiFilterAny(contrFilter, contractors)) return false;
  }
  if (finFilters.budgetMin !== "" && (+t.budget || 0) < +finFilters.budgetMin) return false;
  if (finFilters.budgetMax !== "" && (+t.budget || 0) > +finFilters.budgetMax) return false;
  if (finFilters.onlyBudget && !(+t.budget > 0)) return false;
  return true;
}

function _financeSearchText(t) {
  if (typeof buildRuntimeFinanceSearchText === "function") {
    return buildRuntimeFinanceSearchText(
      t,
      taskContractors(t),
      taskCostItems(t),
      CN(t.cat),
      COST_TYPES,
      PAYMENT_TYPES,
    );
  }
  const parts = [
    t.n, t.name, CN(t.cat), t.prog, t.budget, t.spent,
    (+t.budget || 0) - (+t.spent || 0),
  ];
  taskContractors(t).forEach((name) => parts.push(name));
  taskCostItems(t).forEach((item) => {
    parts.push(
      item.type,
      COST_TYPES?.[item.type]?.label,
      item.name,
      item.supplier,
      item.unit,
      item.qty,
      item.unitPrice,
      _financeItemTotal(item),
    );
    (item.payments || []).forEach((payment) => {
      parts.push(
        payment.date,
        payment.amount,
        payment.type,
        PAYMENT_TYPES?.[payment.type],
        payment.note,
      );
    });
  });
  return parts.filter((value) => value !== null && value !== undefined)
    .join(" ")
    .toLocaleLowerCase("uk-UA");
}

function _financeContractorKey(name) {
  return String(name || "").trim().toLocaleLowerCase("uk-UA");
}

function _financeItemTotal(item) {
  if (typeof buildRuntimeFinanceItemTotal === "function") return buildRuntimeFinanceItemTotal(item);
  const qty = item?.qty == null ? 1 : (+item.qty || 0);
  return qty * (+item?.unitPrice || 0);
}

function _financeScopedCostItems(t) {
  const selected = multiFilterValues(finFilters.contr).map(_financeContractorKey);
  if (typeof buildRuntimeFinanceScopedCostItems === "function") {
    return buildRuntimeFinanceScopedCostItems(
      t,
      selected,
      _financeContractorKey,
      (task) => typeof taskCostItems === "function" ? taskCostItems(task) : (task.costItems || task.cost_items || []),
    );
  }
  const items = typeof taskCostItems === "function" ? taskCostItems(t) : (t.costItems || t.cost_items || []);
  if (!selected.length) return items;
  return items.filter((item) => selected.includes(_financeContractorKey(item.supplier)));
}

function _financeTaskScope(t) {
  const selected = multiFilterValues(finFilters.contr).map(_financeContractorKey);
  if (typeof buildRuntimeFinanceTaskScope === "function") {
    return buildRuntimeFinanceTaskScope(
      t,
      selected,
      _financeContractorKey,
      (task) => typeof taskCostItems === "function" ? taskCostItems(task) : (task.costItems || task.cost_items || []),
    );
  }
  const items = _financeScopedCostItems(t);
  const payments = items.flatMap((it) => it.payments || []);
  if (selected.length) {
    const budget = items.reduce((sum, it) => sum + _financeItemTotal(it), 0);
    const spent = payments.reduce((sum, p) => sum + (+p.amount || 0), 0);
    return { budget, spent, payments };
  }
  return {
    budget: +t.budget || 0,
    spent: +t.spent || 0,
    payments,
  };
}

function renderFinance() {
  _renderFinanceOverview();
  _renderFinanceTable();
  switchFinTab(finActiveTab);
}

function _renderFinanceOverview() {
  const summary = document.getElementById("fin-summary");
  if (!summary) return;

  const overview = typeof buildRuntimeCalculateFinanceOverview === "function"
    ? buildRuntimeCalculateFinanceOverview(tasks)
    : (() => {
        const tb = tasks.reduce((s, t) => s + (+t.budget || 0), 0);
        const ts = tasks.reduce((s, t) => s + (+t.spent || 0), 0);
        const tr = tb - ts;
        const op = tb > 0 ? Math.round((ts / tb) * 100) : 0;
        const bcwp = tasks.reduce((s, t) => s + (+t.budget || 0) * (t.prog / 100), 0);
        const acwp = ts;
        const bac = tb;
        const cpi = acwp > 0 ? bcwp / acwp : null;
        const eac = cpi && cpi > 0 ? bac / cpi : null;
        const etc = eac !== null ? eac - acwp : null;
        const vac = eac !== null ? bac - eac : null;
        return { budget: tb, spent: ts, rest: tr, spentPct: op, bcwp, acwp, bac, cpi, eac, etc, vac };
      })();
  const tb = overview.budget;
  const ts = overview.spent;
  const tr = overview.rest;
  const op = overview.spentPct;
  const bcwp = overview.bcwp;
  const acwp = overview.acwp;
  const bac = overview.bac;
  const cpi = overview.cpi;
  const eac = overview.eac;
  const etc = overview.etc;
  const vac = overview.vac;
  const cpiColor = cpi === null ? "inherit" : cpi >= 1 ? "var(--ok)" : cpi >= 0.9 ? "var(--warn)" : "var(--err)";

  summary.innerHTML = `
    <div class="fc"><div class="lbl">Бюджет</div><div class="val">${fmtM(tb)}</div><div class="sub">грн</div></div>
    <div class="fc"><div class="lbl">Витрачено</div><div class="val" style="color:${ts > tb && tb > 0 ? "var(--err)" : "var(--ok)"}">${fmtM(ts)}</div><div class="sub">${op}%</div></div>
    <div class="fc"><div class="lbl">Залишок</div><div class="val" style="color:${tr < 0 ? "var(--err)" : "inherit"}">${fmtM(tr)}</div><div class="sub">грн</div></div>
    ${
      showEVM
        ? `<div class="fc"><div class="lbl">Освоєно</div><div class="val">${fmtM(Math.round(bcwp))}</div><div class="sub">грн</div></div>
           <div class="fc"><div class="lbl">Індекс вартості</div><div class="val" style="color:${cpiColor}">${cpi !== null ? cpi.toFixed(2) : "—"}</div></div>
           <div class="fc"><div class="lbl">Прогноз</div><div class="val" style="color:${eac !== null && eac > bac ? "var(--err)" : "inherit"}">${eac !== null ? fmtM(Math.round(eac)) : "—"}</div><div class="sub">${vac !== null ? (vac >= 0 ? ` (-${fmtM(Math.round(Math.abs(vac)))})` : ` (+${fmtM(Math.round(Math.abs(vac)))})`) : ""}</div></div>
           <div class="fc"><div class="lbl">Ще потрібно</div><div class="val">${etc !== null ? fmtM(Math.round(etc)) : "—"}</div><div class="sub">грн</div></div>`
        : ""
    }
    <div class="fc"><div class="lbl">Робіт</div><div class="val">${tasks.length}</div><div class="sub">з бюджетом: ${tasks.filter((t) => t.budget > 0).length}</div></div>`;

  if (finActiveTab === "overview") requestAnimationFrame(renderSCurve);
}

function _getFinanceRows() {
  const filteredTasks = tasks
    .map((t, ti) => ({ ...t, __ti: ti }))
    .filter(applyFinFilters);
  if (typeof buildRuntimeBuildFinanceRows === "function") {
    return buildRuntimeBuildFinanceRows(filteredTasks, finSort, dur, remWk);
  }
  const rows = filteredTasks.map((t) => ({
    ...t,
    ti: t.__ti,
    dur: dur(t),
    rest: (+t.budget || 0) - (+t.spent || 0),
    pct: t.budget > 0 ? Math.round((t.spent / t.budget) * 100) : 0,
    rate: (() => {
      const rw = remWk(t);
      const r = (+t.budget || 0) - (+t.spent || 0);
      return rw > 0 ? Math.round(r / rw) : 0;
    })(),
  }));
  rows.sort((a, b) => {
    const av = a[finSort.col];
    const bv = b[finSort.col];
    return typeof av === "string" ? finSort.dir * av.localeCompare(bv, "uk") : finSort.dir * (av - bv);
  });
  return rows;
}

function _renderFinanceTable() {
  const tbl = document.getElementById("fin-tbl");
  if (!tbl) return;

  const cols = _getFinColumns();
  const widths = _getFinColWidths();
  const ft = _getFinanceRows();

  const colgroup = `<colgroup>${cols.map((c) => `<col style="width:${widths[c.k] || FIN_COL_DEFAULTS[c.k]}px">`).join("")}</colgroup>`;
  const thead = cols
    .map((c) => {
      const sortCls = finSort.col === c.k ? (finSort.dir === 1 ? "asc" : "desc") : "";
      return `<th data-col="${c.k}" data-finance-surface-action="sort-col" data-col-key="${c.k}" class="${sortCls}">
        <span>${c.l}</span><span class="sa"></span>
        <span class="fin-col-resizer" data-finance-surface-mousedown="resize-col" data-col="${c.k}"></span>
      </th>`;
    })
    .join("");

  const rows = ft.map((t) => _renderFinanceRow(t)).join("");
  const tot = ft.reduce((a, t) => ({ b: a.b + (+t.budget || 0), s: a.s + (+t.spent || 0), r: a.r + t.rest }), { b: 0, s: 0, r: 0 });

  tbl.innerHTML =
    `${colgroup}
     <thead><tr>${thead}</tr></thead>
     <tbody>${rows || `<tr><td colspan="${cols.length}" class="fin-empty">Немає робіт за фільтрами</td></tr>`}</tbody>
     <tfoot>
       <tr class="ttl">
         <td colspan="4">Разом (відфільтровано)</td>
         <td>${fmtM(tot.b)}</td>
         <td>${fmtM(tot.s)}</td>
         <td></td>
         <td style="color:${tot.r < 0 ? "var(--err)" : ""}">${fmtM(tot.r)}</td>
         <td colspan="2"></td>
       </tr>
     </tfoot>`;
}

function _renderFinanceRow(t) {
  const warns = checkDeps(t);
  return `<tr data-ti="${t.ti}">
    <td>${t.n}</td>
    <td class="fin-cell-link" data-finance-surface-action="open-task" data-task-index="${t.ti}">${t.name}${warns.length ? ` <span title="${warns.join("\n")}" class="fin-warn-ic">⚠</span>` : ""}</td>
    <td class="fin-cell-link" data-finance-surface-action="open-task" data-task-index="${t.ti}"><span class="fin-cat-dot" style="background:${CC(t.cat)}"></span>${CN(t.cat)}</td>
    <td>${t.dur}</td>
    <td class="fin-cell-link" data-finance-surface-action="open-cost" data-task-index="${t.ti}">${fmtM(t.budget)}</td>
    <td class="fin-cell-link" data-finance-surface-action="open-cost" data-task-index="${t.ti}">${fmtM(t.spent)}</td>
    <td>${_finProgressBar(t.pct, "money", "show-overview", t.ti)}</td>
    <td class="fin-cell-link" data-finance-surface-action="open-cost" data-task-index="${t.ti}" style="color:${t.rest < 0 ? "var(--err)" : ""}">${fmtM(t.rest)}</td>
    <td>${t.rate > 0 ? fmtM(t.rate) : "—"}</td>
    <td>${_finProgressBar(t.prog || 0, "work", "go-to-gantt-search", t.ti)}</td>
  </tr>`;
}

function _finProgressBar(pct, type, action, taskIndex) {
  const p = Math.max(0, Math.min(100, Math.round(+pct || 0)));
  const state = p >= 100 ? "done" : p > 0 ? "active" : "pending";
  return `<button class="fin-bar fin-bar-${state} fin-bar-${type}" data-finance-surface-action="${action}" data-task-index="${taskIndex}" title="${p}%">
    <span class="fin-bar-fill" style="width:${p}%"></span>
    <span class="fin-bar-label">${p}%</span>
  </button>`;
}

function sortFin(col) {
  if (finSort.col === col) finSort.dir *= -1;
  else {
    finSort.col = col;
    finSort.dir = 1;
  }
  renderFinance();
}

function startFinColResize(event, col) {
  event.preventDefault();
  event.stopPropagation();
  const widths = _getFinColWidths();
  _finResize = typeof buildRuntimeBuildFinanceResizeSession === "function"
    ? buildRuntimeBuildFinanceResizeSession(widths, FIN_COL_DEFAULTS, col, event.clientX)
    : { col, startX: event.clientX, startW: widths[col] || FIN_COL_DEFAULTS[col] || 100, widths };
  document.addEventListener("mousemove", _onFinColResize);
  document.addEventListener("mouseup", _stopFinColResize);
}

function _onFinColResize(event) {
  if (!_finResize) return;
  const nextState = typeof buildRuntimeApplyFinanceResizeDrag === "function"
    ? buildRuntimeApplyFinanceResizeDrag(_finResize, event.clientX)
    : {
        nextWidth: Math.max(42, _finResize.startW + event.clientX - _finResize.startX),
        widths: {
          ..._finResize.widths,
          [_finResize.col]: Math.max(42, _finResize.startW + event.clientX - _finResize.startX),
        },
      };
  _finResize.widths = nextState.widths;
  const idx = _getFinColumns().findIndex((c) => c.k === _finResize.col) + 1;
  document.querySelectorAll(`#fin-tbl col:nth-child(${idx})`).forEach((col) => {
    col.style.width = `${nextState.nextWidth}px`;
  });
}

function _stopFinColResize() {
  if (_finResize) _saveFinColWidths(_finResize.widths);
  _finResize = null;
  document.removeEventListener("mousemove", _onFinColResize);
  document.removeEventListener("mouseup", _stopFinColResize);
}

function finOpenTask(ti) {
  openEdit(ti);
}

function finOpenCost(ti) {
  openCostModal(ti);
}

function finShowOverview() {
  switchFinTab("overview");
  setTimeout(() => document.getElementById("scurve-section")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
}

function finGoToGanttSearch(ti) {
  const t = tasks[ti];
  if (!t) return;
  const navPlan = typeof buildRuntimeBuildFinanceGanttNavigationPlan === "function"
    ? buildRuntimeBuildFinanceGanttNavigationPlan(
        ti,
        t.name,
        !!document.getElementById("pane-gantt")?.classList.contains("active"),
      )
    : {
        shouldActivateGantt: !document.getElementById("pane-gantt")?.classList.contains("active"),
        targetRowId: `tr${ti}`,
        taskIndex: ti,
        searchQuery: t.name.toLowerCase(),
        searchDisplayName: t.name,
      };
  if (navPlan.shouldActivateGantt) {
    document.querySelector('.tab[data-app-shell-action="switch-tab"][data-tab-id="gantt"]')?.click();
  }
  taskSearch = navPlan.searchQuery;
  renderTable();
  setTimeout(() => {
    const inp = document.getElementById("task-search-inp");
    if (inp) inp.value = navPlan.searchDisplayName;
    onTaskSearch(navPlan.searchDisplayName);
    document.getElementById(navPlan.targetRowId)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 50);
}

function renderSCurve() {
  const el = document.getElementById("scurve-section");
  const canvas = document.getElementById("scurve-canvas");
  if (!el || !canvas) return;
  _applyFinanceChartHeight();
  document.getElementById("scurve-weekly-toggle")?.classList.toggle("active", showWeeklyCostBars);
  document.getElementById("weekly-cost-section")?.classList.toggle("show", showWeeklyCostBars);

  const ml = getML();
  const chartTasks = tasks.filter(applyFinFilters);
  if (!ml.length || chartTasks.every((t) => {
    const scope = _financeTaskScope(t);
    return !scope.budget && !scope.spent;
  })) {
    el.style.display = "none";
    if (sCurveChart) {
      try {
        sCurveChart.destroy();
      } catch (_) {}
      sCurveChart = null;
    }
    if (weeklyCostChart) {
      try {
        weeklyCostChart.destroy();
      } catch (_) {}
      weeklyCostChart = null;
    }
    return;
  }

  el.style.display = "block";
  if (typeof Chart === "undefined") return;

  const weekCount = TW();
  const weeklyPlanned = new Array(weekCount).fill(0);
  const weeklyActual = new Array(weekCount).fill(0);
  const weeklyProjected = new Array(weekCount).fill(0);
  const labels = _financeWeekLabels(ml, weekCount);
  const currentWkRaw = _financeCurrentWeekIndex();
  const currentWk = currentWkRaw >= 0 ? Math.min(currentWkRaw, weekCount - 1) : -1;

  chartTasks.forEach((t) => {
    const { budget, spent, payments } = _financeTaskScope(t);
    if (!budget && !spent) return;

    const startWk = t.ms * 4 + t.ws;
    const endWk = t.me * 4 + t.we;
    const totalWk = Math.max(1, endWk - startWk + 1);

    for (let wk = startWk; wk <= endWk; wk++) {
      if (wk < 0 || wk >= weekCount) continue;
      weeklyPlanned[wk] += budget / totalWk;
    }

    let plottedActual = 0;
    let plottedProjected = 0;
    payments.forEach((p) => {
      const amount = +p.amount || 0;
      if (!amount) return;
      const wk = _financeDateToWeek(p.date, true);
      if (wk === null) return;
      if (!_financeIsFutureDate(p.date) && currentWk >= 0 && wk <= currentWk) {
        weeklyActual[wk] += amount;
        plottedActual += amount;
      } else {
        weeklyProjected[wk] += amount;
        plottedProjected += amount;
      }
    });

    const undatedSpent = Math.max(0, spent - plottedActual - plottedProjected);
    if (undatedSpent > 0 && currentWk >= 0) {
      const actualEnd = Math.min(endWk, currentWk, weekCount - 1);
      if (actualEnd >= startWk) {
        const actualWeeks = Math.max(1, actualEnd - startWk + 1);
        for (let wk = startWk; wk <= actualEnd; wk++) {
          if (wk >= 0 && wk < weekCount) weeklyActual[wk] += undatedSpent / actualWeeks;
        }
        plottedActual += undatedSpent;
      } else {
        _financeSpreadAmount(weeklyProjected, undatedSpent, Math.max(startWk, currentWk + 1), endWk);
        plottedProjected += undatedSpent;
      }
    } else if (undatedSpent > 0) {
      _financeSpreadAmount(weeklyProjected, undatedSpent, startWk, endWk);
      plottedProjected += undatedSpent;
    }

    const remainingForecast = Math.max(0, budget - plottedActual - plottedProjected);
    if (remainingForecast > 0) {
      const forecastStart = currentWk >= 0 ? Math.max(startWk, currentWk + 1) : startWk;
      _financeSpreadAmount(weeklyProjected, remainingForecast, forecastStart, endWk);
    }
  });

  const cumPlanned = [];
  const cumActual = [];
  const cumProjected = [];
  const cumActualFull = [];
  let plannedSum = 0;
  let actualSum = 0;

  weeklyPlanned.forEach((value, i) => {
    plannedSum += value;
    actualSum += weeklyActual[i];
    cumPlanned.push(Math.round(plannedSum));
    cumActualFull.push(Math.round(actualSum));
    cumActual.push(currentWk >= 0 && i <= currentWk ? Math.round(actualSum) : null);
  });
  let projectedSum = currentWk >= 0 ? (cumActualFull[currentWk] || 0) : 0;
  weeklyProjected.forEach((value, i) => {
    if (currentWk >= 0 && i < currentWk) {
      cumProjected.push(null);
      return;
    }
    if (!(currentWk >= 0 && i === currentWk)) projectedSum += value;
    cumProjected.push(Math.round(projectedSum));
  });
  const hasProjected = weeklyProjected.some((value, i) =>
    value > 0 && (currentWk < 0 || i >= currentWk)
  ) || (currentWk >= 0 && currentWk < weekCount - 1 && (cumActualFull[currentWk] || 0) > 0);

  if (sCurveChart) {
    try {
      sCurveChart.destroy();
    } catch (_) {}
  }

  const axisColor = getComputedStyle(document.documentElement).getPropertyValue("--txt2").trim() || "#4a5568";
  const todayLinePlugin = {
    id: "sCurveTodayLine",
    afterDatasetsDraw(chart) {
      if (currentWk < 0) return;
      const { ctx, chartArea, scales } = chart;
      const x = scales.x.getPixelForValue(currentWk);
      if (x < chartArea.left || x > chartArea.right) return;

      ctx.save();
      ctx.strokeStyle = "#e03030";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.stroke();

      ctx.fillStyle = "#e03030";
      ctx.font = "12px sans-serif";
      ctx.textAlign = x > chartArea.right - 48 ? "right" : "left";
      ctx.fillText("Сьогодні", x + (x > chartArea.right - 48 ? -5 : 5), chartArea.top + 11);
      ctx.restore();
    },
  };

  sCurveChart = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: FINANCE_UI.chart.plannedLabel,
          data: cumPlanned,
          yAxisID: "y",
          borderColor: "rgba(30,80,200,0.85)",
          backgroundColor: "rgba(30,80,200,0.08)",
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          order: 1,
        },
        {
          label: FINANCE_UI.chart.actualLabel,
          data: cumActual,
          yAxisID: "y",
          borderColor: "rgba(22,128,60,0.9)",
          backgroundColor: "rgba(22,128,60,0.08)",
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          spanGaps: false,
          order: 2,
        },
        ...(hasProjected
          ? [{
              label: FINANCE_UI.chart.projectedLabel,
              data: cumProjected,
              yAxisID: "y",
              borderColor: "rgba(234,117,0,0.85)",
              backgroundColor: "rgba(234,117,0,0.04)",
              borderWidth: 2,
              borderDash: [5, 5],
              fill: false,
              tension: 0.35,
              pointRadius: 2,
              spanGaps: true,
              order: 3,
            }]
          : []),
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: axisColor, font: { size: 12 }, boxWidth: 14 },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${new Intl.NumberFormat("uk-UA").format(ctx.parsed.y)} ${FINANCE_UI.chart.tooltipCurrencyUnit}`,
          },
        },
      },
      scales: {
        x: {
          offset: false,
          grid: { offset: false },
          ticks: {
            color: axisColor,
            font: { size: 12 },
            maxRotation: 0,
            autoSkip: false,
            callback: (value, index, ticks) => _financeMonthTick(value, index, ticks, ml),
          },
        },
        y: {
          position: "left",
          afterFit: (scale) => {
            scale.width = 78;
          },
          ticks: {
            color: axisColor,
            font: { size: 12 },
            callback: (value) => new Intl.NumberFormat("uk-UA", { notation: "compact" }).format(value),
          },
        },
      },
    },
    plugins: [todayLinePlugin],
  });

  renderWeeklyCostChart(weeklyPlanned, weeklyActual, weeklyProjected, currentWk, ml);
  _syncFinanceChartLayout();
}

function _financeSpreadAmount(target, amount, startWk, endWk) {
  if (!amount || !target.length) return;
  let start = Math.max(0, Math.min(target.length - 1, Math.trunc(startWk)));
  let end = Math.max(0, Math.min(target.length - 1, Math.trunc(endWk)));
  if (end < start) end = start;
  const part = amount / Math.max(1, end - start + 1);
  for (let wk = start; wk <= end; wk++) target[wk] += part;
}

function _financeDateToWeek(dateStr, clamp = false) {
  if (!dateStr) return null;
  const d = _financeParseDate(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const monthIdx = (d.getFullYear() - proj.sy) * 12 + (d.getMonth() - proj.sm);
  if (monthIdx < 0) return clamp ? 0 : null;
  if (monthIdx >= proj.nm) return clamp ? TW() - 1 : null;
  const weekInMonth = Math.min(3, Math.floor((d.getDate() - 1) / 7));
  const wk = monthIdx * 4 + weekInMonth;
  if (wk < 0) return clamp ? 0 : null;
  if (wk >= TW()) return clamp ? TW() - 1 : null;
  return wk;
}

function _financeParseDate(dateStr) {
  const m = String(dateStr || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  return new Date(dateStr);
}

function _financeIsFutureDate(dateStr) {
  const d = _financeParseDate(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d > today;
}

function _financeCurrentWeekIndex() {
  const now = new Date();
  const monthIdx = (now.getFullYear() - proj.sy) * 12 + (now.getMonth() - proj.sm);
  if (monthIdx < 0) return -1;
  if (monthIdx >= proj.nm) return TW() - 1;
  return monthIdx * 4 + Math.min(3, Math.floor((now.getDate() - 1) / 7));
}

function renderWeeklyCostChart(weeklyPlanned, weeklyActual, weeklyProjected, currentWk, ml) {
  const el = document.getElementById("weekly-cost-section");
  const canvas = document.getElementById("weekly-cost-canvas");
  if (!el || !canvas) return;

  el.classList.toggle("show", showWeeklyCostBars);
  if (!showWeeklyCostBars || typeof Chart === "undefined") {
    if (weeklyCostChart) {
      try {
        weeklyCostChart.destroy();
      } catch (_) {}
      weeklyCostChart = null;
    }
    return;
  }

  const labels = _financeWeekLabels(ml, weeklyActual.length);
  const plannedValues = weeklyPlanned.map((value) => Math.round(value));
  const actualValues = weeklyActual.map((value, i) => (currentWk >= 0 && i <= currentWk ? Math.round(value) : null));
  const projectedValues = weeklyProjected.map((value, i) => (value > 0 && (currentWk < 0 || i >= currentWk) ? Math.round(value) : null));
  const hasProjected = projectedValues.some((value) => value !== null);

  if (weeklyCostChart) {
    try {
      weeklyCostChart.destroy();
    } catch (_) {}
  }

  const todayLinePlugin = {
    id: "weeklyCostTodayLine",
    afterDatasetsDraw(chart) {
      if (currentWk < 0) return;
      const { ctx, chartArea, scales } = chart;
      const x = scales.x.getPixelForValue(currentWk);
      if (x < chartArea.left || x > chartArea.right) return;

      ctx.save();
      ctx.strokeStyle = "#e03030";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.stroke();
      ctx.restore();
    },
  };
  const dashedFutureBarsPlugin = {
    id: "weeklyProjectedDashedBars",
    afterDatasetsDraw(chart) {
      const datasetIndex = chart.data.datasets.findIndex((dataset) => dataset._financeProjected);
      if (datasetIndex < 0) return;
      const meta = chart.getDatasetMeta(datasetIndex);
      const dataset = chart.data.datasets[datasetIndex];
      const { ctx } = chart;
      ctx.save();
      ctx.strokeStyle = "rgba(234,117,0,0.78)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      meta.data.forEach((bar, i) => {
        if (dataset.data[i] === null || dataset.data[i] === undefined) return;
        const props = typeof bar.getProps === "function"
          ? bar.getProps(["x", "y", "base", "width"], true)
          : bar;
        const width = props.width || 0;
        const left = props.x - width / 2;
        const top = Math.min(props.y, props.base);
        const height = Math.abs(props.base - props.y);
        if (width > 0 && height > 0) ctx.strokeRect(left, top, width, height);
      });
      ctx.restore();
    },
  };

  const axisColor = getComputedStyle(document.documentElement).getPropertyValue("--txt2").trim() || "#4a5568";
  weeklyCostChart = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: FINANCE_UI.chart.plannedLabel,
          data: plannedValues,
          backgroundColor: "rgba(30,80,200,0.22)",
          borderColor: "rgba(30,80,200,0.72)",
          borderWidth: 1,
          borderRadius: 3,
          stack: "plan",
          categoryPercentage: 0.72,
          barPercentage: 0.82,
        },
        {
          label: FINANCE_UI.chart.actualLabel,
          data: actualValues,
          backgroundColor: "rgba(22,128,60,0.28)",
          borderColor: "rgba(22,128,60,0.78)",
          borderWidth: 1,
          borderRadius: 3,
          stack: "actual",
          categoryPercentage: 0.72,
          barPercentage: 0.82,
        },
        ...(hasProjected
          ? [{
              label: FINANCE_UI.chart.projectedLabel,
              data: projectedValues,
              backgroundColor: "rgba(234,117,0,0.16)",
              borderColor: "rgba(234,117,0,0.76)",
              borderWidth: 2,
              borderDash: [5, 5],
              borderRadius: 3,
              stack: "actual",
              categoryPercentage: 0.72,
              barPercentage: 0.82,
              _financeProjected: true,
            }]
          : []),
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: axisColor, font: { size: 12 }, boxWidth: 14 },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${new Intl.NumberFormat("uk-UA").format(ctx.parsed.y)} ${FINANCE_UI.chart.tooltipCurrencyUnit}`,
          },
        },
      },
      scales: {
        x: {
          offset: false,
          grid: { offset: false },
          ticks: {
            color: axisColor,
            font: { size: 12 },
            maxRotation: 0,
            autoSkip: false,
            callback: (value, index, ticks) => _financeMonthTick(value, index, ticks, ml),
          },
        },
        y: {
          afterFit: (scale) => {
            scale.width = 78;
          },
          ticks: {
            color: axisColor,
            font: { size: 12 },
            callback: (value) => new Intl.NumberFormat("uk-UA", { notation: "compact" }).format(value),
          },
        },
      },
    },
    plugins: [todayLinePlugin, dashedFutureBarsPlugin],
  });

  _syncFinanceChartLayout();
}
