import type { Category, ProjectSettings, ProjectSnapshot, ProjectSnapshotMeta, Task, TaskPhase } from "./types";

export interface ProjectSettingsUpdateInput {
  snapshot: ProjectSnapshot;
  name: string;
  sm: number;
  sy: number;
  nm: number;
}

export interface ProjectSettingsUpdateResult {
  snapshot: ProjectSnapshot;
  before: Pick<ProjectSettings, "name" | "sm" | "sy" | "nm">;
  after: Pick<ProjectSettings, "name" | "sm" | "sy" | "nm">;
  shift: number;
  shiftedTasks: boolean;
}

export interface CreateEmptyProjectSnapshotInput {
  name: string;
  defaults: Pick<ProjectSettings, "sm" | "sy" | "nm">;
  categories: Category[];
  meta?: Partial<ProjectSnapshotMeta>;
}

export interface CreateDemoProjectSnapshotInput {
  projectName: string;
  startYear: number;
  categories: Category[];
  tasks: Task[];
  nextN: number;
  meta?: Partial<ProjectSnapshotMeta>;
}

export interface ResolvedProjectDefaults {
  sm: number;
  sy: number;
  nm: number;
}

export interface ProjectDeletionState {
  nextCurrentId: string | null;
  shouldReloadCurrent: boolean;
  remainingProjectIds: string[];
}

export interface ProjectCollectionRenameResult {
  projects: Record<string, ProjectSnapshot>;
  nextName: string;
  changed: boolean;
}

export interface ProjectCollectionDeletionResult {
  projects: Record<string, ProjectSnapshot>;
  deletionState: ProjectDeletionState;
}

function clonePhaseWithShift(phase: TaskPhase, shift: number): TaskPhase {
  return {
    ...phase,
    ms: Math.max(0, phase.ms + shift),
    me: Math.max(0, phase.me + shift),
  };
}

function cloneTaskWithShift(task: Task, shift: number): Task {
  return {
    ...task,
    ms: Math.max(0, task.ms + shift),
    me: Math.max(0, task.me + shift),
    phases: task.phases?.map((phase) => clonePhaseWithShift(phase, shift)) || task.phases || null,
  };
}

export function applyProjectSettingsUpdate(
  input: ProjectSettingsUpdateInput,
): ProjectSettingsUpdateResult {
  const { snapshot, name, sm, sy, nm } = input;
  const before = {
    name: snapshot.proj.name,
    sm: snapshot.proj.sm,
    sy: snapshot.proj.sy,
    nm: snapshot.proj.nm,
  };

  const nextNm = Math.min(120, Math.max(3, nm));
  const oldAbsStart = snapshot.proj.sy * 12 + snapshot.proj.sm;
  const newAbsStart = sy * 12 + sm;
  const shift = oldAbsStart - newAbsStart;
  const shiftedTasks = shift !== 0;

  return {
    snapshot: {
      ...snapshot,
      proj: {
        ...snapshot.proj,
        name: name.trim() || snapshot.proj.name,
        sm,
        sy,
        nm: nextNm,
      },
      tasks: shiftedTasks ? snapshot.tasks.map((task) => cloneTaskWithShift(task, shift)) : snapshot.tasks,
    },
    before,
    after: {
      name: name.trim() || snapshot.proj.name,
      sm,
      sy,
      nm: nextNm,
    },
    shift,
    shiftedTasks,
  };
}

export function createEmptyProjectSnapshot(
  input: CreateEmptyProjectSnapshotInput,
): ProjectSnapshot {
  const { name, defaults, categories, meta } = input;
  return {
    proj: {
      name: name.trim(),
      sm: defaults.sm,
      sy: defaults.sy,
      nm: defaults.nm,
    },
    cats: categories.map((category) => ({ ...category })),
    tasks: [],
    nextN: 1,
    ...(meta || {}),
  };
}

export function createDemoProjectSnapshot(
  input: CreateDemoProjectSnapshotInput,
): ProjectSnapshot {
  const { projectName, startYear, categories, tasks, nextN, meta } = input;
  return {
    proj: {
      name: projectName,
      sm: 0,
      sy: startYear,
      nm: 12,
    },
    cats: categories.map((category) => ({ ...category })),
    tasks: tasks.map((task) => ({ ...task })),
    nextN,
    ...(meta || {}),
  };
}

export function resolveProjectDefaults(
  userDefaults: {
    sm?: number | null;
    sy?: number | null;
    nm?: number | null;
  } | null | undefined,
  fallbackDefaults: Pick<ProjectSettings, "sm" | "sy" | "nm">,
): ResolvedProjectDefaults {
  return {
    sm: userDefaults?.sm ?? fallbackDefaults.sm,
    sy: userDefaults?.sy ?? fallbackDefaults.sy,
    nm: userDefaults?.nm ?? fallbackDefaults.nm,
  };
}

export function canDeleteProjectCount(projectCount: number): boolean {
  return projectCount > 1;
}

export function resolveNextProjectAfterDeletion(
  projectIds: string[],
  currentId: string | null,
  deletedId: string,
): string | null {
  if (currentId !== deletedId) return currentId;
  return projectIds.find((projectId) => projectId !== deletedId) || null;
}

export function buildProjectDeletionState(
  projectIds: string[],
  currentId: string | null,
  deletedId: string,
): ProjectDeletionState {
  const remainingProjectIds = (projectIds || []).filter((projectId) => projectId !== deletedId);
  const nextCurrentId = resolveNextProjectAfterDeletion(projectIds, currentId, deletedId);
  return {
    nextCurrentId,
    shouldReloadCurrent: currentId === deletedId && !!nextCurrentId,
    remainingProjectIds,
  };
}

export function addProjectToCollection(
  projects: Record<string, ProjectSnapshot>,
  id: string,
  snapshot: ProjectSnapshot,
): Record<string, ProjectSnapshot> {
  return {
    ...(projects || {}),
    [id]: snapshot,
  };
}

export function renameProjectInCollection(
  projects: Record<string, ProjectSnapshot>,
  id: string,
  name: string,
): ProjectCollectionRenameResult {
  const snapshot = projects?.[id];
  if (!snapshot) {
    return {
      projects: { ...(projects || {}) },
      nextName: "",
      changed: false,
    };
  }

  const nextName = name.trim() || snapshot.proj.name;
  if (nextName === snapshot.proj.name) {
    return {
      projects: { ...(projects || {}) },
      nextName,
      changed: false,
    };
  }

  return {
    projects: {
      ...(projects || {}),
      [id]: {
        ...snapshot,
        proj: {
          ...snapshot.proj,
          name: nextName,
        },
      },
    },
    nextName,
    changed: true,
  };
}

export function applyProjectDeletionToCollection(
  projects: Record<string, ProjectSnapshot>,
  currentId: string | null,
  deletedId: string,
): ProjectCollectionDeletionResult {
  const deletionState = buildProjectDeletionState(Object.keys(projects || {}), currentId, deletedId);
  const nextProjects = { ...(projects || {}) };
  delete nextProjects[deletedId];

  return {
    projects: nextProjects,
    deletionState,
  };
}
