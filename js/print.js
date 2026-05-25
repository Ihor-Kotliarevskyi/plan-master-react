const PRINT_DEFAULTS = {
  paper: "a3",
  orientation: "landscape",
  contentScale: 1,
  renderScale: 1,
  margin: 5,
  fitMode: "paginate",
};

const PRINT_PAPER_MM = {
  a4: { w: 210, h: 297 },
  a3: { w: 297, h: 420 },
  letter: { w: 215.9, h: 279.4 },
};

let _printPreviewTimer = null;
let _printPreviewPage = 0;
const PRINT_UI = typeof buildRuntimePrintUiModel === "function"
  ? buildRuntimePrintUiModel()
  : {
      noChartsText: "No charts available",
      previewLoadingText: "Refreshing preview...",
      previewPagesLabel: (pages) => `${pages} pages`,
      reportTitle: "Report",
      nothingSelectedText: "Nothing selected for print.",
      projectFallbackTitle: "Project",
      ganttTitle: "Gantt chart",
      ganttEmptyText: "No tasks available for print.",
      financeTitle: "Financial report",
      sCurveTitle: "S-curve",
      sCurveAlt: "S-curve",
      sCurveUnavailableText: "S-curve is unavailable for print.",
      weeklyCostTitle: "Weekly cost chart",
      weeklyCostAlt: "Weekly cost chart",
      weeklyCostUnavailableText: "Weekly cost chart is unavailable for print.",
      chartFallbackTitle: "Chart",
      exportPdfTitle: "Generating PDF...",
      exportPdfProgressText: "Preparing...",
      exportPdfSuccessTitle: "PDF saved",
      exportPdfErrorTitle: "PDF error",
      pdfPageProgressText: (current, total) => `Page ${current} of ${total}...`,
      ganttPageTitlePrefix: "Gantt chart: weeks",
      tasksMetaLabel: "tasks",
      workTypeHeader: "Work type",
      plannedLabel: "Planned",
      actualLabel: "Actual",
      financeBudgetLabel: "Budget",
      financeSpentLabel: "Spent",
      financeRestLabel: "Remaining",
      financeTasksLabel: "Tasks",
      financeDoneSuffix: "done",
      currencyUnit: "UAH",
      financeTableHeaders: {
        task: "Task",
        category: "Category",
        weeks: "Weeks",
        budget: "Budget",
        spent: "Spent",
        rest: "Remaining",
        progress: "%",
      },
      noTasksShortText: "No tasks.",
      chartPageFallbackTitle: "Chart",
    };

function openPrintDialog() {
  const restore = _preparePrintSources({ charts: true });
  const allCharts = [...document.querySelectorAll("#chart-grid .chart-card")].map((c) => ({
    id: c.id,
    title: c.querySelector("h4 span")?.textContent || c.id,
  }));
  restore();

  document.getElementById("print-chart-list").innerHTML = allCharts.length
    ? allCharts
        .map(
          (c) =>
            `<label class="print-chart-label">
               <input type="checkbox" class="print-chart-cb" value="${_printEsc(c.id)}" checked> ${_printEsc(c.title)}
             </label>`,
        )
        .join("")
    : `<div class="print-no-charts">${PRINT_UI.noChartsText}</div>`;

  document.getElementById("print-modal").style.display = "flex";
  _schedulePrintPreview();
}

function closePrintDialog() {
  document.getElementById("print-modal").style.display = "none";
  if (_printPreviewTimer) clearTimeout(_printPreviewTimer);
  _printPreviewTimer = null;
}

async function doPrint() {
  const sections = _getPrintSections();
  const settings = _getPrintSettings();
  closePrintDialog();
  _removePrintRoot();
  _applyDynamicPrintStyle(settings);
  _buildPrintRoot(sections, settings);
  document.body.classList.add("printing-report");

  const cleanup = () => {
    document.body.classList.remove("printing-report");
    _removeDynamicPrintStyle();
    _removePrintRoot();
    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup);
  setTimeout(() => {
    window.print();
    setTimeout(cleanup, 500);
  }, 100);
}

function _getPrintSections() {
  const raw = {
    gantt: document.getElementById("print-gantt")?.checked ?? true,
    finance: document.getElementById("print-finance")?.checked ?? false,
    charts: document.getElementById("print-charts")?.checked ?? false,
    chartIds: [...document.querySelectorAll(".print-chart-cb:checked")].map((c) => c.value),
    range: document.getElementById("print-range")?.value || "all",
  };
  return typeof buildRuntimeResolvePrintSections === "function"
    ? buildRuntimeResolvePrintSections(raw)
    : raw;
}

function _getPrintSettings() {
  const numberValue = (id, fallback) => {
    const value = Number.parseFloat(document.getElementById(id)?.value);
    return Number.isFinite(value) ? value : fallback;
  };
  const raw = {
    paper: document.getElementById("print-paper")?.value || PRINT_DEFAULTS.paper,
    orientation: document.getElementById("print-orientation")?.value || PRINT_DEFAULTS.orientation,
    contentScale: numberValue("print-scale", PRINT_DEFAULTS.contentScale),
    renderScale: numberValue("print-quality", PRINT_DEFAULTS.renderScale),
    margin: numberValue("print-margin", PRINT_DEFAULTS.margin),
    fitMode: document.getElementById("print-fit")?.value || PRINT_DEFAULTS.fitMode,
  };
  return typeof buildRuntimeResolvePrintSettings === "function"
    ? buildRuntimeResolvePrintSettings(raw, PRINT_DEFAULTS)
    : raw;
}

function _getPrintMetrics(settings) {
  return typeof buildRuntimeGetPrintMetrics === "function"
    ? buildRuntimeGetPrintMetrics(settings, PRINT_PAPER_MM)
    : (() => {
        const base = PRINT_PAPER_MM[settings.paper] || PRINT_PAPER_MM.a3;
        const pageW = settings.orientation === "landscape" ? base.h : base.w;
        const pageH = settings.orientation === "landscape" ? base.w : base.h;
        const contentWmm = Math.max(50, pageW - settings.margin * 2);
        const contentHmm = Math.max(50, pageH - settings.margin * 2);
        const pxPerMm = 96 / 25.4;
        return {
          pageW,
          pageH,
          contentWmm,
          contentHmm,
          contentWpx: Math.round(contentWmm * pxPerMm),
          contentHpx: Math.round(contentHmm * pxPerMm),
        };
      })();
}

function _applyDynamicPrintStyle(settings) {
  _removeDynamicPrintStyle();
  const style = document.createElement("style");
  style.id = "dynamic-print-page";
  style.textContent = `
@page {
  size: ${settings.paper.toUpperCase()} ${settings.orientation};
  margin: ${settings.margin}mm;
}`;
  document.head.appendChild(style);
}

function _removeDynamicPrintStyle() {
  document.getElementById("dynamic-print-page")?.remove();
}

function _removePrintRoot() {
  document.getElementById("print-root")?.remove();
}

function _showPaneForPrint(id, width = 1100) {
  const el = document.getElementById(id);
  if (!el) return () => {};
  const prevStyle = el.getAttribute("style");
  el.style.display = "block";
  el.style.position = "absolute";
  el.style.left = "-10000px";
  el.style.top = "0";
  el.style.width = `${width}px`;
  el.style.opacity = "0";
  el.style.zIndex = "-1";
  el.style.pointerEvents = "none";
  return () => {
    if (prevStyle === null) el.removeAttribute("style");
    else el.setAttribute("style", prevStyle);
  };
}

function _resizePrintCharts() {
  if (typeof sCurveChart !== "undefined" && sCurveChart) {
    try {
      sCurveChart.options.animation = false;
      sCurveChart.resize();
      sCurveChart.update("none");
    } catch (_) {}
  }
  (chartInstances || []).forEach((c) => {
    try {
      c.inst.options.animation = false;
      c.inst.resize();
      c.inst.update("none");
    } catch (_) {}
  });
}

function _preparePrintSources(sections) {
  const restore = [];
  if (sections.finance) {
    restore.push(_showPaneForPrint("pane-finance"));
    if (typeof renderFinFilters === "function") renderFinFilters();
    if (typeof renderFinance === "function") renderFinance();
  }
  if (sections.charts) {
    restore.push(_showPaneForPrint("pane-charts"));
    if (typeof updateCbCatFilter === "function") updateCbCatFilter();
    if (typeof renderAutoCharts === "function") renderAutoCharts();
  }
  _resizePrintCharts();
  return () => restore.reverse().forEach((fn) => fn());
}

function _getChartImage(id) {
  const inst = (chartInstances || []).find((c) => c.id === id)?.inst;
  if (inst) {
    try {
      const type = inst.config?.type || inst.config?._config?.type || "bar";
      const isHoriz = inst.options?.indexAxis === "y";
      const img = _renderChartImage(type, _cloneChartData(inst.data), _printChartOptions(type, isHoriz));
      if (img && img !== "data:,") return img;
    } catch (_) {}
  }
  const canvas = document.getElementById(id)?.querySelector("canvas");
  if (!canvas || !canvas.width || !canvas.height) return "";
  try {
    return canvas.toDataURL("image/png");
  } catch (_) {
    return "";
  }
}

function _getSCurveImage() {
  try {
    const data = _buildSCurvePrintData();
    if (!data) return "";
    const ml = getML();
    const currentWk = todayWk();
    const todayLinePlugin = {
      id: "printSCurveTodayLine",
      afterDatasetsDraw(chart) {
        if (currentWk < 0) return;
        const { ctx, chartArea, scales } = chart;
        const x = scales.x?.getPixelForValue(currentWk);
        if (!Number.isFinite(x) || x < chartArea.left || x > chartArea.right) return;

        ctx.save();
        ctx.strokeStyle = "#e03030";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();

        ctx.fillStyle = "#e03030";
        ctx.font = "bold 13px Segoe UI, sans-serif";
        ctx.textAlign = x > chartArea.right - 68 ? "right" : "left";
        ctx.fillText("\u0421\u044c\u043e\u0433\u043e\u0434\u043d\u0456", x + (x > chartArea.right - 68 ? -6 : 6), chartArea.top + 14);
        ctx.restore();
      },
    };
    const options = _printChartOptions("line", false);
    options.scales = {
      x: {
        offset: false,
        grid: { offset: false },
        ticks: {
          font: { size: 12 },
          maxRotation: 0,
          autoSkip: false,
          callback: (value, index, ticks) => _financeMonthTick(value, index, ticks, ml),
        },
      },
      y: {
        ticks: {
          font: { size: 12 },
          callback: (value) => new Intl.NumberFormat("uk-UA", { notation: "compact" }).format(value),
        },
      },
    };
    return _renderChartImage("line", data, options, 1320, 520, [todayLinePlugin]);
  } catch (_) {
    return "";
  }
}

function _getWeeklyCostImage() {
  try {
    if (!showWeeklyCostBars || !weeklyCostChart) return "";
    const ml = getML();
    const currentWk = todayWk();
    const data = _cloneChartData(weeklyCostChart.data);
    if (!data?.labels?.length) return "";
    const todayLinePlugin = {
      id: "printWeeklyCostTodayLine",
      afterDatasetsDraw(chart) {
        if (currentWk < 0) return;
        const { ctx, chartArea, scales } = chart;
        const x = scales.x?.getPixelForValue(currentWk);
        if (!Number.isFinite(x) || x < chartArea.left || x > chartArea.right) return;
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
    const options = _printChartOptions("bar", false);
    options.scales = {
      x: {
        offset: false,
        grid: { offset: false },
        ticks: {
          font: { size: 12 },
          maxRotation: 0,
          autoSkip: false,
          callback: (value, index, ticks) => _financeMonthTick(value, index, ticks, ml),
        },
      },
      y: {
        ticks: {
          font: { size: 12 },
          callback: (value) => new Intl.NumberFormat("uk-UA", { notation: "compact" }).format(value),
        },
      },
    };
    return _renderChartImage("bar", data, options, 1320, 560, [todayLinePlugin]);
  } catch (_) {
    return "";
  }
}

function _cloneChartData(data) {
  return {
    labels: [...(data?.labels || [])],
    datasets: (data?.datasets || []).map((ds) => ({
      label: ds.label || "",
      data: [...(ds.data || [])],
      backgroundColor: Array.isArray(ds.backgroundColor) ? [...ds.backgroundColor] : ds.backgroundColor,
      borderColor: Array.isArray(ds.borderColor) ? [...ds.borderColor] : ds.borderColor,
      borderWidth: ds.borderWidth ?? 0,
      fill: ds.fill ?? false,
      tension: ds.tension ?? 0,
      pointRadius: ds.pointRadius ?? 0,
      spanGaps: ds.spanGaps,
    })),
  };
}

function _printChartOptions(type, isHoriz) {
  const circular = type === "pie" || type === "doughnut";
  return {
    responsive: false,
    maintainAspectRatio: false,
    animation: false,
    indexAxis: isHoriz ? "y" : undefined,
    plugins: {
      legend: {
        display: circular || type === "line",
        position: "bottom",
        labels: { font: { size: 12 }, boxWidth: 12 },
      },
      tooltip: { enabled: false },
    },
    scales: circular
      ? {}
      : {
          x: { ticks: { font: { size: 11 }, maxRotation: isHoriz ? 0 : 35 } },
          y: {
            ticks: {
              font: { size: 11 },
              callback: (v) => (typeof v === "number" ? fmtM(v) : v),
            },
          },
        },
  };
}

function _renderChartImage(type, data, options, width = 980, height = 520, extraPlugins = []) {
  if (typeof Chart === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.style.position = "absolute";
  canvas.style.left = "-10000px";
  canvas.style.top = "0";
  document.body.appendChild(canvas);

  let chart = null;
  try {
    const bgPlugin = {
      id: "printCanvasBg",
      beforeDraw(c) {
        const { ctx, width: cw, height: ch } = c;
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, cw, ch);
        ctx.restore();
      },
    };
    chart = new Chart(canvas.getContext("2d"), {
      type,
      data,
      options,
      plugins: [bgPlugin, ...extraPlugins],
    });
    chart.update("none");
    return canvas.toDataURL("image/png");
  } catch (_) {
    return "";
  } finally {
    try {
      chart?.destroy();
    } catch (_) {}
    canvas.remove();
  }
}

function _buildSCurvePrintData() {
  const ml = getML();
  if (!ml.length || tasks.every((t) => !t.budget && !t.spent)) return null;

  const planned = new Array(ml.length).fill(0);
  const actual = new Array(ml.length).fill(0);
  tasks.forEach((t) => {
    const budget = +t.budget || 0;
    const spent = +t.spent || 0;
    if (!budget && !spent) return;
    const startWk = t.ms * 4 + t.ws;
    const endWk = t.me * 4 + t.we;
    const totalWk = Math.max(1, endWk - startWk + 1);
    for (let wk = startWk; wk <= endWk; wk++) {
      const mi = Math.floor(wk / 4);
      if (mi < 0 || mi >= ml.length) continue;
      planned[mi] += budget / totalWk;
      actual[mi] += spent / totalWk;
    }
  });

  const cumPlanned = [];
  const cumActual = [];
  let sp = 0;
  let sa = 0;
  planned.forEach((v, i) => {
    sp += v;
    sa += actual[i];
    cumPlanned.push(Math.round(sp));
    cumActual.push(Math.round(sa));
  });

  let lastNonZero = 0;
  cumActual.forEach((v, i) => {
    if (v > 0) lastNonZero = i;
  });
  const tw = todayWk();
  const curMi = tw >= 0 ? Math.min(ml.length - 1, Math.floor(tw / 4)) : 0;
  const cutoff = Math.max(curMi + 1, lastNonZero + 1);

  return {
    labels: ml.map((m) => `${m.name.slice(0, 3)} ${m.y}`),
    datasets: [
      {
        label: PRINT_UI.plannedLabel,
        data: cumPlanned,
        borderColor: "rgba(30,80,200,0.9)",
        backgroundColor: "rgba(30,80,200,0.08)",
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointRadius: 3,
      },
      {
        label: PRINT_UI.actualLabel,
        data: cumActual.map((v, i) => (i <= cutoff ? v : null)),
        borderColor: "rgba(22,128,60,0.95)",
        backgroundColor: "rgba(22,128,60,0.08)",
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        spanGaps: false,
      },
    ],
  };
}

function _schedulePrintPreview() {
  if (_printPreviewTimer) clearTimeout(_printPreviewTimer);
  _printPreviewPage = 0;
  _printPreviewTimer = setTimeout(_renderPrintPreview, 120);
}

function changePrintPreviewPage(delta) {
  const pages = document.querySelectorAll("#print-preview .print-page").length;
  if (!pages) return;
  _printPreviewPage = Math.min(pages - 1, Math.max(0, _printPreviewPage + delta));
  _syncPrintPreviewPage();
}

function _renderPrintPreview() {
  const target = document.getElementById("print-preview");
  const meta = document.getElementById("print-preview-meta");
  const modal = document.getElementById("print-modal");
  if (!target || !modal || modal.style.display === "none") return;

  _removePrintRoot();
  target.innerHTML = `<div class="print-preview-empty">${PRINT_UI.previewLoadingText}</div>`;

  const root = _buildPrintRoot(_getPrintSections(), _getPrintSettings());
  const clone = root.cloneNode(true);
  _removePrintRoot();
  clone.removeAttribute("id");
  clone.classList.add("print-preview-document");
  clone.style.position = "absolute";
  clone.style.left = "0";
  clone.style.top = "0";
  target.innerHTML = "";
  target.style.position = "relative";
  target.appendChild(clone);

  requestAnimationFrame(_syncPrintPreviewPage);
  return;

  requestAnimationFrame(() => {
    const firstPage = clone.querySelector(".print-page");
    if (!firstPage) return;
    const shell = target.closest(".print-preview-shell");
    const availableW = Math.max(260, (shell?.clientWidth || target.clientWidth || 500) - 10);
    const pageW = firstPage.scrollWidth || firstPage.getBoundingClientRect().width || availableW;
    const scale = Math.min(1, availableW / pageW);
    clone.style.transform = `scale(${scale})`;
    clone.style.transformOrigin = "top left";
    target.style.width = `${pageW * scale}px`;
    target.style.height = `${clone.scrollHeight * scale}px`;
    if (meta) {
      const pages = clone.querySelectorAll(".print-page").length;
      meta.textContent = PRINT_UI.previewPagesLabel(pages);
    }
  });
}

function _syncPrintPreviewPage() {
  const target = document.getElementById("print-preview");
  const meta = document.getElementById("print-preview-meta");
  const prevBtn = document.getElementById("print-prev-page");
  const nextBtn = document.getElementById("print-next-page");
  const clone = target?.querySelector(".print-preview-document");
  const pages = clone ? [...clone.querySelectorAll(".print-page")] : [];
  if (!target || !clone || !pages.length) return;

  _printPreviewPage = Math.min(pages.length - 1, Math.max(0, _printPreviewPage));
  pages.forEach((page, i) => page.classList.toggle("preview-page-active", i === _printPreviewPage));

  const active = pages[_printPreviewPage];
  const shell = target.closest(".print-preview-shell");
  const availableW = Math.max(260, (shell?.clientWidth || target.clientWidth || 500) - 12);
  const availableH = Math.max(220, (shell?.clientHeight || target.clientHeight || 500) - 12);
  const pageW = active.scrollWidth || active.getBoundingClientRect().width || availableW;
  const pageH = active.scrollHeight || active.getBoundingClientRect().height || availableH;
  const previewState = typeof buildRuntimeGetPrintPreviewState === "function"
    ? buildRuntimeGetPrintPreviewState({
        currentPage: _printPreviewPage,
        pagesCount: pages.length,
        availableWidth: availableW,
        availableHeight: availableH,
        pageWidth: pageW,
        pageHeight: pageH,
      })
    : null;
  if (!previewState) return;
  _printPreviewPage = previewState.pageIndex;

  clone.style.transform = `scale(${previewState.scale})`;
  clone.style.transformOrigin = "top left";
  clone.style.width = `${previewState.cloneWidth}px`;
  clone.style.height = `${previewState.cloneHeight}px`;
  target.style.width = `${previewState.targetWidth}px`;
  target.style.height = `${previewState.targetHeight}px`;
  target.style.left = `${previewState.targetLeft}px`;
  target.style.top = `${previewState.targetTop}px`;

  if (meta) meta.textContent = previewState.pageLabel;
  if (prevBtn) prevBtn.disabled = previewState.prevDisabled;
  if (nextBtn) nextBtn.disabled = previewState.nextDisabled;
}

function _printEsc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function _buildPrintRoot(sections, settings) {
  const metrics = _getPrintMetrics(settings);
  const restore = _preparePrintSources(sections);
  const root = document.createElement("div");
  root.id = "print-root";
  root.style.setProperty("--print-page-width", `${metrics.contentWmm}mm`);
  root.style.setProperty("--print-page-min-height", `${metrics.contentHmm}mm`);
  root.style.setProperty("--print-content-width-px", `${metrics.contentWpx}px`);

  try {
    if (sections.gantt) _appendPrintGantt(root, settings, metrics);
    if (sections.finance) _appendPrintFinance(root, metrics, settings);
    if (sections.charts && sections.chartIds.length) _appendPrintCharts(root, sections.chartIds, metrics);

  if (!root.children.length) {
    root.appendChild(_createPrintPage(PRINT_UI.reportTitle, `<div class="print-empty">${PRINT_UI.nothingSelectedText}</div>`));
  }

  } finally {
    restore();
  }

  document.body.appendChild(root);
  return root;
}

function _createPrintPage(title, bodyHtml, meta = "") {
  const page = document.createElement("section");
  page.className = "print-page";
  page.innerHTML = `
    <div class="print-page-head">
      <div>
        <div class="print-project">${_printEsc(proj.name || PRINT_UI.projectFallbackTitle)}</div>
        <div class="print-title">${_printEsc(title)}</div>
      </div>
      <div class="print-meta">${_printEsc(meta || new Date().toLocaleDateString("uk-UA"))}</div>
    </div>
    <div class="print-page-body">${bodyHtml}</div>`;
  return page;
}

function _appendPrintGantt(root, settings, metrics) {
  const visibleTasks = tasks.filter((t) => !hiddenCats.has(t.cat));
  const allWeeks = TW();
  const firstWeek = Math.min(Math.max(0, visStart()), Math.max(0, allWeeks - 1));
  const visibleWeeks = Math.max(0, allWeeks - firstWeek);
  if (!visibleTasks.length || !allWeeks) {
    root.appendChild(_createPrintPage(PRINT_UI.ganttTitle, `<div class="print-empty">${PRINT_UI.ganttEmptyText}</div>`));
    return;
  }

  const layout = _resolvePrintGanttLayout(settings, metrics, visibleTasks.length, visibleWeeks);

  for (let weekStart = firstWeek; weekStart < allWeeks; weekStart += layout.weeksPerPage) {
    const weekEnd = Math.min(allWeeks - 1, weekStart + layout.weeksPerPage - 1);
    for (let rowStart = 0; rowStart < visibleTasks.length; rowStart += layout.rowsPerPage) {
      const rowTasks = visibleTasks.slice(rowStart, rowStart + layout.rowsPerPage);
      const pageTitle = `${PRINT_UI.ganttPageTitlePrefix} ${weekStart + 1}-${weekEnd + 1}`;
      const meta = `${rowStart + 1}-${rowStart + rowTasks.length} з ${visibleTasks.length} ${PRINT_UI.tasksMetaLabel}`;
      root.appendChild(
        _createPrintPage(
          pageTitle,
          _renderPrintGanttPage(rowTasks, weekStart, weekEnd, layout),
          meta,
        ),
      );
    }
  }
}

function _resolvePrintGanttLayout(settings, metrics, taskCount, allWeeks) {
  return typeof buildRuntimeResolvePrintGanttLayout === "function"
    ? buildRuntimeResolvePrintGanttLayout({ settings, metrics, taskCount, allWeeks })
    : (() => {
        const density = settings.contentScale;
        const headH = 118;
        const nW = Math.max(20, Math.round(34 * density));
        const nameW = Math.max(110, Math.round(220 * density));
        const progW = Math.max(34, Math.round(46 * density));
        const fixedW = nW + nameW + progW;
        let weekW = Math.max(8, Math.round(22 * density));
        let rowH = Math.max(22, Math.round(28 * density));

        if (settings.fitMode === "width" || settings.fitMode === "page") {
          weekW = Math.max(2, Math.floor((metrics.contentWpx - fixedW - 2) / Math.max(1, allWeeks)));
        }

        if (settings.fitMode === "height" || settings.fitMode === "page") {
          rowH = Math.max(12, Math.floor((metrics.contentHpx - headH) / Math.max(1, taskCount)));
        }

        return {
          nW,
          nameW,
          progW,
          fixedW,
          weekW,
          rowH,
          weeksPerPage: settings.fitMode === "width" || settings.fitMode === "page"
            ? Math.max(1, allWeeks)
            : Math.max(4, Math.floor((metrics.contentWpx - fixedW - 2) / weekW)),
          rowsPerPage: settings.fitMode === "height" || settings.fitMode === "page"
            ? Math.max(1, taskCount)
            : Math.max(8, Math.floor((metrics.contentHpx - headH) / rowH)),
        };
      })();
}

function _renderPrintGanttPage(rowTasks, weekStart, weekEnd, layout) {
  const weeks = weekEnd - weekStart + 1;
  const months = _getPrintMonthSpans(weekStart, weekEnd);
  const tw = todayWk();
  const todayVisible = tw >= weekStart && tw <= weekEnd;
  const todayLeft = layout.fixedW + (tw - weekStart) * layout.weekW + Math.floor(layout.weekW / 2);
  const colStyle = `--pg-n:${layout.nW}px;--pg-name:${layout.nameW}px;--pg-prog:${layout.progW}px;--pg-week:${layout.weekW}px;--pg-weeks:${weeks};--pg-row-h:${layout.rowH}px;`;
  const monthCells = months
    .map((m) => `<div class="pg-month" style="grid-column:span ${m.weeks}">${_printEsc(m.label)}</div>`)
    .join("");
  const weekCells = Array.from({ length: weeks }, (_, i) => {
    const abs = weekStart + i;
    return `<div class="pg-week${abs % 4 === 0 ? " ms" : ""}${abs === tw ? " today" : ""}">${(abs % 4) + 1}</div>`;
  }).join("");
  const rows = rowTasks.map((t) => _renderPrintGanttRow(t, weekStart, weekEnd, layout)).join("");

  return `
    <div class="print-gantt" style="${colStyle}">
      <div class="pg-row pg-head pg-month-row">
        <div class="pg-fixed pg-num" style="grid-row:span 2">#</div>
        <div class="pg-fixed pg-name" style="grid-row:span 2">${PRINT_UI.workTypeHeader}</div>
        <div class="pg-fixed pg-prog" style="grid-row:span 2">%</div>
        ${monthCells}
      </div>
      <div class="pg-row pg-head pg-week-row">
        <div class="pg-fixed ghost"></div>
        <div class="pg-fixed ghost"></div>
        <div class="pg-fixed ghost"></div>
        ${weekCells}
      </div>
      ${rows}
      ${todayVisible ? `<div class="pg-today-line" style="left:${todayLeft}px"></div>` : ""}
    </div>`;
}

function _getPrintMonthSpans(weekStart, weekEnd) {
  const ml = getML();
  const spans = [];
  for (let w = weekStart; w <= weekEnd; ) {
    const monthIdx = Math.floor(w / 4);
    const monthEnd = Math.min(weekEnd, monthIdx * 4 + 3);
    const m = ml[monthIdx] || { name: "", y: "" };
    spans.push({ label: `${m.name} ${m.y}`, weeks: monthEnd - w + 1 });
    w = monthEnd + 1;
  }
  return spans;
}

function _renderPrintGanttRow(t, weekStart, weekEnd, layout) {
  const start = t.ms * 4 + t.ws;
  const end = t.me * 4 + t.we;
  const visibleStart = Math.max(start, weekStart);
  const visibleEnd = Math.min(end, weekEnd);
  const hasBar = visibleEnd >= weekStart && visibleStart <= weekEnd;
  const barLeft = layout.fixedW + (visibleStart - weekStart) * layout.weekW;
  const barWidth = Math.max(layout.weekW, (visibleEnd - visibleStart + 1) * layout.weekW);
  const progressWidth = Math.round((barWidth * (+t.prog || 0)) / 100);
  const weekCells = Array.from({ length: weekEnd - weekStart + 1 }, (_, i) => {
    const abs = weekStart + i;
    return `<div class="pg-cell${abs % 4 === 0 ? " ms" : ""}${abs === todayWk() ? " today" : ""}"></div>`;
  }).join("");
  const color = monoBarColor || CC(t.cat);

  return `
    <div class="pg-row pg-task-row">
      <div class="pg-fixed pg-num">${_printEsc(t.n)}</div>
      <div class="pg-fixed pg-name"><span class="pg-cat-dot" style="background:${_printEsc(CC(t.cat))}"></span>${_printEsc(t.name)}</div>
      <div class="pg-fixed pg-prog">${_printEsc(t.prog || 0)}%</div>
      ${weekCells}
      ${
        hasBar
          ? `<div class="pg-bar" style="left:${barLeft}px;width:${barWidth}px;background:${_printEsc(color)}">
              <span class="pg-bar-progress" style="width:${progressWidth}px"></span>
              <span class="pg-bar-label">${_printEsc(t.prog || 0)}%</span>
            </div>`
          : ""
      }
    </div>`;
}

function _appendPrintFinance(root, metrics, settings) {
  const totalBudget = tasks.reduce((s, t) => s + (+t.budget || 0), 0);
  const totalSpent = tasks.reduce((s, t) => s + (+t.spent || 0), 0);
  const totalRest = totalBudget - totalSpent;
  const done = tasks.filter((t) => +t.prog >= 100).length;
  const cards = [
    [PRINT_UI.financeBudgetLabel, fmtM(totalBudget), PRINT_UI.currencyUnit],
    [PRINT_UI.financeSpentLabel, fmtM(totalSpent), PRINT_UI.currencyUnit],
    [PRINT_UI.financeRestLabel, fmtM(totalRest), PRINT_UI.currencyUnit],
    [PRINT_UI.financeTasksLabel, String(tasks.length), `${done} ${PRINT_UI.financeDoneSuffix}`],
  ]
    .map(([label, value, sub]) => `<div class="print-fin-card"><span>${_printEsc(label)}</span><b>${_printEsc(value)}</b><small>${_printEsc(sub)}</small></div>`)
    .join("");

  const financeRows = tasks.map((t) => {
    const rest = (+t.budget || 0) - (+t.spent || 0);
    return `<tr>
      <td>${_printEsc(t.n)}</td>
      <td>${_printEsc(t.name)}</td>
      <td>${_printEsc(CN(t.cat))}</td>
      <td class="nr">${_printEsc(dur(t))}</td>
      <td class="nr">${_printEsc(fmtM(t.budget))}</td>
      <td class="nr">${_printEsc(fmtM(t.spent))}</td>
      <td class="nr">${_printEsc(fmtM(rest))}</td>
      <td class="nr">${_printEsc(t.prog || 0)}%</td>
    </tr>`;
  });

  const sCurveImg = _getSCurveImage();
  const weeklyCostImg = _getWeeklyCostImage();
  root.appendChild(
    _createPrintPage(
      PRINT_UI.financeTitle,
      `<div class="print-fin-cards">${cards}</div>`,
    ),
  );
  root.appendChild(
    _createPrintPage(
      PRINT_UI.sCurveTitle,
      sCurveImg
        ? `<div class="print-fin-chart print-fin-chart-lg"><img src="${sCurveImg}" alt="${PRINT_UI.sCurveAlt}"></div>`
        : `<div class="print-empty">${PRINT_UI.sCurveUnavailableText}</div>`,
    ),
  );
  if (showWeeklyCostBars) {
    root.appendChild(
      _createPrintPage(
        PRINT_UI.weeklyCostTitle,
        weeklyCostImg
          ? `<div class="print-fin-chart print-fin-chart-lg"><img src="${weeklyCostImg}" alt="${PRINT_UI.weeklyCostAlt}"></div>`
          : `<div class="print-empty">${PRINT_UI.weeklyCostUnavailableText}</div>`,
      ),
    );
  }

  const fitFinanceTable = settings.fitMode === "height" || settings.fitMode === "page";
  const rowsPerPage = fitFinanceTable
    ? Math.max(1, financeRows.length)
    : Math.max(6, Math.floor((metrics.contentHpx - 120) / 54));
  const fitFont = fitFinanceTable ? 14 : 15;
  for (let i = 0; i < Math.max(1, financeRows.length); i += rowsPerPage) {
    const chunk = financeRows.slice(i, i + rowsPerPage).join("");
    root.appendChild(
      _createPrintPage(
        PRINT_UI.financeTitle,
        `<table class="print-fin-table${fitFinanceTable ? " fit" : ""}" style="--fin-font:${fitFont}px">
          <colgroup>
            <col style="width:5%">
            <col style="width:27%">
            <col style="width:18%">
            <col style="width:8%">
            <col style="width:13%">
            <col style="width:13%">
            <col style="width:10%">
            <col style="width:6%">
          </colgroup>
          <thead><tr><th>#</th><th>${PRINT_UI.financeTableHeaders.task}</th><th>${PRINT_UI.financeTableHeaders.category}</th><th>${PRINT_UI.financeTableHeaders.weeks}</th><th>${PRINT_UI.financeTableHeaders.budget}</th><th>${PRINT_UI.financeTableHeaders.spent}</th><th>${PRINT_UI.financeTableHeaders.rest}</th><th>${PRINT_UI.financeTableHeaders.progress}</th></tr></thead>
          <tbody>${chunk || `<tr><td colspan="8">${PRINT_UI.noTasksShortText}</td></tr>`}</tbody>
         </table>`,
        financeRows.length ? `${i + 1}-${Math.min(i + rowsPerPage, financeRows.length)} ? ${financeRows.length} ${PRINT_UI.tasksMetaLabel}` : "",
      ),
    );
  }
}
function _appendPrintCharts(root, chartIds) {
  chartIds.forEach((cid) => {
    const card = document.getElementById(cid);
    if (!card) return;
    const title = card.querySelector("h4 span")?.textContent || PRINT_UI.chartPageFallbackTitle;
    const img = _getChartImage(cid);
    if (!img) return;
    root.appendChild(
      _createPrintPage(
        title,
        `<div class="print-chart-page"><img src="${img}" alt="${_printEsc(title)}"></div>`,
      ),
    );
  });
}

async function doExportPDF() {
  closePrintDialog();
  const sections = _getPrintSections();
  const settings = _getPrintSettings();

  Swal.fire({
    title: PRINT_UI.exportPdfTitle,
    html: `<div class="pdf-progress-wrap">
      <div class="pdf-progress-icon">PDF</div>
      <div id="pdf-progress" class="pdf-progress-text">${PRINT_UI.exportPdfProgressText}</div>
    </div>`,
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: async () => {
      try {
        await _generatePDF(sections, settings);
        Swal.close();
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: PRINT_UI.exportPdfSuccessTitle,
          showConfirmButton: false,
          timer: 2500,
        });
      } catch (e) {
        Swal.fire({ icon: "error", title: PRINT_UI.exportPdfErrorTitle, text: e.message });
      }
    },
  });
}

async function _generatePDF(sections, settings = PRINT_DEFAULTS) {
  const { jsPDF } = window.jspdf;
  const progress = document.getElementById("pdf-progress");
  _removePrintRoot();
  const root = _buildPrintRoot(sections, settings);
  root.classList.add("pdf-render-root");
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const pdf = new jsPDF({ orientation: settings.orientation, unit: "mm", format: settings.paper });
  const metrics = _getPrintMetrics(settings);
  const pages = [...root.querySelectorAll(".print-page")];

  for (let i = 0; i < pages.length; i++) {
    if (progress) progress.textContent = PRINT_UI.pdfPageProgressText(i + 1, pages.length);
    const canvas = await html2canvas(pages[i], {
      scale: settings.renderScale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
    });
    if (i > 0) pdf.addPage();
    const imgH = Math.min(metrics.contentHmm, (canvas.height / canvas.width) * metrics.contentWmm);
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", settings.margin, settings.margin, metrics.contentWmm, imgH);
  }

  _removePrintRoot();
  pdf.save(`${proj.name}_${new Date().toLocaleDateString("uk-UA").replace(/\./g, "-")}.pdf`);
}
