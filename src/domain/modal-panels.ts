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

export interface TaskNotesSessionState {
  taskIndex: number | null;
  title: string;
  notes: TaskNoteEntry[];
  exists: boolean;
  visible: boolean;
}

export interface NotesCellState {
  count: number;
  className: string;
  title: string;
  hasNotes: boolean;
}

export interface CategoryEditorState {
  categories: Category[];
}

export interface CategoryDeletionState {
  isUsed: boolean;
  categories: Category[];
}

export interface CategoryDraftUpdateResult {
  categories: Category[];
  changed: boolean;
}

export function cloneTaskNotes(notes: TaskNoteEntry[] | null | undefined): TaskNoteEntry[] {
  return (notes || []).map((note) => ({
    ...note,
    history: (note.history || []).map((entry) => ({ ...entry })),
  }));
}

export function buildTaskNotesSession(task: Task | null | undefined): TaskNotesSessionState {
  return {
    taskIndex: null,
    title: String(task?.name || ""),
    notes: cloneTaskNotes((task as AnyRecord)?.notes || []),
    exists: !!task,
    visible: !!task,
  };
}

export function buildTaskNotesOpenState(params: {
  tasks: Task[];
  taskIndex: number | null;
}): TaskNotesSessionState {
  const task = params.taskIndex !== null ? params.tasks?.[params.taskIndex] : null;
  return {
    taskIndex: params.taskIndex,
    title: String(task?.name || ""),
    notes: cloneTaskNotes((task as AnyRecord)?.notes || []),
    exists: !!task,
    visible: !!task,
  };
}

export function closeTaskNotesSession(): TaskNotesSessionState {
  return {
    taskIndex: null,
    title: "",
    notes: [],
    exists: false,
    visible: false,
  };
}

export function getTaskNotesByIndex(tasks: Task[], taskIndex: number | null): TaskNoteEntry[] {
  if (taskIndex === null || !tasks?.[taskIndex]) return [];
  return cloneTaskNotes(((tasks[taskIndex] as AnyRecord)?.notes || []) as TaskNoteEntry[]);
}

export function applyTaskNotesToTasks(params: {
  tasks: Task[];
  taskIndex: number | null;
  notes: TaskNoteEntry[];
}): { tasks: Task[]; changed: boolean } {
  if (params.taskIndex === null || !params.tasks?.[params.taskIndex]) {
    return {
      tasks: [...(params.tasks || [])],
      changed: false,
    };
  }

  return {
    tasks: (params.tasks || []).map((task, index) =>
      index === params.taskIndex
        ? {
            ...task,
            notes: cloneTaskNotes(params.notes),
          }
        : task,
    ),
    changed: true,
  };
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

export function buildNotesCellState(params: {
  notes: TaskNoteEntry[] | null | undefined;
  countTitle: (count: number) => string;
  defaultTitle: string;
}): NotesCellState {
  const count = countVisibleTaskNotes(params.notes);
  return {
    count,
    className: count > 0 ? "td-notes has-notes" : "td-notes",
    title: count > 0 ? params.countTitle(count) : params.defaultTitle,
    hasNotes: count > 0,
  };
}

export function cloneCategoryDrafts(categories: Category[]): Category[] {
  return (categories || []).map((category) => ({ ...category }));
}

export function buildCategoryEditorState(categories: Category[]): CategoryEditorState {
  return {
    categories: cloneCategoryDrafts(categories),
  };
}

export function updateCategoryDraftAt(
  categories: Category[],
  index: number,
  patch: Partial<Category>,
): CategoryDraftUpdateResult {
  if (index < 0 || index >= (categories || []).length) {
    return {
      categories: cloneCategoryDrafts(categories),
      changed: false,
    };
  }

  return {
    categories: cloneCategoryDrafts(categories).map((category, categoryIndex) =>
      categoryIndex === index
        ? { ...category, ...patch }
        : category,
    ),
    changed: true,
  };
}

export function applyCategoryNamesFromValues(categories: Category[], values: string[]): Category[] {
  return cloneCategoryDrafts(categories).map((category, index) => ({
    ...category,
    name: values[index] ?? category.name,
  }));
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

export function buildCategoryDeletionState(params: {
  categories: Category[];
  index: number;
  tasks: Task[];
}): CategoryDeletionState {
  return {
    isUsed: isCategoryUsedByTasks(params.tasks, params.index),
    categories: removeCategoryDraftAt(params.categories, params.index),
  };
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
