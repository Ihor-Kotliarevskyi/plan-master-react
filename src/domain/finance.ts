type AnyRecord = Record<string, any>;

export interface FinanceFiltersShape {
  cat?: unknown;
  stat?: unknown;
  contr?: unknown;
  budgetMin?: string | number;
  budgetMax?: string | number;
  onlyBudget?: boolean;
  q?: string;
}

export interface FinanceOverviewMetrics {
  budget: number;
  spent: number;
  rest: number;
  spentPct: number;
  bcwp: number;
  acwp: number;
  bac: number;
  cpi: number | null;
  eac: number | null;
  etc: number | null;
  vac: number | null;
}

export interface FinanceDeletionSummary {
  tasks: number;
  budget: number;
  spent: number;
  items: number;
  acts: number;
  payments: number;
}

export interface FinanceResizeSession {
  col: string;
  startX: number;
  startW: number;
  widths: Record<string, number>;
}

export function financeItemTotal(item: AnyRecord): number {
  const qty = item?.qty == null ? 1 : (+item.qty || 0);
  return qty * (+item?.unitPrice || 0);
}

export function hasFinanceFilters(filters: FinanceFiltersShape, multiValues: (value: unknown) => string[]): boolean {
  return !!(
    multiValues(filters.cat).length ||
    multiValues(filters.stat).length ||
    multiValues(filters.contr).length ||
    filters.budgetMin !== "" ||
    filters.budgetMax !== "" ||
    filters.onlyBudget
  );
}

export function financeScopedCostItems(
  task: AnyRecord,
  selectedContractors: string[],
  contractorKey: (name: string) => string,
  getTaskCostItems: (task: AnyRecord) => AnyRecord[],
): AnyRecord[] {
  const items = getTaskCostItems(task);
  if (!selectedContractors.length) return items;
  return items.filter((item) => selectedContractors.includes(contractorKey(item.supplier)));
}

export function financeTaskScope(
  task: AnyRecord,
  selectedContractors: string[],
  contractorKey: (name: string) => string,
  getTaskCostItems: (task: AnyRecord) => AnyRecord[],
): { budget: number; spent: number; payments: AnyRecord[]; items: AnyRecord[] } {
  const items = financeScopedCostItems(task, selectedContractors, contractorKey, getTaskCostItems);
  const payments = items.flatMap((item) => item.payments || []);
  if (selectedContractors.length) {
    const budget = items.reduce((sum, item) => sum + financeItemTotal(item), 0);
    const spent = payments.reduce((sum, payment) => sum + (+payment.amount || 0), 0);
    return { budget, spent, payments, items };
  }
  return {
    budget: +task.budget || 0,
    spent: +task.spent || 0,
    payments,
    items,
  };
}

export function buildFinanceSearchText(
  task: AnyRecord,
  contractors: string[],
  items: AnyRecord[],
  categoryName: string,
  itemTypeLabels: Record<string, { label?: string }>,
  paymentTypeLabels: Record<string, string>,
): string {
  const parts: unknown[] = [
    task.n,
    task.name,
    categoryName,
    task.prog,
    task.budget,
    task.spent,
    (+task.budget || 0) - (+task.spent || 0),
  ];

  contractors.forEach((name) => parts.push(name));
  items.forEach((item) => {
    parts.push(
      item.type,
      itemTypeLabels?.[item.type]?.label,
      item.name,
      item.supplier,
      item.unit,
      item.qty,
      item.unitPrice,
      financeItemTotal(item),
    );
    (item.payments || []).forEach((payment: AnyRecord) => {
      parts.push(
        payment.date,
        payment.amount,
        payment.type,
        paymentTypeLabels?.[payment.type],
        payment.note,
      );
    });
  });

  return parts
    .filter((value) => value !== null && value !== undefined)
    .join(" ")
    .toLocaleLowerCase("uk-UA");
}

export function summarizeFinanceDeletion(
  indexes: number[],
  tasks: AnyRecord[],
  getTaskCostItems: (task: AnyRecord) => AnyRecord[],
): FinanceDeletionSummary {
  return indexes.reduce(
    (acc, index) => {
      const task = tasks[index];
      const items = getTaskCostItems(task);
      acc.tasks += 1;
      acc.budget += +task.budget || 0;
      acc.spent += +task.spent || 0;
      acc.items += items.length;
      items.forEach((item) => {
        acc.acts += (item.acts || []).length;
        acc.payments += (item.payments || []).length;
      });
      return acc;
    },
    { tasks: 0, budget: 0, spent: 0, items: 0, acts: 0, payments: 0 },
  );
}

export function resolveFinanceDeletionScope(
  hasScopedFilters: boolean,
  searchQuery: string,
  labels: { filteredScopeLabel: string; fullScopeLabel: string },
): string {
  return hasScopedFilters || !!String(searchQuery || "").trim()
    ? labels.filteredScopeLabel
    : labels.fullScopeLabel;
}

export function buildFinanceDeletionHtml(
  summary: FinanceDeletionSummary,
  scope: string,
  formatMoney: (value: number) => string,
): string {
  return `
      <div style="text-align:left">
        Буде видалено: <b>${summary.tasks}</b> робіт.<br>
        Позицій кошторису: <b>${summary.items}</b><br>
        Платежів: <b>${summary.payments}</b><br>
        Актів: <b>${summary.acts}</b><br>
        Бюджет: <b>${formatMoney(Math.round(summary.budget))}</b><br>
        Витрачено: <b>${formatMoney(Math.round(summary.spent))}</b><br><br>
        Сценарій: <b>${scope}</b>
      </div>`;
}

export function applyFinanceDeletion(tasks: AnyRecord[], indexes: number[]) {
  const deleteSet = new Set(indexes);
  return tasks.filter((_, index) => !deleteSet.has(index));
}

export function buildFinanceResizeSession(
  widths: Record<string, number>,
  defaults: Record<string, number>,
  col: string,
  startX: number,
): FinanceResizeSession {
  return {
    col,
    startX,
    startW: widths[col] || defaults[col] || 100,
    widths: { ...widths },
  };
}

export function applyFinanceResizeDrag(session: FinanceResizeSession, clientX: number) {
  const nextWidth = Math.max(42, session.startW + clientX - session.startX);
  return {
    nextWidth,
    widths: {
      ...session.widths,
      [session.col]: nextWidth,
    },
  };
}

export function buildFinanceGanttNavigationPlan(
  taskIndex: number,
  taskName: string,
  isGanttActive: boolean,
) {
  return {
    shouldActivateGantt: !isGanttActive,
    targetRowId: `tr${taskIndex}`,
    taskIndex,
    searchQuery: String(taskName || "").toLowerCase(),
    searchDisplayName: String(taskName || ""),
  };
}

export function calculateFinanceOverview(tasks: AnyRecord[]): FinanceOverviewMetrics {
  const budget = tasks.reduce((sum, task) => sum + (+task.budget || 0), 0);
  const spent = tasks.reduce((sum, task) => sum + (+task.spent || 0), 0);
  const rest = budget - spent;
  const spentPct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const bcwp = tasks.reduce((sum, task) => sum + (+task.budget || 0) * ((+task.prog || 0) / 100), 0);
  const acwp = spent;
  const bac = budget;
  const cpi = acwp > 0 ? bcwp / acwp : null;
  const eac = cpi && cpi > 0 ? bac / cpi : null;
  const etc = eac !== null ? eac - acwp : null;
  const vac = eac !== null ? bac - eac : null;
  return { budget, spent, rest, spentPct, bcwp, acwp, bac, cpi, eac, etc, vac };
}

export function buildFinanceRows(
  filteredTasks: AnyRecord[],
  sort: { col: string; dir: number },
  getDuration: (task: AnyRecord) => number,
  getRemainingWeeks: (task: AnyRecord) => number,
) {
  const rows = filteredTasks.map((task, index) => ({
    ...task,
    ti: task.__ti ?? index,
    dur: getDuration(task),
    rest: (+task.budget || 0) - (+task.spent || 0),
    pct: task.budget > 0 ? Math.round((task.spent / task.budget) * 100) : 0,
    rate: (() => {
      const remainingWeeks = getRemainingWeeks(task);
      const rest = (+task.budget || 0) - (+task.spent || 0);
      return remainingWeeks > 0 ? Math.round(rest / remainingWeeks) : 0;
    })(),
  }));

  rows.sort((a, b) => {
    const av = (a as Record<string, unknown>)[sort.col];
    const bv = (b as Record<string, unknown>)[sort.col];
    return typeof av === "string"
      ? sort.dir * String(av ?? "").localeCompare(String(bv ?? ""), "uk")
      : sort.dir * ((Number(av) || 0) - (Number(bv) || 0));
  });

  return rows;
}
