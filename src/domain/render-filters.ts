type AnyRecord = Record<string, any>;

export interface ProjectSelectItem {
  id: string;
  name: string;
  selected: boolean;
  roleLabelSuffix: string;
}

export interface ProjectSelectState {
  own: ProjectSelectItem[];
  shared: ProjectSelectItem[];
}

export function buildProjectSelectState(params: {
  ownEntries: Array<[string, AnyRecord]>;
  sharedEntries: Array<[string, AnyRecord]>;
  currentId: string | null;
  getRoleLabel: (role: string) => string;
  sharedRoleSeparator: string;
  normalizeRole: (role: string) => string;
}): ProjectSelectState {
  const mapItems = (entries: Array<[string, AnyRecord]>, isShared: boolean) =>
    entries.map(([id, snapshot]) => {
      const role = params.normalizeRole(snapshot?._role || "owner");
      return {
        id,
        name: snapshot?.proj?.name || "",
        selected: id === params.currentId,
        roleLabelSuffix: isShared ? `${params.sharedRoleSeparator}${params.getRoleLabel(role)}` : "",
      };
    });

  return {
    own: mapItems(params.ownEntries || [], false),
    shared: mapItems(params.sharedEntries || [], true),
  };
}

export function hasActiveGanttFilters(
  ganttFilters: { contractor?: unknown; pay?: unknown },
  multiFilterValues: (value: unknown) => string[],
): boolean {
  return Boolean(
    multiFilterValues(ganttFilters?.contractor).length ||
    multiFilterValues(ganttFilters?.pay).length,
  );
}

export function taskMatchesGanttFilters(params: {
  task: AnyRecord;
  hiddenCats: Set<number>;
  ganttFilters: { contractor?: unknown; pay?: unknown };
  multiFilterAny: (selected: unknown, values: string[]) => boolean;
  multiFilterValues: (selected: unknown) => string[];
  taskContractors: (task: AnyRecord) => string[];
  taskCostSummary: (task: AnyRecord) => {
    budget: number;
    paid: number;
    rest: number;
    payments: number;
  };
}): boolean {
  const { task, hiddenCats, ganttFilters, multiFilterAny, multiFilterValues, taskContractors, taskCostSummary } = params;
  if (hiddenCats.has(task.cat)) return false;
  if (!multiFilterAny(ganttFilters.contractor, taskContractors(task))) return false;

  const payFilters = multiFilterValues(ganttFilters.pay);
  if (!payFilters.length) return true;

  const summary = taskCostSummary(task);
  const matchesPay =
    (payFilters.includes("debt") && summary.budget > 0 && summary.rest > 0.5) ||
    (payFilters.includes("paid") && summary.budget > 0 && Math.abs(summary.rest) <= 0.5) ||
    (payFilters.includes("over") && summary.rest < -0.5) ||
    (payFilters.includes("unpaid") && summary.budget > 0 && summary.paid <= 0.5) ||
    (payFilters.includes("hasPayments") && (summary.paid > 0.5 || summary.payments > 0)) ||
    (payFilters.includes("noPayments") && summary.paid <= 0.5 && summary.payments === 0);

  return matchesPay;
}

export function buildRenderGroupStats(params: {
  tasks: AnyRecord[];
}): {
  totalTasks: number;
  doneTasks: number;
  totalBudget: number;
} {
  const totalTasks = (params.tasks || []).length;
  const doneTasks = (params.tasks || []).filter((task) => task.prog === 100).length;
  const totalBudget = (params.tasks || []).reduce((sum, task) => sum + (Number(task.budget) || 0), 0);
  return {
    totalTasks,
    doneTasks,
    totalBudget,
  };
}
