const CONTRACTOR_EMPTY_NAME = "Без контрагента";

let contractorFilters = { q: "", status: [], type: [], cat: [] };
let contractorSort = { col: "paid", dir: -1 };
let contractorDetailSort = {
  contracts: { col: "contractNo", dir: 1 },
  acts: { col: "date", dir: -1 },
  payments: { col: "date", dir: -1 },
};
let contractorExpanded = new Set();
let contractorSelected = new Set();
let contractorSelectionMode = false;
let _contractorResize = null;
let _contractorColDrag = null;
let _contractorSuppressHeaderClick = false;
let _contractorDetailResize = null;
let _contractorDetailColDrag = null;
let _contractorEntryEditPath = null;
let _contractorEntryOriginalKey = "";
let _contractorImportMapping = null;

const CONTRACTOR_COL_SK = "gantt_contractor_col_widths";
const CONTRACTOR_COL_ORDER_SK = "gantt_contractor_col_order";
const CONTRACTOR_COL_DEFAULTS = {
  select: 42,
  rowNo: 54,
  supplier: 320,
  tasksCount: 82,
  itemsCount: 88,
  budget: 140,
  paid: 140,
  rest: 140,
  actsAmount: 140,
  actsDebt: 150,
  paymentsCount: 94,
  lastPayment: 124,
  status: 150,
  actions: 128,
};

const CONTRACTOR_DETAIL_COL_SK = "gantt_contractor_detail_col_widths";
const CONTRACTOR_DETAIL_COL_ORDER_SK = "gantt_contractor_detail_col_order";
const CONTRACTOR_DETAIL_COL_DEFAULTS = {
  "contracts.contractNo": 220,
  "contracts.taskName": 260,
  "contracts.total": 140,
  "contracts.note": 220,
  "contracts.actions": 112,
  "acts.date": 110,
  "acts.type": 120,
  "acts.name": 150,
  "acts.amount": 120,
  "acts.itemName": 240,
  "acts.contractNo": 160,
  "acts.taskName": 260,
  "acts.note": 220,
  "acts.actions": 112,
  "payments.date": 110,
  "payments.amount": 120,
  "payments.contractNo": 160,
  "payments.actNo": 120,
  "payments.taskName": 260,
  "payments.itemName": 240,
  "payments.note": 220,
  "payments.actions": 86,
  "forecast.taskName": 260,
  "forecast.itemName": 220,
  "forecast.budget": 140,
  "forecast.paid": 140,
  "forecast.rest": 140,
};

const CONTRACTOR_ACT_TYPES = {
  contract: "Договір",
  act: "Акт",
  advance: "Аванс",
  invoice: "Рахунок",
  delivery: "Накладна",
  other: "Інше",
};

const CONTRACTOR_IMPORT_HEADERS = [
  "Робота",
  "Контрагент",
  "Договір",
  "Сума договору",
  "Опис товару/послуги",
  "Акт",
  "Дата платежу",
  "Сума платежу",
  "Примітка",
];

const CONTRACTOR_HEADER_ALIASES = {
  taskId: ["id", "idроботи", "taskid", "workid"],
  taskNo: ["number", "n", "номер", "номерроботи", "робота", "роботаn", "taskno", "tasknumber"],
  taskName: ["назвароботи", "видробіт", "робота", "роботи", "task", "taskname", "work", "workname"],
  supplier: ["контрагент", "постачальник", "підрядник", "виконавець", "supplier", "contractor", "vendor"],
  contractNo: ["договір", "номердоговору", "назвадоговору", "contract", "contractno", "contractname"],
  actName: ["акт", "номеракту", "actname", "act", "document", "documentname"],
  type: ["тип", "позиція", "типпозиції", "категоріяпозиції", "type", "itemtype", "position"],
  unit: ["одиниця", "од", "unit", "uom"],
  qty: ["кількість", "ксть", "кільк", "qty", "quantity"],
  unitPrice: ["ціназаод", "ціназаодиницю", "ціна", "unitprice", "price"],
  total: ["сумадоговору", "сумакошторису", "кошторис", "вартість", "budget", "total", "estimated"],
  paymentDate: ["датаплатежу", "датаоплати", "дата", "paymentdate", "paiddate", "date"],
  paymentAmount: ["сумаплатежу", "сумаоплати", "сума", "оплата", "сплачено", "платіж", "paid", "amount", "paymentamount"],
  note: ["примітка", "коментар", "опис", "note", "comment", "description"],
};

const CONTRACTOR_IMPORT_FIELD_LABELS = {
  taskName: "Робота",
  supplier: "Контрагент",
  contractNo: "Договір",
  total: "Сума договору",
  type: "Опис товару/послуги",
  actName: "Акт",
  paymentDate: "Дата платежу",
  paymentAmount: "Сума платежу",
  note: "Примітка",
};

const CONTRACTOR_IMPORT_FIELD_ORDER = [
  "taskName",
  "supplier",
  "contractNo",
  "total",
  "type",
  "actName",
  "paymentDate",
  "paymentAmount",
  "note",
];

CONTRACTOR_IMPORT_HEADERS.splice(0, CONTRACTOR_IMPORT_HEADERS.length,
  "Робота",
  "Контрагент",
  "Договір",
  "Сума договору",
  "Опис товару/послуги",
  "Акт",
  "Дата платежу",
  "Сума платежу",
  "Примітка"
);

function renderContractors() {
  const tbl = document.getElementById("contractor-tbl");
  if (!tbl) return;

  _syncContractorControls();
  const rows = _getContractorRows();
  _renderContractorSummary(rows);

  const cols = _getContractorColumns();
  const visibleCols = contractorSelectionMode ? cols : cols.filter(([key]) => key !== "select");
  const widths = _getContractorColWidths();

  const head = visibleCols
    .map(([key, label]) => {
      const resize = `<span class="contractor-col-resizer" onclick="event.stopPropagation()" onmousedown="startContractorColResize(event,'${key}')"></span>`;
      const drag = `draggable="true" ondragstart="startContractorColDrag(event,'${key}')" ondragover="event.preventDefault()" ondrop="dropContractorCol(event,'${key}')" ondragend="endContractorColDrag()"`;
      if (key === "select") return `<th data-col="${key}" class="contractor-select-cell" ${drag}>${contractorSelectionMode ? `<input type="checkbox" id="contractor-select-all" onclick="event.stopPropagation();toggleAllVisibleContractors(this.checked)" title="Вибрати всі видимі контрагенти">` : ""}${resize}</th>`;
      if (key === "actions") return `<th data-col="${key}" ${drag}>${label}${resize}</th>`;
      const cls = contractorSort.col === key ? (contractorSort.dir === 1 ? "asc" : "desc") : "";
      return `<th data-col="${key}" class="${cls}" onclick="if(!_contractorSuppressHeaderClick)sortContractors('${key}')" ${drag}><span>${label}</span>${resize}</th>`;
    })
    .join("");

  const body = rows.length
    ? rows.map((row) => _renderContractorRow(row, visibleCols)).join("")
    : `<tr><td colspan="${visibleCols.length}" class="contractor-empty">Немає контрагентів за вибраними фільтрами</td></tr>`;

  tbl.innerHTML = `
    <colgroup>${visibleCols.map(([key]) => `<col style="width:${widths[key] || CONTRACTOR_COL_DEFAULTS[key]}px">`).join("")}</colgroup>
    <thead><tr>${head}</tr></thead>
    <tbody>${body}</tbody>`;

  tbl.classList.toggle("contractor-selection-mode", contractorSelectionMode);
  tbl.closest(".contractor-table-wrap")?.classList.toggle("contractor-selection-mode", contractorSelectionMode);
  lucide.createIcons({ nodes: [tbl, document.getElementById("pane-contractors")] });
  _syncContractorSelectionHeader(rows);
}

function _getContractorColumns() {
  const base = [
    ["select", ""],
    ["rowNo", "№"],
    ["supplier", "Контрагент"],
    ["tasksCount", "Робіт"],
    ["itemsCount", "Договорів"],
    ["budget", "Кошторис"],
    ["paid", "Оплачено"],
    ["rest", "Залишок"],
    ["actsAmount", "Сума актів"],
    ["actsDebt", "Заборг. по актах"],
    ["paymentsCount", "Платежів"],
    ["lastPayment", "Остання оплата"],
    ["status", "Статус"],
    ["actions", ""],
  ];
  return _applyStoredColumnOrder(base, CONTRACTOR_COL_ORDER_SK);
}

function _applyStoredColumnOrder(base, storageKey) {
  let order = [];
  try {
    order = JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch (_) { }
  if (!Array.isArray(order) || !order.length) return base;
  const byKey = new Map(base.map((col) => [col[0], col]));
  const ordered = order.map((key) => byKey.get(key)).filter(Boolean);
  base.forEach((col) => {
    if (!order.includes(col[0])) ordered.push(col);
  });
  return ordered;
}

function _saveColumnOrder(storageKey, cols) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(cols.map(([key]) => key)));
  } catch (_) { }
}

function _getContractorColWidths() {
  try {
    return { ...CONTRACTOR_COL_DEFAULTS, ...(JSON.parse(localStorage.getItem(CONTRACTOR_COL_SK) || "{}")) };
  } catch (_) {
    return { ...CONTRACTOR_COL_DEFAULTS };
  }
}

function _saveContractorColWidths(widths) {
  try {
    localStorage.setItem(CONTRACTOR_COL_SK, JSON.stringify(widths));
  } catch (_) { }
}

function _getAutoContractorColWidths(rows, cols, containerWidth) {
  const widths = {};
  const fixed = {
    select: contractorSelectionMode ? 42 : 0,
    rowNo: 54,
    tasksCount: 54,
    itemsCount: 72,
    paymentsCount: 72,
    actions: 118,
  };
  const minimums = {
    budget: 96,
    paid: 96,
    rest: 96,
    actsAmount: 96,
    actsDebt: 108,
    lastPayment: 110,
    status: 96,
  };
  const charPx = 8;
  const cellPadding = 28;

  cols.forEach(([key, label]) => {
    if (!contractorSelectionMode && key === "select") {
      widths[key] = 0;
      return;
    }
    if (key === "supplier") return;
    if (fixed[key] !== undefined) {
      widths[key] = fixed[key];
      return;
    }

    let longest = String(label || "").length;
    rows.slice(0, 200).forEach((row) => {
      let value = "";
      if (key === "budget") value = fmtM(Math.round(row.budget || 0));
      else if (key === "paid") value = fmtM(Math.round(row.paid || 0));
      else if (key === "rest") value = fmtM(Math.round(row.rest || 0));
      else if (key === "actsAmount") value = fmtM(Math.round(row.actsAmount || 0));
      else if (key === "actsDebt") value = fmtM(Math.round(row.actsDebt || 0));
      else if (key === "lastPayment") value = _ctDisplayDate(row.lastPayment) || "";
      else if (key === "status") value = _contractorStatus(row).label || "";
      else value = String(row[key] ?? "");
      longest = Math.max(longest, String(value).length);
    });

    widths[key] = Math.max(minimums[key] || 72, Math.min(220, longest * charPx + cellPadding));
  });

  const supplierMin = 340;
  let used = cols.reduce((sum, [key]) => sum + (key === "supplier" ? 0 : (widths[key] || 0)), 0);
  const allowedForOtherCols = Math.max(0, (containerWidth || 0) - supplierMin - 4);
  if (used > allowedForOtherCols) {
    const shrinkOrder = ["status", "lastPayment", "actsDebt", "actsAmount", "rest", "paid", "budget"];
    let overflow = used - allowedForOtherCols;
    shrinkOrder.forEach((key) => {
      if (overflow <= 0) return;
      const current = widths[key] || 0;
      const min = minimums[key] || current;
      const delta = Math.max(0, current - min);
      if (!delta) return;
      const take = Math.min(delta, overflow);
      widths[key] = current - take;
      overflow -= take;
    });
    used = cols.reduce((sum, [key]) => sum + (key === "supplier" ? 0 : (widths[key] || 0)), 0);
  }

  widths.supplier = Math.max(supplierMin, (containerWidth || 0) - used - 4);
  return widths;
}

function _syncContractorControls() {
  const q = document.getElementById("contractor-search");
  if (q && q.value !== contractorFilters.q) q.value = contractorFilters.q;
  document.getElementById("contractor-search-clear")?.classList.toggle("show", !!contractorFilters.q);

  const status = document.getElementById("contractor-status-filter");
  if (status) {
    status.innerHTML = renderMultiFilter("contractorFilters.status", "Статус", "Усі статуси", [
      { value: "debt", label: "Є залишок" },
      { value: "paid", label: "Оплачено" },
      { value: "over", label: "Переплата" },
      { value: "unpaid", label: "Без оплат" },
    ], "renderContractors", "contractor-multi");
  }

  const type = document.getElementById("contractor-type-filter");
  if (type) {
    const typeOptions = Object.entries(COST_TYPES || {}).map(([value, cfg]) => ({ value, label: cfg.label || value }));
    type.innerHTML = renderMultiFilter("contractorFilters.type", "Тип", "Усі типи", typeOptions, "renderContractors", "contractor-multi");
  }

  const cat = document.getElementById("contractor-cat-filter");
  if (cat) {
    const catOptions = cats.map((c, i) => ({ value: i, label: c.name }));
    cat.innerHTML = renderMultiFilter("contractorFilters.cat", "Категорія", "Усі категорії", catOptions, "renderContractors", "contractor-multi");
  }

  const reset = document.getElementById("contractor-reset-filter");
  if (reset) {
    reset.innerHTML = _hasContractorFilters()
      ? `<button class="btn btn-sm" onclick="resetContractorFilters()" title="Скинути фільтри контрагентів"><i data-lucide="rotate-ccw"></i></button>`
      : "";
  }

  const selection = document.getElementById("contractor-selection-actions");
  if (selection) {
    const selectedCount = _selectedContractorKeys().length;
    selection.innerHTML = `
        <button class="btn btn-sm" onclick="toggleContractorSelectionMode()">${contractorSelectionMode ? "Сховати вибір" : "Вибрати"}</button>
        ${selectedCount
        ? `
        <span class="contractor-selection-chip">Вибрано: <b>${selectedCount}</b></span>
        <button class="btn btn-sm" onclick="clearContractorSelection()">Очистити</button>
        <button class="btn btn-sm danger" onclick="deleteSelectedContractors()">Видалити вибраних</button>`
        : ""}`;
  }

  const canImport = typeof canEdit === "function" ? canEdit() : true;
  document.querySelectorAll(".contractor-import-btn").forEach((el) => {
    el.classList.toggle("disabled", !canImport);
    el.style.display = canImport ? "inline-flex" : "none";
  });
}

function onContractorSearch(q) {
  contractorFilters.q = String(q || "").trim();
  document.getElementById("contractor-search-clear")?.classList.toggle("show", !!contractorFilters.q);
  renderContractors();
}

function clearContractorSearch() {
  contractorFilters.q = "";
  const input = document.getElementById("contractor-search");
  if (input) input.value = "";
  document.getElementById("contractor-search-clear")?.classList.remove("show");
  renderContractors();
}

function _renderContractorSummary(rows) {
  const el = document.getElementById("contractor-summary");
  if (!el) return;

  const total = rows.reduce(
    (acc, r) => {
      acc.budget += r.budget;
      acc.paid += r.paid;
      acc.rest += r.rest;
      acc.actsAmount += r.actsAmount || 0;
      acc.actsDebt += r.actsDebt || 0;
      acc.payments += r.paymentsCount;
      acc.items += r.itemsCount;
      return acc;
    },
    { budget: 0, paid: 0, rest: 0, actsAmount: 0, actsDebt: 0, payments: 0, items: 0 },
  );
  const realContractors = rows.filter((r) => !r.isForecast).length;
  const withDebt = rows.filter((r) => r.rest > 0.5).length;

  el.innerHTML = `
    <div class="contractor-card"><div class="lbl">Контрагентів</div><div class="val">${realContractors}</div></div>
    <div class="contractor-card"><div class="lbl">Договорів</div><div class="val">${total.items}</div></div>
    <div class="contractor-card"><div class="lbl">Кошторис</div><div class="val">${fmtM(Math.round(total.budget))}</div><div class="sub">грн</div></div>
    <div class="contractor-card"><div class="lbl">Оплачено</div><div class="val" style="color:var(--ok)">${fmtM(Math.round(total.paid))}</div><div class="sub">грн</div></div>
    <div class="contractor-card"><div class="lbl">Сума актів</div><div class="val">${fmtM(Math.round(total.actsAmount))}</div><div class="sub">грн</div></div>
    <div class="contractor-card"><div class="lbl">Борг по актах</div><div class="val" style="color:${total.actsDebt > 0 ? "var(--err)" : "inherit"}">${fmtM(Math.round(total.actsDebt))}</div><div class="sub">грн</div></div>
    <div class="contractor-card"><div class="lbl">Залишок</div><div class="val" style="color:${total.rest < 0 ? "var(--err)" : "inherit"}">${fmtM(Math.round(total.rest))}</div><div class="sub">грн</div></div>`;
}

function _renderContractorRow(row, colspan) {
  const open = contractorExpanded.has(row.key);
  const status = _contractorStatus(row);
  const special = _isPinnedContractorRow(row);
  const selectable = !_isBulkDeleteBlockedKey(row.key) && !row.isForecast;
  const selected = selectable && contractorSelected.has(row.key);
  const detail = open
    ? (row.isForecast ? _renderContractorForecastDetails(row, colspan) : _renderContractorDetails(row, colspan))
    : "";
  const action = row.isForecast
    ? `<span class="contractor-muted">—</span>`
    : `<button class="btn btn-sm contractor-row-action" onclick="editContractor('${encodeURIComponent(row.key)}')" title="Редагувати контрагента">
          <i data-lucide="pencil"></i>
        </button>
        <button class="btn btn-sm contractor-row-action danger" onclick="deleteContractor('${encodeURIComponent(row.key)}')" title="Видалити контрагента">
          <i data-lucide="trash-2"></i>
        </button>`;
  return `
    <tr class="contractor-main-row${special ? " contractor-special-row" : ""}${selected ? " contractor-selected" : ""}">
      <td class="contractor-select-cell">
        ${selectable ? `<input type="checkbox" ${selected ? "checked" : ""} onclick="event.stopPropagation();toggleContractorSelection('${encodeURIComponent(row.key)}', this.checked)" title="Вибрати контрагента">` : ""}
      </td>
      <td class="contractor-num contractor-row-no">${row.rowNo || ""}</td>
      <td class="contractor-name-cell">
        <div class="contractor-name-wrap">
          <button class="contractor-expand-btn" onclick="toggleContractorDetails('${encodeURIComponent(row.key)}')" title="${open ? "Згорнути" : "Розгорнути"}">
            <i data-lucide="${open ? "chevron-down" : "chevron-right"}"></i>
          </button>
          <span class="contractor-title">
            <b title="${_ctAttr(row.supplier)}">${_ctEsc(row.supplier)}</b>
          </span>
        </div>
      </td>
      <td class="contractor-num">${row.tasksCount}</td>
      <td class="contractor-num">${row.itemsCount}</td>
      <td class="contractor-num contractor-money-cell">${fmtM(Math.round(row.budget))}</td>
      <td class="contractor-num contractor-money-cell">${fmtM(Math.round(row.paid))}</td>
      <td class="contractor-num contractor-money-cell${row.rest < 0 ? " contractor-rest-negative" : ""}">${fmtM(Math.round(row.rest))}</td>
      <td class="contractor-num">${fmtM(Math.round(row.actsAmount || 0))}</td>
      <td class="contractor-num${(row.actsDebt || 0) > 0 ? " contractor-rest-negative" : ""}">${fmtM(Math.round(row.actsDebt || 0))}</td>
      <td class="contractor-num">${row.paymentsCount}</td>
      <td>${_ctEsc(_ctDisplayDate(row.lastPayment) || "—")}</td>
      <td>${_renderContractorStatusBar(row, status)}</td>
      <td>${action}</td>
    </tr>${detail}`;
}

function _renderContractorStatusBar(row, status) {
  const pctRaw = row.budget > 0 ? Math.round((row.paid / row.budget) * 100) : 0;
  const pct = Math.max(0, Math.min(100, pctRaw));
  const state = status.key === "paid" ? "done" : row.paid > 0 ? "active" : "pending";
  const title = `${status.label}: ${pctRaw}%`;
  return `<div class="contractor-money-status" title="${_ctAttr(title)}">
    <span class="fin-bar fin-bar-${state} fin-bar-money">
      <span class="fin-bar-fill" style="width:${pct}%"></span>
      <span class="fin-bar-label">${pctRaw}%</span>
    </span>
  </div>`;
}

function _renderContractorDetails(row, colspan) {
  const payments = _sortContractorDetailRows(row.payments || [], "payments");
  const acts = _sortContractorDetailRows(row.acts || [], "acts");
  const contracts = _sortContractorDetailRows(row.items || [], "contracts");
  const contractRows = contracts.length
    ? contracts.map((item) => `
      <tr>
        <td>${_ctEsc(item.itemName || "—")}</td>
        <td><span class="contractor-link" onclick="openContractorTask(${item.ti})">#${item.taskNo} ${_ctEsc(item.taskName)}</span></td>
        <td class="contractor-num">${fmtM(Math.round(item.budget || 0))}</td>
        <td>${_ctEsc(item.note || "")}</td>
        <td class="contractor-pay-actions">
          <button class="btn btn-sm contractor-row-action" onclick="openContractorActModal('', '${_ctAttr(item.path)}')" title="Додати акт">
            <i data-lucide="file-text"></i>
          </button>
          <button class="btn btn-sm contractor-row-action" onclick="openContractorPaymentModal('${_ctAttr(item.path)}')" title="Додати платіж">
            <i data-lucide="credit-card"></i>
          </button>
        </td>
      </tr>`).join("")
    : `<tr><td colspan="5" class="contractor-empty">Договорів по цьому контрагенту ще немає</td></tr>`;

  const actRows = acts.length
    ? acts.map((act) => `
      <tr>
        <td>${_ctEsc(_ctDisplayDate(act.date) || "—")}</td>
        <td>${_ctEsc(CONTRACTOR_ACT_TYPES[act.type] || act.type || "—")}</td>
        <td>${_ctEsc(act.name || "—")}</td>
        <td class="contractor-num">${fmtM(Math.round(act.amount || 0))}</td>
        <td>${_ctEsc(act.contractNo || "—")}<br><small>${fmtM(Math.round(act.contractAmount || 0))} грн</small></td>
        <td><span class="contractor-link" onclick="openContractorTask(${act.ti})">#${act.taskNo} ${_ctEsc(act.taskName)}</span></td>
        <td>${_ctEsc(act.note || "")}</td>
        <td class="contractor-pay-actions">
          <button class="btn btn-sm contractor-row-action" onclick="editContractorAct('${_ctAttr(act.path)}')" title="Редагувати акт">
            <i data-lucide="pencil"></i>
          </button>
          <button class="btn btn-sm contractor-row-action" onclick="openContractorPaymentModal('', '${_ctAttr(act.path)}')" title="Додати платіж">
            <i data-lucide="credit-card"></i>
          </button>
          <button class="btn btn-sm contractor-row-action danger" onclick="deleteContractorAct('${_ctAttr(act.path)}')" title="Видалити акт">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>`).join("")
    : `<tr><td colspan="8" class="contractor-empty">Актів по цьому контрагенту ще немає</td></tr>`;

  const paymentRows = payments.length
    ? payments
      .map(
        (p) => `
      <tr>
        <td>${_ctEsc(_ctDisplayDate(p.date) || "—")}</td>
        <td class="contractor-num">${fmtM(Math.round(p.amount || 0))}</td>
        <td>${_ctEsc(p.contractNo || "—")}<br><small>${fmtM(Math.round(p.contractAmount || 0))} грн</small></td>
        <td>${_ctEsc(p.actNo || "—")}</td>
        <td><span class="contractor-link" onclick="openContractorTask(${p.ti})">#${p.taskNo} ${_ctEsc(p.taskName)}</span></td>
        <td>${_ctEsc(p.itemName)}</td>
        <td>${_ctEsc(p.note || "")}</td>
        <td class="contractor-pay-actions">
          <button class="btn btn-sm contractor-row-action" onclick="editContractorPayment('${_ctAttr(p.path)}')" title="Редагувати платіж">
            <i data-lucide="pencil"></i>
          </button>
          <button class="btn btn-sm contractor-row-action danger" onclick="deleteContractorPayment('${_ctAttr(p.path)}')" title="Видалити платіж">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>`,
      )
      .join("")
    : `<tr><td colspan="8" class="contractor-empty">Платежів по цьому контрагенту ще немає</td></tr>`;

  return `
    <tr class="contractor-detail-row">
      <td colspan="${colspan}">
        <div class="contractor-detail-box">
          <table class="contractor-pay-tbl">
            <thead>
              <tr>
                ${_renderContractorDetailTh("contracts", "itemName", "Договір", "")}
                ${_renderContractorDetailTh("contracts", "taskName", "Робота", "width:260px")}
                ${_renderContractorDetailTh("contracts", "budget", "Сума", "width:140px")}
                ${_renderContractorDetailTh("contracts", "note", "Примітка", "")}
                <th style="width:112px">Дії</th>
              </tr>
            </thead>
            <tbody>${contractRows}</tbody>
          </table>
          <table class="contractor-pay-tbl">
            <thead>
              <tr>
                ${_renderContractorDetailTh("acts", "date", "Дата акту", "width:110px")}
                ${_renderContractorDetailTh("acts", "type", "Тип", "width:120px")}
                ${_renderContractorDetailTh("acts", "name", "Акт", "width:150px")}
                ${_renderContractorDetailTh("acts", "amount", "Сума акту", "width:120px")}
                ${_renderContractorDetailTh("acts", "contractNo", "Договір", "width:160px")}
                ${_renderContractorDetailTh("payments", "itemName", "Опис товару/послуги", "width:240px")}
                ${_renderContractorDetailTh("acts", "taskName", "Робота", "width:260px")}
                ${_renderContractorDetailTh("acts", "note", "Примітка", "")}
                <th style="width:112px">Дії</th>
              </tr>
            </thead>
            <tbody>${actRows}</tbody>
          </table>
          <table class="contractor-pay-tbl">
            <thead>
              <tr>
                ${_renderContractorDetailTh("payments", "date", "Дата", "width:110px")}
                ${_renderContractorDetailTh("payments", "amount", "Сума", "width:120px")}
                ${_renderContractorDetailTh("payments", "contractNo", "Договір", "width:160px")}
                ${_renderContractorDetailTh("payments", "actNo", "Акт", "width:120px")}
                ${_renderContractorDetailTh("payments", "taskName", "Робота", "width:260px")}
                ${_renderContractorDetailTh("payments", "note", "Примітка", "")}
                <th style="width:86px">Дії</th>
              </tr>
            </thead>
            <tbody>${paymentRows}</tbody>
          </table>
        </div>
      </td>
    </tr>`;
}

function _renderContractorForecastDetails(row, colspan) {
  const rows = row.items
    .slice()
    .sort((a, b) => a.taskNo - b.taskNo)
    .map((item) => {
      const rest = (item.budget || 0) - (item.paid || 0);
      return `
        <tr>
          <td><span class="contractor-link" onclick="openContractorTask(${item.ti})">#${item.taskNo} ${_ctEsc(item.taskName)}</span></td>
          <td>${_ctEsc(item.itemName)}</td>
          <td class="contractor-num">${fmtM(Math.round(item.budget || 0))}</td>
          <td class="contractor-num">${fmtM(Math.round(item.paid || 0))}</td>
          <td class="contractor-num${rest < 0 ? " contractor-rest-negative" : ""}">${fmtM(Math.round(rest))}</td>
        </tr>`;
    })
    .join("");

  return `
    <tr class="contractor-detail-row">
      <td colspan="${colspan}">
        <div class="contractor-detail-box">
          <table class="contractor-pay-tbl">
            <thead>
              <tr>
                <th>Робота</th>
                <th>Джерело</th>
                <th style="width:140px">Кошторис</th>
                <th style="width:140px">Оплачено без контрагента</th>
                <th style="width:140px">Залишок</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </td>
    </tr>`;
}

function _renderContractorDetailTh(group, col, label, style) {
  const sort = contractorDetailSort[group] || { col: "", dir: 1 };
  const cls = sort.col === col ? (sort.dir === 1 ? "asc" : "desc") : "";
  return `<th class="${cls}" style="${style}" onclick="sortContractorDetails('${group}','${col}')">${label}</th>`;
}

function _sortContractorDetailRows(rows, group) {
  const sort = contractorDetailSort[group] || { col: "", dir: 1 };
  return rows.slice().sort((a, b) => _compareContractorDetailRows(a, b, sort));
}

function _compareContractorDetailRows(a, b, sort) {
  const col = sort.col;
  const av = a[col] ?? "";
  const bv = b[col] ?? "";
  const cmp = typeof av === "number"
    ? av - (+bv || 0)
    : String(av).localeCompare(String(bv), "uk");
  return sort.dir * cmp;
}

function _getContractorRows() {
  const buckets = new Map();

  tasks.forEach((task, ti) => {
    if (!multiFilterHas(contractorFilters.cat, String(task.cat))) return;

    const costItems = typeof taskCostItems === "function" ? taskCostItems(task) : (task.costItems || task.cost_items || []);
    costItems.forEach((item, itemIndex) => {
      if (!multiFilterHas(contractorFilters.type, item.type || "other")) return;

      const supplier = _contractorName(item.supplier);
      const key = _contractorKey(supplier);
      const bucket = buckets.get(key) || {
        key,
        supplier,
        budget: 0,
        paid: 0,
        rest: 0,
        actsAmount: 0,
        actsDebt: 0,
        tasks: new Set(),
        taskNames: new Map(),
        items: [],
        acts: [],
        payments: [],
        lastPayment: "",
        search: "",
      };

      const itemBudget = _ctItemTotal(item);
      const itemPayments = item.payments || [];
      const itemPaid = itemPayments.reduce((sum, p) => sum + (+p.amount || 0), 0);
      const itemName = item.name || "Опис товару/послуги";

      bucket.budget += itemBudget;
      bucket.paid += itemPaid;
      bucket.tasks.add(task.id || String(task.n));
      bucket.taskNames.set(task.id || String(task.n), task.name);
      bucket.items.push({
        ti,
        itemId: item.id,
        itemIndex,
        path: _encodeContractorItemPath({ ti, itemId: item.id, itemIndex }),
        taskNo: task.n,
        taskName: task.name,
        contractNo: item.contractNo || "-",
        itemName: itemName || "-",
        type: item.type,
        total: itemBudget,
        budget: itemBudget,
        paid: itemPaid,
        note: item.contractNote || item.note || "",
      });
      (item.acts || []).forEach((act, actIndex) => {
        const actAmount = +act.amount || 0;
        bucket.actsAmount += actAmount;
        bucket.acts.push({
          ti,
          itemId: item.id,
          actId: act.id,
          actIndex,
          path: _encodeContractorActPath({ ti, itemId: item.id, itemIndex, actId: act.id, actIndex }),
          taskNo: task.n,
          taskName: task.name,
          itemName,
          contractNo: item.contractNo || "",
          contractAmount: itemBudget,
          type: act.type || "contract",
          name: act.name || "",
          itemName: act.itemName || act.description || itemName,
          date: act.date || "",
          amount: actAmount,
          note: act.note || "",
        });
      });

      itemPayments.forEach((payment, payIndex) => {
        const amount = +payment.amount || 0;
        bucket.payments.push({
          ti,
          itemId: item.id,
          payId: payment.id,
          payIndex,
          path: _encodeContractorPaymentPath({ ti, itemId: item.id, itemIndex, payId: payment.id, payIndex }),
          taskNo: task.n,
          taskName: task.name,
          itemName,
          date: payment.date || "",
          type: payment.type || "other",
          amount,
          contractNo: item.contractNo || "",
          contractDate: item.contractDate || "",
          contractAmount: itemBudget,
          actId: payment.actId || "",
          actNo: payment.actNo || "",
          note: payment.note || "",
        });
        if (payment.date && payment.date > bucket.lastPayment) bucket.lastPayment = payment.date;
      });

      bucket.search += ` ${supplier} ${task.name} ${itemName} ${item.type || ""} ${itemPayments
        .map((p) => `${p.note || ""} ${p.amount || ""}`)
        .join(" ")}`;
      buckets.set(key, bucket);
    });

    if (!multiFilterValues(contractorFilters.type).length) _addTaskForecastRemainder(buckets, task, ti, costItems);
  });

  const q = contractorFilters.q.trim().toLocaleLowerCase("uk-UA");
  const rows = [...buckets.values()]
    .map((row) => {
      row.actsAmount = row.actsAmount || 0;
      row.rest = row.budget - row.paid;
      row.actsDebt = row.isForecast ? 0 : row.actsAmount - row.paid;
      row.tasksCount = row.tasks.size;
      row.itemsCount = row.items.length;
      row.paymentsCount = row.payments.length;
      row.topTask = [...row.taskNames.values()][0] || "";
      row.status = _contractorStatus(row).key;
      return row;
    })
    .filter((row) => {
      if (q && !row.search.toLocaleLowerCase("uk-UA").includes(q)) return false;
      const statuses = multiFilterValues(contractorFilters.status);
      if (statuses.length) {
        const matchesStatus =
          (statuses.includes("debt") && row.rest > 0.5) ||
          (statuses.includes("paid") && row.budget > 0 && Math.abs(row.rest) <= 0.5) ||
          (statuses.includes("over") && row.rest < -0.5) ||
          (statuses.includes("unpaid") && row.budget > 0 && row.paid <= 0.5);
        if (!matchesStatus) return false;
      }
      return true;
    });

  rows.sort((a, b) => {
    const ap = _isPinnedContractorRow(a);
    const bp = _isPinnedContractorRow(b);
    if (ap !== bp) return ap ? -1 : 1;
    if (ap && bp) return _pinnedContractorRank(a) - _pinnedContractorRank(b);
    const col = contractorSort.col;
    const av = a[col] ?? "";
    const bv = b[col] ?? "";
    const cmp = typeof av === "string"
      ? av.localeCompare(String(bv), "uk")
      : (Number(av) || 0) - (Number(bv) || 0);
    return contractorSort.dir * cmp;
  });

  rows.forEach((row, index) => {
    row.rowNo = index + 1;
  });

  return rows;
}

function _isPinnedContractorRow(row) {
  return !!row?.isForecast || row?.key === _contractorKey(CONTRACTOR_EMPTY_NAME);
}

function _pinnedContractorRank(row) {
  if (row?.isForecast) return 0;
  if (row?.key === _contractorKey(CONTRACTOR_EMPTY_NAME)) return 1;
  return 2;
}

function _addTaskForecastRemainder(buckets, task, ti, costItems) {
  const taskBudget = +task.budget || 0;
  const taskPaid = +task.spent || 0;
  const assignedBudget = costItems.reduce((sum, item) => sum + _ctItemTotal(item), 0);
  const assignedPaid = costItems.reduce(
    (sum, item) => sum + (item.payments || []).reduce((pSum, p) => pSum + (+p.amount || 0), 0),
    0,
  );
  const forecastBudget = Math.max(0, taskBudget - assignedBudget);
  const unassignedPaid = Math.max(0, taskPaid - assignedPaid);
  if (forecastBudget <= 0.5 && unassignedPaid <= 0.5) return;

  const key = "__forecast_without_contractor__";
  const supplier = "Нерозподілений кошторис";
  const bucket = buckets.get(key) || {
    key,
    supplier,
    isForecast: true,
    budget: 0,
    paid: 0,
    rest: 0,
    tasks: new Set(),
    taskNames: new Map(),
    items: [],
    payments: [],
    lastPayment: "",
    search: " нерозподілений кошторис прогноз без контрагента",
  };

  bucket.budget += forecastBudget;
  bucket.paid += unassignedPaid;
  bucket.tasks.add(task.id || String(task.n));
  bucket.taskNames.set(task.id || String(task.n), task.name);
  bucket.items.push({
    ti,
    taskNo: task.n,
    taskName: task.name,
    itemName: "Плановий кошторис роботи",
    type: "forecast",
    budget: forecastBudget,
    paid: unassignedPaid,
  });
  bucket.search += ` ${task.name} ${task.n} ${forecastBudget} ${unassignedPaid}`;
  buckets.set(key, bucket);
}

function _contractorStatus(row) {
  if (row.rest < -0.5) return { key: "over", label: "Переплата" };
  if (row.budget > 0 && row.paid <= 0.5) return { key: "debt", label: "Без оплат" };
  if (row.budget > 0 && row.rest > 0.5) return { key: "debt", label: "Залишок" };
  if (row.budget > 0 && Math.abs(row.rest) <= 0.5) return { key: "paid", label: "Оплачено" };
  return { key: "empty", label: "Без сум" };
}

function sortContractors(col) {
  if (contractorSort.col === col) contractorSort.dir *= -1;
  else {
    contractorSort.col = col;
    contractorSort.dir = col === "supplier" || col === "lastPayment" || col === "status" ? 1 : -1;
  }
  renderContractors();
}

function sortContractorDetails(group, col) {
  const sort = contractorDetailSort[group] || { col, dir: 1 };
  if (sort.col === col) sort.dir *= -1;
  else {
    sort.col = col;
    sort.dir = col === "amount" || col === "budget" || col === "date" ? -1 : 1;
  }
  contractorDetailSort[group] = sort;
  renderContractors();
}

function startContractorColResize(event, col) {
  event.preventDefault();
  event.stopPropagation();
  const widths = _getContractorColWidths();
  _contractorResize = { col, startX: event.clientX, startW: widths[col] || CONTRACTOR_COL_DEFAULTS[col] || 100, widths };
  document.addEventListener("mousemove", _onContractorColResize);
  document.addEventListener("mouseup", _stopContractorColResize);
}

function _onContractorColResize(event) {
  if (!_contractorResize) return;
  const next = Math.max(52, _contractorResize.startW + event.clientX - _contractorResize.startX);
  _contractorResize.widths[_contractorResize.col] = next;
  const cols = contractorSelectionMode
    ? _getContractorColumns()
    : _getContractorColumns().filter(([key]) => key !== "select");
  const idx = cols.findIndex(([key]) => key === _contractorResize.col) + 1;
  if (idx > 0) {
    document.querySelectorAll(`#contractor-tbl col:nth-child(${idx})`).forEach((col) => {
      col.style.width = `${next}px`;
    });
  }
}

function _stopContractorColResize() {
  if (_contractorResize) _saveContractorColWidths(_contractorResize.widths);
  _contractorResize = null;
  document.removeEventListener("mousemove", _onContractorColResize);
  document.removeEventListener("mouseup", _stopContractorColResize);
}

function startContractorColDrag(event, col) {
  if (event.target?.closest?.(".contractor-col-resizer, input, button")) {
    event.preventDefault();
    return;
  }
  _contractorColDrag = col;
  event.dataTransfer?.setData("text/plain", col);
  event.dataTransfer?.setDragImage?.(event.currentTarget, 12, 12);
  event.currentTarget?.classList.add("contractor-col-dragging");
}

function dropContractorCol(event, targetCol) {
  event.preventDefault();
  const sourceCol = _contractorColDrag || event.dataTransfer?.getData("text/plain");
  if (!sourceCol || sourceCol === targetCol) return;
  const cols = _getContractorColumns();
  const from = cols.findIndex(([key]) => key === sourceCol);
  const to = cols.findIndex(([key]) => key === targetCol);
  if (from < 0 || to < 0) return;
  const [moved] = cols.splice(from, 1);
  cols.splice(to, 0, moved);
  _saveColumnOrder(CONTRACTOR_COL_ORDER_SK, cols);
  _contractorSuppressHeaderClick = true;
  setTimeout(() => { _contractorSuppressHeaderClick = false; }, 80);
  _contractorColDrag = null;
  renderContractors();
}

function endContractorColDrag() {
  _contractorColDrag = null;
  document.querySelectorAll(".contractor-col-dragging").forEach((el) => el.classList.remove("contractor-col-dragging"));
}

function toggleContractorDetails(key) {
  key = decodeURIComponent(key);
  if (contractorExpanded.has(key)) contractorExpanded.delete(key);
  else contractorExpanded.add(key);
  renderContractors();
}

function _encodeContractorPaymentPath(path) {
  return encodeURIComponent(JSON.stringify(path));
}

function _encodeContractorActPath(path) {
  return encodeURIComponent(JSON.stringify(path));
}

function _encodeContractorItemPath(path) {
  return encodeURIComponent(JSON.stringify(path));
}

function _decodeContractorPaymentPath(path) {
  try {
    return JSON.parse(decodeURIComponent(path || ""));
  } catch (_) {
    return null;
  }
}

function _decodeContractorActPath(path) {
  try {
    return JSON.parse(decodeURIComponent(path || ""));
  } catch (_) {
    return null;
  }
}

function _decodeContractorItemPath(path) {
  try {
    return JSON.parse(decodeURIComponent(path || ""));
  } catch (_) {
    return null;
  }
}

function _findContractorPayment(path) {
  const data = typeof path === "string" ? _decodeContractorPaymentPath(path) : path;
  if (!data) return null;
  const task = tasks[data.ti];
  if (!task) return null;
  const items = taskCostItems(task);
  const item = data.itemId !== undefined && data.itemId !== null
    ? items.find((it) => String(it.id) === String(data.itemId))
    : items.find((_, idx) => idx === data.itemIndex);
  if (!item || !Array.isArray(item.payments)) return null;
  const payment = data.payId !== undefined && data.payId !== null
    ? item.payments.find((p) => String(p.id) === String(data.payId))
    : item.payments[data.payIndex];
  if (!payment) return null;
  return { task, item, payment };
}

function _findContractorAct(path) {
  const data = typeof path === "string" ? _decodeContractorActPath(path) : path;
  if (!data) return null;
  const task = tasks[data.ti];
  if (!task) return null;
  const items = taskCostItems(task);
  const item = data.itemId !== undefined && data.itemId !== null
    ? items.find((it) => String(it.id) === String(data.itemId))
    : items.find((_, idx) => idx === data.itemIndex);
  if (!item || !Array.isArray(item.acts)) return null;
  const act = data.actId !== undefined && data.actId !== null
    ? item.acts.find((a) => String(a.id) === String(data.actId))
    : item.acts[data.actIndex];
  if (!act) return null;
  return { task, item, act };
}

function _findContractorItem(path) {
  const data = typeof path === "string" ? _decodeContractorItemPath(path) : path;
  if (!data) return null;
  const task = tasks[data.ti];
  if (!task) return null;
  const items = taskCostItems(task);
  const item = data.itemId !== undefined && data.itemId !== null
    ? items.find((it) => String(it.id) === String(data.itemId))
    : items.find((_, idx) => idx === data.itemIndex);
  return item ? { task, item, ti: data.ti, itemIndex: data.itemIndex } : null;
}

async function editContractor(key) {
  key = decodeURIComponent(key || "");
  const entry = _getAllContractorItems().find(({ item }) => _contractorKey(item.supplier) === key);
  if (!entry) return;
  openContractorEntryModal(entry.item.supplier, true);
}

function _contractorTaskOptions(selectedTi) {
  return tasks.map((task, ti) =>
    `<option value="${ti}"${ti === selectedTi ? " selected" : ""}>#${task.n} ${_ctEsc(task.name)}</option>`
  ).join("");
}

function addContractorEditRow() {
  const list = document.querySelector(".contractor-edit-list");
  if (!list) return;
  const index = document.querySelectorAll(".contractor-edit-row").length;
  const row = document.createElement("div");
  row.className = "contractor-edit-row";
  row.dataset.index = String(index);
  row.innerHTML = `
    <label>Робота<select class="ce-edit-task">${_contractorTaskOptions(0)}</select></label>
    <label>Позиція<input class="ce-edit-name"></label>
    <label>Номер договору<input class="ce-edit-contract-no"></label>
    <label>Дата договору<input class="ce-edit-contract-date" type="date" value="${new Date().toISOString().slice(0, 10)}"></label>
    <label>Сума договору<input class="ce-edit-price" type="number" step="0.01"></label>
    <button type="button" class="ce-edit-delete-btn" onclick="this.closest('.contractor-edit-row').classList.toggle('marked-delete')" title="Видалити">
      <i data-lucide="x"></i>
    </button>`;
  list.insertBefore(row, list.lastElementChild);
  lucide.createIcons({ nodes: [row] });
}

function _contractorTypeOptions(selectedType) {
  return Object.entries(COST_TYPES)
    .map(([key, cfg]) => `<option value="${key}"${key === selectedType ? " selected" : ""}>${_ctEsc(cfg.label || key)}</option>`)
    .join("");
}

function _contractorContractLabel(item) {
  const no = _ctText(item.contractNo) || "без номера";
  const date = _ctText(item.contractDate);
  return `${no}${date ? " від " + date : ""} · ${fmtM(Math.round(_ctItemTotal(item)))} грн`;
}

function _contractorContractAmountLabel(item) {
  return `<span class="contractor-contract-amount">${fmtM(Math.round(_ctItemTotal(item)))} грн</span>`;
}

function _contractorActLabel(act) {
  const no = _ctText(act.name) || "без номера";
  const type = CONTRACTOR_ACT_TYPES[act.type] || act.type || "Акт";
  return `${type} ${no}${act.date ? " від " + _ctDisplayDate(act.date) : ""} · ${fmtM(Math.round(+act.amount || 0))} грн`;
}

function _contractorContractsForSupplier(supplier, taskIndex = null) {
  const key = _contractorKey(supplier);
  const list = [];
  tasks.forEach((task, ti) => {
    if (taskIndex !== null && ti !== taskIndex) return;
    taskCostItems(task).forEach((item) => {
      if (_contractorKey(item.supplier) !== key) return;
      list.push({ task, ti, item });
    });
  });
  return list;
}

function _contractorFindContract(contractId, fallbackSupplier = "", taskIndex = null) {
  const contracts = _contractorContractsForSupplier(fallbackSupplier, taskIndex);
  return contracts.find(({ item }) => String(item.id) === String(contractId)) || contracts[0] || null;
}

function _contractorActOptions(item, selectedAct = "") {
  const acts = item?.acts || [];
  return `<option value="">Без акту</option>${acts
    .map((act) => `<option value="${_ctAttr(act.id || act.name)}"${String(selectedAct) === String(act.id || act.name) || selectedAct === act.name ? " selected" : ""}>${_ctEsc(_contractorActLabel(act))}</option>`)
    .join("")}`;
}

function syncPaymentEditActs(supplier, taskIndex = null) {
  const contractId = document.getElementById("pay-edit-contract")?.value;
  const found = _contractorFindContract(contractId, supplier, taskIndex);
  const actEl = document.getElementById("pay-edit-act");
  if (actEl) actEl.innerHTML = _contractorActOptions(found?.item || null);
}

async function deleteContractor(key) {
  key = decodeURIComponent(key || "");
  if (!key || key === _contractorKey(CONTRACTOR_EMPTY_NAME)) return;
  await _bulkDeleteContractors([key], "поточного контрагента");
}

function _getAllContractorItems() {
  const list = [];
  tasks.forEach((task, ti) => {
    taskCostItems(task).forEach((item, itemIndex) => list.push({ task, ti, item, itemIndex }));
  });
  return list;
}

async function editContractorPayment(path) {
  const found = _findContractorPayment(path);
  if (!found) return;
  const { task, item, payment } = found;
  const currentTi = tasks.indexOf(task);
  const currentName = _contractorName(item.supplier);
  const contracts = _contractorContractsForSupplier(currentName);
  const contractOptions = contracts
    .map(({ item: contract }) => `<option value="${_ctAttr(contract.id)}"${String(payment.contractId || item.id) === String(contract.id) ? " selected" : ""}>${_ctEsc(_contractorContractLabel(contract))}</option>`)
    .join("");
  const selectedContractItem = contracts.find(({ item: contract }) => String(payment.contractId || item.id) === String(contract.id))?.item || item;
  const result = await Swal.fire({
    title: `Редагувати платіж: ${_ctEsc(currentName)}`,
    width: 820,
    html: `
      <div class="swal-form-grid">
        <label class="swal-span-2">Договір
          <select id="pay-edit-contract" class="swal2-input contractor-contract-select" onchange="syncPaymentEditActs('${_ctAttr(currentName)}')">${contractOptions}</select>
        </label>
        <label>Дата платежу<input id="pay-edit-date" type="date" class="swal2-input" value="${_ctAttr(payment.date || "")}"></label>
        <label>Сума платежу<input id="pay-edit-amount" type="number" min="0" step="100" class="swal2-input" value="${_ctAttr(payment.amount || 0)}"></label>
        <label class="swal-span-2">Згідно акту<select id="pay-edit-act" class="swal2-input">${_contractorActOptions(selectedContractItem, payment.actId || payment.actNo)}</select></label>
        <label class="swal-span-2">Примітка<input id="pay-edit-note" class="swal2-input" value="${_ctAttr(payment.note || "")}"></label>
      </div>`,
    showCancelButton: true,
    confirmButtonText: "Зберегти",
    cancelButtonText: "Скасувати",
    preConfirm: () => {
      const amount = _ctAmount(document.getElementById("pay-edit-amount")?.value);
      if (amount === null || amount < 0) {
        Swal.showValidationMessage("Вкажіть коректну суму");
        return false;
      }
      return {
        ti: currentTi,
        supplier: currentName,
        contractId: document.getElementById("pay-edit-contract")?.value,
        date: _ctDate(document.getElementById("pay-edit-date")?.value),
        amount,
        type: "act",
        actSelect: document.getElementById("pay-edit-act")?.value || "",
        note: _ctText(document.getElementById("pay-edit-note")?.value),
      };
    },
  });
  if (!result.isConfirmed) return;
  const selectedContract = _contractorFindContract(result.value.contractId, result.value.supplier);
  const targetTask = selectedContract?.task || tasks[result.value.ti];
  if (!targetTask) return;
  const oldTask = task;
  if (!Array.isArray(targetTask.costItems)) targetTask.costItems = Array.isArray(targetTask.cost_items) ? targetTask.cost_items : [];
  delete targetTask.cost_items;

  const targetItem = selectedContract?.item || item;
  const sameItem = targetItem === item;

  if (!sameItem) {
    const oldIdx = item.payments.indexOf(payment);
    if (oldIdx >= 0) item.payments.splice(oldIdx, 1);
    if (!targetTask.costItems.includes(targetItem)) targetTask.costItems.push(targetItem);
    if (!Array.isArray(targetItem.payments)) targetItem.payments = [];
    targetItem.payments.push(payment);
  }

  const selectedAct = (targetItem.acts || []).find((act) => String(act.id || act.name) === String(result.value.actSelect));
  Object.assign(payment, {
    date: result.value.date,
    amount: result.value.amount,
    type: "act",
    contractId: targetItem.id,
    actId: selectedAct?.id || "",
    actNo: selectedAct?.name || "",
    note: result.value.note,
  });
  delete payment.ti;
  delete payment.supplier;
  _ctRecalcTaskTotals(oldTask);
  if (targetTask !== oldTask) _ctRecalcTaskTotals(targetTask);
  saveAll();
  render();
  renderContractors();
}

async function deleteContractorPayment(path) {
  const data = _decodeContractorPaymentPath(path);
  const found = _findContractorPayment(data);
  if (!found) return;
  const result = await Swal.fire({
    icon: "warning",
    title: "Видалити платіж?",
    showCancelButton: true,
    confirmButtonText: "Видалити",
    cancelButtonText: "Скасувати",
    confirmButtonColor: "#dc2626",
  });
  if (!result.isConfirmed) return;
  const idx = found.item.payments.indexOf(found.payment);
  if (idx >= 0) found.item.payments.splice(idx, 1);
  _ctRecalcTaskTotals(found.task);
  saveAll();
  render();
  renderContractors();
}

function resetContractorFilters() {
  contractorFilters = { ...contractorFilters, status: [], type: [], cat: [] };
  renderContractors();
}

function _hasContractorFilters() {
  return !!(
    multiFilterValues(contractorFilters.status).length ||
    multiFilterValues(contractorFilters.type).length ||
    multiFilterValues(contractorFilters.cat).length
  );
}

function _isBulkDeleteBlockedKey(key) {
  return !key || key === _contractorKey(CONTRACTOR_EMPTY_NAME) || key === "__forecast_without_contractor__";
}

function _selectedContractorKeys() {
  return Array.from(contractorSelected).filter((key) => !_isBulkDeleteBlockedKey(key));
}

function _visibleDeletableContractorRows() {
  return _getContractorRows().filter((row) => !_isBulkDeleteBlockedKey(row.key) && !row.isForecast);
}

function _syncContractorSelectionHeader(rows = null) {
  const checkbox = document.getElementById("contractor-select-all");
  if (!checkbox) return;
  const visibleKeys = (rows || _getContractorRows())
    .filter((row) => !_isBulkDeleteBlockedKey(row.key) && !row.isForecast)
    .map((row) => row.key);
  const selectedVisible = visibleKeys.filter((key) => contractorSelected.has(key)).length;
  checkbox.checked = !!visibleKeys.length && selectedVisible === visibleKeys.length;
  checkbox.indeterminate = selectedVisible > 0 && selectedVisible < visibleKeys.length;
}

function toggleContractorSelection(key, checked) {
  key = decodeURIComponent(key || "");
  if (!key || _isBulkDeleteBlockedKey(key)) return;
  if (checked) contractorSelected.add(key);
  else contractorSelected.delete(key);
  renderContractors();
}

function toggleAllVisibleContractors(checked) {
  _visibleDeletableContractorRows().forEach((row) => {
    if (checked) contractorSelected.add(row.key);
    else contractorSelected.delete(row.key);
  });
  renderContractors();
}

function toggleContractorSelectionMode(force) {
  contractorSelectionMode = typeof force === "boolean" ? force : !contractorSelectionMode;
  if (!contractorSelectionMode && !contractorSelected.size) contractorSelected.clear();
  renderContractors();
}

function clearContractorSelection() {
  if (!contractorSelected.size) return;
  contractorSelected.clear();
  contractorSelectionMode = false;
  renderContractors();
}

async function deleteSelectedContractors() {
  const keys = _selectedContractorKeys();
  if (!keys.length) {
    Swal.fire({ icon: "info", title: "Немає вибраних контрагентів" });
    return;
  }
  await _bulkDeleteContractors(keys, "вибраних контрагентів");
}

async function deleteVisibleContractors() {
  const keys = _visibleDeletableContractorRows().map((row) => row.key);
  if (!keys.length) {
    Swal.fire({ icon: "info", title: "Немає контрагентів для видалення" });
    return;
  }
  await _bulkDeleteContractors(keys, "усіх контрагентів за поточним фільтром");
}

async function _bulkDeleteContractors(keys, scopeLabel) {
  const uniqueKeys = Array.from(new Set(keys)).filter((key) => !_isBulkDeleteBlockedKey(key));
  if (!uniqueKeys.length) return;

  const rows = _getContractorRows().filter((row) => uniqueKeys.includes(row.key));
  const summary = rows.reduce((acc, row) => {
    acc.contractors += 1;
    acc.items += row.itemsCount || 0;
    acc.payments += row.paymentsCount || 0;
    acc.acts += (row.acts || []).length || 0;
    return acc;
  }, { contractors: 0, items: 0, payments: 0, acts: 0 });

  const confirmOne = await Swal.fire({
    icon: "warning",
    title: "Підтвердьте видалення",
    html: `
      <div style="text-align:left">
        Буде видалено <b>${summary.contractors}</b> контрагентів.<br>
        Позицій: <b>${summary.items}</b><br>
        Платежів: <b>${summary.payments}</b><br>
        Актів: <b>${summary.acts}</b><br><br>
        Сценарій: <b>${_ctEsc(scopeLabel)}</b>
      </div>`,
    showCancelButton: true,
    confirmButtonText: "Продовжити",
    cancelButtonText: "Скасувати",
    confirmButtonColor: "#dc2626",
  });
  if (!confirmOne.isConfirmed) return;

  const confirmTwo = await Swal.fire({
    icon: "warning",
    title: "Фінальне підтвердження",
    input: "text",
    inputLabel: 'Введіть "ВИДАЛИТИ", щоб остаточно підтвердити',
    showCancelButton: true,
    confirmButtonText: "Видалити",
    cancelButtonText: "Скасувати",
    confirmButtonColor: "#dc2626",
    preConfirm: (value) => {
      if (String(value || "").trim().toUpperCase() !== "ВИДАЛИТИ") {
        Swal.showValidationMessage('Введіть слово "ВИДАЛИТИ"');
        return false;
      }
      return true;
    },
  });
  if (!confirmTwo.isConfirmed) return;

  tasks.forEach((task) => {
    const items = taskCostItems(task);
    if (!items.length) return;
    task.costItems = items.filter((item) => !uniqueKeys.includes(_contractorKey(item.supplier)));
    delete task.cost_items;
    _ctRecalcTaskTotals(task);
  });

  uniqueKeys.forEach((key) => {
    contractorExpanded.delete(key);
    contractorSelected.delete(key);
  });

  saveAll();
  render();
  renderContractors();
}

function openContractorTask(ti) {
  openCostModal(ti);
}

async function openContractorActModal(prefillSupplier = "", contractPath = "") {
  const pathContract = contractPath ? _findContractorItem(contractPath) : null;
  const supplier = pathContract ? _contractorName(pathContract.item.supplier) : decodeURIComponent(prefillSupplier || "");
  const contracts = pathContract ? [{ task: pathContract.task, ti: pathContract.ti, item: pathContract.item }] : _contractorContractsForSupplier(supplier);
  if (!contracts.length) {
    Swal.fire({ icon: "info", title: "Немає договорів", text: "Спочатку додайте договір для цього контрагента." });
    return;
  }
  const initialItemName = pathContract?.item?.name || contracts[0]?.item?.name || "";
  const result = await Swal.fire({
    title: `Додати акт: ${_ctEsc(supplier)}`,
    width: 760,
    html: `
      <div class="swal-form-grid">
        <label class="swal-span-2">Договір
          <select id="act-contract" class="swal2-input">
            ${contracts.map(({ item }) => `<option value="${_ctAttr(item.id)}"${pathContract && String(pathContract.item.id) === String(item.id) ? " selected" : ""}>${_ctEsc(_contractorContractLabel(item))}</option>`).join("")}
          </select>
        </label>
        <label>Тип акту<select id="act-type" class="swal2-input">
          ${Object.entries(CONTRACTOR_ACT_TYPES).map(([key, label]) => `<option value="${key}">${label}</option>`).join("")}
        </select></label>
        <label>Номер акту<input id="act-name" class="swal2-input" placeholder="Акт №"></label>
        <label>Дата акту<input id="act-date" type="date" class="swal2-input" value="${new Date().toISOString().slice(0, 10)}"></label>
        <label>Сума акту<input id="act-amount" type="number" min="0" step="100" class="swal2-input"></label>
        <label class="swal-span-2">Опис товару/послуги<input id="act-item-name" class="swal2-input" value="${_ctAttr(initialItemName)}"></label>
        <label class="swal-span-2">Примітка<input id="act-note" class="swal2-input"></label>
      </div>`,
    showCancelButton: true,
    confirmButtonText: "Зберегти",
    cancelButtonText: "Скасувати",
    didOpen: () => {
      const contractSelect = document.getElementById("act-contract");
      const itemNameInput = document.getElementById("act-item-name");
      contractSelect?.addEventListener("change", () => {
        const selected = contracts.find(({ item }) => String(item.id) === String(contractSelect.value));
        if (itemNameInput && selected?.item?.name) itemNameInput.value = selected.item.name;
      });
    },
    preConfirm: () => {
      const amount = _ctAmount(document.getElementById("act-amount")?.value);
      const name = _ctText(document.getElementById("act-name")?.value);
      if (!name) {
        Swal.showValidationMessage("Вкажіть номер акту");
        return false;
      }
      if (amount === null || amount <= 0) {
        Swal.showValidationMessage("Вкажіть суму акту");
        return false;
      }
      return {
        contractId: document.getElementById("act-contract")?.value,
        type: document.getElementById("act-type")?.value || "contract",
        name,
        date: _ctDate(document.getElementById("act-date")?.value),
        amount,
        itemName: _ctText(document.getElementById("act-item-name")?.value),
        note: _ctText(document.getElementById("act-note")?.value),
      };
    },
  });
  if (!result.isConfirmed) return;

  const found = _contractorFindContract(result.value.contractId, supplier);
  const item = found?.item;
  if (!item) return;
  if (!Array.isArray(item.acts)) item.acts = [];
  if (!Array.isArray(item.payments)) item.payments = [];
  item.acts.push({
    id: typeof _nextCostId === "function" ? _nextCostId() : Date.now() + Math.floor(Math.random() * 1000),
    type: result.value.type,
    name: result.value.name,
    date: result.value.date,
    amount: result.value.amount,
    itemName: result.value.itemName,
    note: result.value.note,
  });
  _ctRecalcTaskTotals(found.task);
  saveAll();
  render();
  renderContractors();
}

async function editContractorAct(path) {
  const found = _findContractorAct(path);
  if (!found) return;
  const { task, item, act } = found;
  const supplier = _contractorName(item.supplier);
  const contracts = _contractorContractsForSupplier(supplier);
  const result = await Swal.fire({
    title: `Редагувати акт: ${_ctEsc(supplier)}`,
    width: 760,
    html: `
      <div class="swal-form-grid">
        <label class="swal-span-2">Договір
          <select id="act-edit-contract" class="swal2-input">
            ${contracts.map(({ item: contract }) => `<option value="${_ctAttr(contract.id)}"${String(contract.id) === String(item.id) ? " selected" : ""}>${_ctEsc(_contractorContractLabel(contract))}</option>`).join("")}
          </select>
        </label>
        <label>Тип акту<select id="act-edit-type" class="swal2-input">
          ${Object.entries(CONTRACTOR_ACT_TYPES).map(([key, label]) => `<option value="${key}"${(act.type || "contract") === key ? " selected" : ""}>${label}</option>`).join("")}
        </select></label>
        <label>Номер акту<input id="act-edit-name" class="swal2-input" value="${_ctAttr(act.name || "")}"></label>
        <label>Дата акту<input id="act-edit-date" type="date" class="swal2-input" value="${_ctAttr(act.date || "")}"></label>
        <label>Сума акту<input id="act-edit-amount" type="number" min="0" step="100" class="swal2-input" value="${_ctAttr(act.amount || 0)}"></label>
        <label class="swal-span-2">Опис товару/послуги<input id="act-edit-item-name" class="swal2-input" value="${_ctAttr(act.itemName || act.description || item.name || "")}"></label>
        <label class="swal-span-2">Примітка<input id="act-edit-note" class="swal2-input" value="${_ctAttr(act.note || "")}"></label>
      </div>`,
    showCancelButton: true,
    confirmButtonText: "Зберегти",
    cancelButtonText: "Скасувати",
    preConfirm: () => {
      const amount = _ctAmount(document.getElementById("act-edit-amount")?.value);
      const name = _ctText(document.getElementById("act-edit-name")?.value);
      if (!name) {
        Swal.showValidationMessage("Вкажіть номер акту");
        return false;
      }
      if (amount === null || amount <= 0) {
        Swal.showValidationMessage("Вкажіть суму акту");
        return false;
      }
      return {
        contractId: document.getElementById("act-edit-contract")?.value,
        type: document.getElementById("act-edit-type")?.value || "contract",
        name,
        date: _ctDate(document.getElementById("act-edit-date")?.value),
        amount,
        itemName: _ctText(document.getElementById("act-edit-item-name")?.value),
        note: _ctText(document.getElementById("act-edit-note")?.value),
      };
    },
  });
  if (!result.isConfirmed) return;
  const target = _contractorFindContract(result.value.contractId, supplier);
  const targetItem = target?.item || item;
  if (targetItem !== item) {
    const idx = item.acts.indexOf(act);
    if (idx >= 0) item.acts.splice(idx, 1);
    if (!Array.isArray(targetItem.acts)) targetItem.acts = [];
    targetItem.acts.push(act);
  }
  Object.assign(act, result.value);
  delete act.contractId;
  (targetItem.payments || []).forEach((payment) => {
    if (String(payment.actId) === String(act.id)) payment.actNo = act.name;
  });
  _ctRecalcTaskTotals(task);
  if (target?.task && target.task !== task) _ctRecalcTaskTotals(target.task);
  saveAll();
  render();
  renderContractors();
}

async function deleteContractorAct(path) {
  const found = _findContractorAct(path);
  if (!found) return;
  const result = await Swal.fire({
    icon: "warning",
    title: "Видалити акт?",
    showCancelButton: true,
    confirmButtonText: "Видалити",
    cancelButtonText: "Скасувати",
    confirmButtonColor: "#dc2626",
  });
  if (!result.isConfirmed) return;
  const idx = found.item.acts.indexOf(found.act);
  if (idx >= 0) found.item.acts.splice(idx, 1);
  (found.item.payments || []).forEach((payment) => {
    if (String(payment.actId) === String(found.act.id)) {
      payment.actId = "";
      payment.actNo = "";
    }
  });
  _ctRecalcTaskTotals(found.task);
  saveAll();
  render();
  renderContractors();
}

async function openContractorPaymentModal(contractPath = "", actPath = "") {
  const actEntry = actPath ? _findContractorAct(actPath) : null;
  const contractEntry = actEntry ? { task: actEntry.task, item: actEntry.item, ti: tasks.indexOf(actEntry.task) } : _findContractorItem(contractPath);
  if (!contractEntry?.item) return;

  const supplier = _contractorName(contractEntry.item.supplier);
  const contracts = _contractorContractsForSupplier(supplier);
  const selectedId = contractEntry.item.id;
  const selectedAct = actEntry?.act || null;

  const result = await Swal.fire({
    title: `Додати платіж: ${_ctEsc(supplier)}`,
    width: 760,
    html: `
      <div class="swal-form-grid">
        <label class="swal-span-2">Договір
          <select id="pay-add-contract" class="swal2-input contractor-contract-select" onchange="syncPaymentAddActs('${_ctAttr(supplier)}')">
            ${contracts.map(({ item }) => `<option value="${_ctAttr(item.id)}"${String(selectedId) === String(item.id) ? " selected" : ""}>${_ctEsc(_contractorContractLabel(item))}</option>`).join("")}
          </select>
        </label>
        <label>Дата платежу<input id="pay-add-date" type="date" class="swal2-input" value="${new Date().toISOString().slice(0, 10)}"></label>
        <label>Сума платежу<input id="pay-add-amount" type="number" min="0" step="100" class="swal2-input"></label>
        <label class="swal-span-2">Згідно акту<select id="pay-add-act" class="swal2-input">${_contractorActOptions(contractEntry.item, selectedAct?.id || selectedAct?.name || "")}</select></label>
        <label class="swal-span-2">Примітка<input id="pay-add-note" class="swal2-input"></label>
      </div>`,
    showCancelButton: true,
    confirmButtonText: "Зберегти",
    cancelButtonText: "Скасувати",
    preConfirm: () => {
      const amount = _ctAmount(document.getElementById("pay-add-amount")?.value);
      if (amount === null || amount <= 0) {
        Swal.showValidationMessage("Вкажіть суму платежу");
        return false;
      }
      return {
        contractId: document.getElementById("pay-add-contract")?.value,
        actSelect: document.getElementById("pay-add-act")?.value || "",
        date: _ctDate(document.getElementById("pay-add-date")?.value),
        amount,
        note: _ctText(document.getElementById("pay-add-note")?.value),
      };
    },
  });
  if (!result.isConfirmed) return;

  const target = _contractorFindContract(result.value.contractId, supplier);
  const item = target?.item;
  if (!item) return;
  if (!Array.isArray(item.payments)) item.payments = [];
  const selected = (item.acts || []).find((act) => String(act.id || act.name) === String(result.value.actSelect));
  item.payments.push({
    id: typeof _nextCostId === "function" ? _nextCostId() : Date.now() + Math.floor(Math.random() * 1000),
    date: result.value.date,
    type: "act",
    amount: result.value.amount,
    contractId: item.id,
    actId: selected?.id || "",
    actNo: selected?.name || "",
    note: result.value.note,
  });
  _ctRecalcTaskTotals(target.task);
  saveAll();
  render();
  renderContractors();
}

function syncPaymentAddActs(supplier) {
  const contractId = document.getElementById("pay-add-contract")?.value;
  const found = _contractorFindContract(contractId, supplier);
  const actEl = document.getElementById("pay-add-act");
  if (actEl) actEl.innerHTML = _contractorActOptions(found?.item || null);
}

function openContractorEntryModal(prefillSupplier = "", lockSupplier = false) {
  prefillSupplier = decodeURIComponent(prefillSupplier || "");
  _contractorEntryEditPath = null;
  if (typeof canEdit === "function" && !canEdit()) {
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "warning",
      title: "У вас немає прав на редагування",
      showConfirmButton: false,
      timer: 3200,
    });
    return;
  }

  if (!tasks.length) {
    Swal.fire({ icon: "info", title: "Немає робіт", text: "Спочатку додайте роботу на графіку." });
    return;
  }

  const modal = document.getElementById("contractor-entry-modal");
  if (!modal) return;

  const supplierEl = document.getElementById("ce-supplier");
  const supplier = prefillSupplier;
  _contractorEntryOriginalKey = _contractorKey(supplier);

  if (supplierEl) supplierEl.value = supplier;
  if (supplierEl) {
    supplierEl.readOnly = !!lockSupplier;
    supplierEl.classList.toggle("contractor-entry-locked", !!lockSupplier);
    supplierEl.title = lockSupplier ? "Контрагент зафіксований для цього рядка" : "";
    supplierEl.oninput = null;
  }

  renderContractorContractManagerRows();
  modal.style.display = "flex";
  lucide.createIcons({ nodes: [modal] });
  setTimeout(() => supplierEl?.focus(), 50);
}

function closeContractorEntryModal() {
  const modal = document.getElementById("contractor-entry-modal");
  if (modal) modal.style.display = "none";
  _contractorEntryEditPath = null;
  _contractorEntryOriginalKey = "";
}

function renderContractorContractManagerRows() {
  const list = document.getElementById("ce-contract-list");
  if (!list) return;
  const supplier = _ctText(document.getElementById("ce-supplier")?.value);
  const contracts = supplier ? _contractorContractsForSupplier(supplier) : [];
  const rows = contracts.map(({ task, ti, item, itemIndex }) => _contractorContractEditRow({
    path: _encodeContractorItemPath({ ti, itemId: item.id, itemIndex }),
    ti,
    no: item.contractNo || "",
    date: item.contractDate || "",
    amount: _ctItemTotal(item) || 0,
    note: item.contractNote || item.note || "",
  }));
  list.innerHTML = rows.join("") || _contractorContractEditRow({ ti: 0 });
  lucide.createIcons({ nodes: [list] });
}

function _contractorContractEditRow({ path = "", ti = 0, no = "", date = "", amount = "", note = "" } = {}) {
  return `<div class="contractor-contract-row" data-path="${_ctAttr(path)}" data-ti="${ti}">
    <label>Робота<select class="ce-contract-task">${_contractorTaskOptions(ti)}</select></label>
    <label>Номер договору<input class="ce-contract-no" value="${_ctAttr(no)}" placeholder="Договір №"></label>
    <label>Дата<input class="ce-contract-date" type="date" value="${_ctAttr(date)}"></label>
    <label>Сума<input class="ce-contract-amount" type="number" min="0" step="100" value="${_ctAttr(amount || "")}" placeholder="0"></label>
    <label>Примітка<input class="ce-contract-note" value="${_ctAttr(note)}" placeholder="Примітка до договору"></label>
    <button type="button" class="btn btn-sm contractor-row-action danger" onclick="this.closest('.contractor-contract-row').classList.toggle('marked-delete')" title="Видалити">
      <i data-lucide="trash-2"></i>
    </button>
  </div>`;
}

function addContractorContractRow() {
  const list = document.getElementById("ce-contract-list");
  if (!list) return;
  const supplier = _ctText(document.getElementById("ce-supplier")?.value);
  const base = supplier ? _contractorContractsForSupplier(supplier)[0] : null;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = _contractorContractEditRow({ ti: base?.ti || 0, date: new Date().toISOString().slice(0, 10) });
  const row = wrapper.firstElementChild;
  list.appendChild(row);
  lucide.createIcons({ nodes: [row] });
  row.querySelector(".ce-contract-no")?.focus();
}

function saveContractorEntry() {
  if (typeof canEdit === "function" && !canEdit()) return;

  const supplier = _ctText(document.getElementById("ce-supplier")?.value);
  if (!supplier) {
    Swal.fire({ icon: "warning", title: "Вкажіть контрагента" });
    return;
  }

  const rows = [...document.querySelectorAll("#ce-contract-list .contractor-contract-row")];
  if (!rows.length) {
    Swal.fire({ icon: "warning", title: "Додайте договір" });
    return;
  }

  const touched = new Set();
  const sourceContracts = _contractorEntryOriginalKey
    ? _getAllContractorItems().filter(({ item }) => _contractorKey(item.supplier) === _contractorEntryOriginalKey)
    : [];
  const fallbackTask = sourceContracts[0]?.task || tasks[0];

  for (const row of rows) {
    const path = row.dataset.path || "";
    const amount = _ctAmount(row.querySelector(".ce-contract-amount")?.value);
    const no = _ctText(row.querySelector(".ce-contract-no")?.value);
    const date = _ctDate(row.querySelector(".ce-contract-date")?.value);
    const note = _ctText(row.querySelector(".ce-contract-note")?.value);
    const selectedTi = Number(row.querySelector(".ce-contract-task")?.value);
    const existing = path ? _findContractorItem(path) : null;

    if (row.classList.contains("marked-delete")) {
      if (existing) {
        existing.task.costItems = taskCostItems(existing.task).filter((candidate) => candidate !== existing.item);
        delete existing.task.cost_items;
        touched.add(existing.task);
      }
      continue;
    }

    if (amount === null || amount <= 0) {
      Swal.fire({ icon: "warning", title: "Вкажіть суму договору" });
      return;
    }

    const task = tasks[Number.isFinite(selectedTi) ? selectedTi : Number(row.dataset.ti)] || existing?.task || fallbackTask;
    if (!task) continue;
    if (!Array.isArray(task.costItems)) task.costItems = Array.isArray(task.cost_items) ? task.cost_items : [];
    delete task.cost_items;

    if (existing && existing.task !== task) {
      existing.task.costItems = taskCostItems(existing.task).filter((candidate) => candidate !== existing.item);
      delete existing.task.cost_items;
      touched.add(existing.task);
    }

    const item = existing?.item || {
      id: typeof _nextCostId === "function" ? _nextCostId() : Date.now() + Math.floor(Math.random() * 1000),
      payments: [],
      acts: [],
    };
    Object.assign(item, {
      type: item.type || "work",
      name: no ? `Договір ${no}` : "Договір",
      supplier,
      unit: "договір",
      qty: 1,
      unitPrice: amount,
      contractNo: no,
      contractDate: date,
      contractNote: note,
      note,
    });
    if (!Array.isArray(item.payments)) item.payments = [];
    if (!Array.isArray(item.acts)) item.acts = [];
    if (!task.costItems.includes(item)) task.costItems.push(item);
    touched.add(task);
  }

  touched.forEach((task) => _ctRecalcTaskTotals(task));
  contractorExpanded.delete(_contractorEntryOriginalKey);
  contractorExpanded.add(_contractorKey(supplier));
  closeContractorEntryModal();
  saveAll();
  render();
  renderContractors();
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title: "Контрагента оновлено",
    showConfirmButton: false,
    timer: 2200,
  });
}

function _ensurePaymentRegisters() {
  if (!Array.isArray(proj.paymentRegisters)) proj.paymentRegisters = [];
  return proj.paymentRegisters;
}

function _paymentRegisterRowsFromFilters() {
  return _getContractorRows()
    .filter((row) => !row.isForecast)
    .flatMap((row) => row.payments.map((payment) => ({
      supplier: row.supplier,
      date: payment.date || "",
      amount: +payment.amount || 0,
      type: PAYMENT_TYPES[payment.type] || payment.type || "Інше",
      taskNo: payment.taskNo,
      taskName: payment.taskName,
      itemName: payment.itemName,
      note: payment.note || "",
    })))
    .sort((a, b) => (a.date || "").localeCompare(b.date || "") || a.supplier.localeCompare(b.supplier, "uk"));
}

function _paymentRegisterTotal(rows) {
  return rows.reduce((sum, row) => sum + (+row.amount || 0), 0);
}

function _paymentRegisterFiltersLabel() {
  const parts = [];
  if (contractorFilters.q) parts.push(`пошук: ${contractorFilters.q}`);
  const statuses = multiFilterValues(contractorFilters.status);
  if (statuses.length) parts.push(`статус: ${statuses.join(", ")}`);
  const types = multiFilterValues(contractorFilters.type);
  if (types.length) parts.push(`тип: ${types.map((type) => COST_TYPES?.[type]?.label || type).join(", ")}`);
  const catValues = multiFilterValues(contractorFilters.cat);
  if (catValues.length) parts.push(`категорія: ${catValues.map((cat) => CN(+cat)).join(", ")}`);
  return parts.join("; ") || "усі платежі";
}

function openPaymentRegisterModal() {
  _ensurePaymentRegisters();
  const modal = document.getElementById("payment-register-modal");
  if (!modal) return;
  modal.style.display = "flex";
  renderPaymentRegisterModal();
}

function closePaymentRegisterModal() {
  const modal = document.getElementById("payment-register-modal");
  if (modal) modal.style.display = "none";
}

function renderPaymentRegisterModal() {
  const currentEl = document.getElementById("payment-register-current");
  const listEl = document.getElementById("payment-register-list");
  if (!currentEl || !listEl) return;

  const currentRows = _paymentRegisterRowsFromFilters();
  const currentTotal = _paymentRegisterTotal(currentRows);
  currentEl.innerHTML = `
    <div class="payment-register-current-card">
      <div><b>Поточний фільтр:</b> ${_ctEsc(_paymentRegisterFiltersLabel())}</div>
      <div><b>Платежів:</b> ${currentRows.length}</div>
      <div><b>Сума:</b> ${fmtM(Math.round(currentTotal))}</div>
    </div>`;

  const registers = _ensurePaymentRegisters();
  if (!registers.length) {
    listEl.innerHTML = `<div class="contractor-empty">Збережених реєстрів ще немає</div>`;
  } else {
    listEl.innerHTML = registers
      .map((register) => `
        <div class="payment-register-item">
          <div class="payment-register-info">
            <b>${_ctEsc(register.name)}</b>
            <span>${_ctEsc(register.createdAt || "")} · ${register.rows?.length || 0} платежів · ${fmtM(Math.round(register.total || 0))}</span>
            <small>${_ctEsc(register.filtersLabel || "")}</small>
          </div>
          <div class="payment-register-row-actions">
            <button class="btn btn-sm" onclick="printPaymentRegister('${_ctAttr(register.id)}')"><i data-lucide="printer"></i></button>
            <button class="btn btn-sm" onclick="exportPaymentRegister('${_ctAttr(register.id)}','xlsx')">XLSX</button>
            <button class="btn btn-sm" onclick="exportPaymentRegister('${_ctAttr(register.id)}','csv')">CSV</button>
            <button class="btn btn-sm btn-danger" onclick="deletePaymentRegister('${_ctAttr(register.id)}')"><i data-lucide="trash-2"></i></button>
          </div>
        </div>`)
      .join("");
  }
  lucide.createIcons({ nodes: [document.getElementById("payment-register-modal")] });
}

async function createPaymentRegisterFromFilters() {
  const rows = _paymentRegisterRowsFromFilters();
  if (!rows.length) {
    Swal.fire({ icon: "info", title: "Немає платежів", text: "Поточний фільтр не містить платежів для реєстру." });
    return;
  }
  const suggested = `Реєстр платежів ${new Date().toLocaleDateString("uk-UA")}`;
  const result = await Swal.fire({
    icon: "question",
    title: "Назва реєстру",
    input: "text",
    inputValue: suggested,
    showCancelButton: true,
    confirmButtonText: "Зберегти",
    cancelButtonText: "Скасувати",
    inputValidator: (value) => (!_ctText(value) ? "Вкажіть назву реєстру" : null),
  });
  if (!result.isConfirmed) return;

  _ensurePaymentRegisters().unshift({
    id: typeof genId === "function" ? genId() : `reg_${Date.now()}`,
    name: _ctText(result.value) || suggested,
    createdAt: new Date().toLocaleString("uk-UA"),
    filters: { ...contractorFilters },
    filtersLabel: _paymentRegisterFiltersLabel(),
    total: _paymentRegisterTotal(rows),
    rows,
  });
  saveAll();
  renderPaymentRegisterModal();
}

function _findPaymentRegister(id) {
  return _ensurePaymentRegisters().find((register) => String(register.id) === String(id));
}

function exportCurrentPaymentRegister(type) {
  const rows = _paymentRegisterRowsFromFilters();
  _exportPaymentRegisterRows(`Поточний реєстр платежів`, rows, type);
}

function exportPaymentRegister(id, type) {
  const register = _findPaymentRegister(id);
  if (!register) return;
  _exportPaymentRegisterRows(register.name, register.rows || [], type);
}

function _paymentRegisterAoA(rows) {
  return [
    ["Дата", "Контрагент", "Сума", "Тип", "Робота", "Опис роботи/товару", "Примітка"],
    ...rows.map((row) => [
      row.date,
      row.supplier,
      row.amount,
      row.type,
      `#${row.taskNo} ${row.taskName}`,
      row.itemName,
      row.note,
    ]),
  ];
}

function _exportPaymentRegisterRows(name, rows, type) {
  if (!rows.length) {
    Swal.fire({ icon: "info", title: "Немає платежів для експорту" });
    return;
  }
  const fileBase = `${name}`.replace(/[\\/:*?"<>|]+/g, "_");
  if (type === "xlsx" && typeof XLSX !== "undefined") {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(_paymentRegisterAoA(rows));
    ws["!cols"] = [{ wch: 12 }, { wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 34 }, { wch: 30 }, { wch: 34 }];
    XLSX.utils.book_append_sheet(wb, ws, "Реєстр");
    XLSX.writeFile(wb, `${fileBase}.xlsx`);
    return;
  }
  const csv = _paymentRegisterAoA(rows)
    .map((line) => line.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  dl(`${fileBase}.csv`, "\ufeff" + csv, "text/csv;charset=utf-8");
}

function printCurrentPaymentRegister() {
  _printPaymentRegisterRows("Поточний реєстр платежів", _paymentRegisterRowsFromFilters(), _paymentRegisterFiltersLabel());
}

function printPaymentRegister(id) {
  const register = _findPaymentRegister(id);
  if (!register) return;
  _printPaymentRegisterRows(register.name, register.rows || [], register.filtersLabel || "");
}

function _printPaymentRegisterRows(name, rows, subtitle = "") {
  if (!rows.length) {
    Swal.fire({ icon: "info", title: "Немає платежів для друку" });
    return;
  }
  const total = _paymentRegisterTotal(rows);
  const body = rows.map((row) => `
    <tr>
      <td>${_ctEsc(_ctDisplayDate(row.date))}</td>
      <td>${_ctEsc(row.supplier)}</td>
      <td class="num">${fmtM(Math.round(row.amount))}</td>
      <td>${_ctEsc(row.type)}</td>
      <td>#${row.taskNo} ${_ctEsc(row.taskName)}</td>
      <td>${_ctEsc(row.itemName)}</td>
      <td>${_ctEsc(row.note)}</td>
    </tr>`).join("");
  const win = window.open("", "_blank");
  if (!win) {
    Swal.fire({ icon: "warning", title: "Браузер заблокував друк", text: "Дозвольте спливаюче вікно для друку реєстру." });
    return;
  }
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${_ctEsc(name)}</title>
    <style>
      body{font-family:Arial,sans-serif;color:#111;margin:24px}
      h1{font-size:20px;margin:0 0 4px}
      .meta{color:#555;margin-bottom:14px;font-size:12px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{border:1px solid #ccc;padding:6px;text-align:left;vertical-align:top}
      th{background:#f2f2f2}
      .num{text-align:right;white-space:nowrap}
      tfoot td{font-weight:700}
    </style></head><body>
    <h1>${_ctEsc(name)}</h1>
    <div class="meta">${_ctEsc(subtitle)} · ${new Date().toLocaleString("uk-UA")}</div>
    <table><thead><tr><th>Дата</th><th>Контрагент</th><th>Сума</th><th>Тип</th><th>Робота</th><th>Опис товару/послуги</th><th>Примітка</th></tr></thead>
    <tbody>${body}</tbody>
    <tfoot><tr><td colspan="2">Разом</td><td class="num">${fmtM(Math.round(total))}</td><td colspan="4"></td></tr></tfoot></table>
    <script>window.print();</script></body></html>`);
  win.document.close();
}

async function deletePaymentRegister(id) {
  const register = _findPaymentRegister(id);
  if (!register) return;
  const result = await Swal.fire({
    icon: "warning",
    title: "Видалити реєстр?",
    text: register.name,
    showCancelButton: true,
    confirmButtonText: "Видалити",
    cancelButtonText: "Скасувати",
    confirmButtonColor: "#dc2626",
  });
  if (!result.isConfirmed) return;
  proj.paymentRegisters = _ensurePaymentRegisters().filter((item) => item.id !== id);
  saveAll();
  renderPaymentRegisterModal();
}

function exportContractorImportTemplate() {
  const rows = [
    CONTRACTOR_IMPORT_HEADERS,
    ["#1 Фундамент", "ТОВ Будмонтаж", "Договір 01", 250000, "Монолітні роботи", "Акт 1", "2026-05-10", 100000, "Передоплата"],
    ["#1 Фундамент", "ТОВ Будмонтаж", "Договір 01", 250000, "Монолітні роботи", "", "2026-05-24", 150000, "Закриття етапу"],
  ];

  if (typeof XLSX === "undefined") {
    dl("contractors-payments-template.csv", rows.map((r) => r.join(";")).join("\n"), "text/csv;charset=utf-8");
    return;
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 28 }, { wch: 24 }, { wch: 18 }, { wch: 14 }, { wch: 28 }, { wch: 14 }, { wch: 13 }, { wch: 13 }, { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Імпорт");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(_contractorImportFormatRows()), "Формати");
  XLSX.writeFile(wb, "contractors-payments-template.xlsx");
}

function _contractorImportFormatRows() {
  return [
    ["Поле", "Допустимий формат", "Приклади"],
    ["Суми", "Число; пробіли, крапка або кома можуть бути розділювачами тисяч/копійок", "100000 | 100 000 | 100000,50 | 1.234,56 | 1,234.56 | 12 345 грн"],
    ["Дати", "YYYY-MM-DD або DD.MM.YYYY / DD-MM-YYYY / DD/MM/YYYY", "2026-05-10 | 10.05.2026 | 10/05/26"],
    ["Платіж", "Для імпорту платежу потрібні дата платежу і сума платежу. Тип платежу не імпортується і лишається для ручного вибору.", ""],
    ["Договір", "Сума договору завжди записується в поле Сума договору контрагента.", ""],
    ["Акт", "Якщо є платіж без акту, акт буде створено автоматично з послідовною нумерацією.", ""],
  ];
}

function importContractorTable(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;

  if (typeof canEdit === "function" && !canEdit()) {
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "warning",
      title: "У вас немає прав на імпорт",
      showConfirmButton: false,
      timer: 3200,
    });
    return;
  }

  if (typeof XLSX === "undefined") {
    Swal.fire({ icon: "error", title: "Імпорт недоступний", text: "Бібліотека XLSX не завантажилась." });
    return;
  }

  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const wb = XLSX.read(new Uint8Array(ev.target.result), { type: "array", cellDates: true });
      const rows = _readContractorImportRows(wb);
      if (!rows.length) {
        Swal.fire({ icon: "warning", title: "У файлі не знайдено рядків для імпорту" });
        return;
      }

      const mapping = await _confirmContractorImportMapping(rows);
      if (!mapping) return;

      let result;
      _contractorImportMapping = mapping;
      try {
        const preview = _previewContractorImportRows(rows);
        const confirmedPlan = await _confirmContractorImport(preview);
        if (!confirmedPlan) return;

        _createContractorImportBackup();
        result = _applyContractorImportRows(confirmedPlan);
        if (result.changed) {
          saveAll();
          render();
          renderContractors();
        }
      } finally {
        _contractorImportMapping = null;
      }

      Swal.fire({
        icon: result.changed ? "success" : "info",
        title: result.changed ? "Імпорт завершено" : "Немає змін для імпорту",
        html: `
          <div style="text-align:left">
            Оброблено рядків: <b>${result.processed}</b><br>
            Нових позицій: <b>${result.itemsCreated}</b><br>
            Оновлено позицій: <b>${result.itemsUpdated}</b><br>
            Додано платежів: <b>${result.paymentsAdded}</b><br>
            Дублікати платежів: <b>${result.duplicates}</b><br>
            Пропущено: <b>${result.skipped}</b>
          </div>`,
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Помилка імпорту",
        text: "Не вдалося прочитати файл. Перевірте формат таблиці або скористайтесь шаблоном.",
      });
    }
  };
  reader.readAsArrayBuffer(file);
}

function _readContractorImportRows(wb) {
  const rows = [];
  wb.SheetNames.forEach((sheetName) => {
    const sheet = wb.Sheets[sheetName];
    const table = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
    const rawTable = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
    const headerIndexes = _detectContractorImportHeaderRows(table);
    headerIndexes.forEach((headerIndex, blockIndex) => {
      const nextHeaderIndex = headerIndexes[blockIndex + 1] ?? table.length;
      const headers = (table[headerIndex] || []).map((cell, index) => _ctText(cell) || _ctText(rawTable[headerIndex]?.[index]) || `Колонка ${index + 1}`);
      table.slice(headerIndex + 1, nextHeaderIndex).forEach((line, offset) => {
        const rawLine = rawTable[headerIndex + offset + 1] || [];
        const row = {};
        headers.forEach((header, index) => {
          row[header] = _ctImportCellValue(line?.[index], rawLine?.[index]);
        });
        if (!_ctIsEmptyRow(row)) {
          rows.push({
            row,
            sheetName,
            index: headerIndex + offset + 2,
            tableNo: blockIndex + 1,
            columns: headers,
          });
        }
      });
    });
  });
  return rows;
}

function _ctImportCellValue(formatted, raw) {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw;
  if (raw && typeof raw === "object") {
    if (typeof raw.v === "number" && Number.isFinite(raw.v)) return raw.v;
    if (raw.v !== null && raw.v !== undefined && raw.v !== "") return raw.v;
    if (raw.w !== null && raw.w !== undefined && raw.w !== "") return raw.w;
  }
  if (formatted !== null && formatted !== undefined && formatted !== "") return formatted;
  if (raw !== null && raw !== undefined && raw !== "") return raw;
  return "";
}

function _detectContractorImportHeaderRows(table) {
  const candidates = [];
  table.forEach((line, index) => {
    const score = _ctHeaderRowScore(line, table.slice(index + 1, index + 6));
    if (score >= 24) candidates.push({ index, score });
  });
  if (!candidates.length) return [_detectContractorImportHeaderRow(table)];
  return candidates
    .filter((candidate, index, list) => index === 0 || candidate.index - list[index - 1].index > 1)
    .map((candidate) => candidate.index);
}

function _detectContractorImportHeaderRow(table) {
  let best = { index: 0, score: -1 };
  table.slice(0, 20).forEach((line, index) => {
    const score = _ctHeaderRowScore(line, table.slice(index + 1, index + 6));
    if (score > best.score) best = { index, score };
  });
  return best.index;
}

function _ctHeaderRowScore(line, nextRows = []) {
  const headerScore = (line || []).reduce((sum, cell) => {
    const key = _ctHeaderKey(cell);
    if (!key) return sum;
    const aliasHit = Object.values(CONTRACTOR_HEADER_ALIASES).some((aliases) => aliases.includes(key));
    return sum + (aliasHit ? 3 : (_ctText(cell) ? 1 : 0));
  }, 0);
  const nonEmptyCells = (line || []).filter((cell) => _ctText(cell)).length;
  const dataScore = nextRows.reduce((sum, row) => sum + ((row || []).some((cell) => _ctText(cell)) ? 1 : 0), 0);
  return headerScore * 10 + nonEmptyCells + dataScore;
}

async function _confirmContractorImportMapping(rows) {
  const columns = _ctImportColumns(rows);
  const mapping = {};
  const body = CONTRACTOR_IMPORT_FIELD_ORDER.map((field) => {
    const selected = mapping[field] || "";
    const selectOptions = _ctImportSelectOptions(columns, selected);
    const examples = selected ? _ctColumnExamples(rows, selected).map(_ctEsc).join(" | ") : "";
    return `
      <tr>
        <th>${_ctEsc(CONTRACTOR_IMPORT_FIELD_LABELS[field] || field)}</th>
        <td><select class="contractor-import-map-select" data-field="${field}">${selectOptions}</select></td>
        <td class="contractor-import-map-examples" data-field="${field}">${examples || "<span class=\"muted\">-</span>"}</td>
      </tr>`;
  }).join("");
  const defaultTaskOptions = [`<option value="">Не використовувати</option>`]
    .concat((tasks || []).map((task) => `<option value="${_ctEsc(task.id || String(task.n))}">#${task.n} ${_ctEsc(task.name || "")}</option>`))
    .join("");
  const result = await Swal.fire({
    title: "Імпорт платежів",
    width: 940,
    customClass: {
      popup: "contractor-import-modal",
      htmlContainer: "contractor-import-modal-body",
      actions: "contractor-import-modal-actions",
    },
    html: `
      <div class="contractor-import-mapping">
        <p><span>Робота за замовчуванням, якщо у файлі не знайдено роботу</span></p>
        <label class="contractor-import-default-task">
          <select id="contractor-import-default-task">${defaultTaskOptions}</select>
        </label>
        <table>
          <thead><tr><th>Поле проєкту</th><th>Колонка у файлі</th><th>Приклади</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>`,
    showCancelButton: true,
    confirmButtonText: "Продовжити",
    cancelButtonText: "Скасувати",
    didOpen: () => {
      document.querySelectorAll(".contractor-import-map-select").forEach((select) => {
        select.addEventListener("change", () => {
          const cell = document.querySelector(`.contractor-import-map-examples[data-field="${select.dataset.field}"]`);
          if (!cell) return;
          const examples = select.value ? _ctColumnExamples(rows, select.value).map(_ctEsc).join(" | ") : "";
          cell.innerHTML = examples || "<span class=\"muted\">-</span>";
        });
      });
    },
    preConfirm: () => {
      const next = {};
      document.querySelectorAll(".contractor-import-map-select").forEach((select) => {
        if (select.value) next[select.dataset.field] = select.value;
      });
      const defaultTaskId = document.getElementById("contractor-import-default-task")?.value;
      if (defaultTaskId) next.defaultTaskId = defaultTaskId;
      return next;
    },
  });
  return result.isConfirmed ? result.value : null;
}

function _ctImportSelectOptions(columns, selected) {
  return `<option value="">Не імпортувати</option>` + columns
    .map((column) => `<option value="${_ctAttr(column)}"${column === selected ? " selected" : ""}>${_ctEsc(column)}</option>`)
    .join("");
}

function _ctImportColumns(rows) {
  const seen = new Set();
  rows.slice(0, 80).forEach(({ row }) => {
    Object.keys(row || {}).forEach((key) => {
      if (_ctText(key) && !seen.has(key)) seen.add(key);
    });
  });
  return Array.from(seen);
}

function _inferContractorImportMapping(rows, columns) {
  const mapping = {};
  const used = new Set();
  CONTRACTOR_IMPORT_FIELD_ORDER.forEach((field) => {
    let bestColumn = "";
    let bestScore = 0;
    columns.forEach((column) => {
      if (used.has(column)) return;
      const score = _ctImportColumnScore(rows, column, field);
      if (score > bestScore) {
        bestScore = score;
        bestColumn = column;
      }
    });
    if (bestColumn && bestScore >= 25) {
      mapping[field] = bestColumn;
      used.add(bestColumn);
    }
  });
  return mapping;
}

function _ctImportColumnScore(rows, column, field) {
  const aliases = CONTRACTOR_HEADER_ALIASES[field] || [];
  const headerKey = _ctHeaderKey(column);
  let score = aliases.includes(headerKey) ? 100 : 0;
  const values = rows.map(({ row }) => row?.[column]).filter((value) => _ctText(value)).slice(0, 40);
  if (!values.length) return score;
  const textCount = values.filter((value) => Number.isNaN(Number(_ctText(value))) && _ctText(value).length > 1).length;
  const amountCount = values.filter((value) => _ctAmount(value) !== null).length;
  const dateCount = values.filter(_ctLooksLikeDateValue).length;
  const costTypeCount = values.filter((value) => _ctCostType(value) !== "other").length;
  const taskLikeCount = values.filter((value) => _ctLeadingTaskNo(value) || tasks.some((task) => _ctNormText(value).includes(_ctNormText(task.name)))).length;
  const longTextCount = values.filter((value) => _ctText(value).length > 20).length;
  const ratio = (count) => (count / values.length) * 80;

  if (field === "paymentDate") score += ratio(dateCount);
  else if (["paymentAmount", "total", "unitPrice", "qty"].includes(field)) score += ratio(amountCount);
  else if (field === "type") score += ratio(costTypeCount) + ratio(textCount) * 0.2;
  else if (field === "taskName") score += ratio(taskLikeCount) + ratio(textCount) * 0.25;
  else if (field === "taskNo") {
    const markedNoCount = values.filter((value) => /^\s*(?:#|№|N|No\.?)\s*\d+\s*$/i.test(_ctText(value))).length;
    score += ratio(markedNoCount);
    if (aliases.includes(headerKey)) score += ratio(amountCount) * 0.5;
  }
  else if (field === "note") score += ratio(longTextCount);
  else if (["supplier", "contractNo"].includes(field)) score += ratio(textCount);
  return score;
}

function _ctColumnExamples(rows, column) {
  const examples = [];
  rows.forEach(({ row }) => {
    const value = _ctImportDisplayValue(_ctImportColumnValue(row, column));
    if (value !== "" && !examples.includes(value)) examples.push(value);
  });
  return examples.slice(0, 3);
}

function _ctImportColumnValue(row, column) {
  if (!row || !column) return "";
  if (Object.prototype.hasOwnProperty.call(row, column)) return row[column];
  const columnKey = _ctHeaderKey(column);
  const match = Object.entries(row).find(([key]) => _ctHeaderKey(key) === columnKey);
  return match ? match[1] : "";
}

function _ctImportDisplayValue(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (value && typeof value === "object") {
    const candidate = value.w ?? value.v ?? value.text ?? value.result ?? "";
    return candidate === value ? "" : _ctImportDisplayValue(candidate);
  }
  return _ctText(value);
}

function _ctLooksLikeDateValue(value) {
  const raw = _ctText(value);
  if (!raw) return false;
  return /^\d{4}-\d{1,2}-\d{1,2}/.test(raw) || /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/.test(raw);
}

function _previewContractorImportRows(rawRows) {
  const preview = {
    processed: rawRows.length,
    itemsCreated: 0,
    itemsUpdated: 0,
    paymentsAdded: 0,
    duplicates: 0,
    skipped: 0,
    warnings: [],
    affectedTasks: new Set(),
    contractors: new Set(),
  };
  const virtualItemKeys = new Set();
  const virtualPaymentKeys = new Set();

  rawRows.forEach(({ row, sheetName, index }) => {
    const ref = `${sheetName || "Аркуш"}:${index || "?"}`;
    const task = _ctFindTask(row, { useFallback: true });
    if (!task) {
      preview.skipped += 1;
      preview.warnings.push(`${ref}: роботу не знайдено`);
      return;
    }
    if (task.importFallbackTask) preview.fallbackTaskUsed = true;

    const supplier = _ctText(_ctVal(row, "supplier"));
    const itemName = _ctText(_ctVal(row, "itemName"));
    let paymentAmount = _ctAmount(_ctVal(row, "paymentAmount"));
    let total = _ctAmount(_ctVal(row, "total"));
    const qty = _ctAmount(_ctVal(row, "qty"));
    const unitPrice = _ctAmount(_ctVal(row, "unitPrice"));
    const paymentDateRaw = _ctText(_ctVal(row, "paymentDate"));

    if (paymentAmount === null && total !== null && (paymentDateRaw || _ctImportPaymentType(row) !== "other")) {
      paymentAmount = total;
      total = null;
    }

    if (!supplier && !itemName && !paymentAmount && !total && !qty && !unitPrice) {
      preview.skipped += 1;
      return;
    }

    const costItems = typeof taskCostItems === "function" ? taskCostItems(task) : (task.costItems || task.cost_items || []);
    const type = _ctImportCostType(row);
    const name = itemName || _ctDefaultItemName(type);
    const match = _ctFindImportCostItem(costItems, supplier, name, type, row);
    const itemKey = _ctImportCostItemKey(task, supplier, name, type);
    const virtualItemExists = virtualItemKeys.has(itemKey);

    if (match) preview.itemsUpdated += 1;
    else if (!virtualItemExists) {
      preview.itemsCreated += 1;
      virtualItemKeys.add(itemKey);
    }
    preview.affectedTasks.add(task.id || String(task.n));
    if (supplier) preview.contractors.add(supplier);

    if (paymentAmount !== null && paymentAmount > 0) {
      if (!paymentDateRaw) {
        preview.skipped += 1;
        preview.warnings.push(`${ref}: платіж ${fmtM(paymentAmount)} без дати буде пропущено`);
      } else {
        const payment = {
          date: _ctDate(paymentDateRaw),
          type: _ctImportPaymentType(row),
          amount: paymentAmount,
          note: _ctText(_ctVal(row, "note")),
        };
        const paymentKey = _ctImportPaymentKey(itemKey, payment);
        if ((match && _isContractorPaymentDuplicate(match, payment)) || virtualPaymentKeys.has(paymentKey)) {
          preview.duplicates += 1;
        } else {
          preview.paymentsAdded += 1;
          virtualPaymentKeys.add(paymentKey);
        }
      }
    } else if (paymentAmount !== null && paymentAmount <= 0) {
      preview.warnings.push(`${ref}: сума платежу не більша за 0`);
    }
  });

  if (preview.fallbackTaskUsed) {
    preview.warnings.unshift("Рядки без роботи буде прив'язано до типової роботи імпорту.");
  }
  preview.affectedTasks = preview.affectedTasks.size;
  preview.contractors = preview.contractors.size;
  return preview;
}

async function _confirmContractorImport(preview) {
  const issueList = preview.warnings.slice(0, 8).map((w) => `<li>${_ctEsc(w)}</li>`).join("");
  const more = preview.warnings.length > 8 ? `<li>... ще ${preview.warnings.length - 8}</li>` : "";
  const hasImportableRows = preview.itemsCreated > 0 || preview.itemsUpdated > 0 || preview.paymentsAdded > 0;
  const result = await Swal.fire({
    icon: preview.warnings.length ? "warning" : "question",
    title: "Перевірка імпорту",
    width: 760,
    customClass: {
      popup: "contractor-import-modal",
      htmlContainer: "contractor-import-modal-body",
      actions: "contractor-import-modal-actions",
    },
    html: `
      <div class="contractor-import-preview">
        <div class="contractor-import-grid">
          <div><b>${preview.processed}</b><span>рядків</span></div>
          <div><b>${preview.contractors}</b><span>контрагентів</span></div>
          <div><b>${preview.affectedTasks}</b><span>робіт</span></div>
          <div><b>${preview.itemsCreated}</b><span>нових договорів</span></div>
          <div><b>${preview.itemsUpdated}</b><span>оновлень</span></div>
          <div><b>${preview.paymentsAdded}</b><span>платежів</span></div>
          <div><b>${preview.duplicates}</b><span>дублікатів</span></div>
          <div><b>${preview.skipped}</b><span>пропусків</span></div>
        </div>
        ${preview.warnings.length ? `<div class="contractor-import-warnings"><b>Попередження</b><ul>${issueList}${more}</ul></div>` : ""}
      </div>`,
    showCancelButton: hasImportableRows,
    confirmButtonText: hasImportableRows ? "Імпортувати" : "OK",
    cancelButtonText: "Скасувати",
  });
  return hasImportableRows && result.isConfirmed;
}

function _createContractorImportBackup() {
  try {
    const key = `contractor_import_backup_${currentId || "local"}_${Date.now()}`;
    localStorage.setItem(key, JSON.stringify({ currentId, project: allProjects[currentId] || { proj, tasks, cats } }));
    localStorage.setItem("contractor_import_last_backup", key);
  } catch (_) { }
}

function _applyContractorImportRows(rawRows) {
  const touched = new Set();
  const result = {
    processed: rawRows.length,
    itemsCreated: 0,
    itemsUpdated: 0,
    paymentsAdded: 0,
    duplicates: 0,
    skipped: 0,
    changed: false,
  };

  rawRows.forEach(({ row }) => {
    const task = _ctFindTask(row, { useFallback: true, createFallback: true });
    if (!task) {
      result.skipped += 1;
      return;
    }

    const supplier = _ctText(_ctVal(row, "supplier"));
    const itemName = _ctText(_ctVal(row, "itemName"));
    let paymentAmount = _ctAmount(_ctVal(row, "paymentAmount"));
    let total = _ctAmount(_ctVal(row, "total"));
    const qty = _ctAmount(_ctVal(row, "qty"));
    const unitPrice = _ctAmount(_ctVal(row, "unitPrice"));
    if (paymentAmount === null && total !== null && (_ctText(_ctVal(row, "paymentDate")) || _ctImportPaymentType(row) !== "other")) {
      paymentAmount = total;
      total = null;
    }

    if (!supplier && !itemName && !paymentAmount && !total && !qty && !unitPrice) {
      result.skipped += 1;
      return;
    }

    if (!Array.isArray(task.costItems)) task.costItems = Array.isArray(task.cost_items) ? task.cost_items : [];
    delete task.cost_items;
    const type = _ctImportCostType(row);
    const name = itemName || _ctDefaultItemName(type);
    const match = _ctFindImportCostItem(task.costItems, supplier, name, type, row);

    const item = match || {
      id: typeof _nextCostId === "function" ? _nextCostId() : Date.now() + Math.floor(Math.random() * 1000),
      type,
      name,
      supplier,
      unit: "",
      qty: null,
      unitPrice: null,
      payments: [],
    };

    if (!match) {
      task.costItems.push(item);
      result.itemsCreated += 1;
    } else {
      result.itemsUpdated += 1;
    }

    item.type = type;
    item.name = name;
    item.supplier = supplier;

    const unit = _ctText(_ctVal(row, "unit"));
    if (unit) item.unit = unit;
    if (qty !== null) item.qty = qty;
    if (unitPrice !== null) item.unitPrice = unitPrice;
    if (total !== null && qty === null && unitPrice === null) {
      item.qty = 1;
      item.unitPrice = total;
    }
    if (!item.payments) item.payments = [];

    if (paymentAmount !== null && paymentAmount > 0 && _ctText(_ctVal(row, "paymentDate"))) {
      const payment = {
        id: typeof _nextCostId === "function" ? _nextCostId() : Date.now() + Math.floor(Math.random() * 1000),
        date: _ctDate(_ctVal(row, "paymentDate")),
        type: _ctImportPaymentType(row),
        amount: paymentAmount,
        note: _ctText(_ctVal(row, "note")),
      };
      const isDuplicate = _isContractorPaymentDuplicate(item, payment);
      if (isDuplicate) result.duplicates += 1;
      else {
        item.payments.push(payment);
        result.paymentsAdded += 1;
      }
    } else if (paymentAmount !== null && paymentAmount > 0) {
      result.skipped += 1;
    }

    _ctRecalcTaskTotals(task);
    touched.add(task.id || String(task.n));
    result.changed = true;
  });

  if (!touched.size && !result.paymentsAdded && !result.itemsCreated) result.changed = false;
  return result;
}

function _previewContractorImportRows(rawRows) {
  const ctx = { virtualPaymentKeys: new Set(), lastImportContracts: {}, supplierNames: {} };
  const entries = rawRows.map((source, entryIndex) => _ctBuildContractorImportEntry(source, entryIndex, ctx));
  const preview = _ctSummarizeContractorImportPlan(entries, rawRows.length);
  preview.entries = entries;
  return preview;
}

async function _confirmContractorImport(preview) {
  const summary = _ctSummarizeContractorImportPlan(preview.entries || [], preview.processed || 0);
  const reviewEntries = preview.entries || [];
  const issueEntries = reviewEntries.filter((entry) => entry.issues.length);
  const filterCards = [
    ["all", summary.processed, "рядків"],
    ["contractors", summary.contractors, "контрагентів"],
    ["tasks", summary.affectedTasks, "робіт"],
    ["created", summary.itemsCreated, "нових позицій"],
    ["updated", summary.itemsUpdated, "оновлень"],
    ["payments", summary.paymentsAdded, "платежів"],
    ["duplicates", summary.duplicates, "дублікатів"],
    ["skipped", summary.skipped, "пропусків"],
    ["issues", issueEntries.length, "проблем"],
  ];
  const hasDecisionOptions = issueEntries.some((entry) => entry.rowDecisionOptions?.length || entry.paymentDecisionOptions?.length);
  const hasImportableRows = summary.itemsCreated > 0 || summary.itemsUpdated > 0 || summary.paymentsAdded > 0 || hasDecisionOptions;
  const result = await Swal.fire({
    icon: issueEntries.length ? "warning" : "question",
    title: "Перевірка імпорту",
    width: 1040,
    customClass: {
      popup: "contractor-import-modal",
      htmlContainer: "contractor-import-modal-body",
      actions: "contractor-import-modal-actions",
    },
    html: `
      <div class="contractor-import-preview">
        <div class="contractor-import-grid">
          ${filterCards.map(([filter, count, label], index) => `
            <button type="button" class="contractor-import-filter-card${index === 0 ? " is-active" : ""}" data-import-filter="${filter}">
              <b>${count}</b><span>${label}</span>
            </button>`).join("")}
        </div>
        ${summary.fallbackTaskUsed ? `<div class="contractor-import-warnings"><b>Примітка</b><ul><li>Частина рядків без роботи буде прив’язана до типової імпортної роботи.</li></ul></div>` : ""}
        ${reviewEntries.length ? `
          <div class="contractor-import-warnings">
            <b>Рядки імпорту</b>
            <table class="contractor-import-review-table">
              <thead>
                <tr>
                  <th>Рядок</th>
                  <th>Контрагент</th>
                  <th>Позиція</th>
                  <th>Платіж</th>
                  <th>Проблема</th>
                  <th>Дія</th>
                </tr>
              </thead>
              <tbody>${reviewEntries.map((entry) => _ctRenderImportIssueRow(entry)).join("")}</tbody>
            </table>
          </div>` : ""}
      </div>`,
    showCancelButton: hasImportableRows,
    confirmButtonText: hasImportableRows ? "Імпортувати" : "OK",
    cancelButtonText: "Скасувати",
    didOpen: () => {
      const applyFilter = (filter) => {
        document.querySelectorAll("[data-import-filter]").forEach((card) => {
          card.classList.toggle("is-active", card.getAttribute("data-import-filter") === filter);
        });
        document.querySelectorAll("[data-import-review-row]").forEach((row) => {
          const entry = reviewEntries[Number(row.getAttribute("data-entry-index"))];
          row.hidden = !_ctImportEntryMatchesFilter(entry, filter);
        });
      };
      document.querySelectorAll("[data-import-filter]").forEach((card) => {
        card.addEventListener("click", () => applyFilter(card.getAttribute("data-import-filter") || "all"));
      });
      applyFilter("all");
    },
    preConfirm: () => {
      const updatedEntries = (preview.entries || []).map((entry) => ({ ...entry }));
      document.querySelectorAll("[data-import-decision]").forEach((select) => {
        const index = Number(select.getAttribute("data-entry-index"));
        const kind = select.getAttribute("data-decision-kind");
        if (!updatedEntries[index]) return;
        if (kind === "row") updatedEntries[index].rowDecision = select.value;
        if (kind === "payment") updatedEntries[index].paymentDecision = select.value;
      });
      updatedEntries.forEach(_ctNormalizeImportDecisionEntry);
      const nextSummary = _ctSummarizeContractorImportPlan(updatedEntries, preview.processed || 0);
      if (!nextSummary.itemsCreated && !nextSummary.itemsUpdated && !nextSummary.paymentsAdded) {
        Swal.showValidationMessage("Немає змін для імпорту");
        return false;
      }
      return { ...preview, ...nextSummary, entries: updatedEntries };
    },
  });
  return hasImportableRows && result.isConfirmed ? result.value : null;
}

function _ctNormalizeImportDecisionEntry(entry) {
  if (!entry) return entry;
  if (entry.rowDecision === "importFallback" || entry.rowDecision === "importCreate") {
    const task = entry.taskRef ? _ctResolveEntryTask(entry) : _ctFindTask(entry.row, { useFallback: true });
    if (task) {
      entry.taskRef = { id: task.id, n: task.n };
      entry.name = entry.name || entry.position || (entry.contractNo ? `Договір ${entry.contractNo}` : _ctDefaultItemName(entry.type));
      entry.itemMode = "create";
      entry.itemKey = _ctImportCostItemKey(task, entry.supplier, entry.contractNo || entry.name, entry.type);
      entry.rowDecision = "import";
    }
  }
  if (entry.rowDecision !== "import") return entry;
  if (entry.paymentDecision === "importToday" && entry.paymentAmount !== null && entry.paymentAmount > 0) {
    entry.payment = {
      date: new Date().toISOString().slice(0, 10),
      type: "other",
      amount: entry.paymentAmount,
      note: "",
    };
    entry.paymentDecision = "import";
  }
  return entry;
}

function _ctNextAutoActName(item) {
  const used = new Set((item?.acts || []).map((act) => _ctNormText(act.name)));
  let next = 1;
  while (used.has(_ctNormText(`Акт ${next}`))) next += 1;
  return `Акт ${next}`;
}

function _applyContractorImportRows(preview) {
  const entries = preview?.entries || [];
  const touched = new Set();
  const createdItems = new Map();
  const result = {
    processed: entries.length,
    itemsCreated: 0,
    itemsUpdated: 0,
    paymentsAdded: 0,
    duplicates: 0,
    skipped: 0,
    changed: false,
  };

  entries.forEach((entry) => {
    if (entry.rowDecision !== "import") {
      result.skipped += 1;
      return;
    }

    const task = _ctResolveEntryTask(entry);
    if (!task) {
      result.skipped += 1;
      return;
    }

    if (!Array.isArray(task.costItems)) task.costItems = Array.isArray(task.cost_items) ? task.cost_items : [];
    delete task.cost_items;

    let item = _ctResolveEntryItem(task, entry, createdItems);
    if (!item && entry.itemMode === "create") {
      item = {
        id: typeof _nextCostId === "function" ? _nextCostId() : Date.now() + Math.floor(Math.random() * 1000),
        type: entry.type,
        name: entry.name || entry.position || (entry.contractNo ? `Договір ${entry.contractNo}` : "Позиція платежу"),
        supplier: entry.supplier,
        unit: entry.unit || "договір",
        qty: entry.qty !== null ? entry.qty : 1,
        unitPrice: null,
        contractNo: entry.contractNo || "",
        contractDate: "",
        payments: [],
        acts: [],
      };
      task.costItems.push(item);
      createdItems.set(entry.itemKey, item);
      result.itemsCreated += 1;
    } else if (item) {
      result.itemsUpdated += 1;
    }
    if (!item) {
      result.skipped += 1;
      return;
    }

    item.type = entry.type;
    item.supplier = entry.supplier;
    if (entry.contractNo) item.contractNo = entry.contractNo;
    item.name = entry.position || item.name || (item.contractNo ? `Договір ${item.contractNo}` : "Позиція платежу");
    if (entry.unit) item.unit = entry.unit;
    else if (!item.unit) item.unit = "договір";
    item.qty = entry.qty !== null ? entry.qty : (item.qty || 1);
    if (entry.contractAmount !== null) {
      if (entry.qty === null) item.qty = 1;
      item.unitPrice = entry.contractAmount;
    }
    if (!item.payments) item.payments = [];
    if (!item.acts) item.acts = [];

    let ensuredAct = null;
    if (entry.payment) {
      const actType = "act";
      const actName = _ctText(entry.actName) || _ctNextAutoActName(item);
      ensuredAct = (item.acts || []).find((act) =>
        (act.date || "") === (entry.documentDate || "") &&
        (act.type || "other") === actType &&
        _ctNormText(act.name || "") === _ctNormText(actName)
      ) || null;
      if (!ensuredAct) {
        ensuredAct = {
          id: typeof _nextCostId === "function" ? _nextCostId() : Date.now() + Math.floor(Math.random() * 1000),
          type: actType,
          name: actName,
          date: entry.documentDate,
          amount: entry.payment.amount,
          itemName: entry.position || item.name || "",
          note: entry.note || "",
        };
        item.acts.push(ensuredAct);
      } else if (entry.note && !ensuredAct.note) {
        ensuredAct.note = entry.note;
      }
      if (entry.position && !ensuredAct.itemName) ensuredAct.itemName = entry.position;
    }

    if (entry.paymentDecision === "import" && entry.payment) {
      item.payments.push({
        id: typeof _nextCostId === "function" ? _nextCostId() : Date.now() + Math.floor(Math.random() * 1000),
        date: entry.payment.date,
        type: "other",
        amount: entry.payment.amount,
        contractId: item.id,
        actId: ensuredAct?.id || "",
        actNo: ensuredAct?.name || "",
        note: "",
      });
      result.paymentsAdded += 1;
      if (entry.duplicatePayment) result.duplicates += 1;
    } else if (entry.paymentAmount !== null && entry.paymentAmount > 0 && entry.paymentDecision !== "import") {
      result.skipped += 1;
      if (entry.duplicatePayment) result.duplicates += 1;
    }

    task.contractsOverrideBudget = true;
    _ctRecalcTaskTotals(task);
    touched.add(task.id || String(task.n));
    result.changed = true;
  });

  if (!touched.size && !result.paymentsAdded && !result.itemsCreated) result.changed = false;
  return result;
}

function _ctBuildContractorImportEntry(source, entryIndex, ctx) {
  const { row, sheetName, index } = source;
  const entry = {
    entryIndex,
    row,
    ref: `${sheetName || "Аркуш"}:${index || "?"}`,
    supplier: _ctText(_ctVal(row, "supplier")),
    contractNo: _ctText(_ctVal(row, "contractNo")),
    actName: _ctText(_ctVal(row, "actName")),
    position: _ctText(_ctVal(row, "type")),
    rawTypeText: _ctText(_ctVal(row, "type")),
    type: "service",
    unit: _ctText(_ctVal(row, "unit")),
    qty: _ctAmount(_ctVal(row, "qty")),
    unitPrice: _ctAmount(_ctVal(row, "unitPrice")),
    total: _ctAmount(_ctVal(row, "total")),
    note: _ctText(_ctVal(row, "note")),
    paymentAmount: _ctAmount(_ctVal(row, "paymentAmount")),
    paymentDateRaw: _ctText(_ctVal(row, "paymentDate")),
    documentKind: "none",
    hasTaskRef: _ctHasTaskReference(row),
    issues: [],
    rowDecision: "import",
    paymentDecision: "none",
    rowDecisionOptions: null,
    paymentDecisionOptions: null,
    duplicatePayment: false,
    payment: null,
    taskRef: null,
    itemMode: "none",
    itemKey: "",
    existingItemId: null,
    existingItemIndex: null,
    fallbackTaskUsed: false,
  };

  if (entry.supplier && ctx?.supplierNames) {
    const supplierKey = _contractorKey(entry.supplier);
    const existingSupplier = _ctFindSupplierItems(entry.supplier)[0]?.item?.supplier || "";
    if (existingSupplier) {
      entry.supplier = existingSupplier;
      ctx.supplierNames[supplierKey] = existingSupplier;
    } else if (ctx.supplierNames[supplierKey]) {
      entry.supplier = ctx.supplierNames[supplierKey];
    } else {
      ctx.supplierNames[supplierKey] = entry.supplier;
    }
  }

  _ctAddInvalidImportAmountIssues(entry, row);

  const looksLikeBareContract = !!entry.contractNo &&
    !entry.actName &&
    entry.paymentAmount === null &&
    !entry.paymentDateRaw;
  if (looksLikeBareContract) entry.documentKind = "contract";

  entry.isDocumentRow = !!entry.actName || entry.paymentAmount !== null;
  entry.isContractRow = entry.documentKind === "contract";
  entry.documentDate = "";

  if (!entry.supplier && !entry.contractNo && !entry.position && !entry.actName && !entry.paymentAmount && !entry.total && !entry.qty && !entry.unitPrice) {
    entry.rowDecision = "skip";
    entry.issues.push("Порожній рядок");
    return entry;
  }

  entry.name = entry.position || (entry.contractNo ? `Договір ${entry.contractNo}` : _ctDefaultItemName(entry.type));
  entry.contractAmount = entry.total ?? entry.unitPrice ?? null;

  if (!entry.hasTaskRef && entry.supplier) {
    const resolvedWithoutTask = _ctResolveImportTargetWithoutTask(entry.supplier, entry.contractNo, entry.name, entry.type, row);
    if (resolvedWithoutTask?.task && resolvedWithoutTask?.item) {
      entry.taskRef = { id: resolvedWithoutTask.task.id, n: resolvedWithoutTask.task.n };
      entry.itemMode = "update";
      entry.existingItemId = resolvedWithoutTask.item.id;
      entry.existingItemIndex = resolvedWithoutTask.itemIndex;
      entry.itemKey = _ctImportCostItemKey(resolvedWithoutTask.task, entry.supplier, entry.contractNo || entry.name, entry.type);
    } else if (resolvedWithoutTask?.reason) {
      entry.issues.push(`${entry.ref}: ${resolvedWithoutTask.reason}`);
    }
  }

  if (!entry.taskRef) {
    const task = _ctFindTask(row, { useFallback: true });
    if (task) {
      entry.taskRef = { id: task.id, n: task.n };
      entry.fallbackTaskUsed = !!task.importFallbackTask;
      const match = entry.isDocumentRow
        ? _ctFindDocumentTargetItem(task, entry, ctx)
        : _ctFindImportCostItem(typeof taskCostItems === "function" ? taskCostItems(task) : (task.costItems || task.cost_items || []), entry.supplier, entry.name, entry.type, row);
      entry.itemKey = _ctImportCostItemKey(task, entry.supplier, entry.contractNo || _ctText(match?.contractNo) || entry.name, entry.type);
      if (match) {
        entry.itemMode = "update";
        entry.existingItemId = match.id;
        entry.existingItemIndex = (typeof taskCostItems === "function" ? taskCostItems(task) : (task.costItems || task.cost_items || [])).indexOf(match);
      } else {
        const lastKey = `${task.id || task.n}|${_contractorKey(entry.supplier)}`;
        if (entry.isDocumentRow && ctx?.lastImportContracts?.[lastKey]?.itemKey) {
          entry.itemMode = "update";
          entry.itemKey = ctx.lastImportContracts[lastKey].itemKey;
        } else {
          entry.itemMode = "create";
        }
      }
    }
  }

  if (!entry.taskRef || entry.itemMode === "none") {
    entry.rowDecision = "skip";
    const canCreateFallback = !!entry.supplier || !!entry.contractNo || !!entry.position || !!entry.actName || entry.paymentAmount !== null || entry.total !== null || entry.unitPrice !== null;
    if (!entry.issues.length) entry.issues.push(`${entry.ref}: роботу або позицію не вдалося визначити`);
    if (canCreateFallback) {
      entry.rowDecisionOptions = [
        { value: "skip", label: "Пропустити рядок" },
        { value: entry.taskRef ? "importCreate" : "importFallback", label: entry.taskRef ? "Створити нову позицію" : "Імпортувати в типову роботу" },
      ];
    }
    return entry;
  }

  if (ctx?.lastImportContracts && entry.taskRef && entry.supplier && (entry.isContractRow || entry.contractNo)) {
    const lastKey = `${entry.taskRef.id || entry.taskRef.n}|${_contractorKey(entry.supplier)}`;
    ctx.lastImportContracts[lastKey] = { id: entry.existingItemId, itemKey: entry.itemKey };
  }

  if (entry.paymentAmount !== null && entry.paymentAmount > 0) {
    if (!entry.paymentDateRaw) {
      entry.paymentDecision = "skip";
      entry.paymentDecisionOptions = [
        { value: "skip", label: "Імпортувати рядок без платежу" },
        { value: "importToday", label: "Імпортувати платіж з поточною датою" },
      ];
      entry.issues.push(`${entry.ref}: платіж ${fmtM(entry.paymentAmount)} без дати`);
    } else {
      entry.payment = {
        date: _ctDate(entry.paymentDateRaw),
        type: "other",
        amount: entry.paymentAmount,
        note: "",
      };
      const task = _ctResolveEntryTask(entry);
      const existingItem = task ? _ctResolveEntryItem(task, entry, null) : null;
      const paymentKey = _ctImportPaymentKey(entry.itemKey, entry.payment);
      const duplicate = (existingItem && _isContractorPaymentDuplicate(existingItem, entry.payment)) || ctx.virtualPaymentKeys.has(paymentKey);
      if (duplicate) {
        entry.duplicatePayment = true;
        entry.paymentDecision = "skip";
        entry.paymentDecisionOptions = [
          { value: "skip", label: "Пропустити дублікат" },
          { value: "import", label: "Імпортувати все одно" },
        ];
        entry.issues.push(`${entry.ref}: у контрагента вже є такий платіж`);
      } else {
        entry.paymentDecision = "import";
        ctx.virtualPaymentKeys.add(paymentKey);
      }
    }
  } else if (entry.paymentAmount !== null && entry.paymentAmount <= 0) {
    entry.paymentDecision = "skip";
    entry.issues.push(`${entry.ref}: сума платежу має бути більшою за 0`);
  }

  if (entry.issues.length && entry.rowDecision === "import") {
    entry.rowDecisionOptions = [
      { value: "import", label: "Імпортувати рядок" },
      { value: "skip", label: "Пропустити рядок" },
    ];
  }

  return entry;
}

function _ctAddInvalidImportAmountIssues(entry, row) {
  [
    ["qty", "Кількість"],
    ["unitPrice", "Ціна / сума договору"],
    ["total", "Кошторис / сума договору"],
    ["paymentAmount", "Сума платежу"],
  ].forEach(([field, label]) => {
    const raw = _ctText(_ctVal(row, field));
    if (raw && entry[field] === null) {
      entry.issues.push(`${entry.ref}: поле "${label}" має невідомий формат суми: "${raw}"`);
    }
  });
}

function _ctResolveImportTargetWithoutTask(supplier, contractNo, name, type, row) {
  const supplierItems = _ctFindSupplierItems(supplier);
  if (!supplierItems.length) return { reason: "контрагента не знайдено серед наявних робіт" };

  const contractKey = _ctNormText(contractNo);
  if (contractKey) {
    const byContractNo = supplierItems.filter(({ item }) => _ctNormText(item.contractNo || item.name) === contractKey);
    if (byContractNo.length === 1) return byContractNo[0];
    if (byContractNo.length > 1) return { reason: `знайдено кілька договорів "${contractNo}" без вказаної роботи` };
  }
  const exact = supplierItems.filter(({ item }) => {
    const sameName = _ctNormText(item.name) === _ctNormText(name);
    const sameType = (item.type || "other") === type;
    return sameName && sameType;
  });
  if (exact.length === 1) return exact[0];
  if (!contractNo && supplierItems.length === 1) return supplierItems[0];
  if (exact.length > 1) return { reason: `знайдено кілька позицій "${name}" без вказаної роботи` };
  if (!contractNo && supplierItems.length > 1) return { reason: "у контрагента кілька позицій, потрібна робота або номер договору" };
  return { reason: "без роботи не вдалося однозначно знайти позицію контрагента" };
}

function _ctFindSupplierItems(supplier) {
  const key = _contractorKey(supplier);
  const list = [];
  tasks.forEach((task, ti) => {
    taskCostItems(task).forEach((item, itemIndex) => {
      if (_contractorKey(item.supplier) !== key) return;
      list.push({ task, ti, item, itemIndex });
    });
  });
  return list;
}

function _ctFindDocumentTargetItem(task, entry, ctx = null) {
  const items = typeof taskCostItems === "function" ? taskCostItems(task) : (task.costItems || task.cost_items || []);
  const sameSupplier = items.filter((item) => _contractorKey(item.supplier) === _contractorKey(entry.supplier));
  if (sameSupplier.length === 1) {
    if (ctx) ctx.lastImportContractKey = `${task.id || task.n}|${_contractorKey(entry.supplier)}`;
    return sameSupplier[0];
  }

  const ctxKey = `${task.id || task.n}|${_contractorKey(entry.supplier)}`;
  if (ctx?.lastImportContracts?.[ctxKey]?.id !== undefined && ctx.lastImportContracts[ctxKey]?.id !== null) {
    return sameSupplier.find((item) => String(item.id) === String(ctx.lastImportContracts[ctxKey].id)) || null;
  }

  const byContractNo = sameSupplier.find((item) => _ctNormText(item.contractNo || item.name) === _ctNormText(entry.contractNo));
  if (byContractNo) return byContractNo;

  const namedContract = sameSupplier.find((item) => _ctText(item.contractNo) || _ctNormText(item.name).includes("догов"));
  if (namedContract) return namedContract;

  return sameSupplier[0] || null;
}

function _ctSummarizeContractorImportPlan(entries, processed) {
  const summary = {
    processed,
    itemsCreated: 0,
    itemsUpdated: 0,
    paymentsAdded: 0,
    duplicates: 0,
    skipped: 0,
    warnings: [],
    affectedTasks: 0,
    contractors: 0,
    fallbackTaskUsed: false,
  };
  const contractors = new Set();
  const tasksSet = new Set();
  const createdKeys = new Set();

  entries.forEach((entry) => {
    if (entry.fallbackTaskUsed) summary.fallbackTaskUsed = true;
    if (entry.issues.length) summary.warnings.push(...entry.issues);
    if (entry.rowDecision !== "import") {
      summary.skipped += 1;
      return;
    }
    if (entry.supplier) contractors.add(entry.supplier);
    if (entry.taskRef?.id || entry.taskRef?.n) tasksSet.add(entry.taskRef.id || String(entry.taskRef.n));
    if (entry.itemMode === "create" && entry.itemKey && !createdKeys.has(entry.itemKey)) {
      createdKeys.add(entry.itemKey);
      summary.itemsCreated += 1;
    }
    if (entry.itemMode === "update") summary.itemsUpdated += 1;
    if (entry.duplicatePayment) summary.duplicates += 1;
    if (entry.paymentDecision === "import") summary.paymentsAdded += 1;
    if (entry.paymentAmount !== null && entry.paymentAmount > 0 && entry.paymentDecision !== "import") summary.skipped += 1;
  });

  summary.affectedTasks = tasksSet.size;
  summary.contractors = contractors.size;
  return summary;
}

function _ctRenderImportIssueRow(entry) {
  const paymentLabel = entry.paymentAmount !== null && entry.paymentAmount > 0
    ? `${fmtM(entry.paymentAmount)}${entry.paymentDateRaw ? ` · ${_ctEsc(entry.paymentDateRaw)}` : ""}`
    : "—";
  return `
    <tr data-import-review-row="1" data-entry-index="${entry.entryIndex}">
      <td>${_ctEsc(entry.ref)}</td>
      <td>${_ctEsc(entry.supplier || "—")}</td>
      <td>${_ctEsc(entry.name || "—")}</td>
      <td>${paymentLabel}</td>
      <td>${entry.issues.map((issue) => _ctEsc(issue)).join("<br>")}</td>
      <td>${_ctRenderImportDecisionControl(entry)}</td>
    </tr>`;
}

function _ctImportEntryMatchesFilter(entry, filter) {
  if (!entry) return false;
  if (filter === "all") return true;
  if (filter === "issues") return !!entry.issues?.length;
  if (filter === "contractors") return !!entry.supplier;
  if (filter === "tasks") return !!entry.taskRef;
  if (filter === "created") return entry.rowDecision === "import" && entry.itemMode === "create";
  if (filter === "updated") return entry.rowDecision === "import" && entry.itemMode === "update";
  if (filter === "payments") return entry.paymentDecision === "import" && !!entry.payment;
  if (filter === "duplicates") return !!entry.duplicatePayment;
  if (filter === "skipped") return entry.rowDecision !== "import" || entry.paymentDecision === "skip";
  return true;
}

function _ctRenderImportDecisionControl(entry) {
  const controls = [];
  if (entry.rowDecisionOptions?.length) {
    controls.push(`<select class="contractor-import-map-select" data-import-decision="1" data-decision-kind="row" data-entry-index="${entry.entryIndex}">
      ${entry.rowDecisionOptions.map((option) => `<option value="${option.value}"${option.value === entry.rowDecision ? " selected" : ""}>${_ctEsc(option.label)}</option>`).join("")}
    </select>`);
  }
  if (entry.paymentDecisionOptions?.length) {
    controls.push(`<select class="contractor-import-map-select" data-import-decision="1" data-decision-kind="payment" data-entry-index="${entry.entryIndex}">
      ${entry.paymentDecisionOptions.map((option) => `<option value="${option.value}"${option.value === entry.paymentDecision ? " selected" : ""}>${_ctEsc(option.label)}</option>`).join("")}
    </select>`);
  }
  if (controls.length) return `<div class="contractor-import-decision-stack">${controls.join("")}</div>`;
  if (entry.rowDecision !== "import") return `<span class="contractor-import-issue-note">Пропустити</span>`;
  if (entry.paymentDecision === "skip") return `<span class="contractor-import-issue-note">Імпортувати рядок без платежу</span>`;
  return `<span class="contractor-import-issue-note">Авто</span>`;
}

function _ctResolveEntryTask(entry) {
  if (!entry?.taskRef) return null;
  const existing = tasks.find((task) =>
    (entry.taskRef.id && String(task.id || "") === String(entry.taskRef.id)) ||
    String(task.n) === String(entry.taskRef.n)
  ) || null;
  if (existing) return existing;
  return entry.row ? _ctFindTask(entry.row, { useFallback: true, createFallback: true }) : null;
}

function _ctResolveEntryItem(task, entry, createdItems) {
  if (!task || !entry) return null;
  const items = taskCostItems(task);
  if (entry.existingItemId !== null && entry.existingItemId !== undefined) {
    return items.find((item) => String(item.id) === String(entry.existingItemId)) || items[entry.existingItemIndex] || null;
  }
  if (createdItems && entry.itemKey && createdItems.has(entry.itemKey)) return createdItems.get(entry.itemKey);
  return null;
}

function _ctFindTask(row, options = {}) {
  const taskId = _ctText(_ctVal(row, "taskId"));
  if (taskId) {
    const byId = tasks.find((task) => String(task.id || "") === taskId);
    if (byId) return byId;
  }

  const taskNameRaw = _ctVal(row, "taskName");
  const byNoFromName = _ctFindTaskByNo(_ctLeadingTaskNo(taskNameRaw)) ||
    _ctFindTaskByNo(_ctPlainTaskNo(taskNameRaw));
  if (byNoFromName) return byNoFromName;

  const name = _ctNormText(_ctTaskNameWithoutNo(taskNameRaw));
  const byName = name
    ? tasks.find((task) => _ctTaskNameMatches(task.name, name))
    : null;
  if (byName) return byName;

  const byNo = taskNameRaw ? null : _ctFindTaskByNo(_ctVal(row, "taskNo"));
  if (byNo) return byNo;

  const byLooseRow = _ctHasImportMapping() ? null : _ctFindTaskByLooseRow(row);
  if (byLooseRow) return byLooseRow;

  const defaultTaskId = _contractorImportMapping?.defaultTaskId;
  if (defaultTaskId) {
    return tasks.find((task) => task.id === defaultTaskId || String(task.n) === String(defaultTaskId)) || null;
  }
  if (options.useFallback && _ctHasTaskReference(row)) {
    return options.createFallback ? _ctGetOrCreateImportTaskFromRow(row) : _ctImportTaskPreviewFromRow(row);
  }
  if (options.useFallback && _ctShouldUseFallbackImportTask(row)) {
    return options.createFallback ? _ctGetOrCreateFallbackImportTask() : _ctFallbackImportTaskPreview();
  }
  return null;
}

function _ctFindTaskByNo(value) {
  const raw = _ctText(value);
  if (!raw) return null;
  const no = Number.parseInt(raw.replace(/[^\d-]/g, ""), 10);
  if (!Number.isFinite(no)) return null;
  return tasks.find((task) => Number(task.n) === no) || null;
}

function _ctShouldUseFallbackImportTask(row) {
  if (!Array.isArray(tasks) || tasks.length === 0) return true;
  if (tasks.every((task) => task.importFallbackTask)) return true;
  return !_ctHasTaskReference(row);
}

function _ctHasTaskReference(row) {
  if (_ctText(_ctVal(row, "taskId")) || _ctText(_ctVal(row, "taskNo")) || _ctText(_ctVal(row, "taskName"))) return true;
  if (_ctHasImportMapping()) return false;
  return Object.entries(row || {}).some(([key, value]) => _ctLooksLikeTaskColumn(key) && _ctText(value));
}

function _ctTaskRefFromRow(row) {
  const taskNameRaw = _ctVal(row, "taskName");
  const taskNoRaw = _ctVal(row, "taskNo");
  const looseValue = _ctHasImportMapping() ? "" : _ctLooseTaskValue(row);
  const rawName = _ctText(_ctTaskNameWithoutNo(taskNameRaw)) || _ctText(_ctTaskNameWithoutNo(looseValue));
  const rawNo = _ctLeadingTaskNo(taskNameRaw) || _ctPlainTaskNo(taskNameRaw) || (rawName ? "" : taskNoRaw);
  const no = Number.parseInt(String(rawNo || "").replace(/[^\d-]/g, ""), 10);
  const name = rawName || (Number.isFinite(no) ? `Імпортована робота №${no}` : "Імпортована робота");
  return {
    key: _ctCompactTaskText(`${Number.isFinite(no) ? no : ""} ${name}`) || _ctCompactTaskText(name),
    name,
    no: Number.isFinite(no) ? no : null,
  };
}

function _ctImportTaskPreviewFromRow(row) {
  const ref = _ctTaskRefFromRow(row);
  return {
    id: `__contractor_import_task__${ref.key}`,
    n: ref.no || Math.max(1, ...(tasks || []).map((task) => Number(task.n) || 0)),
    name: ref.name,
    cat: 0,
    ms: 0,
    ws: 0,
    me: Math.min(Math.max(0, (proj?.nm || 2) - 1), 1),
    we: 3,
    prog: 0,
    budget: 0,
    spent: 0,
    deps: [],
    costItems: [],
    importCreatedFromTable: true,
  };
}

function _ctGetOrCreateImportTaskFromRow(row) {
  const ref = _ctTaskRefFromRow(row);
  const existing = tasks.find((task) => {
    if (ref.no !== null && Number(task.n) === ref.no) return true;
    return _ctTaskNameMatches(task.name, _ctNormText(ref.name));
  });
  if (existing) return existing;

  const maxN = Math.max(0, ...(tasks || []).map((task) => Number(task.n) || 0));
  const canUseImportedNo = ref.no !== null && !tasks.some((task) => Number(task.n) === ref.no);
  const n = canUseImportedNo ? ref.no : Math.max(nextN || 1, maxN + 1);
  nextN = Math.max(nextN || 1, n + 1);

  const task = {
    id: typeof genId === "function" ? genId() : `import-task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    n,
    name: ref.name,
    cat: 0,
    ms: 0,
    ws: 0,
    me: Math.min(Math.max(0, (proj?.nm || 2) - 1), 1),
    we: 3,
    prog: 0,
    budget: 0,
    spent: 0,
    contractsOverrideBudget: true,
    deps: [],
    phases: null,
    costItems: [],
    notes: [],
    importCreatedFromTable: true,
  };
  tasks.push(task);
  return task;
}

function _ctFallbackImportTaskPreview() {
  const existing = (tasks || []).find((task) => task.importFallbackTask);
  if (existing) return existing;

  return {
    id: "__contractor_import_fallback_task__",
    n: Math.max(1, ...(tasks || []).map((task) => Number(task.n) || 0)),
    name: "Імпортовані дані без прив'язки до робіт",
    cat: 0,
    ms: 0,
    ws: 0,
    me: Math.min(Math.max(0, (proj?.nm || 2) - 1), 1),
    we: 3,
    prog: 0,
    budget: 0,
    spent: 0,
    deps: [],
    costItems: [],
    importFallbackTask: true,
  };
}

function _ctGetOrCreateFallbackImportTask() {
  const existing = (tasks || []).find((task) => task.importFallbackTask);
  if (existing) return existing;

  const maxN = Math.max(0, ...(tasks || []).map((task) => Number(task.n) || 0));
  const n = Math.max(nextN || 1, maxN + 1);
  nextN = n + 1;

  const task = {
    id: typeof genId === "function" ? genId() : `import-task-${Date.now()}`,
    n,
    name: "Імпортовані дані без прив'язки до робіт",
    cat: 0,
    ms: 0,
    ws: 0,
    me: Math.min(Math.max(0, (proj?.nm || 2) - 1), 1),
    we: 3,
    prog: 0,
    budget: 0,
    spent: 0,
    contractsOverrideBudget: true,
    deps: [],
    phases: null,
    costItems: [],
    notes: [],
    importFallbackTask: true,
  };
  tasks.push(task);
  return task;
}

function _ctTaskNameWithoutNo(value) {
  return _ctText(value).replace(/^\s*(?:#|№|N|No\.?)?\s*\d+\s*[-–—.:)]?\s*/i, "");
}

function _ctLeadingTaskNo(value) {
  const match = _ctText(value).match(/^\s*(?:#|№|N|No\.?)?\s*(\d+)(?:\s|[-–—.:)])/i);
  return match ? match[1] : "";
}

function _ctPlainTaskNo(value) {
  const match = _ctText(value).match(/^\s*(?:#|№|N|No\.?)?\s*(\d+)\s*$/i);
  return match ? match[1] : "";
}

function _ctTaskNameMatches(taskName, importName) {
  const taskNorm = _ctNormText(taskName);
  if (!taskNorm || !importName) return false;
  if (taskNorm === importName) return true;
  if (_ctSimilarTaskText(taskNorm, importName) && (taskNorm.includes(importName) || importName.includes(taskNorm))) return true;

  const taskKey = _ctCompactTaskText(taskNorm);
  const importKey = _ctCompactTaskText(importName);
  if (!taskKey || !importKey) return false;
  if (taskKey === importKey) return true;
  return _ctSimilarTaskText(taskKey, importKey) && (taskKey.includes(importKey) || importKey.includes(taskKey));
}

function _ctSimilarTaskText(a, b) {
  const min = Math.min(a.length, b.length);
  const max = Math.max(a.length, b.length);
  return min >= 8 && min / max >= 0.72;
}

function _ctCompactTaskText(value) {
  return _ctNormText(value).replace(/[^\p{L}\p{N}]+/gu, "");
}

function _ctFindTaskByLooseRow(row) {
  const candidates = _ctLooseTaskValues(row);

  for (const value of candidates) {
    const raw = _ctText(value);
    const byId = tasks.find((task) => String(task.id || "") === raw);
    if (byId) return byId;

    const byNo = _ctFindTaskByNo(_ctLeadingTaskNo(raw)) || _ctFindTaskByNo(_ctPlainTaskNo(raw)) || _ctFindTaskByNo(raw);
    if (byNo) return byNo;

    const name = _ctNormText(_ctTaskNameWithoutNo(raw));
    if (!name) continue;
    const byName = tasks.find((task) => _ctTaskNameMatches(task.name, name));
    if (byName) return byName;
  }

  return null;
}

function _ctLooseTaskValue(row) {
  return _ctLooseTaskValues(row)[0] || "";
}

function _ctLooseTaskValues(row) {
  return Object.entries(row || {})
    .filter(([key, value]) => _ctLooksLikeTaskColumn(key) && _ctText(value))
    .map(([, value]) => value);
}

function _ctLooksLikeTaskColumn(header) {
  const key = _ctHeaderKey(header);
  return [
    "task",
    "work",
    "number",
    "taskno",
    "tasknumber",
    "workid",
    "роб",
    "номер",
    "назва",
    "видроб",
    "завдання",
  ].some((part) => key.includes(part));
}

function _ctHasImportMapping() {
  return !!_contractorImportMapping && typeof _contractorImportMapping === "object";
}

function _ctVal(row, field) {
  const mappedColumn = _contractorImportMapping?.[field];
  if (mappedColumn) {
    if (Object.prototype.hasOwnProperty.call(row, mappedColumn)) return row[mappedColumn];
    const mappedKey = _ctHeaderKey(mappedColumn);
    const match = Object.entries(row).find(([key]) => _ctHeaderKey(key) === mappedKey);
    return match ? match[1] : "";
  }
  if (_ctHasImportMapping()) return "";

  const aliases = CONTRACTOR_HEADER_ALIASES[field] || [];
  for (const [key, value] of Object.entries(row)) {
    const nk = _ctHeaderKey(key);
    if (aliases.includes(nk)) return value;
  }
  return "";
}

function _ctHeaderKey(value) {
  const raw = String(value || "").trim().toLocaleLowerCase("uk-UA");
  if (raw === "№" || raw === "#") return "number";
  return raw
    .replace(/[\s._:;,'"’`/\\|()[\]{}+-]/g, "")
    .replace(/№/g, "number")
    .replace(/#/g, "number");
}

function _ctText(value) {
  return String(value ?? "").trim();
}

function _ctNormText(value) {
  return _ctText(value).toLocaleLowerCase("uk-UA").replace(/\s+/g, " ");
}

function _ctAmount(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  let raw = String(value).trim();
  if (!raw) return null;

  let negative = false;
  if (/^\(.*\)$/.test(raw)) {
    negative = true;
    raw = raw.slice(1, -1);
  }

  raw = raw
    .replace(/[−–—]/g, "-")
    .replace(/\u00a0|\u202f/g, " ")
    .replace(/\s+/g, "")
    .replace(/['’`]/g, "")
    .replace(/[^\d,.-]/g, "");

  if (raw.startsWith("-")) {
    negative = !negative;
    raw = raw.slice(1);
  }
  raw = raw.replace(/-/g, "");
  if (!raw || !/\d/.test(raw)) return null;

  const lastComma = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");
  const decimalSep = _ctAmountDecimalSeparator(raw, lastComma, lastDot);
  let normalized = "";

  if (decimalSep) {
    const decimalIndex = decimalSep === "," ? lastComma : lastDot;
    const intPart = raw.slice(0, decimalIndex).replace(/[,.]/g, "");
    const decPart = raw.slice(decimalIndex + 1).replace(/[,.]/g, "");
    normalized = `${intPart || "0"}.${decPart}`;
  } else {
    normalized = raw.replace(/[,.]/g, "");
  }

  if (!normalized || normalized === ".") return null;
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? (negative ? -n : n) : null;
}

function _ctAmountDecimalSeparator(raw, lastComma, lastDot) {
  if (lastComma >= 0 && lastDot >= 0) return lastComma > lastDot ? "," : ".";
  const sep = lastComma >= 0 ? "," : (lastDot >= 0 ? "." : "");
  if (!sep) return "";

  const parts = raw.split(sep);
  if (parts.length === 2) {
    const [intPart, decPart] = parts;
    if (decPart.length > 0 && decPart.length <= 2) return sep;
    if (decPart.length === 3 && intPart.length <= 3) return "";
    return decPart.length === 0 ? "" : sep;
  }

  const lastPart = parts[parts.length - 1] || "";
  const thousandGroups = parts.slice(1).every((part) => part.length === 3);
  if (thousandGroups) return "";
  return lastPart.length > 0 && lastPart.length <= 2 ? sep : "";
}

function _ctDate(value) {
  const raw = _ctText(value);
  if (!raw) return new Date().toISOString().slice(0, 10);
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const ua = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (ua) {
    const year = ua[3].length === 2 ? `20${ua[3]}` : ua[3];
    return `${year}-${ua[2].padStart(2, "0")}-${ua[1].padStart(2, "0")}`;
  }
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return raw;
}

function _renderContractorMainCell(row, key, ctx) {
  if (key === "select") {
    if (!contractorSelectionMode) return "";
    return `<td class="contractor-select-cell">
      ${ctx.selectable ? `<input type="checkbox" ${ctx.selected ? "checked" : ""} onclick="event.stopPropagation();toggleContractorSelection('${encodeURIComponent(row.key)}', this.checked)" title="Вибрати контрагента">` : ""}
    </td>`;
  }
  if (key === "rowNo") return `<td class="contractor-num contractor-row-no">${row.rowNo || ""}</td>`;
  if (key === "supplier") {
    return `<td class="contractor-name-cell">
      <div class="contractor-name-wrap">
        <button class="contractor-expand-btn" onclick="toggleContractorDetails('${encodeURIComponent(row.key)}')" title="${ctx.open ? "Згорнути" : "Розгорнути"}">
          <i data-lucide="${ctx.open ? "chevron-down" : "chevron-right"}"></i>
        </button>
        <span class="contractor-title">
          <b title="${_ctAttr(row.supplier)}">${_ctEsc(row.supplier)}</b>
        </span>
      </div>
    </td>`;
  }
  if (key === "tasksCount") return `<td class="contractor-num">${row.tasksCount}</td>`;
  if (key === "itemsCount") return `<td class="contractor-num">${row.itemsCount}</td>`;
  if (key === "budget") return `<td class="contractor-num contractor-money-cell">${fmtM(Math.round(row.budget))}</td>`;
  if (key === "paid") return `<td class="contractor-num contractor-money-cell">${fmtM(Math.round(row.paid))}</td>`;
  if (key === "rest") return `<td class="contractor-num contractor-money-cell${row.rest < 0 ? " contractor-rest-negative" : ""}">${fmtM(Math.round(row.rest))}</td>`;
  if (key === "actsAmount") return `<td class="contractor-num">${fmtM(Math.round(row.actsAmount || 0))}</td>`;
  if (key === "actsDebt") return `<td class="contractor-num${(row.actsDebt || 0) > 0 ? " contractor-rest-negative" : ""}">${fmtM(Math.round(row.actsDebt || 0))}</td>`;
  if (key === "paymentsCount") return `<td class="contractor-num">${row.paymentsCount}</td>`;
  if (key === "lastPayment") return `<td>${_ctEsc(_ctDisplayDate(row.lastPayment) || "—")}</td>`;
  if (key === "status") return `<td>${_renderContractorStatusBar(row, ctx.status)}</td>`;
  if (key === "actions") return `<td class="contractor-actions-cell">${ctx.action}</td>`;
  return `<td></td>`;
}

_renderContractorRow = function _renderContractorRowResponsive(row, visibleCols) {
  const cols = Array.isArray(visibleCols) ? visibleCols : (contractorSelectionMode ? _getContractorColumns() : _getContractorColumns().filter(([key]) => key !== "select"));
  const colspan = cols.length;
  const open = contractorExpanded.has(row.key);
  const status = _contractorStatus(row);
  const special = _isPinnedContractorRow(row);
  const selectable = !_isBulkDeleteBlockedKey(row.key) && !row.isForecast;
  const selected = selectable && contractorSelected.has(row.key);
  const detail = open
    ? (row.isForecast ? _renderContractorForecastDetails(row, colspan) : _renderContractorDetails(row, colspan))
    : "";
  const action = row.isForecast
    ? `<span class="contractor-muted">—</span>`
    : `<button class="btn btn-sm contractor-row-action" onclick="editContractor('${encodeURIComponent(row.key)}')" title="Редагувати контрагента">
          <i data-lucide="pencil"></i>
        </button>
        <button class="btn btn-sm contractor-row-action danger" onclick="deleteContractor('${encodeURIComponent(row.key)}')" title="Видалити контрагента">
          <i data-lucide="trash-2"></i>
        </button>`;
  const ctx = { open, status, selectable, selected, action };
  return `
    <tr class="contractor-main-row${special ? " contractor-special-row" : ""}${selected ? " contractor-selected" : ""}">
      ${cols.map(([key]) => _renderContractorMainCell(row, key, ctx)).join("")}
    </tr>${detail}`;
};

function _getContractorDetailColumns(group) {
  const cols = {
    contracts: [
      ["contractNo", "Договір"],
      ["taskName", "Робота"],
      ["total", "Сума договору"],
      ["note", "Примітка"],
      ["actions", "Дії"],
    ],
    acts: [
      ["date", "Дата акту"],
      ["type", "Тип"],
      ["name", "Акт"],
      ["amount", "Сума акту"],
      ["contractNo", "Договір"],
      ["itemName", "Опис товару/послуги"],
      ["taskName", "Робота"],
      ["note", "Примітка"],
      ["actions", "Дії"],
    ],
    payments: [
      ["date", "Дата платежу"],
      ["amount", "Сума платежу"],
      ["contractNo", "Договір"],
      ["actNo", "Акт"],
      ["taskName", "Робота"],
      ["note", "Примітка"],
      ["actions", "Дії"],
    ],
    forecast: [
      ["taskName", "Робота"],
      ["itemName", "Джерело"],
      ["budget", "Кошторис"],
      ["paid", "Оплачено без контрагента"],
      ["rest", "Залишок"],
    ],
  }[group] || [];
  return _applyStoredDetailColumnOrder(group, cols);
}

function _getContractorDetailWidths() {
  try {
    return { ...CONTRACTOR_DETAIL_COL_DEFAULTS, ...(JSON.parse(localStorage.getItem(CONTRACTOR_DETAIL_COL_SK) || "{}")) };
  } catch (_) {
    return { ...CONTRACTOR_DETAIL_COL_DEFAULTS };
  }
}

function _saveContractorDetailWidths(widths) {
  try {
    localStorage.setItem(CONTRACTOR_DETAIL_COL_SK, JSON.stringify(widths));
  } catch (_) { }
}

function _getStoredDetailColumnOrders() {
  try {
    const orders = JSON.parse(localStorage.getItem(CONTRACTOR_DETAIL_COL_ORDER_SK) || "{}");
    return orders && typeof orders === "object" ? orders : {};
  } catch (_) {
    return {};
  }
}

function _applyStoredDetailColumnOrder(group, base) {
  const order = _getStoredDetailColumnOrders()[group] || [];
  if (!Array.isArray(order) || !order.length) return base;
  const byKey = new Map(base.map((col) => [col[0], col]));
  const ordered = order.map((key) => byKey.get(key)).filter(Boolean);
  base.forEach((col) => {
    if (!order.includes(col[0])) ordered.push(col);
  });
  return ordered;
}

function _saveContractorDetailColumnOrder(group, cols) {
  const orders = _getStoredDetailColumnOrders();
  orders[group] = cols.map(([key]) => key);
  try {
    localStorage.setItem(CONTRACTOR_DETAIL_COL_ORDER_SK, JSON.stringify(orders));
  } catch (_) { }
}

function _renderContractorDetailHead(group, cols) {
  const sort = contractorDetailSort[group] || { col: "", dir: 1 };
  return cols.map(([key, label]) => {
    const resize = `<span class="contractor-col-resizer" onclick="event.stopPropagation()" onmousedown="startContractorDetailColResize(event,'${group}','${key}')"></span>`;
    const drag = `draggable="true" ondragstart="startContractorDetailColDrag(event,'${group}','${key}')" ondragover="event.preventDefault()" ondrop="dropContractorDetailCol(event,'${group}','${key}')" ondragend="endContractorDetailColDrag()"`;
    if (key === "actions") return `<th data-col="${key}" ${drag}>${label}${resize}</th>`;
    const cls = sort.col === key ? (sort.dir === 1 ? "asc" : "desc") : "";
    return `<th data-col="${key}" class="${cls}" onclick="if(!_contractorSuppressHeaderClick)sortContractorDetails('${group}','${key}')" ${drag}>${label}${resize}</th>`;
  }).join("");
}

function _renderContractorDetailTable(group, rows, emptyText, cellRenderer) {
  const cols = _getContractorDetailColumns(group);
  const widths = _getContractorDetailWidths();
  const colgroup = cols.map(([key]) => {
    const fullKey = `${group}.${key}`;
    return `<col style="width:${widths[fullKey] || CONTRACTOR_DETAIL_COL_DEFAULTS[fullKey] || 140}px">`;
  }).join("");
  const body = rows.length
    ? rows.map((row) => `<tr>${cols.map(([key]) => cellRenderer(row, key)).join("")}</tr>`).join("")
    : `<tr><td colspan="${cols.length}" class="contractor-empty">${emptyText}</td></tr>`;
  return `<table class="contractor-pay-tbl" data-detail-group="${group}">
    <colgroup>${colgroup}</colgroup>
    <thead><tr>${_renderContractorDetailHead(group, cols)}</tr></thead>
    <tbody>${body}</tbody>
  </table>`;
}

function _renderContractorContractCell(item, key) {
  if (key === "contractNo") return `<td>${_ctEsc(item.contractNo || item.itemName || "—")}</td>`;
  if (key === "itemName") return `<td>${_ctEsc(item.itemName || "—")}</td>`;
  if (key === "taskName") return `<td><span class="contractor-link" onclick="openContractorTask(${item.ti})">#${item.taskNo} ${_ctEsc(item.taskName)}</span></td>`;
  if (key === "total") return `<td class="contractor-num">${fmtM(Math.round(item.total || item.budget || 0))}</td>`;
  if (key === "budget") return `<td class="contractor-num">${fmtM(Math.round(item.budget || 0))}</td>`;
  if (key === "note") return `<td>${_ctEsc(item.note || "")}</td>`;
  if (key === "actions") return `<td class="contractor-pay-actions">
    <button class="btn btn-sm contractor-row-action" onclick="openContractorActModal('', '${_ctAttr(item.path)}')" title="Додати акт"><i data-lucide="file-text"></i></button>
    <button class="btn btn-sm contractor-row-action" onclick="openContractorPaymentModal('${_ctAttr(item.path)}')" title="Додати платіж"><i data-lucide="credit-card"></i></button>
  </td>`;
  return `<td></td>`;
}

function _renderContractorActCell(act, key) {
  if (key === "date") return `<td>${_ctEsc(_ctDisplayDate(act.date) || "—")}</td>`;
  if (key === "type") return `<td>${_ctEsc(CONTRACTOR_ACT_TYPES[act.type] || act.type || "—")}</td>`;
  if (key === "name") return `<td>${_ctEsc(act.name || "—")}</td>`;
  if (key === "amount") return `<td class="contractor-num">${fmtM(Math.round(act.amount || 0))}</td>`;
  if (key === "contractNo") return `<td>${_ctEsc(act.contractNo || "—")}<br><small>${fmtM(Math.round(act.contractAmount || 0))} грн</small></td>`;
  if (key === "itemName") return `<td>${_ctEsc(act.itemName || "—")}</td>`;
  if (key === "taskName") return `<td><span class="contractor-link" onclick="openContractorTask(${act.ti})">#${act.taskNo} ${_ctEsc(act.taskName)}</span></td>`;
  if (key === "note") return `<td>${_ctEsc(act.note || "")}</td>`;
  if (key === "actions") return `<td class="contractor-pay-actions">
    <button class="btn btn-sm contractor-row-action" onclick="editContractorAct('${_ctAttr(act.path)}')" title="Редагувати акт"><i data-lucide="pencil"></i></button>
    <button class="btn btn-sm contractor-row-action" onclick="openContractorPaymentModal('', '${_ctAttr(act.path)}')" title="Додати платіж"><i data-lucide="credit-card"></i></button>
    <button class="btn btn-sm contractor-row-action danger" onclick="deleteContractorAct('${_ctAttr(act.path)}')" title="Видалити акт"><i data-lucide="trash-2"></i></button>
  </td>`;
  return `<td></td>`;
}

function _renderContractorPaymentCell(p, key) {
  if (key === "date") return `<td>${_ctEsc(_ctDisplayDate(p.date) || "—")}</td>`;
  if (key === "amount") return `<td class="contractor-num">${fmtM(Math.round(p.amount || 0))}</td>`;
  if (key === "contractNo") return `<td>${_ctEsc(p.contractNo || "—")}<br><small>${fmtM(Math.round(p.contractAmount || 0))} грн</small></td>`;
  if (key === "actNo") return `<td>${_ctEsc(p.actNo || "—")}</td>`;
  if (key === "taskName") return `<td><span class="contractor-link" onclick="openContractorTask(${p.ti})">#${p.taskNo} ${_ctEsc(p.taskName)}</span></td>`;
  if (key === "itemName") return `<td>${_ctEsc(p.itemName)}</td>`;
  if (key === "note") return `<td>${_ctEsc(p.note || "")}</td>`;
  if (key === "actions") return `<td class="contractor-pay-actions">
    <button class="btn btn-sm contractor-row-action" onclick="editContractorPayment('${_ctAttr(p.path)}')" title="Редагувати платіж"><i data-lucide="pencil"></i></button>
    <button class="btn btn-sm contractor-row-action danger" onclick="deleteContractorPayment('${_ctAttr(p.path)}')" title="Видалити платіж"><i data-lucide="trash-2"></i></button>
  </td>`;
  return `<td></td>`;
}

function _renderContractorForecastCell(item, key) {
  const rest = (item.budget || 0) - (item.paid || 0);
  if (key === "taskName") return `<td><span class="contractor-link" onclick="openContractorTask(${item.ti})">#${item.taskNo} ${_ctEsc(item.taskName)}</span></td>`;
  if (key === "itemName") return `<td>${_ctEsc(item.itemName)}</td>`;
  if (key === "budget") return `<td class="contractor-num">${fmtM(Math.round(item.budget || 0))}</td>`;
  if (key === "paid") return `<td class="contractor-num">${fmtM(Math.round(item.paid || 0))}</td>`;
  if (key === "rest") return `<td class="contractor-num${rest < 0 ? " contractor-rest-negative" : ""}">${fmtM(Math.round(rest))}</td>`;
  return `<td></td>`;
}

_renderContractorDetails = function _renderContractorDetailsResizable(row, colspan) {
  const payments = _sortContractorDetailRows(row.payments || [], "payments");
  const acts = _sortContractorDetailRows(row.acts || [], "acts");
  const contracts = _sortContractorDetailRows(row.items || [], "contracts");
  return `
    <tr class="contractor-detail-row">
      <td colspan="${colspan}">
        <div class="contractor-detail-box">
          ${_renderContractorDetailTable("contracts", contracts, "Договорів по цьому контрагенту ще немає", _renderContractorContractCell)}
          ${_renderContractorDetailTable("acts", acts, "Актів по цьому контрагенту ще немає", _renderContractorActCell)}
          ${_renderContractorDetailTable("payments", payments, "Платежів по цьому контрагенту ще немає", _renderContractorPaymentCell)}
        </div>
      </td>
    </tr>`;
};

_renderContractorForecastDetails = function _renderContractorForecastDetailsResizable(row, colspan) {
  const rows = row.items.slice().sort((a, b) => a.taskNo - b.taskNo);
  return `
    <tr class="contractor-detail-row">
      <td colspan="${colspan}">
        <div class="contractor-detail-box">
          ${_renderContractorDetailTable("forecast", rows, "Планового кошторису без контрагента немає", _renderContractorForecastCell)}
        </div>
      </td>
    </tr>`;
};

function startContractorDetailColResize(event, group, col) {
  event.preventDefault();
  event.stopPropagation();
  const widths = _getContractorDetailWidths();
  const key = `${group}.${col}`;
  _contractorDetailResize = { group, col, key, startX: event.clientX, startW: widths[key] || CONTRACTOR_DETAIL_COL_DEFAULTS[key] || 140, widths };
  document.addEventListener("mousemove", _onContractorDetailColResize);
  document.addEventListener("mouseup", _stopContractorDetailColResize);
}

function _onContractorDetailColResize(event) {
  if (!_contractorDetailResize) return;
  const next = Math.max(52, _contractorDetailResize.startW + event.clientX - _contractorDetailResize.startX);
  _contractorDetailResize.widths[_contractorDetailResize.key] = next;
  const cols = _getContractorDetailColumns(_contractorDetailResize.group);
  const idx = cols.findIndex(([key]) => key === _contractorDetailResize.col) + 1;
  if (idx > 0) {
    document.querySelectorAll(`.contractor-pay-tbl[data-detail-group="${_contractorDetailResize.group}"] col:nth-child(${idx})`).forEach((col) => {
      col.style.width = `${next}px`;
    });
  }
}

function _stopContractorDetailColResize() {
  if (_contractorDetailResize) _saveContractorDetailWidths(_contractorDetailResize.widths);
  _contractorDetailResize = null;
  document.removeEventListener("mousemove", _onContractorDetailColResize);
  document.removeEventListener("mouseup", _stopContractorDetailColResize);
}

function startContractorDetailColDrag(event, group, col) {
  if (event.target?.closest?.(".contractor-col-resizer, input, button")) {
    event.preventDefault();
    return;
  }
  _contractorDetailColDrag = { group, col };
  event.dataTransfer?.setData("text/plain", `${group}.${col}`);
  event.dataTransfer?.setDragImage?.(event.currentTarget, 12, 12);
  event.currentTarget?.classList.add("contractor-col-dragging");
}

function dropContractorDetailCol(event, group, targetCol) {
  event.preventDefault();
  const source = _contractorDetailColDrag;
  if (!source || source.group !== group || source.col === targetCol) return;
  const cols = _getContractorDetailColumns(group);
  const from = cols.findIndex(([key]) => key === source.col);
  const to = cols.findIndex(([key]) => key === targetCol);
  if (from < 0 || to < 0) return;
  const [moved] = cols.splice(from, 1);
  cols.splice(to, 0, moved);
  _saveContractorDetailColumnOrder(group, cols);
  _contractorSuppressHeaderClick = true;
  setTimeout(() => { _contractorSuppressHeaderClick = false; }, 80);
  _contractorDetailColDrag = null;
  renderContractors();
}

function endContractorDetailColDrag() {
  _contractorDetailColDrag = null;
  document.querySelectorAll(".contractor-col-dragging").forEach((el) => el.classList.remove("contractor-col-dragging"));
}

function _ctDisplayDate(value) {
  const raw = _ctText(value);
  if (!raw) return "";
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[1]}.${iso[2]}.${iso[3]}`;
  const dotted = raw.match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
  if (dotted) return raw;
  const normalized = _ctDate(raw);
  const normalizedIso = String(normalized).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return normalizedIso ? `${normalizedIso[1]}.${normalizedIso[2]}.${normalizedIso[3]}` : raw;
}

function _ctCostType(value) {
  const v = _ctNormText(value);
  if (v.includes("мат") || v.includes("material")) return "material";
  if (v.includes("тех") || v.includes("облад") || v.includes("equip") || v.includes("tool")) return "equipment";
  if (v.includes("послуг") || v.includes("service")) return "service";
  if (v.includes("роб") || v.includes("work")) return "work";
  return "other";
}

function _ctPaymentType(value) {
  const v = _ctNormText(value);
  if (v.includes("аванс") || v.includes("передоп") || v.includes("advance") || v.includes("prepay")) return "advance";
  if (v.includes("акт") || v.includes("викон") || v.includes("закрит") || v.includes("act")) return "act";
  if (v.includes("рах") || v.includes("інвойс") || v.includes("invoice") || v.includes("bill")) return "invoice";
  return "other";
}

function _ctLooksLikePaymentType(value) {
  const paymentType = _ctPaymentType(value);
  return paymentType !== "other";
}

function _ctImportDocumentKind(row) {
  const rawPayType = _ctNormText(_ctVal(row, "paymentType"));
  const rawType = _ctNormText(_ctVal(row, "type"));
  const payKind = _ctDocumentKindFromText(rawPayType);
  if (payKind !== "none") return payKind;
  const typeKind = _ctDocumentKindFromText(rawType);
  if (typeKind !== "none") return typeKind;
  if (rawPayType) return "other";
  return "none";
}

function _ctDocumentKindFromText(raw) {
  if (!raw) return "none";
  if (raw.includes("догов") || raw.includes("контракт") || raw.includes("contract")) return "contract";
  if (raw.includes("аванс") || raw.includes("передоп") || raw.includes("advance") || raw.includes("prepay")) return "advance";
  if (raw.includes("акт") || raw.includes("викон") || raw.includes("закрит") || raw.includes("act")) return "act";
  if (raw.includes("рах") || raw.includes("інвойс") || raw.includes("invoice") || raw.includes("bill")) return "invoice";
  if (raw.includes("накл") || raw.includes("постав") || raw.includes("delivery")) return "delivery";
  return "none";
}

function _ctDocumentPaymentType(kind) {
  if (kind === "advance") return "advance";
  if (kind === "invoice") return "invoice";
  if (kind === "act") return "act";
  return "other";
}

function _ctImportCostType(row) {
  const rawType = _ctVal(row, "type");
  const documentKind = _ctImportDocumentKind(row);
  if (documentKind === "contract") return "work";
  if (_ctLooksLikePaymentType(rawType)) return "service";
  if (["advance", "act", "invoice", "delivery", "other"].includes(documentKind)) return "service";
  if (!rawType && (_ctVal(row, "paymentType") || _ctVal(row, "itemName"))) return "service";
  return _ctCostType(rawType);
}

function _ctImportPaymentType(row) {
  return _ctPaymentType(_ctVal(row, "paymentType") || _ctVal(row, "type"));
}

function _ctFindImportCostItem(items, supplier, name, type, row) {
  const supplierKey = _contractorKey(supplier);
  const nameKey = _ctNormText(name);
  const contractNoKey = _ctNormText(_ctVal(row, "contractNo"));
  return (items || []).find((item) => {
    const sameSupplier = _contractorKey(item.supplier) === supplierKey;
    const sameContract = contractNoKey && _ctNormText(item.contractNo || item.name) === contractNoKey;
    const sameName = _ctNormText(item.name) === nameKey;
    const sameType = (item.type || "other") === type;
    return sameSupplier && (sameContract || (sameName && sameType));
  });
}

function _ctImportCostItemKey(task, supplier, name, type) {
  return [
    task?.id || task?.n || "",
    _contractorKey(supplier),
    _ctNormText(name),
    type || "other",
  ].join("|");
}

function _ctImportPaymentKey(itemKey, payment) {
  return [
    itemKey,
    payment.date || "",
    payment.type || "other",
    Math.round((+payment.amount || 0) * 100),
    payment.note || "",
  ].join("|");
}

function _isContractorPaymentDuplicate(item, payment) {
  return (item?.payments || []).some(
    (p) =>
      (p.date || "") === (payment.date || "") &&
      (p.type || "other") === (payment.type || "other") &&
      Math.abs((+p.amount || 0) - (+payment.amount || 0)) < 0.01 &&
      (p.note || "") === (payment.note || ""),
  );
}

function _ctDefaultItemName(type) {
  return COST_TYPES?.[type]?.label || "Опис товару/послуги";
}

function _ctRecalcTaskTotals(task) {
  const items = typeof taskCostItems === "function" ? taskCostItems(task) : (task.costItems || task.cost_items || []);
  const itemsBudget = Math.round(items.reduce((sum, item) => sum + _ctItemTotal(item), 0));
  if (task.contractsOverrideBudget || (+task.budget || 0) <= 0) task.budget = itemsBudget;
  task.spent = Math.round(
    items.reduce((sum, item) => sum + (item.payments || []).reduce((pSum, p) => pSum + (+p.amount || 0), 0), 0),
  );
}

function _ctItemTotal(item) {
  const qty = item.qty == null ? 1 : (+item.qty || 0);
  return qty * (+item.unitPrice || 0);
}

function _ctIsEmptyRow(row) {
  return Object.values(row).every((value) => _ctText(value) === "");
}

function _contractorName(name) {
  return _ctText(name) || CONTRACTOR_EMPTY_NAME;
}

function _contractorKey(name) {
  return _contractorName(name).toLocaleLowerCase("uk-UA");
}

function _ctEsc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function _ctAttr(value) {
  return _ctEsc(value).replace(/'/g, "&#39;");
}
