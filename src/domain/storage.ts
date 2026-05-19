import { normalizeProjectRole } from "./permissions";
import type { ProjectRole, ProjectSnapshot, ProjectSnapshotMeta } from "./types";

type ProjectSnapshotLike = Partial<ProjectSnapshot> & ProjectSnapshotMeta & {
  proj?: Record<string, unknown>;
  cats?: unknown[];
  tasks?: unknown[];
  nextN?: number;
};

export interface StorageBufferPayload {
  allProjects: Record<string, ProjectSnapshotLike>;
  currentId: string | null;
  _userId: string | null;
}

export function buildProjectSnapshotMeta(
  previousSnapshot?: ProjectSnapshotLike | null,
  overrides: Partial<ProjectSnapshotMeta> = {},
): ProjectSnapshotMeta {
  return {
    _localUpdatedAt: overrides._localUpdatedAt || new Date().toISOString(),
    _localVersion: overrides._localVersion ?? ((previousSnapshot?._localVersion || 0) + 1),
    _serverVersion: overrides._serverVersion ?? (previousSnapshot?._serverVersion || 0),
    ...(previousSnapshot?._serverId ? { _serverId: previousSnapshot._serverId } : {}),
    ...(previousSnapshot?._role
      ? { _role: normalizeProjectRole(previousSnapshot._role as string, previousSnapshot._role as ProjectRole) }
      : {}),
    ...(previousSnapshot?._access ? { _access: previousSnapshot._access } : {}),
    ...overrides,
  };
}

export function buildInitialProjectSnapshotMeta(
  overrides: Partial<ProjectSnapshotMeta> = {},
): ProjectSnapshotMeta {
  return {
    _localUpdatedAt: overrides._localUpdatedAt || new Date().toISOString(),
    _localVersion: overrides._localVersion ?? 1,
    _serverVersion: overrides._serverVersion ?? 0,
    ...overrides,
  };
}

export function buildStorageBufferPayload(
  allProjects: Record<string, ProjectSnapshotLike>,
  currentId: string | null,
  userId: string | null,
): StorageBufferPayload {
  return {
    allProjects,
    currentId,
    _userId: userId,
  };
}

export function normalizeBufferedProjectRoles<TProjects extends Record<string, ProjectSnapshotLike>>(
  allProjects: TProjects,
): TProjects {
  Object.values(allProjects || {}).forEach((projectSnapshot) => {
    if (projectSnapshot && projectSnapshot._role) {
      projectSnapshot._role = normalizeProjectRole(
        projectSnapshot._role as string,
        projectSnapshot._role as ProjectRole,
      );
    }
  });
  return allProjects;
}
