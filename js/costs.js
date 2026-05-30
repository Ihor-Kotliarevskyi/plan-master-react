let _costTi = null;
let _costItems = [];
let _expandedIds = new Set();
let _costIdSeq = 1;
const COST_UI =
  typeof buildRuntimeCostUiModel === "function"
    ? buildRuntimeCostUiModel()
    : {
        labels: {
          emptyStateText: "Рядків немає — натисніть кнопку \"Тип\" вище щоб додати",
          budgetLabel: "Кошторис:",
          spentLabel: "Сплачено:",
          restLabel: "Залишок:",
          contractPlaceholder: "Договір №",
          supplierPlaceholder: "Контрагент",
          notePlaceholder: "Примітки",
          paymentAmountPlaceholder: "Сума (грн)",
          paymentNotePlaceholder: "Примітка (акт №, аванс тощо)",
          addPaymentLabel: "+ Платіж",
          paymentCountLabel: (count, isOpen) => `${isOpen ? "▾" : "▸"} ${count} плат.`,
          deleteItemTitle: "Видалити",
          contractNamePrefix: "Договір",
          defaultUnit: "договір",
          currencyUnit: "грн",
        },
      };

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

function _getCostTotals() {
  if (typeof buildRuntimeCalculateCostTotals === "function") {
    return buildRuntimeCalculateCostTotals(_costItems);
  }
  const budget = Math.round(_costItems.reduce((s, it) => s + _costItemTotal(it), 0));
  const spent = Math.round(
    _costItems.reduce(
      (s, it) => s + (it.payments || []).reduce((sp, p) => sp + (+p.amount || 0), 0),
      0,
    ),
  );
  const rest = budget - spent;
  const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  return { budget, spent, rest, pct };
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

  const { budget, spent, rest, pct } = _getCostTotals();

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
  if (typeof _applyTaskModalPermissions === "function") _applyTaskModalPermissions();
  if (typeof isReactTaskModalEnabled === "function" && isReactTaskModalEnabled()) syncReactTaskModalBridge();
}

function _renderCostRow(it) {
  const total = _costItemTotal(it);
  const paid = typeof buildRuntimeCalculateCostSpent === "function"
    ? buildRuntimeCalculateCostSpent(it)
    : (it.payments || []).reduce((s, p) => s + (+p.amount || 0), 0);
  const isOpen = _expandedIds.has(it.id);
  const id = it.id;

  const mainRow = `
    <tr class="cost-row" id="cr${id}">
      <td class="cost-td">
        <select class="cost-sel" data-cost-editor-input="item-type" data-item-id="${id}">
          ${Object.entries(COST_TYPES)
            .map(([k, v]) => `<option value="${k}"${it.type === k ? " selected" : ""}>${v.icon} ${v.label}</option>`)
            .join("")}
        </select>
      </td>
      <td class="cost-td">
        <input class="cost-inp" id="cn${id}" placeholder="Договір №"
               value="${_esc(it.contractNo || it.name || "")}"
               data-cost-editor-input="contract-no" data-item-id="${id}">
      </td>
      <td class="cost-td">
        <input class="cost-inp" id="cs${id}" placeholder="Контрагент"
               value="${_esc(it.supplier || "")}"
               data-cost-editor-input="supplier" data-item-id="${id}">
      </td>
      <td class="cost-td cost-num-td">
        <input class="cost-inp cost-num-inp" id="cp${id}" type="number" min="0" step="1"
               value="${it.unitPrice != null ? it.unitPrice : ""}" placeholder="0"
               data-cost-editor-input="unit-price" data-item-id="${id}">
      </td>
      <td class="cost-td">
        <input class="cost-inp" id="cnote${id}" placeholder="Примітки"
               value="${_esc(it.contractNote || it.note || "")}"
               data-cost-editor-input="contract-note" data-item-id="${id}">
      </td>
      <td class="cost-td cost-total-td">
        <span id="ctotal${id}" class="cost-total-cell">${fmtM(total)}</span>
        ${paid > 0 ? `<span class="cost-paid-cell">/ ${fmtM(paid)}</span>` : ""}
        <button class="cost-act-btn${isOpen ? " active" : ""}" style="margin-top:2px;display:block;width:100%"
                data-cost-editor-action="toggle-payments" data-item-id="${id}" type="button">
          ${isOpen ? "▲" : "▼"} ${it.payments?.length || 0} плат.
        </button>
        <button class="cost-act-btn del" style="display:block;width:100%;margin-top:2px"
                data-cost-editor-action="delete-item" data-item-id="${id}" type="button"><i data-lucide="x"></i></button>
      </td>
    </tr>`;

  const payRow = isOpen
    ? `
    <tr class="cost-pay-row">
      <td colspan="6" class="cost-pay-td">
        <div class="cost-pay-wrap">
          ${(it.payments || []).map((p, pi) => _renderPaymentRow(id, p, pi)).join("")}
          <button class="btn btn-sm cost-add-pay-btn" data-cost-editor-action="add-payment" data-item-id="${id}" type="button">+ Платіж</button>
        </div>
      </td>
    </tr>`
    : "";

  return mainRow + payRow;
}

function _renderPaymentRow(itemId, p, pi) {
  return `<div class="pay-row" data-iid="${itemId}" data-pi="${pi}">
    <input type="date" class="cost-inp pay-date" value="${p.date || ""}"
           data-cost-editor-input="payment-date" data-item-id="${itemId}" data-payment-index="${pi}">
    <select class="cost-sel pay-type-sel" data-cost-editor-input="payment-type" data-item-id="${itemId}" data-payment-index="${pi}">
      ${Object.entries(PAYMENT_TYPES)
        .map(([k, v]) => `<option value="${k}"${p.type === k ? " selected" : ""}>${v}</option>`)
        .join("")}
    </select>
    <input type="number" class="cost-inp pay-amount" min="0" step="100"
           value="${p.amount || ""}" placeholder="Сума (грн)"
           data-cost-editor-input="payment-amount" data-item-id="${itemId}" data-payment-index="${pi}">
    <input class="cost-inp pay-note" value="${_esc(p.note || "")}"
           placeholder="Примітка (акт №, аванс тощо)"
           data-cost-editor-input="payment-note" data-item-id="${itemId}" data-payment-index="${pi}">
    <button class="cost-act-btn del" data-cost-editor-action="delete-payment" data-item-id="${itemId}" data-payment-index="${pi}" type="button"><i data-lucide="x"></i></button>
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
  const { budget, spent, rest, pct } = _getCostTotals();
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
  if (typeof isReactTaskModalEnabled === "function" && isReactTaskModalEnabled()) syncReactTaskModalBridge();
}

function addCostItem(type = "material") {
  if (typeof canEditTasks === "function" && !canEditTasks()) return;
  _flushCostEdits();
  const itemId = _nextCostId();
  const nextItem = typeof buildRuntimeCreateCostItem === "function"
    ? buildRuntimeCreateCostItem({ id: itemId, type, defaultUnit: COST_UI.labels.defaultUnit })
    : {
        id: itemId,
        type,
        name: "",
        supplier: "",
        unit: COST_UI.labels.defaultUnit,
        qty: 1,
        unitPrice: null,
        contractNo: "",
        contractNote: "",
        payments: [],
      };
  _costItems.push(nextItem);
  renderCostTable();
  setTimeout(
    () => document.querySelector(`#cn${_costItems[_costItems.length - 1].id}`)?.focus(),
    50,
  );
}

function deleteCostItem(id) {
  if (typeof canEditTasks === "function" && !canEditTasks()) return;
  _flushCostEdits();
  _costItems = typeof buildRuntimeRemoveCostItem === "function"
    ? buildRuntimeRemoveCostItem(_costItems, id)
    : _costItems.filter((it) => it.id !== id);
  _expandedIds.delete(id);
  renderCostTable();
}

function setCostField(id, field, value) {
  if (typeof canEditTasks === "function" && !canEditTasks()) return;
  _costItems = typeof buildRuntimeUpdateCostItemField === "function"
    ? buildRuntimeUpdateCostItemField(_costItems, id, field, value)
    : _costItems.map((it) => {
        if (it.id !== id) return it;
        const nextValue = value === "__custom" ? "" : value;
        return { ...it, [field]: nextValue, ...(field === "contractNote" ? { note: nextValue } : {}) };
      });
}

function setCostContractNo(id, value) {
  if (typeof canEditTasks === "function" && !canEditTasks()) return;
  _costItems = typeof buildRuntimeUpdateCostItemContract === "function"
    ? buildRuntimeUpdateCostItemContract(_costItems, id, value, COST_UI.labels.contractNamePrefix)
    : _costItems.map((it) =>
        it.id !== id
          ? it
          : { ...it, contractNo: value, name: value ? `${COST_UI.labels.contractNamePrefix} ${value}` : "" }
      );
}

function toggleCostPayments(id) {
  if (typeof canEditTasks === "function" && !canEditTasks()) return;
  _flushCostEdits();
  const nextExpanded = typeof buildRuntimeToggleExpandedCostId === "function"
    ? buildRuntimeToggleExpandedCostId(Array.from(_expandedIds), id)
    : (_expandedIds.has(id)
        ? Array.from(_expandedIds).filter((entry) => entry !== id)
        : [...Array.from(_expandedIds), id]);
  _expandedIds = new Set(nextExpanded);
  renderCostTable();
}

function addPayment(itemId) {
  if (typeof canEditTasks === "function" && !canEditTasks()) return;
  _flushCostEdits();
  const payment = typeof buildRuntimeCreateCostPayment === "function"
    ? buildRuntimeCreateCostPayment({
        id: _nextCostId(),
        date: new Date().toISOString().slice(0, 10),
        type: "act",
      })
    : {
        id: _nextCostId(),
        date: new Date().toISOString().slice(0, 10),
        type: "act",
        amount: null,
        note: "",
      };
  _costItems = typeof buildRuntimeAddPaymentToCostItem === "function"
    ? buildRuntimeAddPaymentToCostItem(_costItems, itemId, payment)
    : _costItems.map((it) =>
        it.id !== itemId
          ? it
          : { ...it, payments: [...(Array.isArray(it.payments) ? it.payments : []), payment] }
      );
  _expandedIds.add(itemId);
  renderCostTable();
  setTimeout(() => {
    const rows = document.querySelectorAll(`.pay-row[data-iid="${itemId}"]`);
    rows[rows.length - 1]?.querySelector(".pay-amount")?.focus();
  }, 50);
}

function deletePayment(itemId, pi) {
  if (typeof canEditTasks === "function" && !canEditTasks()) return;
  _flushCostEdits();
  _costItems = typeof buildRuntimeRemovePaymentFromCostItem === "function"
    ? buildRuntimeRemovePaymentFromCostItem(_costItems, itemId, pi)
    : _costItems.map((it) => {
        if (it.id !== itemId || !Array.isArray(it.payments)) return it;
        return { ...it, payments: it.payments.filter((_, idx) => idx !== pi) };
      });
  renderCostTable();
}

function setPayField(itemId, pi, field, value) {
  if (typeof canEditTasks === "function" && !canEditTasks()) return;
  _costItems = typeof buildRuntimeUpdateCostPaymentField === "function"
    ? buildRuntimeUpdateCostPaymentField(_costItems, itemId, pi, field, value)
    : _costItems.map((it) => {
        if (it.id !== itemId || !Array.isArray(it.payments)) return it;
        return {
          ...it,
          payments: it.payments.map((payment, idx) => idx !== pi ? payment : { ...payment, [field]: value }),
        };
      });
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
      it.name = nameEl.value ? `${COST_UI.labels.contractNamePrefix} ${nameEl.value}` : "";
    }
    if (supEl) it.supplier = supEl.value;
    it.qty = 1;
    it.unit = COST_UI.labels.defaultUnit;
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
  return _getCostTotals().budget;
}

function _costItemTotal(it) {
  if (typeof buildRuntimeCalculateCostItemTotal === "function") return buildRuntimeCalculateCostItemTotal(it);
  const qty = it.qty == null ? 1 : (+it.qty || 0);
  return qty * (+it.unitPrice || 0);
}

function _totalSpent() {
  return _getCostTotals().spent;
}

/** Екранує спецсимволи HTML для підстановки в атрибути. */
function _esc(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
