const Y_LABELS = {
  count: "Кількість",
  budget: "Бюджет (грн)",
  spent: "Витрачено (грн)",
  rest: "Залишок (грн)",
  prog: "Виконання (%)",
  dur: "Тривалість (тиж.)",
  cat: "Категорія",
  contr: "Підрядник",
  status: "Статус",
  month: "Місяць",
  task: "Робота",
};
const X_LABELS = { ...Y_LABELS };

/** Оновлює список категорій у фільтрі chart builder. */
function updateCbCatFilter() {
  const s = document.getElementById("cb-fcat");
  s.innerHTML =
    '<option value="">Усі</option>' +
    cats.map((c, i) => `<option value="${i}">${c.name}</option>`).join("");
}

/** Агрегує дані задач для побудови графіка. */
function getChartData(xKey, yKey, catF, statF) {
  const src = tasks.filter((t) => {
    if (hiddenCats.has(t.cat)) return false;
    if (catF !== "" && t.cat !== +catF) return false;
    if (statF === "done" && t.prog < 100) return false;
    if (statF === "active" && (t.prog === 0 || t.prog === 100)) return false;
    if (statF === "pending" && t.prog !== 0) return false;
    return true;
  });

  const getKey = (t) => {
    if (xKey === "cat") return CN(t.cat);
    if (xKey === "contr") {
      const contractors = typeof taskContractors === "function" ? taskContractors(t) : [t.contr || ""];
      return contractors.length ? contractors.join(", ") : "(без підрядника)";
    }
    if (xKey === "status")
      return t.prog === 100
        ? "Завершено"
        : t.prog > 0
          ? "В роботі"
          : "Не розпочато";
    if (xKey === "task") return t.n + ". " + t.name.substring(0, 22);
    if (xKey === "month") {
      const ml = getML();
      return ml[t.ms] ? `${ml[t.ms].name} ${ml[t.ms].y}` : "?";
    }
    return "?";
  };
  const getVal = (t) => {
    if (yKey === "count") return 1;
    if (yKey === "budget") return +t.budget || 0;
    if (yKey === "spent") return +t.spent || 0;
    if (yKey === "rest") return (+t.budget || 0) - (+t.spent || 0);
    if (yKey === "prog") return t.prog;
    if (yKey === "dur") return dur(t);
    return 0;
  };

  const groups = {},
    cnt = {};
  src.forEach((t) => {
    const k = getKey(t),
      v = getVal(t);
    if (k in groups) {
      groups[k] += v;
      cnt[k] = (cnt[k] || 0) + 1;
    } else {
      groups[k] = v;
      cnt[k] = 1;
    }
  });

  if (yKey === "prog")
    Object.keys(groups).forEach(
      (k) => (groups[k] = Math.round(groups[k] / (cnt[k] || 1))),
    );

  if (xKey === "task")
    return {
      labels: Object.keys(groups).slice(0, 15),
      values: Object.values(groups).slice(0, 15),
    };

  return { labels: Object.keys(groups), values: Object.values(groups) };
}

/** Підбирає кольори для груп графіка. */
function getGroupColors(xKey, labels) {
  if (xKey === "cat")
    return labels.map((l) => {
      const c = cats.find((c2) => c2.name === l);
      return c ? c.color : "#888";
    });
  if (xKey === "status")
    return labels.map((l) =>
      l === "Завершено" ? "#16803c" : l === "В роботі" ? "#c07800" : "#a09d97",
    );
  const pal = [
    "#2563eb",
    "#16803c",
    "#c07800",
    "#b71c1c",
    "#006494",
    "#8a6200",
    "#5a5a5a",
    "#7c3aed",
    "#0891b2",
    "#be185d",
  ];
  return labels.map((_, i) => pal[i % pal.length]);
}

/** Спільні Chart.js options для всіх графіків. */
function buildChartOptions(type, isHoriz) {
  return {
    indexAxis: isHoriz ? "y" : undefined,
    responsive: true,
    plugins: {
      legend: {
        display: type === "pie" || type === "doughnut",
        position: "bottom",
        labels: { font: { size: 10 }, boxWidth: 10 },
      },
    },
    scales:
      type === "pie" || type === "doughnut"
        ? {}
        : {
            x: { ticks: { font: { size: 9 }, maxRotation: isHoriz ? 0 : 35 } },
            y: {
              ticks: {
                font: { size: 9 },
                callback: (v) => (typeof v === "number" ? fmtM(v) : v),
              },
            },
          },
  };
}

/** Додає новий кастомний графік з форми chart builder. */
function addCustomChart() {
  const type = document.getElementById("cb-type").value;
  const xKey = document.getElementById("cb-x").value;
  const yKey = document.getElementById("cb-y").value;
  const catF = document.getElementById("cb-fcat").value;
  const statF = document.getElementById("cb-fstat").value;
  const { labels, values } = getChartData(xKey, yKey, catF, statF);
  const colors = getGroupColors(xKey, labels);
  const title = `${Y_LABELS[yKey]} за ${X_LABELS[xKey]}`;
  const id = "cc_" + Date.now();

  customCharts.push({
    id,
    type,
    xKey,
    yKey,
    catF,
    statF,
    labels,
    values,
    colors,
    title,
  });
  renderCustomChart(customCharts[customCharts.length - 1]);
}

/** Рендерить один кастомний графік у grid. */
function renderCustomChart(c) {
  const grid = document.getElementById("chart-grid");
  const card = document.createElement("div");
  card.className = "chart-card";
  card.id = c.id;
  card.innerHTML = `<h4><span>${c.title}</span>
    <div class="chart-actions">
      <button class="chart-act-btn" onclick="openChartEdit('${c.id}')" title="Редагувати"><i data-lucide="pencil"></i></button>
      <button class="chart-act-btn" onclick="printChart('${c.id}')"   title="Друк"><i data-lucide="printer"></i></button>
      <button class="chart-act-btn del" onclick="removeChart('${c.id}')" title="Видалити"><i data-lucide="x"></i></button>
    </div>
  </h4><canvas height="200"></canvas>`;
  lucide.createIcons({ nodes: [card] });
  grid.appendChild(card);

  const realType = c.type === "horizontalBar" ? "bar" : c.type;
  const isHoriz = c.type === "horizontalBar";
  const inst = new Chart(card.querySelector("canvas").getContext("2d"), {
    type: realType,
    data: {
      labels: c.labels,
      datasets: [
        {
          data: c.values,
          backgroundColor: c.colors,
          borderColor: realType === "line" ? c.colors[0] : undefined,
          borderWidth: realType === "line" ? 2 : 0,
          fill: false,
          tension: 0.3,
        },
      ],
    },
    options: buildChartOptions(realType, isHoriz),
  });
  chartInstances.push({ id: c.id, inst });
}

let removedAutoCharts = new Set();

/** Видаляє авто-графік до наступного оновлення вкладки. */
function removeAutoChart(id) {
  removedAutoCharts.add(id);
  const inst = chartInstances.find((c) => c.id === id);
  if (inst)
    try {
      inst.inst.destroy();
    } catch (_) {}
  chartInstances = chartInstances.filter((c) => c.id !== id);
  document.getElementById(id)?.remove();
}

/** Видаляє кастомний графік. */
function removeChart(id) {
  const inst = chartInstances.find((c) => c.id === id);
  if (inst)
    try {
      inst.inst.destroy();
    } catch (_) {}
  chartInstances = chartInstances.filter((c) => c.id !== id);
  customCharts = customCharts.filter((c) => c.id !== id);
  document.getElementById(id)?.remove();
}

/** Відкриває модал редагування графіка. */
function openChartEdit(id) {
  const cc = customCharts.find((c) => c.id === id);
  document.getElementById("ce-id").value = id;

  const sel = document.getElementById("ce-fcat");
  sel.innerHTML =
    '<option value="">Усі</option>' +
    cats.map((c, i) => `<option value="${i}">${c.name}</option>`).join("");

  if (cc) {
    document.getElementById("ce-type").value = cc.type;
    document.getElementById("ce-x").value = cc.xKey;
    document.getElementById("ce-y").value = cc.yKey;
    document.getElementById("ce-fcat").value = cc.catF;
    document.getElementById("ce-fstat").value = cc.statF;
  } else {
    const autoDefaults = {
      a1: { type: "pie", x: "cat", y: "count" },
      a2: { type: "bar", x: "cat", y: "prog" },
      a3: { type: "doughnut", x: "status", y: "count" },
      a4: { type: "bar", x: "task", y: "dur" },
      a5: { type: "line", x: "month", y: "count" },
    };
    const def = autoDefaults[id] || { type: "bar", x: "cat", y: "count" };
    document.getElementById("ce-type").value = def.type;
    document.getElementById("ce-x").value = def.x;
    document.getElementById("ce-y").value = def.y;
    document.getElementById("ce-fcat").value = "";
    document.getElementById("ce-fstat").value = "";
  }
  document.getElementById("chart-edit-modal").style.display = "flex";
}

function closeChartEdit() {
  document.getElementById("chart-edit-modal").style.display = "none";
}

/** Застосовує зміни з модала редагування до графіка. */
function applyChartEdit() {
  const id = document.getElementById("ce-id").value;
  const type = document.getElementById("ce-type").value;
  const xKey = document.getElementById("ce-x").value;
  const yKey = document.getElementById("ce-y").value;
  const catF = document.getElementById("ce-fcat").value;
  const statF = document.getElementById("ce-fstat").value;
  const { labels, values } = getChartData(xKey, yKey, catF, statF);
  const colors = getGroupColors(xKey, labels);
  const title = `${Y_LABELS[yKey]} за ${X_LABELS[xKey]}`;

  const inst = chartInstances.find((c) => c.id === id);
  if (inst)
    try {
      inst.inst.destroy();
    } catch (_) {}
  chartInstances = chartInstances.filter((c) => c.id !== id);

  const card = document.getElementById(id);
  if (!card) {
    closeChartEdit();
    return;
  }

  card
    .querySelector("canvas")
    .replaceWith(
      Object.assign(document.createElement("canvas"), { height: 200 }),
    );
  card.querySelector("h4 span").textContent = title;

  const realType = type === "horizontalBar" ? "bar" : type;
  const isHoriz = type === "horizontalBar";
  const newInst = new Chart(card.querySelector("canvas").getContext("2d"), {
    type: realType,
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderColor: realType === "line" ? colors[0] : undefined,
          borderWidth: realType === "line" ? 2 : 0,
          fill: false,
          tension: 0.3,
        },
      ],
    },
    options: buildChartOptions(realType, isHoriz),
  });
  chartInstances.push({ id, inst: newInst });

  const ci = customCharts.findIndex((c) => c.id === id);
  if (ci >= 0)
    customCharts[ci] = {
      ...customCharts[ci],
      type,
      xKey,
      yKey,
      catF,
      statF,
      labels,
      values,
      colors,
      title,
    };

  closeChartEdit();
}

/** Друкує графік у новому вікні. */
function printChart(id) {
  const card = document.getElementById(id);
  if (!card) return;
  const canvas = card.querySelector("canvas");
  const title = card.querySelector("h4 span")?.textContent || "Chart";
  const img = canvas.toDataURL("image/png");
  const w = window.open("", "_blank");
  w.document.write(
    `<!DOCTYPE html><html><head><title>${title}</title>
    <style>body{font-family:'Segoe UI',sans-serif;padding:20px;text-align:center}
    h2{font-size:14px;margin-bottom:16px;color:#333}img{max-width:100%}@page{margin:10mm}</style>
    </head><body><h2>${title}</h2><img src="${img}"><br><br>
    <script>window.onload=function(){window.print();window.close();}<\/script></body></html>`,
  );
  w.document.close();
}

/** Рендерить 5 авто-графіків на вкладці Аналітика. */
printChart = function (id) {
  const card = document.getElementById(id);
  if (!card) return;
  const title = card.querySelector("h4 span")?.textContent || "Chart";
  const img = typeof _getChartImage === "function"
    ? _getChartImage(id)
    : card.querySelector("canvas")?.toDataURL("image/png");
  if (!img || img === "data:,") return;

  const w = window.open("", "_blank");
  if (!w) return;

  w.document.write(
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
        window.onafterprint=function(){window.close();};
      })();
    <\/script></body></html>`,
  );
  w.document.close();
};

function renderAutoCharts() {
  const grid = document.getElementById("chart-grid");
  grid
    .querySelectorAll('.chart-card:not([id^="cc_"])')
    .forEach((el) => el.remove());
  chartInstances
    .filter((c) => !c.id.startsWith("cc_"))
    .forEach((c) => {
      try {
        c.inst.destroy();
      } catch (_) {}
    });
  chartInstances = chartInstances.filter((c) => c.id.startsWith("cc_"));

  const autoCharts = [
    { id: "a1", type: "pie", x: "cat", y: "count", title: "Кількість робіт за категорією" },
    { id: "a2", type: "bar", x: "cat", y: "prog", title: "Середнє виконання за категорією (%)" },
    { id: "a3", type: "doughnut", x: "status", y: "count", title: "Статус виконання" },
    { id: "a4", type: "bar", x: "task", y: "dur", title: "Тривалість (тиж., топ 15)" },
    { id: "a5", type: "line", x: "month", y: "count", title: "Активних робіт по місяцях" },
  ];

  autoCharts.forEach((c) => {
    if (removedAutoCharts.has(c.id)) return;
    const { labels, values } = getChartData(c.x, c.y, "", "");
    const colors = getGroupColors(c.x, labels);
    const card = document.createElement("div");
    card.className = "chart-card";
    card.id = c.id;
    card.innerHTML = `<h4><span>${c.title}</span>
      <div class="chart-actions">
        <button class="chart-act-btn" onclick="openChartEdit('${c.id}')" title="Редагувати"><i data-lucide="pencil"></i></button>
        <button class="chart-act-btn" onclick="printChart('${c.id}')"   title="Друк"><i data-lucide="printer"></i></button>
        <button class="chart-act-btn del" onclick="removeAutoChart('${c.id}')" title="Видалити"><i data-lucide="x"></i></button>
      </div>
    </h4><canvas height="200"></canvas>`;
    lucide.createIcons({ nodes: [card] });
    grid.appendChild(card);

    const inst = new Chart(card.querySelector("canvas").getContext("2d"), {
      type: c.type,
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderColor: c.type === "line" ? colors[0] : undefined,
            borderWidth: c.type === "line" ? 2 : 0,
            fill: false,
            tension: 0.3,
          },
        ],
      },
      options: buildChartOptions(c.type, false),
    });
    chartInstances.push({ id: c.id, inst });
  });
}

