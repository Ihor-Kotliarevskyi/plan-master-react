import { getWeightedProgress } from "./modal";
import type { ModalPhaseLike } from "./modal";

type AnyRecord = Record<string, any>;

export interface TaskModalDraft {
  name: string;
  cat: number;
  ms: number;
  ws: number;
  me: number;
  we: number;
  prog: number;
  budget: number;
  spent: number;
  contractsOverrideBudget: boolean;
  deps: AnyRecord[];
  phases: AnyRecord[] | null;
  costItems: AnyRecord[] | null;
  dsExact: string | null;
  deExact: string | null;
}

export interface TaskModalSaveModel {
  isValidRange: boolean;
  startIndex: number;
  endIndex: number;
  prog: number;
  budget: number;
  spent: number;
  taskPatch: TaskModalDraft;
}

export interface TaskModalEditState {
  modalPhases: AnyRecord[];
  modalDeps: AnyRecord[];
  costItems: AnyRecord[];
  hasItems: boolean;
  title: string;
  budgetValue: number | string;
  spentValue: number | string;
  contractsOverrideBudget: boolean;
}

export function cloneModalCostItems(items: AnyRecord[] | null | undefined): AnyRecord[] {
  return (items || []).map((item) => ({
    ...item,
    payments: (item?.payments || []).map((payment: AnyRecord) => ({ ...payment })),
    acts: (item?.acts || []).map((act: AnyRecord) => ({ ...act })),
  }));
}

export function cloneModalPhasesFromTask(task: AnyRecord): AnyRecord[] {
  if (Array.isArray(task?.phases) && task.phases.length > 0) {
    return task.phases.map((phase: AnyRecord) => ({ ...phase, prog: phase?.prog ?? 0 }));
  }
  return [{
    ms: task?.ms ?? 0,
    ws: task?.ws ?? 0,
    me: task?.me ?? 0,
    we: task?.we ?? 0,
    prog: task?.prog || 0,
    dsExact: task?.dsExact || null,
    deExact: task?.deExact || null,
  }];
}

export function buildTaskModalEditState(params: {
  task: AnyRecord;
  editFallbackTitle: string;
  totalBudget: number;
  totalSpent: number;
  normDep: (dep: AnyRecord) => AnyRecord;
}): TaskModalEditState {
  const modalPhases = cloneModalPhasesFromTask(params.task);
  const modalDeps = (params.task?.deps || []).map((dep: AnyRecord) => params.normDep(dep));
  const costItems = cloneModalCostItems(params.task?.costItems || []);
  const hasItems = costItems.length > 0;
  const contractsOverrideBudget = !!params.task?.contractsOverrideBudget;
  const taskBudget = +params.task?.budget || 0;

  return {
    modalPhases,
    modalDeps,
    costItems,
    hasItems,
    title: params.task?.name || params.editFallbackTitle,
    budgetValue: hasItems && (taskBudget <= 0 || contractsOverrideBudget) ? params.totalBudget : (params.task?.budget || ""),
    spentValue: hasItems ? params.totalSpent : (params.task?.spent || ""),
    contractsOverrideBudget,
  };
}

export function buildTaskModalSaveModel(params: {
  name: string;
  cat: number;
  phases: ModalPhaseLike[];
  deps: AnyRecord[];
  costItems: AnyRecord[];
  contractsOverrideBudget: boolean;
  manualBudget: number;
  manualSpent: number;
  totalBudget: number;
  totalSpent: number;
}): TaskModalSaveModel {
  const phases: ModalPhaseLike[] = (params.phases || []).map((phase) => ({ ...phase }));
  const first = phases[0] || { ms: 0, ws: 0 };
  const last = phases[phases.length - 1] || first;
  const startIndex = first.ms * 4 + first.ws;
  const endIndex = last.me * 4 + last.we;
  const costItems = params.costItems.length > 0 ? cloneModalCostItems(params.costItems) : null;
  const budget = costItems && (params.contractsOverrideBudget || params.manualBudget <= 0)
    ? params.totalBudget
    : params.manualBudget;
  const spent = costItems ? params.totalSpent : params.manualSpent;
  const prog = getWeightedProgress(phases);

  return {
    isValidRange: startIndex <= endIndex,
    startIndex,
    endIndex,
    prog,
    budget,
    spent,
    taskPatch: {
      name: params.name,
      cat: params.cat,
      ms: first.ms,
      ws: first.ws,
      me: last.me,
      we: last.we,
      prog,
      budget,
      spent,
      contractsOverrideBudget: params.contractsOverrideBudget,
      deps: params.deps,
      phases: phases.length > 1 ? phases : null,
      costItems,
      dsExact: phases.length === 1 ? (first.dsExact || null) : null,
      deExact: phases.length === 1 ? (first.deExact || null) : null,
    },
  };
}

export function applyTaskSave(params: {
  tasks: AnyRecord[];
  editIdx: number | null;
  nextN: number;
  taskPatch: TaskModalDraft;
  newTaskId: string;
}): { tasks: AnyRecord[]; nextN: number; savedTask: AnyRecord; isEdit: boolean } {
  const isEdit = params.editIdx !== null;
  if (isEdit) {
    const nextTasks = params.tasks.map((task, index) =>
      index === params.editIdx
        ? { ...task, ...params.taskPatch, notes: task.notes || [] }
        : task,
    );
    return {
      tasks: nextTasks,
      nextN: params.nextN,
      savedTask: nextTasks[params.editIdx as number],
      isEdit: true,
    };
  }

  const savedTask = {
    id: params.newTaskId,
    n: params.nextN,
    ...params.taskPatch,
    notes: [],
  };
  return {
    tasks: [...params.tasks, savedTask],
    nextN: params.nextN + 1,
    savedTask,
    isEdit: false,
  };
}

export function removeTaskAt(tasks: AnyRecord[], index: number): { tasks: AnyRecord[]; removedTask: AnyRecord | null } {
  if (index < 0 || index >= tasks.length) return { tasks: [...tasks], removedTask: null };
  return {
    tasks: tasks.filter((_, taskIndex) => taskIndex !== index),
    removedTask: tasks[index] || null,
  };
}
