type AnyRecord = Record<string, any>;

export interface ModalDependencyLike {
  id: string;
  type?: string;
  threshold?: number;
}

export interface ModalDependencyDropdownItem {
  id: string;
  taskNumber: number | string;
  name: string;
}

export interface ModalDependencyDropdownState {
  items: ModalDependencyDropdownItem[];
  visible: boolean;
}

export interface ModalDependencyEditorState {
  visible: boolean;
  dependency: ModalDependencyLike | null;
  taskNumber: number | string;
  taskName: string;
}

export interface ModalPhaseProgressState {
  phases: AnyRecord[];
  totalProgress: number;
}

export function addModalPhase(phases: AnyRecord[], projectMonths: number): AnyRecord[] {
  const nextPhases = (phases || []).map((phase) => ({ ...phase }));
  const last = nextPhases[nextPhases.length - 1] || { me: 0 };
  const newMs = Math.min(projectMonths - 1, (last.me || 0) + 1);
  nextPhases.push({ ms: newMs, ws: 0, me: Math.min(projectMonths - 1, newMs + 1), we: 3, prog: 0 });
  return nextPhases;
}

export function removeModalPhase(phases: AnyRecord[], index: number): AnyRecord[] {
  if ((phases || []).length <= 1) return (phases || []).map((phase) => ({ ...phase }));
  return (phases || []).filter((_, phaseIndex) => phaseIndex !== index).map((phase) => ({ ...phase }));
}

export function updateModalPhaseProgress(
  phases: AnyRecord[],
  index: number,
  value: number,
  getWeightedProgress: (nextPhases: AnyRecord[]) => number,
): ModalPhaseProgressState {
  const nextPhases = (phases || []).map((phase) => ({ ...phase }));
  if (!nextPhases[index]) return { phases: nextPhases, totalProgress: getWeightedProgress(nextPhases) };
  nextPhases[index].prog = value;
  if (value < 100) {
    nextPhases.forEach((phase, phaseIndex) => {
      if (phaseIndex > index) phase.prog = 0;
    });
  }
  return {
    phases: nextPhases,
    totalProgress: getWeightedProgress(nextPhases),
  };
}

export function buildDependencyDropdownState(params: {
  tasks: AnyRecord[];
  editIdx: number | null;
  modalDeps: ModalDependencyLike[];
  query: string;
}): ModalDependencyDropdownState {
  const added = new Set((params.modalDeps || []).map((dep) => dep.id));
  const needle = String(params.query || "").trim().toLowerCase();
  const items = (params.tasks || [])
    .filter((task, index) => index !== params.editIdx && !added.has(task.id))
    .filter((task) => !needle || `${task.n} ${task.name}`.toLowerCase().includes(needle))
    .map((task) => ({
      id: task.id,
      taskNumber: task.n,
      name: task.name,
    }));
  return {
    items,
    visible: items.length > 0,
  };
}

export function addModalDependency(deps: ModalDependencyLike[], id: string): {
  deps: ModalDependencyLike[];
  editingDepId: string;
  didAdd: boolean;
} {
  if ((deps || []).some((dep) => dep.id === id)) {
    return { deps: (deps || []).map((dep) => ({ ...dep })), editingDepId: id, didAdd: false };
  }
  return {
    deps: [...(deps || []).map((dep) => ({ ...dep })), { id, type: "FS", threshold: 0 }],
    editingDepId: id,
    didAdd: true,
  };
}

export function removeModalDependency(
  deps: ModalDependencyLike[],
  id: string,
  editingDepId: string | null,
): { deps: ModalDependencyLike[]; editingDepId: string | null } {
  return {
    deps: (deps || []).filter((dep) => dep.id !== id).map((dep) => ({ ...dep })),
    editingDepId: editingDepId === id ? null : editingDepId,
  };
}

export function toggleModalDependencyEditor(editingDepId: string | null, id: string): string | null {
  return editingDepId === id ? null : id;
}

export function buildModalDependencyEditorState(params: {
  deps: ModalDependencyLike[];
  editingDepId: string | null;
  tasks: AnyRecord[];
}): ModalDependencyEditorState {
  if (!params.editingDepId) {
    return { visible: false, dependency: null, taskNumber: "?", taskName: "" };
  }
  const dependency = (params.deps || []).find((dep) => dep.id === params.editingDepId) || null;
  if (!dependency) {
    return { visible: false, dependency: null, taskNumber: "?", taskName: "" };
  }
  const task = (params.tasks || []).find((candidate) => candidate.id === dependency.id);
  return {
    visible: true,
    dependency,
    taskNumber: task?.n ?? "?",
    taskName: task?.name || "",
  };
}

export function updateModalDependencyType(
  deps: ModalDependencyLike[],
  id: string,
  type: string,
): ModalDependencyLike[] {
  return (deps || []).map((dep) =>
    dep.id === id
      ? { ...dep, type, threshold: type !== "SS" ? 0 : dep.threshold || 25 }
      : { ...dep },
  );
}

export function updateModalDependencyThreshold(
  deps: ModalDependencyLike[],
  id: string,
  value: number,
): ModalDependencyLike[] {
  const threshold = Math.min(99, Math.max(1, Math.round(value)));
  return (deps || []).map((dep) =>
    dep.id === id
      ? { ...dep, threshold }
      : { ...dep },
  );
}
