import { normalizeProjectRole } from "../domain/permissions";
import type { ProjectRole } from "../domain/types";
import {
  getSharedProjectLabels,
  groupProjectEntriesByAccess,
  isSharedProjectEntry,
} from "../domain/project-access";
import {
  buildAccessBannerModel,
  buildSharedProjectMetaLine,
  buildSharedProjectMetaText,
  getProjectRoleLabel,
} from "../domain/access-ui";
import { buildAccountSyncPanelModel } from "../domain/account-ui";
import { buildAuthFormModel, getAuthTabButtonClass } from "../domain/auth-ui";
import { buildThemeToggleModel, buildUserIdentityModel } from "../domain/profile-ui";
import {
  buildAuditEntryViewModel,
  getAuditActorLabel,
  getAuditEventLabel,
  getAuditSubjectLabel,
} from "../domain/audit-ui";
import {
  getProjectSyncState as buildProjectSyncState,
  getSyncBadge,
  resolveSyncStatus,
} from "../domain/sync";
import {
  buildInitialProjectSnapshotMeta,
  buildProjectSnapshotMeta,
  buildStorageBufferPayload,
  normalizeBufferedProjectRoles,
} from "../domain/storage";
import {
  mapAccessibleProjectAccess,
  mapAccessibleProjectToSnapshotShell,
  mapActivityLogRow,
  mapProjectRowToSnapshot,
  mapProjectShareRow,
  mapTaskRowToTask,
} from "../services/supabase/mappers";
import {
  buildActivityInsertPayload,
  buildProjectInsertPayload,
  buildProjectMutationPayload,
  buildProjectShareRoleUpdatePayload,
  buildProjectShareUpsertPayload,
  buildUpsertTasksPayload,
  splitActivityPayload,
} from "../services/supabase/payloads";
import {
  analyzeBufferedProjects,
  buildAccessibleProjectsFromFallback,
} from "../services/supabase/project-list";
import type {
  AccessibleProjectRow,
  ActivityLogRow,
  ProjectRow,
  ProjectShareRow,
  TaskRow,
} from "../services/supabase/contracts";

type AnyRecord = Record<string, any>;

function getStoredRole(localId: string, role: ProjectRole): ProjectRole {
  const scope = globalThis as typeof globalThis & {
    getStoredProjectRole?: (localId: string, role: ProjectRole) => ProjectRole;
  };
  return typeof scope.getStoredProjectRole === "function"
    ? scope.getStoredProjectRole(localId, role)
    : role;
}

function mergeAccessibleProjectsIntoLocalState(
  offlineNew: AnyRecord,
  localSynced: AnyRecord,
  accessibleProjects: AccessibleProjectRow[],
  authUserId: string,
) {
  const mergedProjects: AnyRecord = { ...offlineNew };

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

    const localMatch = Object.entries(localSynced)
      .find(([, localProject]) => (localProject as AnyRecord)?._serverId === item.project_id);

    if (localMatch) {
      const [localId, localProject] = localMatch;
      mergedProjects[localId] = {
        ...(localProject as AnyRecord),
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

function buildSupabaseProjectSnapshot(
  localId: string,
  projectRow: ProjectRow,
  taskRows: TaskRow[],
  previousSnapshot: AnyRecord | undefined,
  role: ProjectRole,
) {
  const snapshot = mapProjectRowToSnapshot(projectRow, taskRows, role, {
    _access: previousSnapshot?._access,
    _localVersion: previousSnapshot?._localVersion,
    _serverVersion: previousSnapshot?._serverVersion,
    _localUpdatedAt: previousSnapshot?._localUpdatedAt,
  });
  return {
    ...snapshot,
    _role: getStoredRole(localId, role),
  };
}

function mapSupabaseShareRecord(shareRow: ProjectShareRow) {
  return mapProjectShareRow(shareRow);
}

function mapSupabaseFallbackShareRecord(shareRow: {
  id: string;
  role: string;
  user_id: string;
}) {
  return {
    id: shareRow.id,
    role: normalizeProjectRole(shareRow.role),
    user: {
      id: shareRow.user_id,
      name: shareRow.user_id,
      email: "",
    },
    invitedByName: "",
    invitedByEmail: "",
  };
}

function mapSupabaseActivityRow(activityRow: ActivityLogRow) {
  return mapActivityLogRow(activityRow);
}

const runtimeHelpers = {
  analyzeBufferedProjectsForUser: analyzeBufferedProjects,
  mergeAccessibleProjectsIntoLocalState,
  mapSupabaseTaskRow: mapTaskRowToTask,
  buildSupabaseProjectSnapshot,
  buildSupabaseTasksPayload: buildUpsertTasksPayload,
  buildSupabaseProjectMutationPayload: buildProjectMutationPayload,
  buildSupabaseProjectInsertPayload: buildProjectInsertPayload,
  buildSupabaseActivityInsertPayload: buildActivityInsertPayload,
  splitSupabaseActivityPayload: splitActivityPayload,
  mapSupabaseShareRecord,
  mapSupabaseFallbackShareRecord,
  mapSupabaseActivityRow,
  buildSupabaseProjectShareUpsertPayload: buildProjectShareUpsertPayload,
  buildSupabaseProjectShareRoleUpdatePayload: buildProjectShareRoleUpdatePayload,
  buildAccessibleProjectsFromFallback,
  isSharedProjectEntry,
  groupProjectEntriesByAccess,
  getSharedProjectLabels,
  getRuntimeProjectSyncState: buildProjectSyncState,
  getRuntimeSyncBadge: getSyncBadge,
  resolveRuntimeSyncStatus: resolveSyncStatus,
  buildRuntimeProjectSnapshotMeta: buildProjectSnapshotMeta,
  buildRuntimeInitialProjectSnapshotMeta: buildInitialProjectSnapshotMeta,
  buildRuntimeStorageBufferPayload: buildStorageBufferPayload,
  normalizeRuntimeBufferedProjectRoles: normalizeBufferedProjectRoles,
  getRuntimeProjectRoleLabel: getProjectRoleLabel,
  buildRuntimeAccountSyncPanelModel: buildAccountSyncPanelModel,
  buildRuntimeAuthFormModel: buildAuthFormModel,
  getRuntimeAuthTabButtonClass: getAuthTabButtonClass,
  buildRuntimeThemeToggleModel: buildThemeToggleModel,
  buildRuntimeUserIdentityModel: buildUserIdentityModel,
  buildRuntimeSharedProjectMetaText: buildSharedProjectMetaText,
  buildRuntimeSharedProjectMetaLine: buildSharedProjectMetaLine,
  buildRuntimeAccessBannerModel: buildAccessBannerModel,
  getRuntimeAuditEventLabel: getAuditEventLabel,
  getRuntimeAuditSubjectLabel: getAuditSubjectLabel,
  getRuntimeAuditActorLabel: getAuditActorLabel,
  buildRuntimeAuditEntryViewModel: buildAuditEntryViewModel,
};

Object.assign(globalThis, runtimeHelpers);
