let criticalSet = new Set();
let showCritical = false;

/** Перераховує критичний шлях (CPM) і оновлює criticalSet. */
function computeCriticalPath() {
  criticalSet = new Set();
  const n = tasks.length;
  if (n === 0) return;

  const byId = {};
  tasks.forEach((t, i) => { byId[t.id] = i; });

  const successors = Array.from({ length: n }, () => []);
  tasks.forEach((t, i) => {
    (t.deps || []).forEach((rawDep) => {
      const dep = normDep(rawDep);
      if (dep.type === "FF") return;
      const pi = byId[dep.id];
      if (pi !== undefined) successors[pi].push(i);
    });
  });

  const durArr = tasks.map((t) => Math.max(1, dur(t)));
  const es = new Array(n).fill(0);
  const ef = new Array(n).fill(0);
  const ls = new Array(n).fill(0);
  const lf = new Array(n).fill(0);

  const inDeg = new Array(n).fill(0);
  tasks.forEach((t) => {
    (t.deps || []).forEach((rawDep) => {
      const dep = normDep(rawDep);
      if (dep.type === "FF") return;
      const pi = byId[dep.id];
      if (pi !== undefined) inDeg[tasks.indexOf(t)]++;
    });
  });
  const queue = [];
  for (let i = 0; i < n; i++) if (inDeg[i] === 0) queue.push(i);
  const order = [];
  while (queue.length) {
    const curr = queue.shift();
    order.push(curr);
    successors[curr].forEach((s) => { if (--inDeg[s] === 0) queue.push(s); });
  }
  const processOrder = order.length === n ? order : tasks.map((_, i) => i);

  // Прямий прохід: ES / EF
  processOrder.forEach((i) => {
    const preds = (tasks[i].deps || [])
      .map(raw => normDep(raw))
      .filter(dep => dep.type !== "FF")
      .map(dep => byId[dep.id])
      .filter(p => p !== undefined);
    es[i] = preds.length > 0 ? Math.max(...preds.map(p => ef[p])) + 1 : 0;
    ef[i] = es[i] + durArr[i] - 1;
  });

  const projectEnd = Math.max(...ef);

  // Зворотній прохід: LS / LF
  [...processOrder].reverse().forEach((i) => {
    const sucLS = successors[i].map((s) => ls[s]);
    lf[i] = sucLS.length > 0 ? Math.min(...sucLS) - 1 : projectEnd;
    ls[i] = lf[i] - durArr[i] + 1;
  });

  // Задача на критичному шляху лише якщо вона підключена до мережі залежностей
  // (має попередників АБО наступників) І має нульовий резерв
  tasks.forEach((_, i) => {
    const connected = (tasks[i].deps || []).some(raw => {
      const dep = normDep(raw);
      return dep.type !== "FF" && byId[dep.id] !== undefined;
    }) || successors[i].length > 0;
    if (connected && (ls[i] - es[i]) <= 0) criticalSet.add(i);
  });
}

/** Перемикає відображення критичного шляху. */
function toggleCriticalPath() {
  showCritical = !showCritical;
  document.getElementById("btn-critical")?.classList.toggle("on", showCritical);
  renderTable();
}
