/** Загальна кількість тижнів у проєкті. */
function TW() {
  return proj.nm * 4;
}

/** Масив місяців з назвами та роками. */
function getML() {
  const r = [];
  for (let i = 0; i < proj.nm; i++) {
    const m = (proj.sm + i) % 12;
    const y = proj.sy + Math.floor((proj.sm + i) / 12);
    r.push({ name: MN[m], m, y });
  }
  return r;
}

/** Поточний тиждень у координатах проєкту (-1 якщо поза діапазоном). */
function todayWk() {
  const now = new Date();
  const mDiff = (now.getFullYear() - proj.sy) * 12 + (now.getMonth() - proj.sm);
  if (mDiff < 0 || mDiff >= proj.nm) return -1;
  const wInM = Math.min(3, Math.floor((now.getDate() - 1) / 7));
  return mDiff * 4 + wInM;
}

/** Перший видимий тиждень з урахуванням hidePast. */
function visStart() {
  if (!hidePast) return 0;
  const tw = todayWk();
  if (tw < 0) return 0;
  return Math.floor(tw / 4) * 4;
}

/** Тривалість задачі в тижнях. */
function dur(t) {
  return t.me * 4 + t.we - t.ms * 4 - t.ws + 1;
}

/** Кількість тижнів, що залишилися до кінця задачі. */
function remWk(t) {
  return Math.max(0, t.me * 4 + t.we - todayWk());
}

/** Форматування суми у гривнях. */
function fmtM(v) {
  if (v === null || v === undefined || v === "") return "—";
  return new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 }).format(v);
}

/** Екранує значення для HTML. */
function htmlEsc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function multiFilterValues(value) {
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
  if (value === null || value === undefined || value === "") return [];
  return [String(value)];
}

function multiFilterHas(value, option) {
  const values = multiFilterValues(value);
  return values.length === 0 || values.includes(String(option));
}

function multiFilterAny(value, options) {
  const values = multiFilterValues(value);
  if (!values.length) return true;
  const set = new Set((options || []).map((v) => String(v)));
  return values.some((v) => set.has(String(v)));
}

let _openMultiFilterPath = "";

function _multiFilterRoot(rootName) {
  try {
    return Function(`return typeof ${rootName} !== "undefined" ? ${rootName} : null`)();
  } catch (_) {
    return null;
  }
}

function setMultiFilter(path, option, checked, renderFnName) {
  const [rootName, field] = String(path || "").split(".");
  const root = _multiFilterRoot(rootName);
  if (!root || !field) return;
  _openMultiFilterPath = String(path || "");
  const values = new Set(multiFilterValues(root[field]));
  const opt = String(option);
  if (checked) values.add(opt);
  else values.delete(opt);
  root[field] = [...values];
  if (rootName === "ganttFilters" && typeof _saveGanttFilters === "function") _saveGanttFilters();
  if (rootName === "finFilters" && typeof renderFinFilters === "function") renderFinFilters();
  const renderFn = window[renderFnName];
  if (typeof renderFn === "function") renderFn();
}

function resetMultiFilter(path, renderFnName) {
  const [rootName, field] = String(path || "").split(".");
  const root = _multiFilterRoot(rootName);
  if (!root || !field) return;
  _openMultiFilterPath = String(path || "");
  root[field] = [];
  if (rootName === "ganttFilters" && typeof _saveGanttFilters === "function") _saveGanttFilters();
  if (rootName === "finFilters" && typeof renderFinFilters === "function") renderFinFilters();
  const renderFn = window[renderFnName];
  if (typeof renderFn === "function") renderFn();
}

function renderMultiFilter(path, label, allLabel, options, renderFnName, extraClass = "") {
  const [rootName, field] = String(path || "").split(".");
  const root = _multiFilterRoot(rootName) || {};
  const selected = multiFilterValues(root[field]);
  const selectedSet = new Set(selected);
  const cleanOptions = (options || []).filter((item) => item && item.value !== undefined);
  const selectedLabels = cleanOptions
    .filter((item) => selectedSet.has(String(item.value)))
    .map((item) => item.label);
  const summary = selectedLabels.length ? selectedLabels.join(", ") : allLabel;
  const count = selectedLabels.length ? `<span class="mf-count">${selectedLabels.length}</span>` : "";
  const isOpen = _openMultiFilterPath === String(path || "");
  return `<details class="multi-filter ${extraClass}" data-multi-filter-root data-filter-path="${htmlEsc(path)}" ${isOpen ? "open" : ""}>
    <summary title="${htmlEsc(summary)}" data-multi-filter-action="toggle" data-filter-path="${htmlEsc(path)}"><span>${htmlEsc(label)}</span><b>${htmlEsc(summary)}</b>${count}</summary>
    <div class="multi-filter-menu">
      <button type="button" class="multi-filter-clear" data-multi-filter-action="reset" data-filter-path="${htmlEsc(path)}" data-render-fn="${htmlEsc(renderFnName)}">${htmlEsc(allLabel)}</button>
      ${cleanOptions.map((item) => `
        <label class="multi-filter-option">
          <input type="checkbox" value="${htmlEsc(item.value)}"${selectedSet.has(String(item.value)) ? " checked" : ""}
                 data-multi-filter-action="set-option" data-filter-path="${htmlEsc(path)}" data-filter-option="${htmlEsc(item.value)}" data-render-fn="${htmlEsc(renderFnName)}">
          <span>${htmlEsc(item.label)}</span>
        </label>`).join("")}
    </div>
  </details>`;
}

/** Колір категорії за індексом. */
function openMultiFilter(path, summaryEl, event) {
  event?.preventDefault();
  _openMultiFilterPath = _openMultiFilterPath === String(path || "") ? "" : String(path || "");
  closeOtherMultiFilters(summaryEl);
  const current = summaryEl?.closest(".multi-filter");
  if (current) {
    if (_openMultiFilterPath) current.setAttribute("open", "open");
    else current.removeAttribute("open");
  }
}

function closeOtherMultiFilters(summaryEl) {
  const current = summaryEl?.closest(".multi-filter");
  document.querySelectorAll(".multi-filter[open]").forEach((el) => {
    if (el !== current) el.removeAttribute("open");
  });
}

document.addEventListener("click", () => {
  _openMultiFilterPath = "";
  document.querySelectorAll(".multi-filter[open]").forEach((el) => {
    el.removeAttribute("open");
  });
});

function CC(i) {
  return (cats[i] || { color: "#888" }).color;
}

/** Назва категорії за індексом. */
function CN(i) {
  return (cats[i] || { name: "?" }).name;
}

/** Перевіряє, чи значення має формат UUID. */
function isUuid(v) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v || ""));
}

/** Генерує унікальний UUID для задачі. */
function genId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (+c ^ (Math.random() * 16) >> (+c / 4)).toString(16),
  );
}

/** Нормалізує залежність до формату {id, type, threshold}. Підтримує застарілі формати. */
function normDep(dep) {
  if (dep && typeof dep === "object" && dep.id)
    return { id: dep.id, type: dep.type || "FS", threshold: dep.threshold || 0 };
  // Застарілий формат {n, type, threshold}
  if (dep && typeof dep === "object" && dep.n !== undefined)
    return { id: String(dep.n), type: dep.type || "FS", threshold: dep.threshold || 0 };
  // Застарілий формат — просто число
  return { id: String(dep), type: "FS", threshold: 0 };
}

/** Повертає масив id залежностей. */
function depIds(t) {
  return (t.deps || []).map((d) => normDep(d).id);
}

/** @deprecated Псевдонім для depIds. */
function depNums(t) { return depIds(t); }

/** Перевірка порушень залежностей з урахуванням типу зв'язку (FS/SS/FF). */
function checkDeps(t) {
  const w = [];
  (t.deps || []).forEach((rawDep) => {
    const dep = normDep(rawDep);
    const d = tasks.find((x) => x.id === dep.id);
    if (!d) return;

    if (dep.type === "FF") return;

    if (dep.type === "FS") {
      const de = d.me * 4 + d.we;
      const ts2 = t.ms * 4 + t.ws;
      if (de > ts2)
        w.push(`"${d.name}" закінчується після початку цієї роботи (${de - ts2} тиж.)`);
      else if (d.prog < 100)
        w.push(`"${d.name}" ще не завершена (${d.prog}%)`);
      return;
    }

    if (dep.type === "SS") {
      const threshold = dep.threshold || 0;
      const ds = d.ms * 4 + d.ws;
      const ts2 = t.ms * 4 + t.ws;
      if (ds > ts2)
        w.push(`"${d.name}" ще не почалась (SS)`);
      else if (threshold > 0 && d.prog < threshold)
        w.push(`"${d.name}" виконано ${d.prog}% — потрібно мінімум ${threshold}% (SS-${threshold}%)`);
    }
  });
  return w;
}

/** Унікальні підрядники з усіх задач. */
function uniqContractors() {
  const names = new Set();
  tasks.forEach((t) => {
    if (t.contr) names.add(t.contr);
    taskCostItems(t).forEach((it) => {
      if (it.supplier) names.add(it.supplier);
    });
  });
  return [...names].sort((a, b) => a.localeCompare(b, "uk"));
}

/** Рядки кошторису задачі з підтримкою клієнтського і серверного форматів ключів. */
function taskCostItems(t) {
  if (Array.isArray(t?.costItems)) return t.costItems;
  if (Array.isArray(t?.cost_items)) return t.cost_items;
  return [];
}

/** Підрядники/постачальники, прив'язані до конкретної задачі. */
function taskContractors(t) {
  const names = new Set();
  if (t?.contr) names.add(t.contr);
  taskCostItems(t).forEach((it) => {
    if (it.supplier) names.add(it.supplier);
  });
  return [...names];
}

/** Фінансовий підсумок задачі за кошторисом або ручними полями задачі. */
function taskCostSummary(t) {
  const items = taskCostItems(t);
  if (!items.length) {
    const budget = +t?.budget || 0;
    const paid = +t?.spent || 0;
    return { budget, paid, rest: budget - paid, payments: 0, items: 0 };
  }

  const itemBudget = items.reduce((sum, it) => {
    const qty = it.qty == null ? 1 : (+it.qty || 0);
    return sum + qty * (+it.unitPrice || 0);
  }, 0);
  const manualBudget = +t?.budget || 0;
  const budget = t?.contractsOverrideBudget || manualBudget <= 0 ? itemBudget : manualBudget;
  const paid = items.reduce(
    (sum, it) => sum + (it.payments || []).reduce((pSum, p) => pSum + (+p.amount || 0), 0),
    0,
  );
  const payments = items.reduce((sum, it) => sum + (it.payments || []).length, 0);
  return { budget, paid, rest: budget - paid, payments, items: items.length };
}

/** Допоміжна функція завантаження файлу через blob URL. */
function dl(name, content, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
}

/** Конвертація hex кольору в rgb рядок. */
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}
