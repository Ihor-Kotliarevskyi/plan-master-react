/* ── DEPENDENCY ARROWS ON GANTT ────────────────────────────────────────────── */
let showDepArrows = false;
let _depChain = null; // Set<ti> | null

const _DA_COLORS = { FS: '#2563eb', SS: '#d97706', FF: '#6b7280' };
const _DA_CRIT = '#e03030';

/* ── Toggle ── */
function toggleDepArrows() {
  showDepArrows = !showDepArrows;
  document.getElementById('btn-dep-arrows')?.classList.toggle('on', showDepArrows);
  renderDepArrows();
}

/* ── Збирає всі залежності як {fromTi, toTi, type} ── */
function _collectAllDeps() {
  const byId = {};
  tasks.forEach((t, i) => { byId[t.id] = i; });
  const result = [];
  tasks.forEach((t, toTi) => {
    (t.deps || []).forEach(raw => {
      const dep = normDep(raw);
      const fromTi = byId[dep.id];
      if (fromTi === undefined || fromTi === toTi) return;
      result.push({ fromTi, toTi, type: dep.type || 'FS' });
    });
  });
  return result;
}

/* ── Головний рендер стрілок ── */
function renderDepArrows() {
  document.getElementById('dep-arrows-svg')?.remove();
  if (!showDepArrows) return;

  const allDeps = _collectAllDeps();
  if (!allDeps.length) return;

  // >30 задач → показуємо лише ланцюжок виділеної
  const autoHide = tasks.length > 50;
  let toRender = allDeps;
  if (autoHide) {
    if (!_depChain) return;
    toRender = allDeps.filter(d => _depChain.has(d.fromTi) && _depChain.has(d.toTi));
    if (!toRender.length) return;
  }

  const wrap = document.getElementById('gtbl-wrap');
  if (!wrap) return;
  wrap.style.position = 'relative';

  const wRect = wrap.getBoundingClientRect();

  const defs = `<defs>${Object.entries(_DA_COLORS).map(([tp, col]) =>
    `<marker id="da-${tp}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto">
         <path d="M0 0L8 4L0 8z" fill="${col}"/>
       </marker>`
  ).join('')}
    <marker id="da-crit" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0 0L8 4L0 8z" fill="${_DA_CRIT}"/>
    </marker>
  </defs>`;

  let paths = '';
  toRender.forEach(dep => { paths += _makeArrowPath(dep, wRect) || ''; });
  if (!paths) return;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'dep-arrows-svg';
  svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:4;overflow:visible';
  svg.setAttribute('width', wrap.scrollWidth);
  svg.setAttribute('height', wrap.scrollHeight);
  svg.innerHTML = defs + paths;
  wrap.appendChild(svg);
}

function _barEl(ti) {
  return document.getElementById(`bar${ti}-0`) || document.getElementById(`bar${ti}`);
}

function _makeArrowPath(dep, wRect) {
  const fBar = _barEl(dep.fromTi);
  const tBar = _barEl(dep.toTi);
  if (!fBar || !tBar) return null;

  const fR = fBar.getBoundingClientRect();
  const tR = tBar.getBoundingClientRect();

  // Координати відносно gtbl-wrap (спільний контейнер → scroll не впливає)
  let sx, ex;
  if (dep.type === 'SS') {
    sx = fR.left - wRect.left - 2;
    ex = tR.left - wRect.left - 2;
  } else if (dep.type === 'FF') {
    sx = fR.right - wRect.left + 2;
    ex = tR.right - wRect.left + 2;
  } else { // FS
    sx = fR.right - wRect.left;
    ex = tR.left - wRect.left - 2;
  }
  const sy = fR.top - wRect.top + fR.height / 2;
  const ey = tR.top - wRect.top + tR.height / 2;

  const isCrit = showCritical && criticalSet.has(dep.fromTi) && criticalSet.has(dep.toTi);
  const col = isCrit ? _DA_CRIT : (_DA_COLORS[dep.type] || _DA_COLORS.FS);
  const markId = isCrit ? 'crit' : (dep.type || 'FS');
  const sw = isCrit ? 2.5 : 1.6;

  // Прозорість: якщо є ланцюжок — притемнюємо не-ланцюжкові стрілки
  const inChain = !_depChain || (_depChain.has(dep.fromTi) && _depChain.has(dep.toTi));
  const op = inChain ? (isCrit ? 0.9 : 0.58) : 0.07;

  const dx = ex - sx;
  const cp = Math.max(28, Math.abs(dx) * 0.42);
  const cx1 = sx + (dx >= 0 ? cp : -cp);
  const cx2 = ex - (dx >= 0 ? cp : -cp);

  return `<path class="da-path da-${dep.fromTi}-${dep.toTi}"
    d="M${sx.toFixed(1)},${sy.toFixed(1)} C${cx1.toFixed(1)},${sy.toFixed(1)} ${cx2.toFixed(1)},${ey.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}"
    stroke="${col}" stroke-width="${sw}" opacity="${op}" fill="none"
    marker-end="url(#da-${markId})"/>`;
}

/* ── Клік по бару ── */
function handleBarClick(e, ti) {
  if (e.target.closest('.bh')) return; // виключаємо drag-ручки
  e.stopPropagation();
  // Повторний клік на той самий бар → скидаємо
  if (_depChain?.has(ti) && _depChain.size > 0 && !e.shiftKey) {
    clearDepChain();
  } else {
    highlightDepChain(ti);
  }
}

/* ── Chain highlight (BFS вгору + вниз) ── */
function highlightDepChain(ti) {
  const byId = {};
  tasks.forEach((t, i) => { byId[t.id] = i; });

  const chain = new Set([ti]);

  // BFS вгору (попередники)
  const upQ = [ti];
  while (upQ.length) {
    const cur = upQ.shift();
    (tasks[cur]?.deps || []).forEach(raw => {
      const d = normDep(raw);
      const pi = byId[d.id];
      if (pi !== undefined && !chain.has(pi)) { chain.add(pi); upQ.push(pi); }
    });
  }

  // BFS вниз (наступники)
  const downQ = [ti];
  while (downQ.length) {
    const cur = downQ.shift();
    const curId = tasks[cur]?.id;
    if (!curId) continue;
    tasks.forEach((t, i) => {
      if (chain.has(i)) return;
      if ((t.deps || []).some(raw => normDep(raw).id === curId)) {
        chain.add(i);
        downQ.push(i);
      }
    });
  }

  _depChain = chain;
  _applyChainStyles();
  if (showDepArrows) renderDepArrows();
}

function clearDepChain() {
  _depChain = null;
  document.querySelectorAll('tbody tr.dep-dim, tbody tr.dep-hi').forEach(r => {
    r.classList.remove('dep-dim', 'dep-hi');
  });
  if (showDepArrows) renderDepArrows();
}

function _applyChainStyles() {
  document.querySelectorAll('tbody tr[id^="tr"]').forEach(r => {
    const rTi = +r.id.slice(2);
    r.classList.toggle('dep-dim', !_depChain.has(rTi));
    r.classList.toggle('dep-hi', _depChain.has(rTi));
  });
}
