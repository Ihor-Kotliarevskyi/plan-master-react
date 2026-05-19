export type ProjectRole = "owner" | "manager" | "editor" | "viewer";

export interface PermissionSet {
  role: ProjectRole;
  canViewProject: boolean;
  canEditTasks: boolean;
  canManageProject: boolean;
  canManageShares: boolean;
  canInviteUsers: boolean;
  canViewAuditLog: boolean;
}

export interface ProfileDefaults {
  sm: number;
  sy: number;
  nm: number;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  theme?: string | null;
  defaults?: ProfileDefaults;
}

export interface ProjectAccessMeta {
  source: "own" | "shared";
  ownerId: string | null;
  ownerName: string;
  ownerEmail: string;
  invitedBy: string | null;
  invitedByName: string;
  invitedByEmail: string;
}

export interface ProjectSnapshotMeta {
  _serverId?: string;
  _role?: ProjectRole;
  _access?: ProjectAccessMeta;
  _localVersion?: number;
  _serverVersion?: number;
  _localUpdatedAt?: string;
}

export interface ProjectSettings {
  name: string;
  sm: number;
  sy: number;
  nm: number;
  baseline?: unknown;
  baselineDate?: string | null;
}

export interface Category {
  name: string;
  color: string;
}

export interface TaskCostItem {
  id?: string | number;
  type?: string;
  name?: string;
  supplier?: string;
  unit?: string;
  qty?: number;
  price?: number;
  budget?: number;
  paid?: number;
  payments?: unknown[];
  acts?: unknown[];
}

export interface TaskPhase {
  name?: string;
  ms: number;
  me: number;
  ws?: number;
  we?: number;
}

export interface Task {
  id?: string | number;
  n: number;
  order?: number;
  name: string;
  cat: number;
  ms: number;
  ws: number;
  me: number;
  we: number;
  prog: number;
  budget?: number;
  spent?: number;
  deps?: unknown[];
  phases?: TaskPhase[] | null;
  notes?: unknown[];
  costItems?: TaskCostItem[];
}

export interface ProjectSnapshot extends ProjectSnapshotMeta {
  proj: ProjectSettings;
  cats: Category[];
  tasks: Task[];
  nextN: number;
}

export type SyncStatus = "offline" | "ok" | "syncing" | "error" | "warn";

export interface ProjectSyncState<TSnapshot = ProjectSnapshot | null> {
  snap: TSnapshot;
  hasServerCopy: boolean;
  hasLocalChanges: boolean;
  localVersion: number;
  serverVersion: number;
  updatedAt: string | null;
}

export interface SyncBadge {
  status: SyncStatus;
  label: string;
}

export type AuditEventType =
  | "task.created"
  | "task.updated"
  | "task.deleted"
  | "project.settings_updated"
  | "project.baseline_saved"
  | "project.baseline_cleared"
  | "share.granted"
  | "share.role_updated"
  | "share.revoked";

export interface AuditEntry<TPayload = Record<string, unknown>> {
  id: string;
  projectId: string;
  actorId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  eventType: AuditEventType;
  entityType: "task" | "project" | "share";
  entityId?: string | null;
  payload: TPayload;
  createdAt: string;
}
