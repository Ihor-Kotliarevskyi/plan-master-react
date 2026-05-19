let _modalPhases = [];
let _modalDeps = [];
let _editingDepId = null;
let _notesTi = null;

/* ── Хелпери конвертації місяць/тиждень ↔ дата ── */

/** Прив'язує дату до найближчої межі пів-тижня (1, 4, 8, 11, 15, 18, 22, 25). */
function _snapToHalfWeek(dateStr) {
  if (!dateStr) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const HW = [1, 4, 8, 11, 15, 18, 22, 25];
  let best = HW[0], bestDiff = Math.abs(d - HW[0]);
  for (const h of HW) {
    const diff = Math.abs(d - h);
    if (diff < bestDiff) { bestDiff = diff; best = h; }
  }
  return `${y}-${String(m).padStart(2, '0')}-${String(best).padStart(2, '0')}`;
}

function _phaseToDateStr(mi, wi) {
  const absMonth = proj.sy * 12 + proj.sm + mi;
  const y = Math.floor(absMonth / 12);
  const m = absMonth % 12;
  const day = Math.min(1 + wi * 7, 28);
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
function _dateStrToPhase(str) {
  if (!str) return { mi: 0, wi: 0 };
  const [y, m, d] = str.split('-').map(Number);
  const absMonth = y * 12 + (m - 1);
  const projStart = proj.sy * 12 + proj.sm;
  const mi = Math.max(0, Math.min(proj.nm - 1, absMonth - projStart));
  const wi = Math.min(3, Math.max(0, Math.floor((d - 1) / 7)));
  return { mi, wi };
}
function _projMinDate() {
  return `${proj.sy}-${String(proj.sm + 1).padStart(2, '0')}-01`;
}
function _projMaxDate() {
  const absEnd = proj.sy * 12 + proj.sm + proj.nm - 1;
  const y = Math.floor(absEnd / 12);
  const m = absEnd % 12 + 1;
  return `${y}-${String(m).padStart(2, '0')}-28`;
}

function adjNum(id, delta) {
  const el = document.getElementById(id);
  if (!el || el.readOnly) return;
  el.value = Math.max(0, (+el.value || 0) + delta);
  updCalc();
}

/** Рендерить chips вибору категорії (ідентичні легенді графіку). */
function buildChips(sel) {
  selCat = sel;
  document.getElementById("cat-chips").innerHTML = cats
    .map(
      (c, i) =>
        `<button class="cat-chip${i === sel ? " active" : ""}" style="--chip-color:${c.color}" onclick="pickCat(${i})" type="button"><span class="chip-dot"></span>${c.name}</button>`,
    )
    .join("");
}

function pickCat(i) {
  if (!_canMutateTaskModal()) return;
  selCat = i;
  document.querySelectorAll("#cat-chips .cat-chip").forEach((c, j) => c.classList.toggle("active", j === i));
}

function _canMutateTaskModal() {
  return typeof canEditTasks !== "function" || canEditTasks();
}

function _applyTaskModalPermissions() {
  const modal = document.getElementById("modal");
  if (!modal) return;
  const editable = _canMutateTaskModal();

  modal.querySelectorAll("input, select, textarea, button").forEach((el) => {
    if (el.closest(".m-btns") || el.closest(".task-tabs")) return;
    el.disabled = !editable;
    if (el.matches("input, textarea")) el.readOnly = !editable;
  });

  const saveBtn = modal.querySelector(".m-btns .btn-acc");
  if (saveBtn) saveBtn.style.display = editable ? "" : "none";
}

function _applyNotesModalPermissions() {
  const editable = _canMutateTaskModal();
  const addRow = document.querySelector("#notes-modal .notes-add-row");
  if (addRow) addRow.style.display = editable ? "" : "none";
  document.querySelectorAll("#notes-modal .note-actions, #notes-modal .note-edit-actions").forEach((el) => {
    el.style.display = editable ? "" : "none";
  });
}

/** Зважений загальний прогрес фаз з урахуванням тривалості кожної. */
function _weightedProg(phases) {
  if (!phases || phases.length === 0) return 0;
  if (phases.length === 1) return phases[0].prog || 0;
  const totalDur = phases.reduce((s, p) => s + Math.max(1, (p.me * 4 + p.we) - (p.ms * 4 + p.ws) + 1), 0);
  return Math.round(phases.reduce((s, p) => s + (p.prog || 0) * Math.max(1, (p.me * 4 + p.we) - (p.ms * 4 + p.ws) + 1), 0) / totalDur);
}

/** Рендерить інлайн-список фаз у модалі задачі. */
function renderModalPhases() {
  const isMulti = _modalPhases.length > 1;
  const totalProg = isMulti ? _weightedProg(_modalPhases) : (_modalPhases[0]?.prog ?? 0);

  const minD = _projMinDate();
  const maxD = _projMaxDate();

  const rows = _modalPhases
    .map((ph, pi) => {
      const locked = pi > 0 && (_modalPhases[pi - 1].prog || 0) < 100;
      const activePct = isMulti && pi === _activePhaseIdx();
      return `<div class="mph-row">
      <div class="mph-top">
        ${isMulti ? `<span class="mph-label">Ф${pi + 1}</span>` : `<span class="mph-label">Терм.</span>`}
        <input type="date" id="mph-ds-${pi}" class="mph-date-inp"
               value="${ph.dsExact || _phaseToDateStr(ph.ms, ph.ws)}"
               min="${minD}" max="${maxD}"
               onchange="onModalPhaseChange()">
        <span class="mph-arrow">→</span>
        <input type="date" id="mph-de-${pi}" class="mph-date-inp"
               value="${ph.deExact || _phaseToDateStr(ph.me, ph.we)}"
               min="${minD}" max="${maxD}"
               onchange="onModalPhaseChange()">
        ${isMulti && pi > 0 ? `<span class="phase-del" onclick="modalRemovePhase(${pi})"><i data-lucide="x"></i></span>` : ""}
      </div>
      <div class="mph-prog-row">
        <span class="mph-hint">Вик.</span>
        <input type="range" id="mph-prog-${pi}" class="mph-range-inp"
               min="0" max="100" step="5" value="${ph.prog || 0}"
               ${locked ? "disabled" : ""} oninput="onModalProgChange(${pi},this.value)">
        <span id="mph-prog-lbl-${pi}" class="mph-pct${activePct ? " mph-pct-active" : ""}">${ph.prog || 0}%</span>
      </div>
    </div>`;
    })
    .join("");

  const summary = isMulti
    ? `<div class="mph-summary">Загальне: <b>${totalProg}%</b></div>`
    : "";

  document.getElementById("modal-phases").innerHTML = rows + summary;
  lucide.createIcons({ nodes: [document.getElementById("modal-phases")] });
  _syncModalPhasesToHidden();
  _applyTaskModalPermissions();
}

/** Повертає індекс активної фази (остання з prog > 0, або перша). */
function _activePhaseIdx() {
  let last = 0;
  _modalPhases.forEach((p, i) => {
    if ((p.prog || 0) > 0) last = i;
  });
  return last;
}

/** Зчитує поточні значення полів фаз у _modalPhases. */
function _flushModalPhases() {
  _modalPhases.forEach((_, pi) => {
    const dsEl = document.getElementById(`mph-ds-${pi}`);
    const deEl = document.getElementById(`mph-de-${pi}`);
    if (dsEl?.value) {
      _modalPhases[pi].dsExact = _snapToHalfWeek(dsEl.value);
      const { mi, wi } = _dateStrToPhase(_modalPhases[pi].dsExact);
      _modalPhases[pi].ms = mi;
      _modalPhases[pi].ws = wi;
    }
    if (deEl?.value) {
      _modalPhases[pi].deExact = _snapToHalfWeek(deEl.value);
      const { mi, wi } = _dateStrToPhase(_modalPhases[pi].deExact);
      _modalPhases[pi].me = mi;
      _modalPhases[pi].we = wi;
    }
    const prog = document.getElementById(`mph-prog-${pi}`)?.value;
    if (prog !== undefined) _modalPhases[pi].prog = +prog;
  });
}

function onModalPhaseChange() {
  _flushModalPhases();
  renderModalPhases();
  updCalc();
}

function onModalProgChange(pi, val) {
  _modalPhases[pi].prog = +val;
  if (+val < 100) {
    _modalPhases.forEach((_, i) => { if (i > pi) _modalPhases[i].prog = 0; });
  }
  // Оновлюємо DOM напряму, щоб не переривати drag слайдера
  const lbl = document.getElementById(`mph-prog-lbl-${pi}`);
  if (lbl) lbl.textContent = `${+val}%`;
  _modalPhases.forEach((p, i) => {
    if (i <= pi) return;
    const locked = (_modalPhases[i - 1]?.prog ?? 0) < 100;
    const slider = document.getElementById(`mph-prog-${i}`);
    if (slider) { slider.disabled = locked; slider.value = p.prog || 0; }
    const l = document.getElementById(`mph-prog-lbl-${i}`);
    if (l) l.textContent = `${p.prog || 0}%`;
  });
  if (_modalPhases.length > 1) {
    const total = _weightedProg(_modalPhases);
    const sumEl = document.querySelector(".mph-summary b");
    if (sumEl) sumEl.textContent = `${total}%`;
  }
}

function _syncModalPhasesToHidden() {
  // Значення зчитуються в saveTask() з _modalPhases напряму.
}

function modalAddPhase() {
  if (!_canMutateTaskModal()) return;
  _flushModalPhases();
  const last = _modalPhases[_modalPhases.length - 1];
  const newMs = Math.min(proj.nm - 1, last.me + 1);
  _modalPhases.push({ ms: newMs, ws: 0, me: Math.min(proj.nm - 1, newMs + 1), we: 3, prog: 0 });
  renderModalPhases();
}

function modalRemovePhase(pi) {
  if (!_canMutateTaskModal()) return;
  _flushModalPhases();
  if (_modalPhases.length <= 1) return;
  _modalPhases.splice(pi, 1);
  renderModalPhases();
}

/** Міні-граф залежностей у модалці задачі. */
function renderModalNet() {
  const sec   = document.getElementById('modal-net-section');
  const graph = document.getElementById('modal-net-graph');
  if (!sec || !graph) return;

  const currTask = editIdx !== null ? tasks[editIdx] : null;
  const currId   = currTask?.id;

  // Попередники (з _modalDeps)
  const preds = _modalDeps
    .map(d => ({ task: tasks.find(t => t.id === d.id), type: d.type || 'FS' }))
    .filter(p => p.task);

  // Наступники (роботи, що залежать від поточної)
  const succs = currTask
    ? tasks
        .filter((t, i) => i !== editIdx && (t.deps || []).some(raw => normDep(raw).id === currId))
        .map(t => {
          const raw = (t.deps || []).find(d => normDep(d).id === currId);
          return { task: t, type: raw ? normDep(raw).type : 'FS' };
        })
    : [];

  if (!preds.length && !succs.length) { sec.style.display = 'none'; return; }
  sec.style.display = 'block';

  const NW = 150, NH = 46, GX = 62, GY = 10, PAD = 14;
  const DEP_COLS = { FS: '#2563eb', SS: '#d97706', FF: '#6b7280' };

  const hasPreds = preds.length > 0;
  const hasSuccs = succs.length > 0;
  const numCols  = hasPreds && hasSuccs ? 3 : 2;
  const maxRows  = Math.max(hasPreds ? preds.length : 0, hasSuccs ? succs.length : 0, 1);
  const maxH     = maxRows * (NH + GY) - GY;
  const svgH     = PAD * 2 + maxH;
  const svgW     = numCols * NW + (numCols - 1) * GX + PAD * 2;

  const defs = `<defs>${Object.entries(DEP_COLS).map(([tp, col]) =>
    `<marker id="mn-${tp}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto">
       <path d="M0 0L8 4L0 8z" fill="${col}"/>
     </marker>`).join('')}</defs>`;

  function colX(idx) { return PAD + idx * (NW + GX); }

  function ysFor(count) {
    const blockH = count * (NH + GY) - GY;
    const top    = PAD + (maxH - blockH) / 2;
    return Array.from({ length: count }, (_, i) => top + i * (NH + GY));
  }

  function node(t, x, y, isCurr) {
    const col = cats[t.cat]?.color || '#888';
    const nm  = t.name.length > 17 ? t.name.slice(0, 16) + '…' : t.name;
    return `
      <rect x="${x}" y="${y}" width="${NW}" height="${NH}" rx="6"
            fill="var(--surf)" stroke="${col}" stroke-width="${isCurr ? 2.5 : 1.5}"/>
      <rect x="${x}" y="${y}" width="5" height="${NH}" rx="3" fill="${col}" opacity=".9"/>
      <text x="${x+13}" y="${y+16}" font-size="9" fill="${col}" font-weight="700" font-family="inherit">#${t.n}</text>
      <text x="${x+24}" y="${y+18}" font-size="11" font-weight="${isCurr ? 700 : 600}"
            fill="var(--txt)" font-family="inherit">${nm}</text>
      <text x="${x+13}" y="${y+33}" font-size="9.5" fill="var(--txt3)" font-family="inherit">
        ${cats[t.cat]?.name || ''}${t.prog > 0 ? ' · ' + t.prog + '%' : ''}
      </text>`;
  }

  function edge(x1, y1, x2, y2, type) {
    const col = DEP_COLS[type] || DEP_COLS.FS;
    const mx  = (x1 + x2) / 2;
    return `<path d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}"
              fill="none" stroke="${col}" stroke-width="1.5" opacity=".65"
              marker-end="url(#mn-${type || 'FS'})"/>`;
  }

  const currDisplay = currTask || {
    n: '?', name: document.getElementById('f-name')?.value || 'Нова робота', cat: selCat || 0,
  };

  let nodesHtml = '', edgesHtml = '';

  if (hasPreds && hasSuccs) {
    const cx = colX(1), cy = PAD + (maxH - NH) / 2;
    nodesHtml += node(currDisplay, cx, cy, true);
    ysFor(preds.length).forEach((py, i) => {
      const px = colX(0);
      nodesHtml += node(preds[i].task, px, py);
      edgesHtml += edge(px + NW, py + NH / 2, cx, cy + NH / 2, preds[i].type);
    });
    ysFor(succs.length).forEach((sy, i) => {
      const sx = colX(2);
      nodesHtml += node(succs[i].task, sx, sy);
      edgesHtml += edge(cx + NW, cy + NH / 2, sx, sy + NH / 2, succs[i].type);
    });
  } else if (hasPreds) {
    const cx = colX(1), cy = PAD + (maxH - NH) / 2;
    nodesHtml += node(currDisplay, cx, cy, true);
    ysFor(preds.length).forEach((py, i) => {
      const px = colX(0);
      nodesHtml += node(preds[i].task, px, py);
      edgesHtml += edge(px + NW, py + NH / 2, cx, cy + NH / 2, preds[i].type);
    });
  } else {
    const cx = colX(0), cy = PAD + (maxH - NH) / 2;
    nodesHtml += node(currDisplay, cx, cy, true);
    ysFor(succs.length).forEach((sy, i) => {
      const sx = colX(1);
      nodesHtml += node(succs[i].task, sx, sy);
      edgesHtml += edge(cx + NW, cy + NH / 2, sx, sy + NH / 2, succs[i].type);
    });
  }

  graph.innerHTML = `<svg viewBox="0 0 ${svgW} ${svgH}" width="${svgW}"
      style="min-height:${svgH}px;display:block;max-width:100%">
    ${defs}${edgesHtml}${nodesHtml}
  </svg>`;
}

/** Рендерить чіпи залежностей. */
function renderDepTags() {
  const tagsEl = document.getElementById("dep-tags");
  if (!tagsEl) return;

  const TYPE_LABELS = { FS: "FS", SS: "SS", FF: "—" };
  const TYPE_COLORS = { FS: "var(--acc)", SS: "var(--warn)", FF: "var(--txt3)" };

  tagsEl.innerHTML = _modalDeps
    .map((dep) => {
      const t = tasks.find((x) => x.id === dep.id);
      const label = t
        ? `#${t.n} ${t.name.slice(0, 20)}${t.name.length > 20 ? "…" : ""}`
        : `#?`;
      const badge =
        dep.type === "SS" && dep.threshold
          ? `${TYPE_LABELS[dep.type]} ${dep.threshold}%`
          : TYPE_LABELS[dep.type] || "FS";
      return `<div class="dep-tag ${_editingDepId === dep.id ? "editing" : ""}"
                   onclick="editDepTag('${dep.id}')">
        <span class="dep-tag-label">${label}</span>
        <span class="dep-tag-badge" style="background:${TYPE_COLORS[dep.type] || "var(--acc)"}">${badge}</span>
        <span class="dep-tag-del" onclick="event.stopPropagation();removeDepTag('${dep.id}')">×</span>
      </div>`;
    })
    .join("");

  renderModalNet();
  _applyTaskModalPermissions();
}

/** Показує dropdown з фільтрацією задач. */
function showDepDropdown() {
  if (!_canMutateTaskModal()) return;
  filterDepSearch(document.getElementById("dep-search")?.value || "");
}

function filterDepSearch(q) {
  if (!_canMutateTaskModal()) return;
  const dd = document.getElementById("dep-dropdown");
  if (!dd) return;
  const added = new Set(_modalDeps.map((d) => d.id));
  const candidates = tasks
    .filter((t) => t !== tasks[editIdx] && !added.has(t.id))
    .filter((t) => !q || `${t.n} ${t.name}`.toLowerCase().includes(q.toLowerCase()));

  if (!candidates.length) {
    dd.style.display = "none";
    return;
  }
  dd.style.display = "block";
  dd.innerHTML = candidates
    .map(
      (t) =>
        `<div class="dep-dd-item" onclick="addDepTag('${t.id}')">
           <span class="dep-dd-num">#${t.n}</span> ${t.name}
         </div>`,
    )
    .join("");
}

function addDepTag(id) {
  if (!_canMutateTaskModal()) return;
  if (_modalDeps.find((d) => d.id === id)) return;
  _modalDeps.push({ id, type: "FS", threshold: 0 });
  renderDepTags();
  const inp = document.getElementById("dep-search");
  if (inp) inp.value = "";
  document.getElementById("dep-dropdown").style.display = "none";
  editDepTag(id);
}

function removeDepTag(id) {
  if (!_canMutateTaskModal()) return;
  _modalDeps = _modalDeps.filter((d) => d.id !== id);
  if (_editingDepId === id) {
    _editingDepId = null;
    renderDepTypeEditor();
  }
  renderDepTags();
}

function editDepTag(id) {
  if (!_canMutateTaskModal()) return;
  _editingDepId = _editingDepId === id ? null : id;
  renderDepTags();
  renderDepTypeEditor();
}

function renderDepTypeEditor() {
  const el = document.getElementById("dep-type-editor");
  if (!el) return;
  if (!_editingDepId) {
    el.style.display = "none";
    return;
  }
  const dep = _modalDeps.find((d) => d.id === _editingDepId);
  if (!dep) {
    el.style.display = "none";
    return;
  }
  const t = tasks.find((x) => x.id === dep.id);
  const name = t ? (t.name.length > 22 ? t.name.slice(0, 22) + "…" : t.name) : "";
  const dispN = t?.n ?? "?";
  el.style.display = "block";
  el.innerHTML = `
    <div class="dep-type-edit-row">
      <span class="dep-type-title">#${dispN} ${name}</span>
      <div class="dep-type-btns">
        ${[
          { v: "FS", l: "FS", tip: "Після завершення" },
          { v: "SS", l: "SS+%", tip: "Після початку + %" },
          { v: "FF", l: "Незал.", tip: "Незалежний зв'язок" },
        ]
          .map(
            (opt) => `<button class="dep-type-btn${dep.type === opt.v ? " active" : ""}"
              title="${opt.tip}"
              onclick="setDepType('${dep.id}','${opt.v}')">${opt.l}</button>`,
          )
          .join("")}
        ${
          dep.type === "SS"
            ? `<span class="dep-threshold-lbl">Мін.:</span>
               <div class="dep-thr-wrap">
                 <button class="dep-thr-btn" type="button" onclick="adjDepThr('${dep.id}',-5)">−</button>
                 <input type="number" value="${dep.threshold || 25}" min="1" max="99"
                        onchange="setDepThreshold('${dep.id}',this.value)"
                        class="dep-threshold-inp">
                 <button class="dep-thr-btn" type="button" onclick="adjDepThr('${dep.id}',5)">+</button>
               </div>
               <span class="dep-threshold-unit">%</span>`
            : ""
        }
      </div>
    </div>`;
  _applyTaskModalPermissions();
}

function setDepType(id, type) {
  const dep = _modalDeps.find((d) => d.id === id);
  if (dep) {
    dep.type = type;
    if (type !== "SS") dep.threshold = 0;
  }
  renderDepTags();
  renderDepTypeEditor();
}

function setDepThreshold(id, val) {
  const dep = _modalDeps.find((d) => d.id === id);
  if (dep) dep.threshold = Math.min(99, Math.max(1, +val));
}

function adjDepThr(id, delta) {
  const dep = _modalDeps.find((d) => d.id === id);
  if (!dep) return;
  dep.threshold = Math.min(99, Math.max(1, (dep.threshold || 25) + delta));
  const inp = document.querySelector(".dep-threshold-inp");
  if (inp) inp.value = dep.threshold;
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".dep-tag-panel")) {
    const dd = document.getElementById("dep-dropdown");
    if (dd) dd.style.display = "none";
  }
});

function switchTaskTab(tab) {
  ["general", "costs"].forEach((t) => {
    document.getElementById(`ttab-${t}`)?.classList.toggle("active", t === tab);
    const pane = document.getElementById(`task-pane-${t}`);
    if (pane) pane.style.display = t === tab ? (t === "costs" ? "flex" : "block") : "none";
  });
  if (tab === "costs") renderCostTable();
}

/** Показує або ховає «авто» бейджи на полях бюджету. */
function _updateAutoBadges(spentAuto, budgetAuto = spentAuto) {
  const bb = document.getElementById("budget-auto-badge");
  const sb = document.getElementById("spent-auto-badge");
  if (bb) bb.style.display = budgetAuto ? "inline" : "none";
  if (sb) sb.style.display = spentAuto ? "inline" : "none";
  const bi = document.getElementById("f-budget");
  const si = document.getElementById("f-spent");
  if (bi) {
    bi.readOnly = budgetAuto;
    bi.style.background = budgetAuto ? "var(--surf2)" : "";
  }
  if (si) {
    si.readOnly = spentAuto;
    si.style.background = spentAuto ? "var(--surf2)" : "";
  }
}

/** Оновлює рядок залишку/ставки під полями бюджету. */
function updCalc() {
  const hasItems = _costItems && _costItems.length > 0;
  const overrideBudget = !!document.getElementById("f-contracts-override-budget")?.checked;
  const currentBudget = +document.getElementById("f-budget").value || 0;
  const b = hasItems && (overrideBudget || currentBudget <= 0) ? _totalBudget() : currentBudget;
  const s = hasItems ? _totalSpent() : (+document.getElementById("f-spent").value || 0);
  if (hasItems) {
    if (overrideBudget || currentBudget <= 0) document.getElementById("f-budget").value = b;
    document.getElementById("f-spent").value = s;
  }
  _updateAutoBadges(hasItems, hasItems && (overrideBudget || currentBudget <= 0));
  const r = b - s;
  const ph = _modalPhases[0];
  const rw = ph ? remWk({ ms: ph.ms, ws: ph.ws, me: ph.me, we: ph.we }) : 0;
  const rate = rw > 0 ? Math.round(r / rw) : 0;
  document.getElementById("calc-info").innerHTML =
    `Залишок: <b>${fmtM(r)} грн</b> · Тижнів: <b>${rw}</b> · Ставка: <b>${rw > 0 ? fmtM(rate) + " грн/тижд." : "—"}</b>`;
}

function openAdd() {
  editIdx = null;
  _editingDepId = null;
  _modalDeps = [];
  _modalPhases = [{ ms: 0, ws: 0, me: 1, we: 3, prog: 0 }];
  _costTi = null;
  _costItems = [];
  _expandedIds = new Set();

  document.getElementById("m-title").textContent = "Нова робота";
  document.getElementById("f-name").value = "";
  document.getElementById("f-budget").value = "";
  document.getElementById("f-spent").value = "";
  document.getElementById("f-contracts-override-budget").checked = false;
  document.getElementById("calc-info").textContent = "Заповніть вартість для розрахунку";
  document.getElementById("dep-warn").classList.remove("show");
  document.getElementById("dep-type-editor").style.display = "none";
  _updateAutoBadges(false);

  buildChips(0);
  renderModalPhases();
  renderDepTags();
  renderCostTable();
  document.getElementById("dep-dropdown").style.display = "none";
  switchTaskTab("general");
  document.getElementById("modal").style.display = "flex";
  _applyTaskModalPermissions();
  if (_canMutateTaskModal()) setTimeout(() => document.getElementById("f-name").focus(), 50);
}

function openEdit(ti) {
  editIdx = ti;
  _editingDepId = null;
  const t = tasks[ti];

  if (t.phases && t.phases.length > 0) {
    _modalPhases = t.phases.map((p) => ({ ...p, prog: p.prog ?? 0 }));
  } else {
    _modalPhases = [{ ms: t.ms, ws: t.ws, me: t.me, we: t.we, prog: t.prog || 0,
                      dsExact: t.dsExact || null, deExact: t.deExact || null }];
  }

  _modalDeps = (t.deps || []).map((d) => normDep(d));
  _costTi = ti;
  _expandedIds = new Set();
  _costItems = (t.costItems || []).map((it) => ({
    ...it,
    payments: (it.payments || []).map((p) => ({ ...p })),
    acts: (it.acts || []).map((a) => ({ ...a })),
  }));

  const hasItems = _costItems.length > 0;

  document.getElementById("m-title").textContent = t.name || "Редагувати роботу";
  document.getElementById("f-name").value = t.name;
  document.getElementById("f-contracts-override-budget").checked = !!t.contractsOverrideBudget;
  document.getElementById("f-budget").value = hasItems && ((+t.budget || 0) <= 0 || t.contractsOverrideBudget) ? _totalBudget() : t.budget || "";
  document.getElementById("f-spent").value = hasItems ? _totalSpent() : t.spent || "";
  _updateAutoBadges(hasItems, hasItems && (!!t.contractsOverrideBudget || (+t.budget || 0) <= 0));

  buildChips(t.cat);
  renderModalPhases();
  renderDepTags();
  renderDepTypeEditor();
  renderCostTable();
  updCalc();

  const warns = checkDeps(t);
  const wb = document.getElementById("dep-warn");
  if (warns.length) {
    wb.innerHTML = "⚠ " + warns.join("<br>");
    wb.classList.add("show");
  } else {
    wb.classList.remove("show");
  }

  switchTaskTab("general");
  document.getElementById("modal").style.display = "flex";
  _applyTaskModalPermissions();
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
  document.getElementById("dep-dropdown").style.display = "none";
}

/** Зберігає задачу (нову або відредаговану). */
async function saveTask() {
  if (typeof canEditTasks === "function" && !canEditTasks()) return;
  const isEdit = editIdx !== null;

  const name = document.getElementById("f-name").value.trim();
  if (!name) {
    document.getElementById("f-name").focus();
    return;
  }

  _flushModalPhases();
  _flushCostEdits();

  const ms = _modalPhases[0].ms,
    ws = _modalPhases[0].ws;
  const me = _modalPhases[_modalPhases.length - 1].me;
  const we = _modalPhases[_modalPhases.length - 1].we;

  if (ms * 4 + ws > me * 4 + we) {
    Swal.fire({ icon: "warning", title: "Невірний діапазон", text: "Початок не може бути після кінця." });
    return;
  }

  const prog = _weightedProg(_modalPhases);

  const costItemsSaved =
    _costItems.length > 0
      ? _costItems.map((it) => ({
          ...it,
          payments: (it.payments || []).map((p) => ({ ...p })),
          acts: (it.acts || []).map((a) => ({ ...a })),
        }))
      : null;

  const contractsOverrideBudget = !!document.getElementById("f-contracts-override-budget")?.checked;
  const manualBudget = +document.getElementById("f-budget").value || 0;
  const budget = costItemsSaved && (contractsOverrideBudget || manualBudget <= 0)
    ? _totalBudget()
    : manualBudget;
  const spent = costItemsSaved
    ? _totalSpent()
    : +document.getElementById("f-spent").value || 0;

  const obj = {
    name,
    cat: selCat,
    ms, ws, me, we, prog,
    budget, spent,
    contractsOverrideBudget,
    deps: _modalDeps,
    phases: _modalPhases.length > 1 ? _modalPhases.map((p) => ({ ...p })) : null,
    costItems: costItemsSaved,
    dsExact: _modalPhases.length === 1 ? (_modalPhases[0].dsExact || null) : null,
    deExact: _modalPhases.length === 1 ? (_modalPhases[0].deExact || null) : null,
  };

  const warns = checkDeps(obj);
  if (warns.length) {
    const res = await Swal.fire({
      icon: "warning",
      title: "Порушення залежностей",
      html: warns.map((w) => `• ${w}`).join("<br>"),
      showCancelButton: true,
      confirmButtonText: "Зберегти",
      cancelButtonText: "Повернутися",
    });
    if (!res.isConfirmed) return;
  }

  let savedTask = null;
  if (isEdit) {
    tasks[editIdx] = { ...tasks[editIdx], ...obj, notes: tasks[editIdx].notes || [] };
    savedTask = tasks[editIdx];
  } else {
    tasks.push({ id: genId(), n: nextN++, ...obj, notes: [] });
    savedTask = tasks[tasks.length - 1];
  }

  closeModal();
  saveAll();
  render();
  await logTaskActivity(isEdit ? AUDIT_EVENT_TYPES.TASK_UPDATED : AUDIT_EVENT_TYPES.TASK_CREATED, savedTask, {
    category: savedTask?.cat ?? selCat,
    hasPhases: Array.isArray(savedTask?.phases) && savedTask.phases.length > 1,
  });
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title: isEdit ? "Роботу оновлено" : "Роботу додано",
    showConfirmButton: false,
    timer: 2000,
  });
}

async function delTask(ti) {
  if (typeof canEditTasks === "function" && !canEditTasks()) return;
  const task = tasks[ti];

  const res = await Swal.fire({
    icon: "warning",
    title: "Видалити роботу?",
    text: `«${task.name}»`,
    showCancelButton: true,
    confirmButtonText: "Видалити",
    confirmButtonColor: "#c42b2b",
    cancelButtonText: "Скасувати",
  });
  if (!res.isConfirmed) return;
  tasks.splice(ti, 1);
  saveAll();
  render();
  await logTaskActivity(AUDIT_EVENT_TYPES.TASK_DELETED, task);
}

function openNotesModal(ti) {
  _notesTi = ti;
  const t = tasks[ti];
  document.getElementById("notes-modal-title").textContent = t.name;
  renderNotes(t.notes || []);
  document.getElementById("notes-modal").style.display = "flex";
  _applyNotesModalPermissions();
}

function closeNotesModal() {
  document.getElementById("notes-modal").style.display = "none";
  _notesTi = null;
}

function renderNotes(notes) {
  const el = document.getElementById("notes-list");
  if (!el) return;
  if (!notes || !notes.length) {
    el.innerHTML = `<div class="note-empty">Нотаток поки немає</div>`;
    return;
  }
  el.innerHTML = notes
    .map((n, i) => {
      const histBtn = n.history?.length
        ? `<button class="note-hist-btn" onclick="toggleNoteHistory(${i})"><i data-lucide="clock"></i> ${n.history.length}</button>`
        : "";
      const histHtml = n.history?.length
        ? `<div class="note-history" id="note-hist-${i}" style="display:none">
             ${n.history
               .map(
                 (h) => `<div class="note-hist-item">
               <span class="note-hist-action ${h.action}">${h.action === "edit" ? "✏ змінено" : "🗑 видалено"}</span>
               <span class="note-hist-meta">${h.author} · ${h.date}</span>
               <div class="note-hist-text">${_escHtml(h.text)}</div>
             </div>`,
               )
               .join("")}
           </div>`
        : "";
      return `<div class="note-item" id="note-item-${i}">
      <div class="note-meta">${n.author || "—"} · ${n.date || ""}${histBtn}</div>
      <div class="note-text" id="note-text-${i}">${_escHtml(n.text)}</div>
      <div class="note-edit-row" id="note-edit-row-${i}" style="display:none">
        <textarea class="note-edit-ta" id="note-edit-ta-${i}">${_escHtml(n.text)}</textarea>
        <div class="note-edit-actions">
          <button class="btn btn-acc btn-sm" onclick="saveNoteEdit(${i})">Зберегти</button>
          <button class="btn btn-sm" onclick="cancelNoteEdit(${i})">Скасувати</button>
        </div>
      </div>
      <div class="note-actions">
        <button class="note-act-btn" onclick="startNoteEdit(${i})" title="Редагувати"><i data-lucide="pencil"></i></button>
        <button class="note-act-btn del" onclick="deleteNote(${i})" title="Видалити"><i data-lucide="trash-2"></i></button>
      </div>
      ${histHtml}
    </div>`;
    })
    .join("");
  lucide.createIcons({ nodes: [el] });
  el.scrollTop = el.scrollHeight;
  _applyNotesModalPermissions();
}

function _getNotesTask() { return _notesTi !== null ? tasks[_notesTi] : null; }
function _getNotes() { return _getNotesTask()?.notes || []; }
function _setNotes(n) {
  if (!_getNotesTask()) return;
  _getNotesTask().notes = n;
  saveAll();
  _syncNotesCell(_notesTi);
}

function _syncNotesCell(ti) {
  if (ti == null) return;
  const t = tasks[ti];
  const count = t.notes?.filter((n) => !n.deleted).length || 0;
  const cell = document.querySelector(`#tr${ti} .td-notes`);
  if (!cell) return;
  cell.className = count > 0 ? "td-notes has-notes" : "td-notes";
  cell.title = count > 0 ? count + " нотаток" : "Нотатки";
  cell.innerHTML = count > 0
    ? `<i data-lucide="message-square-text"></i><span class="notes-count">${count}</span>`
    : `<i data-lucide="message-square"></i>`;
  lucide.createIcons({ nodes: [cell] });
}
function _noteDate() {
  return new Date().toLocaleString("uk-UA", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function addNote() {
  if (!_canMutateTaskModal()) return;
  const ta = document.getElementById("note-input");
  const text = ta?.value?.trim();
  if (!text) return;
  const notes = _getNotes();
  notes.push({
    id: Date.now(),
    text,
    author: userProfile?.name || "Користувач",
    date: _noteDate(),
    history: [],
  });
  _setNotes(notes);
  renderNotes(notes);
  ta.value = "";
}

function startNoteEdit(i) {
  if (!_canMutateTaskModal()) return;
  document.getElementById(`note-text-${i}`).style.display = "none";
  document.getElementById(`note-edit-row-${i}`).style.display = "block";
  document.getElementById(`note-edit-ta-${i}`)?.focus();
}

function cancelNoteEdit(i) {
  document.getElementById(`note-text-${i}`).style.display = "";
  document.getElementById(`note-edit-row-${i}`).style.display = "none";
}

function saveNoteEdit(i) {
  if (!_canMutateTaskModal()) return;
  const ta = document.getElementById(`note-edit-ta-${i}`);
  const txt = ta?.value?.trim();
  if (!txt) return;
  const notes = _getNotes();
  if (!notes[i]) return;
  if (!notes[i].history) notes[i].history = [];
  notes[i].history.push({
    action: "edit",
    text: notes[i].text,
    author: userProfile?.name || "Користувач",
    date: _noteDate(),
  });
  notes[i].text = txt;
  _setNotes(notes);
  renderNotes(notes);
}

async function deleteNote(i) {
  if (!_canMutateTaskModal()) return;
  const res = await Swal.fire({
    icon: "warning",
    title: "Видалити нотатку?",
    showCancelButton: true,
    confirmButtonText: "Видалити",
    confirmButtonColor: "#c42b2b",
    cancelButtonText: "Скасувати",
  });
  if (!res.isConfirmed) return;
  const notes = _getNotes();
  if (!notes[i]) return;
  if (!notes[i].history) notes[i].history = [];
  notes[i].history.push({
    action: "delete",
    text: notes[i].text,
    author: userProfile?.name || "Користувач",
    date: _noteDate(),
  });
  notes[i].text = "[видалено]";
  notes[i].deleted = true;
  _setNotes(notes);
  renderNotes(notes);
}

function toggleNoteHistory(i) {
  const el = document.getElementById(`note-hist-${i}`);
  if (el) el.style.display = el.style.display === "none" ? "block" : "none";
}

function _escHtml(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function openCatEditor() {
  if (typeof canManageProject === "function" && !canManageProject()) {
    Swal.fire({ icon: "info", title: "У вас немає прав на зміну категорій" });
    return;
  }
  tempCats = cats.map((c) => ({ ...c }));
  renderCatList();
  document.getElementById("cat-modal").style.display = "flex";
}

function renderCatList() {
  const el = document.getElementById("cat-editor-list");
  el.innerHTML = "";
  tempCats.forEach((c, i) => {
    const row = document.createElement("div");
    row.className = "cat-row";
    row.dataset.i = i;
    const pickerWrap = document.createElement("div");
    pickerWrap.className = "color-picker-wrap";
    const swatch = document.createElement("button");
    swatch.className = "cat-swatch";
    swatch.style.background = c.color;
    swatch.title = "Вибрати колір";
    swatch.type = "button";
    const dropdown = document.createElement("div");
    dropdown.className = "color-dropdown";
    dropdown.innerHTML = _buildColorDropdownHTML(i);
    swatch.addEventListener("click", (e) => {
      e.stopPropagation();
      document
        .querySelectorAll(".color-dropdown.open")
        .forEach((d) => { if (d !== dropdown) d.classList.remove("open"); });
      dropdown.classList.toggle("open");
    });
    pickerWrap.appendChild(swatch);
    pickerWrap.appendChild(dropdown);
    const nameInp = document.createElement("input");
    nameInp.className = "cat-name-inp";
    nameInp.value = c.name;
    nameInp.placeholder = "Назва категорії";
    nameInp.addEventListener("input", () => { tempCats[i].name = nameInp.value; });
    const delBtn = document.createElement("span");
    delBtn.className = "cat-del";
    delBtn.innerHTML = '<i data-lucide="x"></i>';
    delBtn.title = "Видалити";
    delBtn.addEventListener("click", async () => {
      if (tasks.some((t) => t.cat === i)) {
        const res = await Swal.fire({
          icon: "warning",
          title: "Категорія використовується",
          text: "Є роботи з цією категорією. Видалити?",
          showCancelButton: true,
          confirmButtonText: "Видалити",
          confirmButtonColor: "#c42b2b",
          cancelButtonText: "Скасувати",
        });
        if (!res.isConfirmed) return;
      }
      flushCatNames();
      tempCats.splice(i, 1);
      renderCatList();
    });
    row.appendChild(pickerWrap);
    row.appendChild(nameInp);
    row.appendChild(delBtn);
    el.appendChild(row);
  });
  lucide.createIcons({ nodes: [document.getElementById("cat-editor-list")] });
  document.addEventListener("click", _closeColorDropdowns, { once: false });
}

function _buildColorDropdownHTML(catIdx) {
  const cur = tempCats[catIdx]?.color || "#888";
  const dots = CAT_PALETTE.map(
    (hex) =>
      `<div class="pal-dot${hex === cur ? " active" : ""}" style="background:${hex}" title="${hex}"
            onclick="pickCatColor(${catIdx},'${hex}',this)"></div>`,
  ).join("");
  return `<div class="color-dropdown-inner">
    <div class="pal-grid">${dots}</div>
    <div class="color-custom-row">
      <span class="color-custom-lbl">Свій колір:</span>
      <input type="color" value="${cur}" oninput="pickCatColor(${catIdx},this.value,null)" />
    </div></div>`;
}

function pickCatColor(catIdx, hex, dotEl) {
  tempCats[catIdx].color = hex;
  const rows = document.querySelectorAll("#cat-editor-list .cat-row");
  rows[catIdx]?.querySelector(".cat-swatch")?.style.setProperty("background", hex);
  rows[catIdx]
    ?.querySelectorAll(".pal-dot")
    .forEach((d) => d.classList.toggle("active", d.title === hex));
  if (dotEl) rows[catIdx]?.querySelector(".color-dropdown")?.classList.remove("open");
}

function _closeColorDropdowns(e) {
  if (!e.target.closest(".color-picker-wrap"))
    document.querySelectorAll(".color-dropdown.open").forEach((d) => d.classList.remove("open"));
}

function flushCatNames() {
  document.querySelectorAll("#cat-editor-list .cat-row").forEach((row, i) => {
    const inp = row.querySelector(".cat-name-inp");
    if (inp && tempCats[i]) tempCats[i].name = inp.value;
  });
}

function addCat() {
  flushCatNames();
  const usedColors = tempCats.map((c) => c.color);
  const color =
    CAT_PALETTE.find((c) => !usedColors.includes(c)) ||
    CAT_PALETTE[tempCats.length % CAT_PALETTE.length];
  tempCats.push({ name: "Нова категорія", color });
  renderCatList();
  setTimeout(() => {
    const rows = document.querySelectorAll("#cat-editor-list .cat-row");
    const last = rows[rows.length - 1];
    if (last) {
      last.scrollIntoView({ behavior: "smooth" });
      last.querySelector(".cat-name-inp")?.select();
    }
  }, 50);
}

function saveCats() {
  flushCatNames();
  cats = [...tempCats];
  saveAll();
  render();
  closeCatModal();
}

function closeCatModal() {
  document.querySelectorAll(".color-dropdown.open").forEach((d) => d.classList.remove("open"));
  document.getElementById("cat-modal").style.display = "none";
}

/* ── СПИСОК ЗАЛЕЖНОСТЕЙ ─────────────────────────────────────────────────── */
let _dlFilter = "all"; // 'all' | 'FS' | 'SS' | 'FF'

function openDepList() {
  _dlFilter = "all";
  _renderDepList();
  document.getElementById("dep-list-modal").style.display = "flex";
}

function closeDepList() {
  document.getElementById("dep-list-modal").style.display = "none";
}

function setDepListFilter(f) {
  _dlFilter = f;
  document.querySelectorAll(".dl-filter-btn").forEach(b =>
    b.classList.toggle("on", b.dataset.f === f));
  _renderDepList();
}

function _renderDepList() {
  const TC = { FS: "var(--acc)", SS: "var(--warn)", FF: "var(--txt3)" };

  // Збираємо всі залежності
  const all = [];
  tasks.forEach((t, toTi) => {
    (t.deps || []).forEach(raw => {
      const dep = normDep(raw);
      const fromTask = tasks.find(ft => ft.id === dep.id);
      if (!fromTask) return;
      const fromTi = tasks.indexOf(fromTask);
      all.push({ fromTask, fromTi, toTask: t, toTi, type: dep.type || "FS", threshold: dep.threshold || 0 });
    });
  });

  const filtered = _dlFilter === "all" ? all : all.filter(d => d.type === _dlFilter);

  // Лічильники для фільтрів
  const cnt = { all: all.length, FS: 0, SS: 0, FF: 0 };
  all.forEach(d => cnt[d.type] = (cnt[d.type] || 0) + 1);

  document.getElementById("dl-count").textContent =
    filtered.length === all.length ? `${all.length}` : `${filtered.length} з ${all.length}`;

  // Фільтр-кнопки
  document.querySelectorAll(".dl-filter-btn").forEach(b => {
    const f = b.dataset.f;
    b.textContent = f === "all" ? `Всі (${cnt.all})` :
                    f === "FS"  ? `FS (${cnt.FS || 0})` :
                    f === "SS"  ? `SS (${cnt.SS || 0})` :
                                  `FF (${cnt.FF || 0})`;
    b.classList.toggle("on", f === _dlFilter);
  });

  const body = document.getElementById("dl-body");
  if (!filtered.length) {
    body.innerHTML = `<div class="dl-empty">${
      all.length ? "Немає залежностей вибраного типу" : "У проєкті немає залежностей між роботами"
    }</div>`;
    return;
  }

  const rows = filtered.map((d, i) => {
    const typeLbl = d.type === "SS" && d.threshold ? `SS+${d.threshold}%` : d.type;
    const isCrit  = criticalSet.has(d.fromTi) && criticalSet.has(d.toTi);
    const fCol    = cats[d.fromTask.cat]?.color || "var(--txt3)";
    const tCol    = cats[d.toTask.cat]?.color   || "var(--txt3)";
    return `<tr class="dl-row" onclick="depListGo(${d.fromTi})" title="Клік — підсвітити ланцюжок на графіку">
      <td class="dl-i">${i + 1}</td>
      <td class="dl-task">
        <span class="dl-dot" style="background:${fCol}"></span>
        <span class="dl-tn" style="color:${fCol}">#${d.fromTask.n}</span>
        <span class="dl-nm">${d.fromTask.name}</span>
      </td>
      <td class="dl-arrow">
        <span class="dep-tag-badge" style="background:${TC[d.type] || "var(--acc)"}">${typeLbl}</span>
      </td>
      <td class="dl-task">
        <span class="dl-dot" style="background:${tCol}"></span>
        <span class="dl-tn" style="color:${tCol}">#${d.toTask.n}</span>
        <span class="dl-nm">${d.toTask.name}</span>
      </td>
      <td class="dl-crit">${isCrit ? `<span class="dl-crit-ic" title="Критичний шлях"></span>` : ""}</td>
    </tr>`;
  }).join("");

  body.innerHTML = `<table class="dl-tbl">
    <thead><tr>
      <th class="dl-i">#</th>
      <th>Попередник</th>
      <th class="dl-arrow">Тип</th>
      <th>Наступник</th>
      <th class="dl-crit" title="Критичний шлях"><i data-lucide="activity" style="width:12px;height:12px"></i></th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
  lucide.createIcons({ nodes: [body] });
}

function depListGo(fromTi) {
  closeDepList();
  // Переключаємось на вкладку Графік якщо потрібно
  const ganttPane = document.getElementById("pane-gantt");
  if (ganttPane && !ganttPane.classList.contains("active")) {
    document.querySelector('.tab[onclick*="gantt"]')?.click();
  }
  requestAnimationFrame(() => {
    highlightDepChain(fromTi);
    document.getElementById(`tr${fromTi}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

function openProj() {
  const canManage = typeof canManageProject === "function" ? canManageProject() : true;
  const sel = document.getElementById("p-sm");
  sel.innerHTML = MN.map((m, i) => `<option value="${i}">${m}</option>`).join("");
  sel.value = String(proj.sm);
  const nameInput = document.getElementById("p-name");
  const yearInput = document.getElementById("p-sy");
  const durationInput = document.getElementById("p-nm");
  const modal = document.getElementById("proj-modal");

  nameInput.value = proj.name;
  yearInput.value = proj.sy;
  durationInput.value = proj.nm;

  [nameInput, sel, yearInput, durationInput].forEach((el) => {
    if (!el) return;
    el.disabled = !canManage;
    el.readOnly = !canManage;
  });

  modal.querySelectorAll(".num-btn").forEach((btn) => {
    btn.disabled = !canManage;
    btn.style.display = canManage ? "" : "none";
  });

  const catsBtn = modal.querySelector(".proj-modal-cats .btn");
  if (catsBtn) catsBtn.style.display = canManage ? "" : "none";

  const saveBtn = modal.querySelector(".m-btns .btn-acc");
  if (saveBtn) saveBtn.style.display = canManage ? "" : "none";

  modal.style.display = "flex";
}

function closeProjModal() {
  document.getElementById("proj-modal").style.display = "none";
}

async function saveProjSettings() {
  if (typeof canManageProject === "function" && !canManageProject()) return;

  const oldAbsStart = proj.sy * 12 + proj.sm;
  const before = { name: proj.name, sm: proj.sm, sy: proj.sy, nm: proj.nm };
  proj.name = document.getElementById("p-name").value.trim() || proj.name;
  const newSm = +document.getElementById("p-sm").value;
  const newSy = +document.getElementById("p-sy").value;
  proj.nm = Math.min(120, Math.max(3, +document.getElementById("p-nm").value));
  const newAbsStart = newSy * 12 + newSm;
  const shift = oldAbsStart - newAbsStart;
  if (shift !== 0) {
    tasks.forEach((t) => {
      t.ms = Math.max(0, t.ms + shift);
      t.me = Math.max(0, t.me + shift);
      if (t.phases)
        t.phases = t.phases.map((p) => ({
          ...p,
          ms: Math.max(0, p.ms + shift),
          me: Math.max(0, p.me + shift),
        }));
    });
  }
  proj.sm = newSm;
  proj.sy = newSy;
  closeProjModal();
  saveAll();
  render();
  await logProjectMutation(AUDIT_EVENT_TYPES.PROJECT_SETTINGS_UPDATED, {
    before,
    after: { name: proj.name, sm: proj.sm, sy: proj.sy, nm: proj.nm },
    shiftedTasks: shift !== 0,
  });
}

function openProjManager() {
  const getManagePermission = (projectId) => {
    if (typeof getProjectPermissions !== "function") return true;
    const role = typeof getStoredProjectRole === "function"
      ? getStoredProjectRole(projectId, "owner")
      : allProjects?.[projectId]?._role || (projectId === currentId ? _projectRole : "owner");
    return getProjectPermissions(role).canManageProject;
  };
  const roleLabels = typeof PROJECT_ROLE_LABELS !== "undefined" ? PROJECT_ROLE_LABELS : {};
  const entries = Object.entries(allProjects || {});
  const grouped = typeof groupProjectEntriesByAccess === "function"
    ? groupProjectEntriesByAccess(entries)
    : { own: entries, shared: [] };
  const own = grouped.own || [];
  const shared = grouped.shared || [];

  const renderProjectRow = ([id, p]) => {
    const canManageProjectEntry = getManagePermission(id);
    const role = typeof normalizeProjectRole === "function" ? normalizeProjectRole(p?._role || "owner") : (p?._role || "owner");
    const roleLabel = roleLabels[role] || role;
    const shareLabels = typeof getSharedProjectLabels === "function"
      ? getSharedProjectLabels(p?._access || null)
      : {
          isShared: p?._access?.source === "shared",
          ownerLabel: p?._access?.ownerName || p?._access?.ownerEmail || "",
          invitedByLabel: p?._access?.invitedByName || p?._access?.invitedByEmail || "",
        };
    const ownerLabel = shareLabels.ownerLabel;
    const invitedByLabel = shareLabels.invitedByLabel;
    const sharedMeta =
      shareLabels.isShared
        ? `<div class="pj-meta">${ownerLabel ? `Власник: ${ownerLabel}` : ""}${invitedByLabel ? `${ownerLabel ? " · " : ""}Поділився: ${invitedByLabel}` : ""}</div>`
        : `<div class="pj-meta">Власний проєкт</div>`;
    return `<div class="pj-row${id === currentId ? " active" : ""}">
       <div class="pj-main">
         <input class="pj-name-inp" value="${p.proj.name}" ${canManageProjectEntry ? "" : "disabled"}
                onchange="${canManageProjectEntry ? `allProjects['${id}'].proj.name=this.value;updateProjSel();` : ""}"
                onclick="event.stopPropagation()">
         <span class="pj-role-chip pj-role-${role}">${roleLabel}</span>
       </div>
       <div class="pj-sub">
         <span class="pj-tasks-count">${p.tasks?.length || 0} робіт</span>
         ${sharedMeta}
       </div>
       ${
         canManageProjectEntry
           ? `<span class="pj-del" onclick="event.stopPropagation();deleteProject('${id}')" title="Видалити"><i data-lucide="trash-2"></i></span>`
           : ""
       }
     </div>`;
  };

  const renderGroup = (title, list) =>
    list.length
      ? `<div class="proj-group">
          <div class="proj-group-title">${title}</div>
          ${list.map(renderProjectRow).join("")}
        </div>`
      : "";

  document.getElementById("proj-list-el").innerHTML = [
    renderGroup("Мої проєкти", own),
    renderGroup("Розшарені проєкти", shared),
  ].join("");
  lucide.createIcons({ nodes: [document.getElementById("proj-list-el")] });
  document.getElementById("projmgr-modal").style.display = "flex";
}

function closeProjMgr() {
  document.getElementById("projmgr-modal").style.display = "none";
}

async function loadDemoProject() {
  const { isConfirmed } = await Swal.fire({
    icon: "info",
    title: "Завантажити демо-проєкт?",
    html: `<div class="swal-info-text">Буде створено проєкт «Ремонт офісу» з прикладом задач, категорій та бюджету.<br><br>Ваші поточні проєкти залишаться без змін.</div>`,
    showCancelButton: true,
    confirmButtonText: "Завантажити",
    cancelButtonText: "Скасувати",
  });
  if (!isConfirmed) return;

  const id = "p_" + Date.now();
  allProjects[id] = {
    proj: { name: "Ремонт офісу (демо)", sm: 0, sy: new Date().getFullYear(), nm: 12 },
    cats: DEF_CATS.map((c) => ({ ...c })),
    tasks: DEF_TASKS.map((t) => ({ ...t })),
    nextN: DEF_TASKS.length + 1,
    ...(typeof buildRuntimeInitialProjectSnapshotMeta === "function"
      ? buildRuntimeInitialProjectSnapshotMeta()
      : {
          _localUpdatedAt: new Date().toISOString(),
          _localVersion: 1,
          _serverVersion: 0,
        }),
  };
  try {
    const payload = typeof buildRuntimeStorageBufferPayload === "function"
      ? buildRuntimeStorageBufferPayload(allProjects, currentId, null)
      : { allProjects, currentId };
    localStorage.setItem(SK_BUF, JSON.stringify(payload));
  } catch (_) {}
  switchProject(id);
  closeProjMgr();
  Swal.fire({
    toast: true, position: "top-end", icon: "success",
    title: "Демо-проєкт завантажено",
    showConfirmButton: false, timer: 2500,
  });
}

async function createProject() {
  const { value: name } = await Swal.fire({
    title: "Новий проєкт",
    input: "text",
    inputLabel: "Назва проєкту",
    inputValue: "Новий проєкт",
    inputAttributes: { maxlength: 80 },
    showCancelButton: true,
    confirmButtonText: "Створити",
    cancelButtonText: "Скасувати",
    inputValidator: (v) => !v.trim() && "Введіть назву",
  });
  if (!name) return;
  const id = "p_" + Date.now();
  allProjects[id] = {
    proj: {
      ...DEF_PROJ,
      name: name.trim(),
      sm: userProfile?.defaults?.sm ?? DEF_PROJ.sm,
      sy: userProfile?.defaults?.sy ?? DEF_PROJ.sy,
      nm: userProfile?.defaults?.nm ?? DEF_PROJ.nm,
    },
    cats: DEF_CATS.map((c) => ({ ...c })),
    tasks: [],
    nextN: 1,
    ...(typeof buildRuntimeInitialProjectSnapshotMeta === "function"
      ? buildRuntimeInitialProjectSnapshotMeta()
      : { _localUpdatedAt: new Date().toISOString(), _localVersion: 1, _serverVersion: 0 }),
  };
  saveAll();
  switchProject(id);
  openProjManager();
}

async function deleteProject(id) {
  const role = typeof getStoredProjectRole === "function"
    ? getStoredProjectRole(id, "owner")
    : allProjects?.[id]?._role || (id === currentId ? _projectRole : "owner");
  if (typeof canManageProject === "function" && !canManageProject(role)) return;

  if (Object.keys(allProjects).length <= 1) {
    Swal.fire({ icon: "info", title: "Неможливо видалити", text: "Має залишатися хоча б один проєкт." });
    return;
  }
  const res = await Swal.fire({
    icon: "warning",
    title: "Видалити проєкт?",
    html: `«${allProjects[id]?.proj?.name}»<br><small>Цю дію неможливо скасувати.</small>`,
    showCancelButton: true,
    confirmButtonText: "Видалити",
    confirmButtonColor: "#c42b2b",
    cancelButtonText: "Скасувати",
  });
  if (!res.isConfirmed) return;
  if (typeof apiDeleteProject === "function" && typeof isLoggedIn === "function" && isLoggedIn()) {
    await apiDeleteProject(id);
  }
  delete allProjects[id];
  if (currentId === id) {
    currentId = Object.keys(allProjects)[0];
    loadCurrent();
  }
  saveAll();
  render();
  openProjManager();
}

function openPhaseEditor(ti) { openEdit(ti); }
function closePhaseModal() {}
function savePhases() {}
function clearPhases(ti) {
  if (tasks[ti]) { tasks[ti].phases = null; saveAll(); render(); }
}
