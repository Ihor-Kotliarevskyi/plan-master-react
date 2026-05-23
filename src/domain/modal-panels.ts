import { groupProjectEntriesByAccess } from "./project-access";
import type { Category, ProjectAccessMeta, ProjectRole, Task } from "./types";

type AnyRecord = Record<string, any>;

export interface TaskNoteHistoryEntry {
  action: "edit" | "delete";
  text: string;
  author: string;
  date: string;
}

export interface TaskNoteEntry {
  id?: string | number;
  text: string;
  author: string;
  date: string;
  deleted?: boolean;
  history?: TaskNoteHistoryEntry[];
}

export interface ProjectManagerRowModel {
  id: string;
  name: string;
  role: ProjectRole | string;
  roleLabel: string;
  tasksCount: number;
  sharedMetaLine: string;
  canManageProject: boolean;
  isActive: boolean;
}

export interface ProjectManagerGroupModel {
  own: ProjectManagerRowModel[];
  shared: ProjectManagerRowModel[];
}

export function cloneTaskNotes(notes: TaskNoteEntry[] | null | undefined): TaskNoteEntry[] {
  return (notes || []).map((note) => ({
    ...note,
    history: (note.history || []).map((entry) => ({ ...entry })),
  }));
}

export function addTaskNote(params: {
  notes: TaskNoteEntry[];
  text: string;
  author: string;
  date: string;
  id?: string | number;
}): TaskNoteEntry[] {
  const nextNotes = cloneTaskNotes(params.notes);
  nextNotes.push({
    id: params.id,
    text: params.text,
    author: params.author,
    date: params.date,
    history: [],
  });
  return nextNotes;
}

export function editTaskNote(params: {
  notes: TaskNoteEntry[];
  index: number;
  text: string;
  author: string;
  date: string;
}): TaskNoteEntry[] {
  const nextNotes = cloneTaskNotes(params.notes);
  const target = nextNotes[params.index];
  if (!target) return nextNotes;
  target.history = target.history || [];
  target.history.push({
    action: "edit",
    text: target.text,
    author: params.author,
    date: params.date,
  });
  target.text = params.text;
  return nextNotes;
}

export function deleteTaskNote(params: {
  notes: TaskNoteEntry[];
  index: number;
  author: string;
  date: string;
  deletedPlaceholderText: string;
}): TaskNoteEntry[] {
  const nextNotes = cloneTaskNotes(params.notes);
  const target = nextNotes[params.index];
  if (!target) return nextNotes;
  target.history = target.history || [];
  target.history.push({
    action: "delete",
    text: target.text,
    author: params.author,
    date: params.date,
  });
  target.text = params.deletedPlaceholderText;
  target.deleted = true;
  return nextNotes;
}

export function countVisibleTaskNotes(notes: TaskNoteEntry[] | null | undefined): number {
  return (notes || []).filter((note) => !note.deleted).length;
}

export function cloneCategoryDrafts(categories: Category[]): Category[] {
  return (categories || []).map((category) => ({ ...category }));
}

export function removeCategoryDraftAt(categories: Category[], index: number): Category[] {
  return (categories || []).filter((_, categoryIndex) => categoryIndex !== index);
}

export function createNextCategoryDraft(params: {
  categories: Category[];
  palette: string[];
  newCategoryName: string;
}): Category[] {
  const usedColors = params.categories.map((category) => category.color);
  const color =
    params.palette.find((candidate) => !usedColors.includes(candidate)) ||
    params.palette[params.categories.length % params.palette.length];
  return [
    ...cloneCategoryDrafts(params.categories),
    { name: params.newCategoryName, color },
  ];
}

export function isCategoryUsedByTasks(tasks: Task[], index: number): boolean {
  return (tasks || []).some((task) => task.cat === index);
}

export function buildProjectManagerGroupModel(params: {
  projects: Record<string, AnyRecord>;
  currentId: string | null;
  canManageProject: (projectId: string, snapshot: AnyRecord) => boolean;
  getRoleLabel: (role: string) => string;
  getSharedMetaLine: (accessMeta?: ProjectAccessMeta | null) => string;
}): ProjectManagerGroupModel {
  const grouped = groupProjectEntriesByAccess(Object.entries(params.projects || {}));
  const mapRow = ([id, snapshot]: [string, AnyRecord]): ProjectManagerRowModel => ({
    id,
    name: snapshot?.proj?.name || "",
    role: snapshot?._role || "owner",
    roleLabel: params.getRoleLabel(snapshot?._role || "owner"),
    tasksCount: Array.isArray(snapshot?.tasks) ? snapshot.tasks.length : 0,
    sharedMetaLine: params.getSharedMetaLine(snapshot?._access || null),
    canManageProject: params.canManageProject(id, snapshot),
    isActive: id === params.currentId,
  });

  return {
    own: (grouped.own || []).map(mapRow),
    shared: (grouped.shared || []).map(mapRow),
  };
}
