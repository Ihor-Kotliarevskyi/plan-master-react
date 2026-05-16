let _costTi = null;
let _costItems = [];
let _expandedIds = new Set();
let _costIdSeq = 1;

const COST_TYPES = {
  material: { label: "Матеріали", icon: "🧱" },
  work: { label: "Роботи", icon: "👷" },
  equipment: { label: "Техніка", icon: "🔧" },
  service: { label: "Послуги", icon: "🤝" },
  other: { label: "Інше", icon: "📦" },
};

const PAYMENT_TYPES = {
  advance: "Аванс",
  act: "Акт",
  invoice: "Рахунок",
  other: "Інше",
};

const UNITS = [
  "м²", "м³", "пог.м", "т", "кг", "шт", "год",
  "люд*год", "день", "люд*день", "компл", "л", "рулон", "уп",
];

function _nextCostId() {
  return ++_costIdSeq + (Date.now() % 1000000);
}

function openCostModal(ti) {
  openEdit(ti);
  setTimeout(() => switchTaskTab("costs"), 20);
}

function closeCostModal() {}

function saveCostModal() {
  saveTask();
}

/** Рендерить таблицю кошторису. */
function renderCostTable() {
  const tbody = document.getElementById("cost-tbody");
  const foot = document.getElementById("cost-footer");
  if (!tbody) return;

  if (!_costItems.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="cost-empty">
      Рядків немає — натисніть кнопку "Типу" вище щоб додати
    </td></tr>`;
  } else {
    tbody.innerHTML = _costItems.map((it) => _renderCostRow(it)).join("");
  }

  const budget = _totalBudget();
  const spent = _totalSpent();
  const rest = budget - spent;
  const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;

  if (foot)
    foot.innerHTML = `
    <div class="cost-total-row">
      <span class="cost-total-lbl">Кошторис:</span>
      <span class="cost-total-val">${fmtM(budget)} грн</span>
    </div>
    <div class="cost-total-row">
      <span class="cost-total-lbl">Сплачено:</span>
      <span class="cost-total-val" style="color:${spent > budget && budget > 0 ? "var(--err)" : "var(--ok)"}">${fmtM(spent)} грн${budget > 0 ? " (" + pct + "%)" : ""}</span>
    </div>
    <div class="cost-total-row">
      <span class="cost-total-lbl">Залишок:</span>
      <span class="cost-total-val" style="color:${rest < 0 ? "var(--err)" : "inherit"}">${fmtM(rest)} грн</span>
    </div>`;

  if (typeof _updateAutoBadges === "function") _updateAutoBadges(_costItems.length > 0);
  if (typeof updCalc === "function") updCalc();
  lucide.createIcons({ nodes: [document.getElementById("cost-tbody")] });
}

function _renderCostRow(it) {
  const total = _costItemTotal(it);
  const paid = (it.payments || []).reduce((s, p) => s + (+p.amount || 0), 0);
  const isOpen = _expandedIds.has(it.id);
  const id = it.id;

  const mainRow = `
    <tr class="cost-row" id="cr${id}">
      <td class="cost-td">
        <select class="cost-sel" onchange="setCostField(${id},'type',this.value);_recalcRow(${id})">
          ${Object.entries(COST_TYPES)
            .map(([k, v]) => `<option value="${k}"${it.type === k ? " selected" : ""}>${v.icon} ${v.label}</option>`)
            .join("")}
        </select>
      </td>
      <td class="cost-td">
        <input class="cost-inp" id="cn${id}" placeholder="Договір №"
               value="${_esc(it.contractNo || it.name || "")}"
               onblur="setCostContractNo(${id},this.value)">
      </td>
      <td class="cost-td">
        <input class="cost-inp" id="cs${id}" placeholder="Контрагент"
               value="${_esc(it.supplier || "")}"
               onblur="setCostField(${id},'supplier',this.value)">
      </td>
      <td class="cost-td cost-num-td">
        <input class="cost-inp cost-num-inp" id="cp${id}" type="number" min="0" step="1"
               value="${it.unitPrice != null ? it.unitPrice : ""}" placeholder="0"
               onblur="setCostField(${id},'unitPrice',+this.value);_recalcRow(${id})">
      </td>
      <td class="cost-td">
        <input class="cost-inp" id="cnote${id}" placeholder="Примітки"
               value="${_esc(it.contractNote || it.note || "")}"
               onblur="setCostField(${id},'contractNote',this.value)">
      </td>
      <td class="cost-td cost-total-td">
        <span id="ctotal${id}" class="cost-total-cell">${fmtM(total)}</span>
        ${paid > 0 ? `<span class="cost-paid-cell">/ ${fmtM(paid)}</span>` : ""}
        <button class="cost-act-btn${isOpen ? " active" : ""}" style="margin-top:2px;display:block;width:100%"
                onclick="toggleCostPayments(${id})">
          ${isOpen ? "▲" : "▼"} ${it.payments?.length || 0} плат.
        </button>
        <button class="cost-act-btn del" style="display:block;width:100%;margin-top:2px"
                onclick="deleteCostItem(${id})"><i data-lucide="x"></i></button>
      </td>
    </tr>`;

  const payRow = isOpen
    ? `
    <tr class="cost-pay-row">
      <td colspan="6" class="cost-pay-td">
        <div class="cost-pay-wrap">
          ${(it.payments || []).map((p, pi) => _renderPaymentRow(id, p, pi)).join("")}
          <button class="btn btn-sm cost-add-pay-btn" onclick="addPayment(${id})">+ Платіж</button>
        </div>
      </td>
    </tr>`
    : "";

  return mainRow + payRow;
}

function _renderPaymentRow(itemId, p, pi) {
  return `<div class="pay-row" data-iid="${itemId}" data-pi="${pi}">
    <input type="date" class="cost-inp pay-date" value="${p.date || ""}"
           onchange="setPayField(${itemId},${pi},'date',this.value)">
    <select class="cost-sel pay-type-sel" onchange="setPayField(${itemId},${pi},'type',this.value)">
      ${Object.entries(PAYMENT_TYPES)
        .map(([k, v]) => `<option value="${k}"${p.type === k ? " selected" : ""}>${v}</option>`)
        .join("")}
    </select>
    <input type="number" class="cost-inp pay-amount" min="0" step="100"
           value="${p.amount || ""}" placeholder="Сума (грн)"
           onblur="setPayField(${itemId},${pi},'amount',+this.value);_refreshTotals()">
    <input class="cost-inp pay-note" value="${_esc(p.note || "")}"
           placeholder="Примітка (акт №, аванс тощо)"
           onblur="setPayField(${itemId},${pi},'note',this.value)">
    <button class="cost-act-btn del" onclick="deletePayment(${itemId},${pi})"><i data-lucide="x"></i></button>
  </div>`;
}

function _recalcRow(id) {
  const it = _costItems.find((it) => it.id === id);
  if (!it) return;
  const total = _costItemTotal(it);
  const el = document.getElementById(`ctotal${id}`);
  if (el) el.textContent = fmtM(total);
  _refreshTotals();
}

function _refreshTotals() {
  const budget = _totalBudget();
  const spent = _totalSpent();
  const rest = budget - spent;
  const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const foot = document.getElementById("cost-footer");
  if (!foot) return;
  foot.innerHTML = `
    <div class="cost-total-row">
      <span class="cost-total-lbl">Кошторис:</span>
      <span class="cost-total-val">${fmtM(budget)} грн</span>
    </div>
    <div class="cost-total-row">
      <span class="cost-total-lbl">Сплачено:</span>
      <span class="cost-total-val" style="color:${spent > budget && budget > 0 ? "var(--err)" : "var(--ok)"}">${fmtM(spent)} грн${budget > 0 ? " (" + pct + "%)" : ""}</span>
    </div>
    <div class="cost-total-row">
      <span class="cost-total-lbl">Залишок:</span>
      <span class="cost-total-val" style="color:${rest < 0 ? "var(--err)" : "inherit"}">${fmtM(rest)} грн</span>
    </div>`;
  if (typeof _updateAutoBadges === "function") _updateAutoBadges(_costItems.length > 0);
  if (typeof updCalc === "function") updCalc();
}

function addCostItem(type = "material") {
  _flushCostEdits();
  _costItems.push({
    id: _nextCostId(),
    type,
    name: "",
    supplier: "",
    unit: "договір",
    qty: 1,
    unitPrice: null,
    contractNo: "",
    contractNote: "",
    payments: [],
  });
  renderCostTable();
  setTimeout(
    () => document.querySelector(`#cn${_costItems[_costItems.length - 1].id}`)?.focus(),
    50,
  );
}

function deleteCostItem(id) {
  _flushCostEdits();
  _costItems = _costItems.filter((it) => it.id !== id);
  _expandedIds.delete(id);
  renderCostTable();
}

function setCostField(id, field, value) {
  const it = _costItems.find((it) => it.id === id);
  if (!it) return;
  it[field] = value === "__custom" ? "" : value;
  if (field === "contractNote") it.note = it[field];
}

function setCostContractNo(id, value) {
  const it = _costItems.find((it) => it.id === id);
  if (!it) return;
  it.contractNo = value;
  it.name = value ? `Договір ${value}` : "";
}

function toggleCostPayments(id) {
  _flushCostEdits();
  if (_expandedIds.has(id)) _expandedIds.delete(id);
  else _expandedIds.add(id);
  renderCostTable();
}

function addPayment(itemId) {
  _flushCostEdits();
  const it = _costItems.find((it) => it.id === itemId);
  if (!it) return;
  if (!it.payments) it.payments = [];
  it.payments.push({
    id: _nextCostId(),
    date: new Date().toISOString().slice(0, 10),
    type: "act",
    amount: null,
    note: "",
  });
  _expandedIds.add(itemId);
  renderCostTable();
  setTimeout(() => {
    const rows = document.querySelectorAll(`.pay-row[data-iid="${itemId}"]`);
    rows[rows.length - 1]?.querySelector(".pay-amount")?.focus();
  }, 50);
}

function deletePayment(itemId, pi) {
  _flushCostEdits();
  const it = _costItems.find((it) => it.id === itemId);
  if (it?.payments) {
    it.payments.splice(pi, 1);
    renderCostTable();
  }
}

function setPayField(itemId, pi, field, value) {
  const it = _costItems.find((it) => it.id === itemId);
  if (it?.payments?.[pi]) it.payments[pi][field] = value;
}

/** Зчитує поточні значення DOM у _costItems перед збереженням. */
function _flushCostEdits() {
  _costItems.forEach((it) => {
    const id = it.id;
    const nameEl = document.getElementById(`cn${id}`);
    const supEl = document.getElementById(`cs${id}`);
    const priceEl = document.getElementById(`cp${id}`);
    const noteEl = document.getElementById(`cnote${id}`);
    if (nameEl) {
      it.contractNo = nameEl.value;
      it.name = nameEl.value ? `Договір ${nameEl.value}` : "";
    }
    if (supEl) it.supplier = supEl.value;
    it.qty = 1;
    it.unit = "договір";
    if (priceEl) it.unitPrice = parseFloat(priceEl.value) || 0;
    if (noteEl) {
      it.contractNote = noteEl.value;
      it.note = noteEl.value;
    }

    (it.payments || []).forEach((p, pi) => {
      const row = document.querySelector(`.pay-row[data-iid="${id}"][data-pi="${pi}"]`);
      if (!row) return;
      const dateEl = row.querySelector(".pay-date");
      const amtEl = row.querySelector(".pay-amount");
      const noteEl = row.querySelector(".pay-note");
      if (dateEl) p.date = dateEl.value;
      if (amtEl) p.amount = parseFloat(amtEl.value) || 0;
      if (noteEl) p.note = noteEl.value;
    });
  });
}

function _totalBudget() {
  return Math.round(_costItems.reduce((s, it) => s + _costItemTotal(it), 0));
}

function _costItemTotal(it) {
  const qty = it.qty == null ? 1 : (+it.qty || 0);
  return qty * (+it.unitPrice || 0);
}

function _totalSpent() {
  return Math.round(
    _costItems.reduce(
      (s, it) => s + (it.payments || []).reduce((sp, p) => sp + (+p.amount || 0), 0),
      0,
    ),
  );
}

/** Екранує спецсимволи HTML для підстановки в атрибути. */
function _esc(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
