import type { ProjectSnapshot, Task } from "../../domain/types";

export interface UpsertTaskPayloadItem {
  id: string | number | null;
  n: number;
  order: number;
  name: string;
  cat: number;
  ms: number;
  ws: number;
  me: number;
  we: number;
  prog: number;
  budget: number;
  spent: number;
  deps: unknown[];
  phases: unknown[] | null;
  costItems: unknown[] | null;
  notes: unknown[];
}

export interface ProjectMutationPayload {
  name: string;
  sm: number;
  sy: number;
  nm: number;
  cats: unknown[];
  next_n: number;
  baseline: unknown;
  baseline_date: string | null;
}

export interface ProjectInsertPayload extends ProjectMutationPayload {
  owner_id: string;
}

export interface ActivityInsertPayload {
  project_id: string;
  actor_id: string;
  actor_name: string | null;
  actor_email: string | null;
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  payload: Record<string, unknown>;
}

export function buildUpsertTasksPayload(tasks: Task[]): UpsertTaskPayloadItem[] {
  return (tasks || []).map((task, index) => ({
    id: task.id || null,
    n: Math.trunc(task.n || 0),
    order: index,
    name: task.name || "",
    cat: Math.trunc(task.cat || 0),
    ms: Math.trunc(task.ms || 0),
    ws: Math.trunc(task.ws || 0),
    me: Math.trunc(task.me || 0),
    we: Math.trunc(task.we || 0),
    prog: Math.trunc(task.prog || 0),
    budget: Number(task.budget) || 0,
    spent: Number(task.spent) || 0,
    deps: task.deps || [],
    phases: task.phases || null,
    costItems: task.costItems || null,
    notes: task.notes || [],
  }));
}

export function buildProjectMutationPayload(snapshot: ProjectSnapshot): ProjectMutationPayload {
  return {
    name: snapshot.proj.name,
    sm: snapshot.proj.sm,
    sy: snapshot.proj.sy,
    nm: snapshot.proj.nm,
    cats: snapshot.cats,
    next_n: snapshot.nextN,
    baseline: snapshot.proj.baseline || null,
    baseline_date: snapshot.proj.baselineDate || null,
  };
}

export function buildProjectInsertPayload(snapshot: ProjectSnapshot, ownerId: string): ProjectInsertPayload {
  return {
    owner_id: ownerId,
    ...buildProjectMutationPayload(snapshot),
  };
}

export function buildActivityInsertPayload(input: {
  projectId: string;
  actorId: string;
  actorName?: string | null;
  actorEmail?: string | null;
  eventType: string;
  entityType?: string;
  entityId?: string | number | null;
  payload?: Record<string, unknown>;
}): ActivityInsertPayload {
  const payload = { ...(input.payload || {}) };
  return {
    project_id: input.projectId,
    actor_id: input.actorId,
    actor_name: input.actorName ?? null,
    actor_email: input.actorEmail ?? null,
    event_type: input.eventType,
    entity_type: input.entityType || "project",
    entity_id: input.entityId != null ? String(input.entityId) : null,
    payload,
  };
}
