import type { Category, ProjectSnapshot, ProjectSnapshotMeta, Task, TaskCostItem, TaskPhase } from "./types";

type AnyRecord = Record<string, any>;

export interface CreateCopiedTaskInput {
  task: Task;
  nextN: number;
  newId: string;
  copiedTaskSuffix: string;
}

export interface ResolveUniqueProjectNameInput {
  projects: Record<string, { proj?: { name?: string } } | undefined>;
  baseName: string;
  fallbackName: string;
  copiedTaskSuffix: string;
  numberedCopySuffix: (count: number | string) => string;
}

export interface BuildImportedProjectSnapshotInput {
  data: AnyRecord;
  fallbackProjectName: string;
  resolvedName: string;
  fallbackCategories: Category[];
  generatedTaskIds: string[];
  meta?: Partial<ProjectSnapshotMeta>;
}

export function createCopiedTask(input: CreateCopiedTaskInput): Task {
  const { task, nextN, newId, copiedTaskSuffix } = input;
  return {
    ...task,
    id: newId,
    n: nextN,
    name: `${task.name}${copiedTaskSuffix}`,
    notes: [],
    phases: task.phases ? task.phases.map((phase) => ({ ...phase })) : null,
    ...(Array.isArray(task.costItems)
      ? { costItems: task.costItems.map((item) => ({ ...item })) }
      : {}),
    deps: [],
  };
}

export function projectNameExists(
  projects: Record<string, { proj?: { name?: string } } | undefined>,
  name: string,
): boolean {
  const needle = String(name || "").trim().toLowerCase();
  if (!needle) return false;
  return Object.values(projects || {}).some(
    (project) => String(project?.proj?.name || "").trim().toLowerCase() === needle,
  );
}

export function resolveUniqueProjectName(input: ResolveUniqueProjectNameInput): string {
  const {
    projects,
    baseName,
    fallbackName,
    copiedTaskSuffix,
    numberedCopySuffix,
  } = input;
  const cleanBase = String(baseName || fallbackName).trim() || fallbackName;
  if (!projectNameExists(projects, cleanBase)) return cleanBase;

  const firstCopy = `${cleanBase}${copiedTaskSuffix}`;
  if (!projectNameExists(projects, firstCopy)) return firstCopy;

  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${cleanBase}${numberedCopySuffix(i)}`;
    if (!projectNameExists(projects, candidate)) return candidate;
  }

  return `${cleanBase}${numberedCopySuffix(Date.now())}`;
}

export function normalizeImportedBaseline(
  baseline: unknown,
  idMap: Map<string, string>,
) {
  if (!Array.isArray(baseline)) return baseline || null;
  return baseline
    .map((entry: AnyRecord) => {
      const mappedId = idMap.get(String(entry?.id)) || idMap.get(String(entry?.n));
      if (!mappedId) return null;
      return { ...entry, id: mappedId };
    })
    .filter(Boolean);
}

export function buildImportedProjectSnapshot(
  input: BuildImportedProjectSnapshotInput,
): ProjectSnapshot {
  const {
    data,
    fallbackProjectName,
    resolvedName,
    fallbackCategories,
    generatedTaskIds,
    meta,
  } = input;

  const rawTasks = Array.isArray(data?.tasks) ? data.tasks : [];
  const idMap = new Map<string, string>();

  rawTasks.forEach((task: AnyRecord, idx: number) => {
    const nextId = generatedTaskIds[idx] || `imported-task-${idx + 1}`;
    if (task?.id) idMap.set(String(task.id), nextId);
    if (task?.n !== undefined) idMap.set(String(task.n), nextId);
    idMap.set(String(idx + 1), nextId);
  });

  const normalizeDeps = (deps: unknown) =>
    (Array.isArray(deps) ? deps : [])
      .map((dep: AnyRecord) => {
        const rawId = dep && typeof dep === "object" ? dep.id || dep.n : dep;
        const mappedId = idMap.get(String(rawId));
        if (!mappedId) return null;
        return {
          id: mappedId,
          type: dep?.type || "FS",
          threshold: dep?.threshold || 0,
        };
      })
      .filter(Boolean);

  const tasks = rawTasks.map((task: AnyRecord, idx: number) => {
    const taskId = idMap.get(String(task?.id || task?.n || idx + 1)) || generatedTaskIds[idx] || `imported-task-${idx + 1}`;
    const normalizedTask: Task & AnyRecord = {
      ...task,
      id: taskId,
      n: Number.isFinite(+task?.n) ? +task.n : idx + 1,
      name: String(task?.name || `Task ${idx + 1}`),
      cat: Number.isFinite(+task?.cat) ? +task.cat : 0,
      ms: Number.isFinite(+task?.ms) ? +task.ms : 0,
      ws: Number.isFinite(+task?.ws) ? +task.ws : 0,
      me: Number.isFinite(+task?.me) ? +task.me : 0,
      we: Number.isFinite(+task?.we) ? +task.we : 0,
      prog: Number.isFinite(+task?.prog) ? +task.prog : 0,
      budget: Number(task?.budget) || 0,
      spent: Number(task?.spent) || 0,
      deps: normalizeDeps(task?.deps),
      notes: Array.isArray(task?.notes) ? task.notes.map((note: AnyRecord) => ({ ...note })) : [],
    };
    if (Array.isArray(task?.phases)) {
      normalizedTask.phases = task.phases.map((phase: AnyRecord) => ({
        ...phase,
        ms: Number.isFinite(+phase?.ms) ? +phase.ms : 0,
        me: Number.isFinite(+phase?.me) ? +phase.me : 0,
      })) as TaskPhase[];
    } else {
      normalizedTask.phases = null;
    }
    if (Array.isArray(task?.costItems)) {
      normalizedTask.costItems = task.costItems.map((item: AnyRecord) => ({ ...item })) as TaskCostItem[];
    } else if (Array.isArray(task?.cost_items)) {
      normalizedTask.costItems = task.cost_items.map((item: AnyRecord) => ({ ...item })) as TaskCostItem[];
    }
    delete normalizedTask.cost_items;
    return normalizedTask;
  });

  const maxN = tasks.reduce((maxValue, task) => Math.max(maxValue, +task.n || 0), 0);
  const importedProj = data?.proj || { name: fallbackProjectName };

  return {
    proj: {
      ...importedProj,
      name: resolvedName,
      baseline: normalizeImportedBaseline(importedProj.baseline, idMap),
    },
    cats: Array.isArray(data?.cats)
      ? data.cats.map((category: AnyRecord) => ({
          name: String(category?.name || ""),
          color: String(category?.color || "#94a3b8"),
        }))
      : fallbackCategories.map((category) => ({ ...category })),
    tasks,
    nextN: maxN + 1,
    ...(meta || {}),
  };
}
