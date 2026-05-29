import { normalizeProjectRole } from "../../domain/permissions";
import type { ProjectRole, ProjectSnapshot } from "../../domain/types";
import type { AccessibleProjectRow, ProjectRow, TaskRow } from "./contracts";
import {
  mapAccessibleProjectAccess,
  mapAccessibleProjectToSnapshotShell,
  mapProjectRowToSnapshot,
} from "./mappers";

type ProjectMap = Record<string, ProjectSnapshot>;

export interface ProjectLoadDecision {
  shouldSyncFirst: boolean;
  serverId: string | null;
  localVersion: number;
  serverVersion: number;
}

export function mergeAccessibleProjectsIntoLocalState(
  offlineNew: ProjectMap,
  localSynced: ProjectMap,
  accessibleProjects: AccessibleProjectRow[],
  authUserId: string,
): ProjectMap {
  const mergedProjects: ProjectMap = { ...offlineNew };
  const normalizeProjectName = (value: unknown) => String(value || "").trim().toLowerCase();

  for (const item of accessibleProjects || []) {
    if (!item?.project_id) continue;

    const normalizedRole = normalizeProjectRole(item.role || (item.source === "own" ? "owner" : "viewer"));
    const fallbackMeta = {
      source: item.source || "own",
      owner_id: item.owner_id || (item.source === "own" ? authUserId : null),
      owner_name: item.owner_name || "",
      owner_email: item.owner_email || "",
      invited_by: item.invited_by || null,
      invited_by_name: item.invited_by_name || "",
      invited_by_email: item.invited_by_email || "",
    };

    const localMatch = Object.entries(localSynced).find(
      ([, localProject]) => localProject?._serverId === item.project_id,
    );

    if (localMatch) {
      const [localId, localProject] = localMatch;
      mergedProjects[localId] = {
        ...localProject,
        _role: normalizedRole,
        _access: mapAccessibleProjectAccess({
          ...item,
          ...fallbackMeta,
        }),
      };
      continue;
    }

    const offlineNameMatch = item.source === "own"
      ? Object.entries(mergedProjects).find(
          ([, localProject]) =>
            !localProject?._serverId &&
            normalizeProjectName(localProject?.proj?.name) &&
            normalizeProjectName(localProject?.proj?.name) === normalizeProjectName(item.name),
        )
      : null;

    if (offlineNameMatch) {
      const [localId, localProject] = offlineNameMatch;
      mergedProjects[localId] = {
        ...localProject,
        _serverId: item.project_id,
        _role: normalizedRole,
        _access: mapAccessibleProjectAccess({
          ...item,
          ...fallbackMeta,
        }),
      };
      continue;
    }

    mergedProjects[item.project_id] = mapAccessibleProjectToSnapshotShell(item);
  }

  return mergedProjects;
}

export function buildSupabaseProjectSnapshot(
  localId: string,
  projectRow: ProjectRow,
  taskRows: TaskRow[],
  previousSnapshot: ProjectSnapshot | undefined,
  role: ProjectRole,
  getStoredRole?: (localId: string, role: ProjectRole) => ProjectRole,
): ProjectSnapshot {
  const snapshot = mapProjectRowToSnapshot(projectRow, taskRows, role, {
    _access: previousSnapshot?._access,
    _localVersion: previousSnapshot?._localVersion,
    _serverVersion: previousSnapshot?._serverVersion,
    _localUpdatedAt: previousSnapshot?._localUpdatedAt,
  });
  return {
    ...snapshot,
    _role: typeof getStoredRole === "function" ? getStoredRole(localId, role) : role,
  };
}

export function resolveProjectLoadDecision(snapshot?: ProjectSnapshot | null): ProjectLoadDecision {
  return {
    shouldSyncFirst: (snapshot?._localVersion || 0) > (snapshot?._serverVersion || 0),
    serverId: snapshot?._serverId || null,
    localVersion: snapshot?._localVersion || 0,
    serverVersion: snapshot?._serverVersion || 0,
  };
}

export function buildProjectSyncSuccessSnapshot(snapshot: ProjectSnapshot): ProjectSnapshot {
  return {
    ...snapshot,
    _serverVersion: snapshot._localVersion || 0,
  };
}

export function buildProjectCreateSuccessSnapshot(
  snapshot: ProjectSnapshot,
  serverId: string,
): ProjectSnapshot {
  return {
    ...snapshot,
    _serverId: serverId,
    _role: "owner",
  };
}

export function resolveCurrentProjectId(
  projects: ProjectMap,
  currentId: string | null,
  bufferCurrentId: string | null,
): string | null {
  if (bufferCurrentId && projects[bufferCurrentId]) return bufferCurrentId;
  if (currentId && projects[currentId]) return currentId;
  return Object.keys(projects)[0] || null;
}
