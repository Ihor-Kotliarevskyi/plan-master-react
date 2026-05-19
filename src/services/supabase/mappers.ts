import { formatAuditEntry } from "../../domain/audit";
import { normalizeProjectRole } from "../../domain/permissions";
import type {
  AuditEntry,
  Category,
  ProjectAccessMeta,
  ProjectRole,
  ProjectSnapshot,
  Task,
} from "../../domain/types";
import type {
  AccessibleProjectRow,
  ActivityLogRow,
  ProjectRow,
  ProjectShareRow,
  TaskRow,
} from "./contracts";

export interface ProjectListSummary {
  id: string;
  name: string;
  sm: number;
  sy: number;
  nm: number;
  is_archived: boolean;
  updated_at: string;
}

export interface SharedProjectSummary {
  role: ProjectRole;
  project: ProjectListSummary;
  access: ProjectAccessMeta;
}

export interface ProjectShareView {
  id: string;
  role: ProjectRole;
  user: {
    id: string;
    name: string;
    email: string;
  };
  invitedByName: string;
  invitedByEmail: string;
}

export function mapAccessibleProjectAccess(row: AccessibleProjectRow): ProjectAccessMeta {
  return {
    source: row.source,
    ownerId: row.owner_id ?? null,
    ownerName: row.owner_name ?? "",
    ownerEmail: row.owner_email ?? "",
    invitedBy: row.invited_by ?? null,
    invitedByName: row.invited_by_name ?? "",
    invitedByEmail: row.invited_by_email ?? "",
  };
}

export function mapAccessibleProjectSummary(row: AccessibleProjectRow): ProjectListSummary {
  return {
    id: row.project_id,
    name: row.name,
    sm: row.sm,
    sy: row.sy,
    nm: row.nm,
    is_archived: row.is_archived,
    updated_at: row.updated_at,
  };
}

export function mapAccessibleProjectToSharedSummary(row: AccessibleProjectRow): SharedProjectSummary {
  return {
    role: normalizeProjectRole(row.role),
    project: mapAccessibleProjectSummary(row),
    access: mapAccessibleProjectAccess(row),
  };
}

export function mapAccessibleProjectToSnapshotShell(
  row: AccessibleProjectRow,
  options?: {
    role?: ProjectRole;
    localVersion?: number;
    serverVersion?: number;
    localUpdatedAt?: string;
  },
): ProjectSnapshot {
  const role = normalizeProjectRole(options?.role ?? row.role ?? "viewer");
  return {
    proj: {
      name: row.name,
      sm: row.sm,
      sy: row.sy,
      nm: row.nm,
    },
    cats: [],
    tasks: [],
    nextN: 1,
    _serverId: row.project_id,
    _role: role,
    _access: mapAccessibleProjectAccess(row),
    _localVersion: options?.localVersion ?? 0,
    _serverVersion: options?.serverVersion ?? 0,
    _localUpdatedAt: options?.localUpdatedAt,
  };
}

export function mapTaskRowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    n: row.n,
    order: row.order,
    name: row.name,
    cat: row.cat,
    ms: row.ms,
    ws: row.ws,
    me: row.me,
    we: row.we,
    prog: row.prog,
    budget: Number(row.budget) || 0,
    spent: Number(row.spent) || 0,
    deps: row.deps ?? [],
    phases: row.phases ?? null,
    costItems: row.cost_items ?? undefined,
    notes: row.notes ?? [],
  };
}

export function mapProjectRowToSnapshot(
  project: ProjectRow,
  taskRows: TaskRow[],
  role: ProjectRole,
  previousMeta?: Partial<ProjectSnapshot>,
): ProjectSnapshot {
  const safeLocalVersion = previousMeta?._localVersion ?? 0;
  const safeServerVersion = previousMeta?._serverVersion ?? safeLocalVersion;
  return {
    proj: {
      name: project.name,
      sm: project.sm,
      sy: project.sy,
      nm: project.nm,
      baseline: project.baseline ?? undefined,
      baselineDate: project.baseline_date,
    },
    cats: (Array.isArray(project.cats) ? project.cats : []) as Category[],
    tasks: taskRows.map(mapTaskRowToTask),
    nextN: project.next_n || 1,
    _serverId: project.id,
    _role: normalizeProjectRole(role),
    _access: previousMeta?._access,
    _localVersion: safeLocalVersion,
    _serverVersion: safeServerVersion,
    _localUpdatedAt: previousMeta?._localUpdatedAt,
  };
}

export function mapProjectShareRow(row: ProjectShareRow): ProjectShareView {
  return {
    id: row.id,
    role: normalizeProjectRole(row.role),
    user: {
      id: row.user_id,
      name: row.user_name || row.user_email || row.user_id,
      email: row.user_email || "",
    },
    invitedByName: row.invited_by_name || "",
    invitedByEmail: row.invited_by_email || "",
  };
}

export function mapActivityLogRow(row: ActivityLogRow): AuditEntry {
  return formatAuditEntry({
    id: row.id,
    projectId: row.project_id,
    actorId: row.actor_id,
    actorName: row.actor_name,
    actorEmail: row.actor_email,
    eventType: row.event_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    payload: row.payload,
    createdAt: row.created_at,
  });
}
