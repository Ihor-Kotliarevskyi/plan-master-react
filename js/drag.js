/** Прикріплює обробники drag & drop до таблиці. */
function attachDrag() {
  const tbl = document.getElementById("gtbl");
  if (!tbl) return;

  tbl.addEventListener("mousedown", (e) => {
    const handle = e.target.closest(".td-drag");
    const bh = e.target.closest(".bh");
    const bar = e.target.closest(".bar");

    if (handle && !bh && !bar) {
      e.preventDefault();
      const ti = parseInt(handle.dataset.ti);
      rowDrag = { fromTi: ti, toTi: ti };
      document.getElementById("tr" + ti)?.classList.add("row-dragging");
      return;
    }

    if (!bh && !bar) return;
    e.preventDefault();

    const ti = parseInt((bh || bar).dataset.ti);
    const t = tasks[ti];
    const barEl = bh?.closest(".bar") || bar;
    const barId = barEl?.id || "";

    const phaseMatch = barId.match(/^bar(\d+)-(\d+)$/);
    const phi = phaseMatch ? parseInt(phaseMatch[2]) : null;

    if (phi !== null && t.phases && t.phases[phi]) {
      const ph = t.phases[phi];
      drag = {
        ti, phi,
        mode: bh ? (bh.dataset.side === "L" ? "L" : "R") : "M",
        sx: e.clientX,
        ocs: ph.ms * 4 + ph.ws,
        oce: ph.me * 4 + ph.we,
        last: null,
        isPhase: true,
      };
    } else {
      drag = {
        ti, phi: null,
        mode: bh ? (bh.dataset.side === "L" ? "L" : "R") : "M",
        sx: e.clientX,
        ocs: t.ms * 4 + t.ws,
        oce: t.me * 4 + t.we,
        last: null,
        isPhase: false,
      };
      document.getElementById("bar" + ti)?.classList.add("dragging");
    }
  });
}

document.addEventListener("mousemove", (e) => {
  if (rowDrag) {
    let best = null;
    let bd = 9999;
    document.querySelectorAll("#gtbl tbody tr").forEach((tr) => {
      const rect = tr.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const d = Math.abs(e.clientY - mid);
      if (d < bd) { bd = d; best = tr; }
    });
    if (best) {
      const toTi = parseInt(best.id.replace("tr", ""));
      document
        .querySelectorAll("#gtbl tbody tr")
        .forEach((t) => t.classList.remove("row-drag-over"));
      if (!isNaN(toTi) && toTi !== rowDrag.fromTi) {
        best.classList.add("row-drag-over");
        rowDrag.toTi = toTi;
      } else {
        rowDrag.toTi = rowDrag.fromTi;
      }
    }
    return;
  }

  if (!drag) return;
  const d = Math.round((e.clientX - drag.sx) / zoomLevel);
  if (d === drag.last) return;
  drag.last = d;

  const t = tasks[drag.ti];
  const TW2 = TW();

  if (drag.isPhase && drag.phi !== null && t.phases) {
    const ph = t.phases[drag.phi];
    const prevPh = drag.phi > 0 ? t.phases[drag.phi - 1] : null;
    const nextPh = drag.phi < t.phases.length - 1 ? t.phases[drag.phi + 1] : null;
    const prevEnd = prevPh ? prevPh.me * 4 + prevPh.we + 1 : 0;
    const nextStart = nextPh ? nextPh.ms * 4 + nextPh.ws - 1 : TW2 - 1;

    if (drag.mode === "M") {
      const len = drag.oce - drag.ocs;
      const ns = Math.max(prevEnd, Math.min(nextStart - len, drag.ocs + d));
      ph.ms = Math.floor(ns / 4); ph.ws = ns % 4;
      ph.me = Math.floor((ns + len) / 4); ph.we = (ns + len) % 4;
    } else if (drag.mode === "L") {
      const ns = Math.max(prevEnd, Math.min(drag.oce, drag.ocs + d));
      ph.ms = Math.floor(ns / 4); ph.ws = ns % 4;
    } else {
      const ne = Math.max(drag.ocs, Math.min(nextStart, drag.oce + d));
      ph.me = Math.floor(ne / 4); ph.we = ne % 4;
    }
    t.ms = t.phases[0].ms; t.ws = t.phases[0].ws;
    t.me = t.phases[t.phases.length - 1].me; t.we = t.phases[t.phases.length - 1].we;
    renderTable();
  } else {
    if (drag.mode === "M") {
      const len = drag.oce - drag.ocs;
      const ns = Math.max(0, Math.min(TW2 - len - 1, drag.ocs + d));
      t.ms = Math.floor(ns / 4); t.ws = ns % 4;
      t.me = Math.floor((ns + len) / 4); t.we = (ns + len) % 4;
    } else if (drag.mode === "L") {
      const ns = Math.max(0, Math.min(drag.oce, drag.ocs + d));
      t.ms = Math.floor(ns / 4); t.ws = ns % 4;
    } else {
      const ne = Math.max(drag.ocs, Math.min(TW2 - 1, drag.oce + d));
      t.me = Math.floor(ne / 4); t.we = ne % 4;
    }
    updateBarDOM(drag.ti);
  }
});

document.addEventListener("mouseup", () => {
  if (rowDrag) {
    document
      .querySelectorAll("#gtbl tbody tr")
      .forEach((t) => t.classList.remove("row-dragging", "row-drag-over"));
    if (rowDrag.fromTi !== rowDrag.toTi) {
      const fi = tasks.findIndex((_, i) => i === rowDrag.fromTi);
      const ti2 = tasks.findIndex((_, i) => i === rowDrag.toTi);
      if (fi >= 0 && ti2 >= 0) {
        const task = tasks.splice(fi, 1)[0];
        tasks.splice(ti2, 0, task);
        // Deps використовують task.id — перенумерація n не впливає на залежності
        tasks.forEach((t, i) => { t.n = i + 1; });
        nextN = tasks.length + 1;
      }
      saveAll();
      renderTable();
    }
    rowDrag = null;
    return;
  }

  if (drag) {
    if (!drag.isPhase) {
      document.getElementById("bar" + drag.ti)?.classList.remove("dragging");
      const t = tasks[drag.ti];
      if (t) { t.dsExact = null; t.deExact = null; }
    } else {
      const t = tasks[drag.ti];
      if (t?.phases?.[drag.phi]) {
        t.phases[drag.phi].dsExact = null;
        t.phases[drag.phi].deExact = null;
      }
    }
    drag = null;
    saveAll();
  }
});

/** Оновлює DOM бара після drag без повного ре-рендеру. */
function updateBarDOM(ti) {
  const t = tasks[ti];
  const vs = visStart();
  const cs = t.ms * 4 + t.ws;
  const ce = t.me * 4 + t.we;

  const showFull = cs >= vs;
  const showPartial = !showFull && t.prog < 100 && ce >= vs;
  if (!showFull && !showPartial) {
    document.getElementById("bar" + ti)?.remove();
    return;
  }

  const barStart = showFull ? cs : vs;
  const bW = (ce - barStart + 1) * zoomLevel;
  const col = monoBarColor || CC(t.cat);
  const progW = Math.round((t.prog * Math.max(0, bW - 12)) / 100);

  document.getElementById("bar" + ti)?.remove();
  const td = document.querySelector(`td[data-ti="${ti}"][data-ci="${barStart}"]`);
  if (!td) { renderTable(); return; }

  const el = document.createElement("div");
  el.className = "bar dragging";
  el.id = "bar" + ti;
  el.dataset.ti = ti;
  el.style.cssText = `left:0;width:${bW}px;background:${col}`;
  el.innerHTML = `<div class="bh" data-ti="${ti}" data-side="L">
      <svg width="4" height="8" viewBox="0 0 4 8">
        <line x1="1" y1="1" x2="1" y2="7" stroke="rgba(255,255,255,.6)" stroke-width="1"/>
        <line x1="3" y1="1" x2="3" y2="7" stroke="rgba(255,255,255,.6)" stroke-width="1"/>
      </svg>
    </div>
    ${t.prog > 0 ? `<div class="prog-fill" style="width:${progW}px"></div>` : ""}
    <span class="bl">${t.prog > 0 ? t.prog + "%" : ""}</span>
    <div class="bh" data-ti="${ti}" data-side="R">
      <svg width="4" height="8" viewBox="0 0 4 8">
        <line x1="1" y1="1" x2="1" y2="7" stroke="rgba(255,255,255,.6)" stroke-width="1"/>
        <line x1="3" y1="1" x2="3" y2="7" stroke="rgba(255,255,255,.6)" stroke-width="1"/>
      </svg>
    </div>`;
  td.appendChild(el);
}
