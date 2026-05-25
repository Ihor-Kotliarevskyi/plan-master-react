export interface ModalProjectLike {
  sy: number;
  sm: number;
  nm: number;
}

export interface ModalPhaseLike {
  ms: number;
  ws: number;
  me: number;
  we: number;
  prog?: number;
  dsExact?: string | null;
  deExact?: string | null;
}

export interface ModalTaskLike {
  id?: string;
  n: number;
  name: string;
  cat: number;
  deps?: Array<{ id: string; type?: string; threshold?: number }> | null;
}

export interface ModalCategoryLike {
  color?: string;
}

export interface ModalTaskCalcModel {
  remainder: number;
  weeks: number;
  weeklyRate: number;
}

export interface ModalDependencyListRow {
  index: number;
  fromTi: number;
  toTi: number;
  fromTask: ModalTaskLike;
  toTask: ModalTaskLike;
  type: string;
  threshold: number;
  typeLabel: string;
  isCritical: boolean;
  fromColor: string;
  toColor: string;
}

export interface ModalDependencyListState {
  allCount: number;
  filteredCount: number;
  counts: {
    all: number;
    FS: number;
    SS: number;
    FF: number;
  };
  rows: ModalDependencyListRow[];
}

export interface ModalDependencyListSession {
  filter: "all" | "FS" | "SS" | "FF";
  visible: boolean;
}

export interface ModalDependencyNavigationPlan {
  shouldActivateGantt: boolean;
  targetRowId: string;
  taskIndex: number;
}

export function snapToHalfWeek(dateStr: string): string {
  if (!dateStr) return dateStr;
  const [y, m, d] = dateStr.split("-").map(Number);
  const halfWeeks = [1, 4, 8, 11, 15, 18, 22, 25];
  let best = halfWeeks[0];
  let bestDiff = Math.abs(d - halfWeeks[0]);
  for (const day of halfWeeks) {
    const diff = Math.abs(d - day);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = day;
    }
  }
  return `${y}-${String(m).padStart(2, "0")}-${String(best).padStart(2, "0")}`;
}

export function phaseToDateStr(project: ModalProjectLike, mi: number, wi: number): string {
  const absMonth = project.sy * 12 + project.sm + mi;
  const year = Math.floor(absMonth / 12);
  const month = absMonth % 12;
  const day = Math.min(1 + wi * 7, 28);
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function dateStrToPhase(project: ModalProjectLike, str: string): { mi: number; wi: number } {
  if (!str) return { mi: 0, wi: 0 };
  const [y, m, d] = str.split("-").map(Number);
  const absMonth = y * 12 + (m - 1);
  const projectStart = project.sy * 12 + project.sm;
  return {
    mi: Math.max(0, Math.min(project.nm - 1, absMonth - projectStart)),
    wi: Math.min(3, Math.max(0, Math.floor((d - 1) / 7))),
  };
}

export function getProjectMinDate(project: ModalProjectLike): string {
  return `${project.sy}-${String(project.sm + 1).padStart(2, "0")}-01`;
}

export function getProjectMaxDate(project: ModalProjectLike): string {
  const absEnd = project.sy * 12 + project.sm + project.nm - 1;
  const year = Math.floor(absEnd / 12);
  const month = absEnd % 12 + 1;
  return `${year}-${String(month).padStart(2, "0")}-28`;
}

export function getWeightedProgress(phases: ModalPhaseLike[]): number {
  if (!phases?.length) return 0;
  if (phases.length === 1) return phases[0]?.prog || 0;
  const totalDuration = phases.reduce((sum, phase) => {
    return sum + Math.max(1, (phase.me * 4 + phase.we) - (phase.ms * 4 + phase.ws) + 1);
  }, 0);
  const weighted = phases.reduce((sum, phase) => {
    const duration = Math.max(1, (phase.me * 4 + phase.we) - (phase.ms * 4 + phase.ws) + 1);
    return sum + (phase.prog || 0) * duration;
  }, 0);
  return Math.round(weighted / totalDuration);
}

export function getActivePhaseIndex(phases: ModalPhaseLike[]): number {
  let last = 0;
  phases.forEach((phase, index) => {
    if ((phase.prog || 0) > 0) last = index;
  });
  return last;
}

export function remWeeks(phase: Pick<ModalPhaseLike, "ms" | "ws" | "me" | "we">): number {
  return Math.max(1, (phase.me * 4 + phase.we) - (phase.ms * 4 + phase.ws) + 1);
}

export function buildTaskCalcModel(input: {
  budget: number;
  spent: number;
  phase: Pick<ModalPhaseLike, "ms" | "ws" | "me" | "we"> | null;
}): ModalTaskCalcModel {
  const remainder = input.budget - input.spent;
  const weeks = input.phase ? remWeeks(input.phase) : 0;
  return {
    remainder,
    weeks,
    weeklyRate: weeks > 0 ? Math.round(remainder / weeks) : 0,
  };
}

export function buildDependencyListState(input: {
  tasks: Array<ModalTaskLike & { cat: number; deps?: Array<{ id: string; type?: string; threshold?: number }> | null }>;
  filter: "all" | "FS" | "SS" | "FF";
  criticalSet: Set<number>;
  categories: ModalCategoryLike[];
  normDep: (raw: { id: string; type?: string; threshold?: number }) => { id: string; type?: string; threshold?: number };
}): ModalDependencyListState {
  const all: ModalDependencyListRow[] = [];
  input.tasks.forEach((task, toTi) => {
    (task.deps || []).forEach((raw) => {
      const dep = input.normDep(raw);
      const fromTask = input.tasks.find((candidate) => candidate.id === dep.id);
      if (!fromTask) return;
      const fromTi = input.tasks.indexOf(fromTask);
      const type = dep.type || "FS";
      const threshold = dep.threshold || 0;
      all.push({
        index: all.length + 1,
        fromTi,
        toTi,
        fromTask,
        toTask: task,
        type,
        threshold,
        typeLabel: type === "SS" && threshold ? `SS+${threshold}%` : type,
        isCritical: input.criticalSet.has(fromTi) && input.criticalSet.has(toTi),
        fromColor: input.categories[fromTask.cat]?.color || "var(--txt3)",
        toColor: input.categories[task.cat]?.color || "var(--txt3)",
      });
    });
  });

  const counts = { all: all.length, FS: 0, SS: 0, FF: 0 };
  all.forEach((row) => {
    counts[row.type as "FS" | "SS" | "FF"] = (counts[row.type as "FS" | "SS" | "FF"] || 0) + 1;
  });

  const rows = input.filter === "all" ? all : all.filter((row) => row.type === input.filter);
  return {
    allCount: all.length,
    filteredCount: rows.length,
    counts,
    rows,
  };
}

export function buildDependencyListOpenSession(): ModalDependencyListSession {
  return {
    filter: "all",
    visible: true,
  };
}

export function applyDependencyListFilter(
  currentFilter: "all" | "FS" | "SS" | "FF",
  nextFilter: string,
): "all" | "FS" | "SS" | "FF" {
  if (nextFilter === "FS" || nextFilter === "SS" || nextFilter === "FF" || nextFilter === "all") {
    return nextFilter;
  }
  return currentFilter;
}

export function buildDependencyNavigationPlan(
  taskIndex: number,
  ganttIsActive: boolean,
): ModalDependencyNavigationPlan {
  return {
    shouldActivateGantt: !ganttIsActive,
    targetRowId: `tr${taskIndex}`,
    taskIndex,
  };
}
