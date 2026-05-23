import { normalizeProjectRole } from "../../domain/permissions";
import type { Category, ProjectRole, ProjectSnapshot, Task } from "../../domain/types";

export interface FallbackProjectSummary {
  id: string;
  name: string;
  sm: number;
  sy: number;
  nm: number;
  role?: string | null;
}

export interface FallbackProjectDetails {
  _id: string;
  name: string;
  sm: number;
  sy: number;
  nm: number;
  baseline?: unknown;
  baselineDate?: string | null;
  cats?: Category[];
  nextN?: number | null;
}

export interface FallbackShareRecord {
  role?: string | null;
  userId?: {
    _id?: string;
    name?: string;
    email?: string;
  };
}

export interface FallbackProjectSyncRequest {
  projectPayload: {
    name: string;
    sm: number;
    sy: number;
    nm: number;
    cats: unknown[];
    nextN: number;
    baseline: unknown;
    baselineDate: string | null;
  };
  tasksPayload: {
    tasks: Task[];
  };
}

export interface FallbackProjectCreateRequest {
  payload: {
    name: string;
    sm: number;
    sy: number;
    nm: number;
    cats: unknown[];
    tasks: Task[];
    nextN: number;
  };
}

export interface FallbackShareMutationRequest {
  email: string;
  role: ProjectRole;
}

export interface FallbackShareRoleUpdateRequest {
  role: ProjectRole;
}

export interface FallbackShareModalItem {
  userId: string;
  displayName: string;
  displayEmail: string;
  normalizedRole: ProjectRole;
  roleLabel: string;
}

export interface FallbackShareModalState {
  items: FallbackShareModalItem[];
}

export function buildFallbackProjectShell(project: FallbackProjectSummary): ProjectSnapshot {
  const normalizedRole = normalizeProjectRole(project.role || "owner");
  return {
    proj: {
      name: project.name,
      sm: project.sm,
      sy: project.sy,
      nm: project.nm,
    },
    cats: [],
    tasks: [],
    nextN: 1,
    _serverId: project.id,
    _role: normalizedRole,
  };
}

export function buildFallbackLoadedProjectSnapshot(
  localId: string,
  project: FallbackProjectDetails,
  tasks: Task[],
  resolvedRole: string,
  getStoredRole?: (localId: string, role: ProjectRole) => ProjectRole,
): ProjectSnapshot {
  const normalizedRole = normalizeProjectRole(resolvedRole || "viewer");
  return {
    proj: {
      name: project.name,
      sm: project.sm,
      sy: project.sy,
      nm: project.nm,
      baseline: project.baseline,
      baselineDate: project.baselineDate || null,
    },
    cats: project.cats || [],
    tasks: tasks || [],
    nextN: project.nextN || 1,
    _serverId: project._id,
    _role: typeof getStoredRole === "function" ? getStoredRole(localId, normalizedRole) : normalizedRole,
  };
}

export function buildFallbackProjectSyncRequest(snapshot: ProjectSnapshot): FallbackProjectSyncRequest {
  return {
    projectPayload: {
      name: snapshot.proj.name,
      sm: snapshot.proj.sm,
      sy: snapshot.proj.sy,
      nm: snapshot.proj.nm,
      cats: snapshot.cats,
      nextN: snapshot.nextN,
      baseline: snapshot.proj.baseline || null,
      baselineDate: snapshot.proj.baselineDate || null,
    },
    tasksPayload: {
      tasks: snapshot.tasks,
    },
  };
}

export function buildFallbackProjectCreateRequest(snapshot: ProjectSnapshot): FallbackProjectCreateRequest {
  return {
    payload: {
      name: snapshot.proj.name,
      sm: snapshot.proj.sm,
      sy: snapshot.proj.sy,
      nm: snapshot.proj.nm,
      cats: snapshot.cats,
      tasks: snapshot.tasks,
      nextN: snapshot.nextN,
    },
  };
}

export function buildFallbackProjectDeleteRequest(projectId: string) {
  return { projectId };
}

export function buildFallbackShareGrantRequest(
  email: string,
  role: string,
  isShareableRole: (role: string) => boolean,
): FallbackShareMutationRequest {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) throw new Error("Enter email");
  const normalizedRole = normalizeProjectRole(role);
  if (!isShareableRole(normalizedRole)) throw new Error("Unsupported access role");
  return {
    email: normalizedEmail,
    role: normalizedRole,
  };
}

export function buildFallbackShareRoleUpdateRequest(
  role: string,
  isShareableRole: (role: string) => boolean,
): FallbackShareRoleUpdateRequest {
  const normalizedRole = normalizeProjectRole(role);
  if (!isShareableRole(normalizedRole)) throw new Error("Unsupported access role");
  return {
    role: normalizedRole,
  };
}

export function buildFallbackShareRemoveRequest(userId: string) {
  return { userId };
}

export function buildFallbackShareModalState(
  shares: FallbackShareRecord[],
  getRoleLabel: (role: string) => string,
): FallbackShareModalState {
  return {
    items: (shares || []).map((share) => {
      const normalizedRole = normalizeProjectRole(share.role || "viewer");
      return {
        userId: String(share.userId?._id || ""),
        displayName: share.userId?.name || "—",
        displayEmail: share.userId?.email || "",
        normalizedRole,
        roleLabel: getRoleLabel(normalizedRole),
      };
    }),
  };
}
