import type { ProjectSnapshotMeta, ProjectSyncState, SyncBadge, SyncStatus } from "./types";

export const SYNC_BADGE_LABELS: Record<SyncStatus, string> = {
  offline: "Синхронізація вимкнена",
  ok: "Синхронізація увімкнена",
  syncing: "Триває синхронізація",
  error: "Помилка синхронізації",
  warn: "Є локальні зміни, що ще не відправлені",
};

type SyncSnapshotLike = ProjectSnapshotMeta | null | undefined;

export function getProjectSyncState<TSnapshot extends SyncSnapshotLike>(
  snapshot: TSnapshot,
): ProjectSyncState<TSnapshot | null> {
  const safeSnapshot = snapshot || null;
  const localVersion = safeSnapshot?._localVersion || 0;
  const serverVersion = safeSnapshot?._serverVersion || 0;
  const hasServerCopy = !!safeSnapshot?._serverId;
  const hasLocalChanges = hasServerCopy ? localVersion > serverVersion : localVersion > 0;

  return {
    snap: safeSnapshot,
    hasServerCopy,
    hasLocalChanges,
    localVersion,
    serverVersion,
    updatedAt: safeSnapshot?._localUpdatedAt || null,
  };
}

export function getSyncBadge(
  loggedIn: boolean,
  syncStatus: SyncStatus,
  projectSyncState: Pick<ProjectSyncState, "hasLocalChanges">,
): SyncBadge {
  if (!loggedIn) return { status: "offline", label: SYNC_BADGE_LABELS.offline };
  if (syncStatus === "error") return { status: "error", label: SYNC_BADGE_LABELS.error };
  if (syncStatus === "syncing") return { status: "syncing", label: SYNC_BADGE_LABELS.syncing };
  if (projectSyncState.hasLocalChanges) return { status: "warn", label: SYNC_BADGE_LABELS.warn };
  return { status: "ok", label: SYNC_BADGE_LABELS.ok };
}

export function resolveSyncStatus(
  preferredStatus: SyncStatus | null | undefined,
  options: {
    loggedIn: boolean;
    online: boolean;
    projectSyncState: Pick<ProjectSyncState, "hasLocalChanges">;
  },
): SyncStatus {
  if (preferredStatus) return preferredStatus;
  if (!options.loggedIn) return "offline";
  if (!options.online) return "warn";
  return options.projectSyncState.hasLocalChanges ? "warn" : "ok";
}
