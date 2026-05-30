const CHARTS_UI = typeof buildRuntimeChartsUiModel === "function"
  ? buildRuntimeChartsUiModel()
  : {
      axisLabels: {
        count: "Count",
        budget: "Budget (UAH)",
        spent: "Spent (UAH)",
        rest: "Remaining (UAH)",
        prog: "Progress (%)",
        dur: "Duration (weeks)",
        cat: "Category",
        contr: "Contractor",
        status: "Status",
        month: "Month",
        task: "Task",
      },
      actionLabels: {
        allCategoriesLabel: "All",
        noContractorLabel: "(no contractor)",
        doneStatusLabel: "Done",
        activeStatusLabel: "Active",
        pendingStatusLabel: "Pending",
        editTitle: "Edit",
        printTitle: "Print",
        deleteTitle: "Delete",
        chartFallbackTitle: "Chart",
      },
      autoCharts: [
        { id: "a1", type: "pie", x: "cat", y: "count", title: "Tasks by category" },
        { id: "a2", type: "bar", x: "cat", y: "prog", title: "Average progress by category (%)" },
        { id: "a3", type: "doughnut", x: "status", y: "count", title: "Execution status" },
        { id: "a4", type: "bar", x: "task", y: "dur", title: "Duration (weeks, top 15)" },
        { id: "a5", type: "line", x: "month", y: "count", title: "Active tasks by month" },
      ],
    };

const Y_LABELS = CHARTS_UI.axisLabels;
const X_LABELS = { ...CHARTS_UI.axisLabels };
let _reactChartEditState = {
  visible: false,
};

function isReactChartEditEnabled() {
  return document.body?.dataset?.reactTransitionChartEdit === "enabled";
}

function syncReactChartEditBridge() {
  document.dispatchEvent(new CustomEvent("plan-master:chart-edit-sync"));
}

function getChartEditBridgeSnapshot() {
  return {
    visible: _reactChartEditState.visible,
    chartId: document.getElementById("ce-id")?.value || "",
    form: {
      type: document.getElementById("ce-type")?.value || "bar",
      xKey: document.getElementById("ce-x")?.value || "cat",
      yKey: document.getElementById("ce-y")?.value || "count",
      category: document.getElementById("ce-fcat")?.value || "",
      status: document.getElementById("ce-fstat")?.value || "",
    },
    categoryOptionsHtml: document.getElementById("ce-fcat")?.innerHTML || '<option value="">Усі</option>',
    labels: {
      title: "Редагувати графік",
      typeLabel: "Тип",
      xAxisLabel: "Вісь X / групування",
      yAxisLabel: "Показник Y",
      categoryLabel: "Категорія",
      statusLabel: "Статус",
      cancelButton: "Скасувати",
      applyButton: "Оновити",
    },
    capturedAt: new Date().toISOString(),
  };
}

function updateCbCatFilter() {
  const select = document.getElementById("cb-fcat");
  if (!select) return;
  select.innerHTML =
    `<option value="">${CHARTS_UI.actionLabels.allCategoriesLabel}</option>` +
    cats.map((category, index) => `<option value="${index}">${category.name}</option>`).join("");
}

function getChartData(xKey, yKey, catF, statF) {
  return typeof buildRuntimeChartData === "function"
    ? buildRuntimeChartData({
        tasks,
        xKey,
        yKey,
        catFilter: catF,
        statFilter: statF,
        hiddenCats,
        noContractorLabel: CHARTS_UI.actionLabels.noContractorLabel,
        statusLabels: {
          done: CHARTS_UI.actionLabels.doneStatusLabel,
          active: CHARTS_UI.actionLabels.activeStatusLabel,
          pending: CHARTS_UI.actionLabels.pendingStatusLabel,
        },
        getCategoryName: (cat) => CN(cat),
        getMonthLabel: (monthIndex) => {
          const ml = getML();
          return ml[monthIndex] ? `${ml[monthIndex].name} ${ml[monthIndex].y}` : "?";
        },
        getTaskContractors: (task) => {
          if (typeof taskContractors === "function") return taskContractors(task);
          return task.contr ? [task.contr] : [];
        },
        getTaskDuration: (task) => dur(task),
      })
    : { labels: [], values: [] };
}

function getGroupColors(xKey, labels) {
  return typeof buildRuntimeChartColors === "function"
    ? buildRuntimeChartColors({
        xKey,
        labels,
        categories: cats,
        statusLabels: {
          done: CHARTS_UI.actionLabels.doneStatusLabel,
          active: CHARTS_UI.actionLabels.activeStatusLabel,
          pending: CHARTS_UI.actionLabels.pendingStatusLabel,
        },
      })
    : [];
}

function buildChartOptions(type, isHoriz) {
  const base = typeof buildRuntimeChartOptions === "function"
    ? buildRuntimeChartOptions(type, isHoriz)
    : {};
  if (type === "pie" || type === "doughnut") return base;
  return {
    ...base,
    scales: {
      ...(base.scales || {}),
      y: {
        ...((base.scales || {}).y || {}),
        ticks: {
          ...((((base.scales || {}).y || {}).ticks) || {}),
          callback: (value) => (typeof value === "number" ? fmtM(value) : value),
        },
      },
    },
  };
}

function buildChartDefinition(id, type, xKey, yKey, catF, statF, labels, values, colors) {
  return typeof buildRuntimeChartDefinition === "function"
    ? buildRuntimeChartDefinition({
        id,
        type,
        xKey,
        yKey,
        catF,
        statF,
        labels,
        values,
        colors,
        axisLabels: Y_LABELS,
      })
    : {
        id,
        type,
        xKey,
        yKey,
        catF,
        statF,
        labels,
        values,
        colors,
        title: `${Y_LABELS[yKey]} за ${X_LABELS[xKey]}`,
      };
}

function getChartRenderType(type) {
  return typeof buildRuntimeNormalizeChartRenderType === "function"
    ? buildRuntimeNormalizeChartRenderType(type)
    : { realType: type === "horizontalBar" ? "bar" : type, isHoriz: type === "horizontalBar" };
}

function createChartInstance(canvas, chart) {
  const renderType = getChartRenderType(chart.type);
  return new Chart(canvas.getContext("2d"), {
    type: renderType.realType,
    data: {
      labels: chart.labels,
      datasets: [
        {
          data: chart.values,
          backgroundColor: chart.colors,
          borderColor: renderType.realType === "line" ? chart.colors[0] : undefined,
          borderWidth: renderType.realType === "line" ? 2 : 0,
          fill: false,
          tension: 0.3,
        },
      ],
    },
    options: buildChartOptions(renderType.realType, renderType.isHoriz),
  });
}

function addCustomChart() {
  const type = document.getElementById("cb-type").value;
  const xKey = document.getElementById("cb-x").value;
  const yKey = document.getElementById("cb-y").value;
  const catF = document.getElementById("cb-fcat").value;
  const statF = document.getElementById("cb-fstat").value;
  const { labels, values } = getChartData(xKey, yKey, catF, statF);
  const colors = getGroupColors(xKey, labels);
  const chart = buildChartDefinition(`cc_${Date.now()}`, type, xKey, yKey, catF, statF, labels, values, colors);
  customCharts.push(chart);
  renderCustomChart(chart);
}

function renderCustomChart(chart) {
  const grid = document.getElementById("chart-grid");
  if (!grid) return;
  const card = document.createElement("div");
  card.className = "chart-card";
  card.id = chart.id;
  card.innerHTML = `<h4><span>${chart.title}</span>
    <div class="chart-actions">
      <button class="chart-act-btn" data-chart-action="open-edit" data-chart-id="${chart.id}" title="${CHARTS_UI.actionLabels.editTitle}"><i data-lucide="pencil"></i></button>
      <button class="chart-act-btn" data-chart-surface-action="print-chart" data-chart-id="${chart.id}" title="${CHARTS_UI.actionLabels.printTitle}"><i data-lucide="printer"></i></button>
      <button class="chart-act-btn del" data-chart-surface-action="remove-chart" data-chart-id="${chart.id}" title="${CHARTS_UI.actionLabels.deleteTitle}"><i data-lucide="x"></i></button>
    </div>
  </h4><canvas height="200"></canvas>`;
  lucide.createIcons({ nodes: [card] });
  grid.appendChild(card);

  const inst = createChartInstance(card.querySelector("canvas"), chart);
  chartInstances.push({ id: chart.id, inst });
}

let removedAutoCharts = new Set();

function removeAutoChart(id) {
  removedAutoCharts.add(id);
  const inst = chartInstances.find((chart) => chart.id === id);
  if (inst) {
    try {
      inst.inst.destroy();
    } catch (_) {}
  }
  chartInstances = chartInstances.filter((chart) => chart.id !== id);
  document.getElementById(id)?.remove();
}

function removeChart(id) {
  const inst = chartInstances.find((chart) => chart.id === id);
  if (inst) {
    try {
      inst.inst.destroy();
    } catch (_) {}
  }
  chartInstances = chartInstances.filter((chart) => chart.id !== id);
  customCharts = customCharts.filter((chart) => chart.id !== id);
  document.getElementById(id)?.remove();
}

function openChartEdit(id) {
  const chart = customCharts.find((item) => item.id === id);
  document.getElementById("ce-id").value = id;

  const select = document.getElementById("ce-fcat");
  select.innerHTML =
    `<option value="">${CHARTS_UI.actionLabels.allCategoriesLabel}</option>` +
    cats.map((category, index) => `<option value="${index}">${category.name}</option>`).join("");

  if (chart) {
    document.getElementById("ce-type").value = chart.type;
    document.getElementById("ce-x").value = chart.xKey;
    document.getElementById("ce-y").value = chart.yKey;
    document.getElementById("ce-fcat").value = chart.catF;
    document.getElementById("ce-fstat").value = chart.statF;
  } else {
    const defaults = typeof buildRuntimeChartAutoDefaults === "function"
      ? buildRuntimeChartAutoDefaults(id, CHARTS_UI.autoCharts)
      : { type: "bar", x: "cat", y: "count" };
    document.getElementById("ce-type").value = defaults.type;
    document.getElementById("ce-x").value = defaults.x;
    document.getElementById("ce-y").value = defaults.y;
    document.getElementById("ce-fcat").value = "";
    document.getElementById("ce-fstat").value = "";
  }

  _reactChartEditState.visible = true;
  document.getElementById("chart-edit-modal").style.display = "flex";
  if (isReactChartEditEnabled()) syncReactChartEditBridge();
}

function closeChartEdit() {
  _reactChartEditState.visible = false;
  document.getElementById("chart-edit-modal").style.display = "none";
  if (isReactChartEditEnabled()) syncReactChartEditBridge();
}

function applyChartEdit() {
  const id = document.getElementById("ce-id").value;
  const type = document.getElementById("ce-type").value;
  const xKey = document.getElementById("ce-x").value;
  const yKey = document.getElementById("ce-y").value;
  const catF = document.getElementById("ce-fcat").value;
  const statF = document.getElementById("ce-fstat").value;
  const { labels, values } = getChartData(xKey, yKey, catF, statF);
  const colors = getGroupColors(xKey, labels);
  const chart = buildChartDefinition(id, type, xKey, yKey, catF, statF, labels, values, colors);

  const inst = chartInstances.find((item) => item.id === id);
  if (inst) {
    try {
      inst.inst.destroy();
    } catch (_) {}
  }
  chartInstances = chartInstances.filter((item) => item.id !== id);

  const card = document.getElementById(id);
  if (!card) {
    closeChartEdit();
    return;
  }

  card.querySelector("canvas").replaceWith(Object.assign(document.createElement("canvas"), { height: 200 }));
  card.querySelector("h4 span").textContent = chart.title;

  const newInst = createChartInstance(card.querySelector("canvas"), chart);
  chartInstances.push({ id, inst: newInst });

  const customIndex = customCharts.findIndex((item) => item.id === id);
  if (customIndex >= 0) customCharts[customIndex] = chart;

  closeChartEdit();
  if (isReactChartEditEnabled()) syncReactChartEditBridge();
}

function printChart(id) {
  const card = document.getElementById(id);
  if (!card) return;
  const title = card.querySelector("h4 span")?.textContent || CHARTS_UI.actionLabels.chartFallbackTitle;
  const img = typeof _getChartImage === "function"
    ? _getChartImage(id)
    : card.querySelector("canvas")?.toDataURL("image/png");
  if (!img || img === "data:,") return;

  const win = window.open("", "_blank");
  if (!win) return;

  win.document.write(
    `<!DOCTYPE html><html><head><title>${title}</title>
    <style>
    html,body{height:100%;margin:0}
    body{font-family:'Segoe UI',sans-serif;padding:12mm;display:flex;flex-direction:column;gap:10px;background:#fff;color:#172033;box-sizing:border-box}
    h2{font-size:18px;line-height:1.2;margin:0;color:#111827}
    .chart-print-wrap{flex:1;min-height:0;display:flex;align-items:stretch;justify-content:center}
    img{display:block;width:100%;height:100%;object-fit:contain}
    @page{margin:10mm}
    </style>
    </head><body><h2>${title}</h2>
    <div class="chart-print-wrap"><img id="chart-print-image" src="${img}" alt="${title}"></div>
    <script>
      (function(){
        const img=document.getElementById('chart-print-image');
        const done=function(){window.print();};
        if(img && img.complete) setTimeout(done, 60);
        else if(img) img.onload=done;
        window.addEventListener('afterprint', function(){window.close();}, { once:true });
      })();
    <\/script></body></html>`,
  );
  win.document.close();
}

function renderAutoCharts() {
  const grid = document.getElementById("chart-grid");
  if (!grid) return;

  grid.querySelectorAll('.chart-card:not([id^="cc_"])').forEach((element) => element.remove());
  chartInstances
    .filter((chart) => !chart.id.startsWith("cc_"))
    .forEach((chart) => {
      try {
        chart.inst.destroy();
      } catch (_) {}
    });
  chartInstances = chartInstances.filter((chart) => chart.id.startsWith("cc_"));

  CHARTS_UI.autoCharts.forEach((preset) => {
    if (removedAutoCharts.has(preset.id)) return;

    const { labels, values } = getChartData(preset.x, preset.y, "", "");
    const colors = getGroupColors(preset.x, labels);
    const chart = buildChartDefinition(preset.id, preset.type, preset.x, preset.y, "", "", labels, values, colors);
    chart.title = preset.title;

    const card = document.createElement("div");
    card.className = "chart-card";
    card.id = chart.id;
    card.innerHTML = `<h4><span>${chart.title}</span>
      <div class="chart-actions">
        <button class="chart-act-btn" data-chart-action="open-edit" data-chart-id="${chart.id}" title="${CHARTS_UI.actionLabels.editTitle}"><i data-lucide="pencil"></i></button>
        <button class="chart-act-btn" data-chart-surface-action="print-chart" data-chart-id="${chart.id}" title="${CHARTS_UI.actionLabels.printTitle}"><i data-lucide="printer"></i></button>
        <button class="chart-act-btn del" data-chart-surface-action="remove-auto-chart" data-chart-id="${chart.id}" title="${CHARTS_UI.actionLabels.deleteTitle}"><i data-lucide="x"></i></button>
      </div>
    </h4><canvas height="200"></canvas>`;
    lucide.createIcons({ nodes: [card] });
    grid.appendChild(card);

    const inst = createChartInstance(card.querySelector("canvas"), chart);
    chartInstances.push({ id: chart.id, inst });
  });
}
