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
