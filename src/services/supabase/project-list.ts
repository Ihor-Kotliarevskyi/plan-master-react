import { normalizeProjectRole } from "../../domain/permissions";
import type { ProjectSnapshot } from "../../domain/types";
import type { AccessibleProjectRow } from "./contracts";
import {
  mapAccessibleProjectAccess,
  mapAccessibleProjectToSnapshotShell,
} from "./mappers";

export interface BufferedProjectMap {
  [localId: string]: ProjectSnapshot;
}

export interface BufferedProjectAnalysis {
  offlineNew: BufferedProjectMap;
  localSynced: BufferedProjectMap;
}

export interface OwnProjectFallbackRow {
  id: string;
  name: string;
  sm: number;
  sy: number;
  nm: number;
  is_archived: boolean;
  updated_at: string;
}

export interface SharedProjectFallbackRow {
  role: ProjectSnapshot["_role"];
  invited_by: string | null;
  project: {
    id: string;
    name: string;
    sm: number;
    sy: number;
    nm: number;
    is_archived: boolean;
    updated_at: string;
    owner_id: string | null;
  } | null;
}

export function analyzeBufferedProjects(
  allProjects: BufferedProjectMap,
  bufferUserId: string | null,
  authUserId: string,
): BufferedProjectAnalysis {
  const offlineNew: BufferedProjectMap = {};
  const localSynced: BufferedProjectMap = {};
  const isOwnBuffer = !bufferUserId || bufferUserId === authUserId;

  Object.entries(allProjects || {}).forEach(([localId, snapshot]) => {
    if (!snapshot?._serverId && isOwnBuffer) {
      offlineNew[localId] = snapshot;
      return;
    }
    if (snapshot?._serverId && bufferUserId === authUserId) {
      localSynced[localId] = snapshot;
    }
  });

  return { offlineNew, localSynced };
}

export function mergeAccessibleProjectsIntoLocalMap(
  existingLocalProjects: BufferedProjectMap,
  accessibleProjects: AccessibleProjectRow[],
): BufferedProjectMap {
  const nextProjects: BufferedProjectMap = { ...existingLocalProjects };

  for (const item of accessibleProjects || []) {
    const localMatch = Object.entries(existingLocalProjects).find(
      ([, snapshot]) => snapshot?._serverId === item.project_id,
    );

    if (localMatch) {
      const [localId, snapshot] = localMatch;
      nextProjects[localId] = {
        ...snapshot,
        _role: normalizeProjectRole(item.role),
        _access: mapAccessibleProjectAccess(item),
      };
      continue;
    }

    nextProjects[item.project_id] = mapAccessibleProjectToSnapshotShell(item);
  }

  return nextProjects;
}

export function buildAccessibleProjectsFromFallback(
  ownProjects: OwnProjectFallbackRow[],
  sharedProjects: SharedProjectFallbackRow[],
  authUser: { id: string; email?: string | null },
): AccessibleProjectRow[] {
  return [
    ...(ownProjects || []).map((project) => ({
      project_id: project.id,
      name: project.name,
      sm: project.sm,
      sy: project.sy,
      nm: project.nm,
      is_archived: !!project.is_archived,
      updated_at: project.updated_at,
      role: "owner" as const,
      source: "own" as const,
      owner_id: authUser.id,
      owner_name: "",
      owner_email: authUser.email || "",
      invited_by: null,
      invited_by_name: "",
      invited_by_email: "",
    })),
    ...(sharedProjects || [])
      .filter((item): item is SharedProjectFallbackRow & { project: NonNullable<SharedProjectFallbackRow["project"]> } => !!item?.project?.id)
      .map((item) => ({
        project_id: item.project.id,
        name: item.project.name,
        sm: item.project.sm,
        sy: item.project.sy,
        nm: item.project.nm,
        is_archived: !!item.project.is_archived,
        updated_at: item.project.updated_at,
        role: normalizeProjectRole(item.role || "viewer"),
        source: "shared" as const,
        owner_id: item.project.owner_id || null,
        owner_name: "",
        owner_email: "",
        invited_by: item.invited_by || null,
        invited_by_name: "",
        invited_by_email: "",
      })),
  ];
}
