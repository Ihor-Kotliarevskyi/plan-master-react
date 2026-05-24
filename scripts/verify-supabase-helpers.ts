import assert from "node:assert/strict";

import {
  buildFallbackAuthHydratedState,
  buildFallbackLoginRequest,
  buildFallbackProfileUpdateRequest,
  buildFallbackRegisterRequest,
  buildFallbackSyncIndicatorPlan,
  resetFallbackAuthState,
} from "../src/services/api/account-runtime";
import {
  buildFallbackHttpRequestOptions,
  resolveFallbackHttpOutcome,
} from "../src/services/api/http-runtime";
import {
  buildFallbackLoadedProjectSnapshot,
  buildFallbackProjectCreateRequest,
  buildFallbackProjectDeleteRequest,
  buildFallbackProjectShell,
  buildFallbackProjectSyncRequest,
  buildFallbackShareGrantRequest,
  buildFallbackShareModalState,
  buildFallbackShareRemoveRequest,
  buildFallbackShareRoleUpdateRequest,
} from "../src/services/api/fallback-runtime";
import {
  getSharedProjectLabels,
  groupProjectEntriesByAccess,
} from "../src/domain/project-access";
import {
  buildAccessBannerModel,
  buildSharedProjectMetaLine,
  buildSharedProjectMetaText,
  getProjectRoleLabel,
} from "../src/domain/access-ui";
import { buildAccountSyncPanelModel } from "../src/domain/account-ui";
import { buildAuthFormModel, getAuthTabButtonClass } from "../src/domain/auth-ui";
import { buildThemeToggleModel, buildUserIdentityModel } from "../src/domain/profile-ui";
import {
  buildBaselineClearDialogModel,
  buildBaselineMissingModel,
  buildBaselinePanelModel,
  buildBaselineSavedToastModel,
} from "../src/domain/baseline-ui";
import { buildProjectDefaultsPanelModel, buildThemePanelModel } from "../src/domain/settings-ui";
import { buildAccountSectionModel } from "../src/domain/account-section-ui";
import {
  buildGanttToolbarLabels,
  buildProjectSelectLabels,
  buildTableLabels,
} from "../src/domain/render-ui";
import {
  buildHeaderDateText,
  buildLegendItems,
  buildTaskWindowModel,
  buildVisibleYearGroups,
} from "../src/domain/render";
import { buildAppUiModel } from "../src/domain/app-ui";
import { buildApiUiModel } from "../src/domain/api-ui";
import { buildChartsUiModel } from "../src/domain/charts-ui";
import {
  buildChartColors,
  buildChartData,
  buildChartDefinition,
  buildChartOptions,
  getChartAutoDefaults,
  normalizeChartRenderType,
} from "../src/domain/charts";
import { buildFinanceUiModel } from "../src/domain/finance-ui";
import {
  buildFinanceRows,
  buildFinanceSearchText,
  calculateFinanceOverview,
  financeItemTotal,
  financeScopedCostItems,
  financeTaskScope,
  hasFinanceFilters,
  summarizeFinanceDeletion,
} from "../src/domain/finance";
import { buildPrintUiModel } from "../src/domain/print-ui";
import {
  getPrintMetrics,
  getPrintPreviewState,
  resolvePrintGanttLayout,
  resolvePrintSections,
  resolvePrintSettings,
} from "../src/domain/print";
import { buildStorageUiModel } from "../src/domain/storage-ui";
import {
  buildApiUiModel,
  buildFallbackAuthButtonModel,
  buildFallbackAuthModalRenderModel,
} from "../src/domain/api-ui";
import { buildChartsUiModel } from "../src/domain/charts-ui";
import {
  buildChartColors,
  buildChartData,
  buildChartDefinition,
  buildChartOptions,
  getChartAutoDefaults,
  normalizeChartRenderType,
} from "../src/domain/charts";
import { buildFinanceUiModel } from "../src/domain/finance-ui";
import {
  buildFinanceRows,
  buildFinanceSearchText,
  calculateFinanceOverview,
  financeItemTotal,
  financeScopedCostItems,
  financeTaskScope,
  hasFinanceFilters,
  summarizeFinanceDeletion,
} from "../src/domain/finance";
import { buildPrintUiModel } from "../src/domain/print-ui";
import {
  getPrintMetrics,
  getPrintPreviewState,
  resolvePrintGanttLayout,
  resolvePrintSections,
  resolvePrintSettings,
} from "../src/domain/print";
import { buildStorageUiModel } from "../src/domain/storage-ui";
import {
  buildContractorFilterLabels,
  buildContractorSelectionLabels,
  buildContractorSummaryLabels,
  buildContractorTableLabels,
} from "../src/domain/contractors-ui";
import {
  buildContractorRows,
  contractorItemTotal,
  contractorKey,
  contractorName,
  contractorStatus,
  paymentRegisterFiltersLabel,
  paymentRegisterRowsFromContractorRows,
  paymentRegisterTotal,
  selectedContractorKeys,
  summarizeContractorBulkDelete,
} from "../src/domain/contractors";
import {
  buildContractorBulkDeleteModel,
  buildContractorSummaryModel,
  buildPaymentRegisterCurrentState,
  buildPaymentRegisterListItems,
  buildSavedPaymentRegister,
  findPaymentRegisterById,
  getVisibleDeletableContractorRows,
  hasContractorFilters,
} from "../src/domain/contractors-panel";
import { buildCostUiModel } from "../src/domain/costs-ui";
import {
  addPaymentToCostItem,
  calculateCostItemTotal,
  calculateCostSpent,
  calculateCostTotals,
  createCostItem,
  createCostPayment,
  removeCostItem,
  removePaymentFromCostItem,
  toggleExpandedCostId,
  updateCostItemContract,
  updateCostItemField,
  updateCostPaymentField,
} from "../src/domain/costs";
import { buildGuardedActionLabels, buildGuardToastModel } from "../src/domain/guard-ui";
import {
  buildDependencyEditorModel,
  buildDemoProjectSeedModel,
  buildCannotDeleteLastProjectModel,
  buildCategoryEditorModel,
  buildCreateProjectDialogModel,
  buildDeleteProjectDialogModel,
  buildDependencyListModalModel,
  buildDemoProjectDialogModel,
  buildNotesModalModel,
  buildProjectManagerListModel,
  buildTaskFormPanelModel,
  buildTaskDeleteDialogModel,
  buildTaskDependencyWarningDialogModel,
  buildTaskRangeWarningModel,
  buildTaskSavedToastModel,
} from "../src/domain/modal-ui";
import {
  buildDependencyListState,
  buildTaskCalcModel,
  dateStrToPhase,
  getActivePhaseIndex,
  getProjectMaxDate,
  getProjectMinDate,
  getWeightedProgress,
  phaseToDateStr,
  remWeeks,
  snapToHalfWeek,
} from "../src/domain/modal";
import {
  applyTaskSave,
  buildTaskModalCreateState,
  buildTaskModalEditState,
  buildTaskModalSaveModel,
  cloneModalCostItems,
  cloneModalPhasesFromTask,
  removeTaskAt,
} from "../src/domain/modal-orchestration";
import {
  addTaskNote,
  buildProjectManagerGroupModel,
  cloneCategoryDrafts,
  cloneTaskNotes,
  countVisibleTaskNotes,
  createNextCategoryDraft,
  deleteTaskNote,
  editTaskNote,
  isCategoryUsedByTasks,
  removeCategoryDraftAt,
} from "../src/domain/modal-panels";
import { buildAuthFlowMessages, buildProfileFeedbackMessages } from "../src/domain/user-feedback-ui";
import {
  buildAuditEntryViewModel,
  buildAuditLogModalModel,
  getAuditActorLabel,
  getAuditEventLabel,
  getAuditSubjectLabel,
} from "../src/domain/audit-ui";
import {
  getProjectSyncState,
  getSyncBadge,
  resolveSyncStatus,
} from "../src/domain/sync";
import {
  buildInitialProjectSnapshotMeta,
  buildProjectSnapshotMeta,
  buildStorageBufferPayload,
  normalizeBufferedProjectRoles,
} from "../src/domain/storage";
import {
  applyProjectSettingsUpdate,
  buildProjectDeletionState,
  canDeleteProjectCount,
  createDemoProjectSnapshot,
  createEmptyProjectSnapshot,
  resolveProjectDefaults,
  resolveNextProjectAfterDeletion,
} from "../src/domain/project-lifecycle";
import {
  buildImportedProjectSnapshot,
  createCopiedTask,
  normalizeImportedBaseline,
  projectNameExists,
  resolveUniqueProjectName,
} from "../src/domain/project-import";
import type {
  AccessibleProjectRow,
  ActivityLogRow,
  ProjectRow,
  ProjectShareRow,
  TaskRow,
} from "../src/services/supabase/contracts";
import {
  mapAccessibleProjectToSnapshotShell,
  mapActivityLogRow,
  mapProjectRowToSnapshot,
  mapProjectShareRow,
  mapTaskRowToTask,
} from "../src/services/supabase/mappers";
import {
  analyzeBufferedProjects,
  buildAccessibleProjectsFromFallback,
  mergeAccessibleProjectsIntoLocalMap,
} from "../src/services/supabase/project-list";
import {
  buildProjectCreateSuccessSnapshot,
  buildProjectSyncSuccessSnapshot,
  buildSupabaseProjectSnapshot as buildSupabaseRuntimeProjectSnapshot,
  mergeAccessibleProjectsIntoLocalState,
  resolveCurrentProjectId,
  resolveProjectLoadDecision,
} from "../src/services/supabase/runtime";
import {
  buildAuthRedirectUrl,
  buildSupabaseLoginRequest,
  buildSupabaseAccountErrorMessages,
  buildSupabaseProfileSelectRequest,
  buildSupabaseProfileUpdatePayload,
  buildSupabaseRegisterRequest,
} from "../src/services/supabase/account-runtime";
import {
  buildHydratedAuthState,
  buildLogoutSyncDecision,
  resetSupabaseAuthState,
  resolveSupabaseAuthEventPlan,
} from "../src/services/supabase/auth-runtime";
import {
  bindProjectCreateTasksRpcRequest,
  buildProjectCreateMutationRequest,
  buildProjectDeleteRequest,
  buildProjectSyncMutationRequest,
  buildProjectTasksRpcRequest,
  resolveLoadedProjectRole,
} from "../src/services/supabase/project-runtime";
import {
  buildSupabaseReadOnlyUiState,
  buildSupabaseShareRoleGuide,
  buildSupabaseShareRoleOptions,
  buildSupabaseShareDialogModel,
  buildSupabaseShareErrorMessages,
  buildSupabaseRoleUpdatedToast,
  buildSupabaseShareGrantedToast,
  buildSupabaseShareModalState,
  buildSupabaseShareRemovedToast,
  buildSupabaseSyncIndicatorPlan,
} from "../src/services/supabase/ui-runtime";
import {
  buildActivityLogReadRequest,
  buildActivityWriteRequest,
  buildShareListFallbackRequest,
  buildShareListRpcRequest,
  buildShareGrantRequest,
  buildShareGrantResult,
  buildShareLookupRequest,
  buildSupabaseCollaborationErrorMessages,
  buildShareRemoveRequest,
  buildShareRoleUpdateRequest,
  buildShareRoleUpdateResult,
  buildShareUpsertOptions,
  normalizeShareGrantInput,
  resolveActivityLogLimit,
  resolveShareTargetUser,
} from "../src/services/supabase/collaboration-runtime";
import {
  buildProjectInsertPayload,
  buildActivityInsertPayload,
  buildProjectShareRoleUpdatePayload,
  buildProjectShareUpsertPayload,
  buildProjectMutationPayload,
  splitActivityPayload,
  buildUpsertTasksPayload,
} from "../src/services/supabase/payloads";

const accessibleRow: AccessibleProjectRow = {
  project_id: "project-1",
  name: "Shared Project",
  sm: 5,
  sy: 2026,
  nm: 12,
  is_archived: false,
  updated_at: "2026-05-19T10:00:00.000Z",
  role: "editor",
  source: "shared",
  owner_id: "owner-1",
  owner_name: "Owner Name",
  owner_email: "owner@example.com",
  invited_by: "manager-1",
  invited_by_name: "Manager Name",
  invited_by_email: "manager@example.com",
};

const taskRow: TaskRow = {
  id: "task-1",
  n: 7,
  order: 0,
  name: "Concrete works",
  cat: 2,
  ms: 1,
  ws: 1,
  me: 3,
  we: 3,
  prog: 75,
  budget: "1250.5",
  spent: 800,
  deps: [{ id: "task-0", type: "FS" }],
  phases: [{ name: "Phase A", ms: 1, me: 2 }],
  cost_items: [{ name: "Cement", budget: 500 }],
  notes: [{ text: "Important" }],
};

const projectRow: ProjectRow = {
  id: "project-1",
  owner_id: "owner-1",
  name: "Shared Project",
  sm: 5,
  sy: 2026,
  nm: 12,
  cats: [{ name: "General", color: "#2563eb" }],
  next_n: 11,
  baseline: { saved: true },
  baseline_date: "2026-05-01",
};

const shareRow: ProjectShareRow = {
  id: "share-1",
  role: "manager",
  user_id: "user-2",
  user_name: "Shared User",
  user_email: "user2@example.com",
  invited_by: "owner-1",
  invited_by_name: "Owner Name",
  invited_by_email: "owner@example.com",
  created_at: "2026-05-19T10:15:00.000Z",
};

const activityRow: ActivityLogRow = {
  id: "activity-1",
  project_id: "project-1",
  actor_id: "owner-1",
  actor_name: "Owner Name",
  actor_email: "owner@example.com",
  event_type: "task.updated",
  entity_type: "task",
  entity_id: "task-1",
  payload: { field: "name" },
  created_at: "2026-05-19T10:30:00.000Z",
};

const fallbackAuthResetState = resetFallbackAuthState();
assert.equal(fallbackAuthResetState.token, null);
assert.equal(buildFallbackRegisterRequest("Ihor", "mail@example.com", "secret").name, "Ihor");
assert.equal(buildFallbackLoginRequest("mail@example.com", "secret").password, "secret");
assert.equal(buildFallbackProfileUpdateRequest({ theme: "dark" }).body.theme, "dark");
assert.equal(buildFallbackAuthHydratedState("token-1", { name: "Ihor" }).token, "token-1");
assert.equal(buildFallbackSyncIndicatorPlan().timeoutMs, 1800);
assert.equal(buildFallbackHttpRequestOptions("token-1").headers.Authorization, "Bearer token-1");
assert.equal(resolveFallbackHttpOutcome(401, { expired: true }).kind, "session_expired");
assert.equal(resolveFallbackHttpOutcome(500, { error: "Boom" }).message, "Boom");
assert.equal(buildSupabaseAccountErrorMessages().emailConfirmationRequired, "Check your email to confirm registration.");
const fallbackAuthModalRenderModel = buildFallbackAuthModalRenderModel("register", buildApiUiModel().auth);
assert.equal(fallbackAuthModalRenderModel.showNameField, true);
assert.equal(fallbackAuthModalRenderModel.submitLabel, buildApiUiModel().auth.registerSubmitLabel);
const fallbackAuthButtonModel = buildFallbackAuthButtonModel(true, "Ihor", buildApiUiModel().auth);
assert.equal(fallbackAuthButtonModel.mode, "logout");
assert.equal(fallbackAuthButtonModel.title.length > 0, true);
const taskModalCreateState = buildTaskModalCreateState({
  title: "New Task",
  fillCostHint: "Fill cost",
});
assert.equal(taskModalCreateState.title, "New Task");
assert.equal(taskModalCreateState.modalPhases.length, 1);
assert.equal(taskModalCreateState.hasItems, false);

const fallbackProjectShell = buildFallbackProjectShell({
  id: "fallback-1",
  name: "Fallback Project",
  sm: 4,
  sy: 2026,
  nm: 10,
  role: "manager",
});
assert.equal(fallbackProjectShell._serverId, "fallback-1");
assert.equal(fallbackProjectShell._role, "manager");
const fallbackLoadedProjectSnapshot = buildFallbackLoadedProjectSnapshot(
  "fallback-local-1",
  {
    _id: "fallback-1",
    name: "Fallback Project",
    sm: 4,
    sy: 2026,
    nm: 10,
    baseline: { saved: true },
    baselineDate: "2026-05-02",
    cats: [{ name: "General", color: "#2563eb" }],
    nextN: 8,
  },
  [mapTaskRowToTask(taskRow)],
  "editor",
  (localId, role) => role,
);
assert.equal(fallbackLoadedProjectSnapshot._serverId, "fallback-1");
assert.equal(fallbackLoadedProjectSnapshot._role, "editor");
const fallbackProjectSyncRequest = buildFallbackProjectSyncRequest(fallbackLoadedProjectSnapshot);
assert.equal(fallbackProjectSyncRequest.projectPayload.name, "Fallback Project");
assert.equal(fallbackProjectSyncRequest.tasksPayload.tasks.length, 1);
const fallbackProjectCreateRequest = buildFallbackProjectCreateRequest(fallbackLoadedProjectSnapshot);
assert.equal(fallbackProjectCreateRequest.payload.nextN, 8);
assert.equal(buildFallbackProjectDeleteRequest("fallback-1").projectId, "fallback-1");
assert.equal(resolveProjectDefaults({ sm: 4, sy: 2027 }, { sm: 1, sy: 2026, nm: 12 }).sy, 2027);
const projectDeletionState = buildProjectDeletionState(["a", "b", "c"], "b", "b");
assert.equal(projectDeletionState.nextCurrentId, "a");
assert.equal(projectDeletionState.shouldReloadCurrent, true);
assert.equal(buildFallbackShareGrantRequest(" USER@example.com ", "manager", (role) => ["viewer", "editor", "manager"].includes(role)).email, "user@example.com");
assert.equal(buildFallbackShareRoleUpdateRequest("editor", (role) => ["viewer", "editor", "manager"].includes(role)).role, "editor");
assert.equal(buildFallbackShareRemoveRequest("user-2").userId, "user-2");
const fallbackShareModalState = buildFallbackShareModalState([
  {
    role: "manager",
    userId: {
      _id: "user-2",
      name: "Shared User",
      email: "user2@example.com",
    },
  },
], (role) => role.toUpperCase());
assert.equal(fallbackShareModalState.items[0]?.userId, "user-2");
assert.equal(fallbackShareModalState.items[0]?.normalizedRole, "manager");

const shell = mapAccessibleProjectToSnapshotShell(accessibleRow, {
  localVersion: 3,
  serverVersion: 2,
});
assert.equal(shell._serverId, "project-1");
assert.equal(shell._role, "editor");
assert.equal(shell._access?.ownerEmail, "owner@example.com");

const mappedTask = mapTaskRowToTask(taskRow);
assert.equal(mappedTask.budget, 1250.5);
assert.equal(mappedTask.spent, 800);
assert.equal(mappedTask.costItems?.[0]?.name, "Cement");

const snapshot = mapProjectRowToSnapshot(projectRow, [taskRow], "manager", {
  _access: shell._access,
  _localVersion: 4,
  _serverVersion: 4,
});
assert.equal(snapshot.proj.name, "Shared Project");
assert.equal(snapshot.tasks.length, 1);
assert.equal(snapshot._role, "manager");
assert.equal(snapshot._access?.invitedByEmail, "manager@example.com");

const taskPayload = buildUpsertTasksPayload(snapshot.tasks);
assert.equal(taskPayload.length, 1);
assert.equal(taskPayload[0]?.order, 0);
assert.equal(taskPayload[0]?.budget, 1250.5);

const projectMutation = buildProjectMutationPayload(snapshot);
assert.equal(projectMutation.next_n, 11);
assert.equal(projectMutation.name, "Shared Project");

const projectInsert = buildProjectInsertPayload(snapshot, "owner-1");
assert.equal(projectInsert.owner_id, "owner-1");

const activityInsert = buildActivityInsertPayload({
  projectId: "project-1",
  actorId: "owner-1",
  actorName: "Owner Name",
  actorEmail: "owner@example.com",
  eventType: "task.updated",
  entityType: "task",
  entityId: "task-1",
  payload: { field: "name" },
});
assert.equal(activityInsert.project_id, "project-1");
assert.equal(activityInsert.entity_id, "task-1");
assert.equal(activityInsert.payload.field, "name");

const shareUpsert = buildProjectShareUpsertPayload({
  projectId: "project-1",
  userId: "user-2",
  role: "manager",
  invitedBy: "owner-1",
});
assert.equal(shareUpsert.project_id, "project-1");
assert.equal(shareUpsert.user_id, "user-2");
assert.equal(shareUpsert.role, "manager");

const shareRoleUpdate = buildProjectShareRoleUpdatePayload("viewer");
assert.equal(shareRoleUpdate.role, "viewer");

const shareView = mapProjectShareRow(shareRow);
assert.equal(shareView.role, "manager");
assert.equal(shareView.user.email, "user2@example.com");

const auditEntry = mapActivityLogRow(activityRow);
assert.equal(auditEntry.eventType, "task.updated");
assert.equal(auditEntry.payload.field, "name");
assert.equal(getAuditEventLabel(auditEntry.eventType), "Updated task");
assert.equal(getAuditActorLabel(auditEntry), "Owner Name");
assert.equal(getAuditSubjectLabel(auditEntry, "Shared Project"), "Task #?");
const auditView = buildAuditEntryViewModel(auditEntry, "Shared Project");
assert.equal(auditView.eventLabel, "Updated task");
assert.equal(auditView.actorLabel, "Owner Name");
assert.equal(auditView.subjectLabel, "Task #?");

const buffered = {
  localOnly: {
    proj: { name: "Offline", sm: 1, sy: 2026, nm: 12 },
    cats: [],
    tasks: [],
    nextN: 1,
  },
  synced: {
    ...shell,
    _serverId: "project-1",
  },
};

const analysis = analyzeBufferedProjects(buffered, "user-1", "user-1");
assert.ok(analysis.offlineNew.localOnly);
assert.ok(analysis.localSynced.synced);

const fallbackAccessible = buildAccessibleProjectsFromFallback(
  [{
    id: "project-own",
    name: "Own Project",
    sm: 4,
    sy: 2026,
    nm: 12,
    is_archived: false,
    updated_at: "2026-05-19T11:00:00.000Z",
  }],
  [{
    role: "viewer",
    invited_by: "owner-1",
    project: {
      id: "project-shared",
      name: "Shared Fallback",
      sm: 6,
      sy: 2026,
      nm: 12,
      is_archived: false,
      updated_at: "2026-05-19T11:15:00.000Z",
      owner_id: "owner-2",
    },
  }],
  { id: "owner-1", email: "owner@example.com" },
);
assert.equal(fallbackAccessible.length, 2);
assert.equal(fallbackAccessible[0]?.role, "owner");
assert.equal(fallbackAccessible[1]?.source, "shared");

const splitActivity = splitActivityPayload({
  entityType: "share",
  entityId: "share-1",
  role: "manager",
});
assert.equal(splitActivity.entityType, "share");
assert.equal(splitActivity.entityId, "share-1");
assert.equal(splitActivity.payload.role, "manager");

const merged = mergeAccessibleProjectsIntoLocalMap(analysis.offlineNew, [accessibleRow]);
assert.ok(merged.localOnly);
assert.ok(merged["project-1"]);
assert.equal(merged["project-1"]?._role, "editor");
const mergedRuntimeState = mergeAccessibleProjectsIntoLocalState(
  analysis.offlineNew,
  analysis.localSynced,
  [accessibleRow],
  "user-1",
);
assert.ok(mergedRuntimeState.localOnly);
assert.ok(mergedRuntimeState.synced);
assert.equal(mergedRuntimeState.synced?._role, "editor");
const projectLoadDecision = resolveProjectLoadDecision({
  ...shell,
  _serverId: "project-1",
  _localVersion: 4,
  _serverVersion: 2,
});
assert.equal(projectLoadDecision.shouldSyncFirst, true);
assert.equal(projectLoadDecision.serverId, "project-1");
assert.equal(resolveCurrentProjectId({ a: shell, b: snapshot }, null, "b"), "b");
assert.equal(resolveCurrentProjectId({ a: shell }, "missing", null), "a");
const runtimeProjectSnapshot = buildSupabaseRuntimeProjectSnapshot(
  "local-1",
  projectRow,
  [taskRow],
  shell,
  "manager",
  (_localId, role) => role,
);
assert.equal(runtimeProjectSnapshot._serverId, "project-1");
assert.equal(runtimeProjectSnapshot._role, "manager");
assert.equal(buildProjectSyncSuccessSnapshot(runtimeProjectSnapshot)._serverVersion, runtimeProjectSnapshot._localVersion || 0);
assert.equal(buildProjectCreateSuccessSnapshot(runtimeProjectSnapshot, "project-2")._serverId, "project-2");
assert.equal(buildProjectCreateSuccessSnapshot(runtimeProjectSnapshot, "project-2")._role, "owner");
const resetAuthState = resetSupabaseAuthState();
assert.equal(resetAuthState.user, null);
assert.equal(resetAuthState.profile, null);
assert.equal(resetAuthState.projectRole, null);
const logoutDecision = buildLogoutSyncDecision({
  ...runtimeProjectSnapshot,
  _localVersion: 5,
  _serverVersion: 4,
});
assert.equal(logoutDecision.shouldSync, true);
const hydratedAuthState = buildHydratedAuthState({ id: "user-1" }, { name: "Ihor" });
assert.equal((hydratedAuthState.user as { id: string }).id, "user-1");
assert.equal((hydratedAuthState.profile as { name: string }).name, "Ihor");
assert.equal(resolveSupabaseAuthEventPlan("SIGNED_IN", true).kind, "hydrate");
assert.equal(resolveSupabaseAuthEventPlan("SIGNED_IN", true).loadProjects, true);
assert.equal(resolveSupabaseAuthEventPlan("USER_UPDATED", true).kind, "hydrate");
assert.equal(resolveSupabaseAuthEventPlan("USER_UPDATED", true).loadProjects, false);
assert.equal(resolveSupabaseAuthEventPlan("TOKEN_REFRESHED", true).kind, "refresh");
assert.equal(resolveSupabaseAuthEventPlan("SIGNED_OUT", false).kind, "signed_out");
assert.equal(resolveSupabaseAuthEventPlan("SIGNED_OUT", false).refreshStatus, "offline");
const shareModalState = buildSupabaseShareModalState({
  shares: [{ id: "share-1", role: "manager", user: { email: "user@example.com" } }],
  projectName: "Shared Project",
  getRoleLabel: (role) => role.toUpperCase(),
});
assert.equal(shareModalState.projectName, "Shared Project");
assert.equal(shareModalState.items[0]?.displayLabel, "user@example.com");
assert.equal(shareModalState.items[0]?.roleLabel, "MANAGER");
assert.equal(shareModalState.items[0]?.normalizedRole, "manager");
const shareDialogModel = buildSupabaseShareDialogModel();
assert.equal(shareDialogModel.modalTitle, "Shared Access");
assert.equal(shareDialogModel.confirmButtonText, "Grant access");
const shareErrorMessages = buildSupabaseShareErrorMessages();
assert.equal(shareErrorMessages.updateRoleErrorTitle, "Failed to update role");
assert.equal(shareErrorMessages.removeAccessErrorText, "Try again.");
assert.equal(buildSupabaseShareRoleOptions(["viewer", "manager"], (role) => role.toUpperCase(), "manager").includes("selected"), true);
assert.equal(buildSupabaseShareRoleGuide()[0]?.title, "Manager");
const readOnlyUiState = buildSupabaseReadOnlyUiState({
  readonly: true,
  canShare: false,
  isLoggedIn: true,
  bannerModel: {
    shouldShow: true,
    roleLabel: "Viewer",
    roleHint: "Read-only access",
    sharedMetaText: "Owner · Manager",
  },
});
assert.equal(readOnlyUiState.showReadonlyBanner, true);
assert.equal(readOnlyUiState.headerBannerVisible, true);
assert.equal(readOnlyUiState.addButtonVisible, false);
assert.equal(readOnlyUiState.shareButtonVisible, false);
assert.equal(buildSupabaseRoleUpdatedToast("Manager").title, "Role updated: Manager");
assert.equal(buildSupabaseShareGrantedToast("Viewer", "mail@example.com").text, "mail@example.com");
assert.equal(buildSupabaseShareRemovedToast().title, "Access removed");
assert.equal(buildSupabaseSyncIndicatorPlan().status, "syncing");
assert.equal(buildSupabaseSyncIndicatorPlan().timeoutMs, 1800);
assert.equal(buildAuthRedirectUrl("http://localhost:5173", "/app"), "http://localhost:5173/app");
const registerRequest = buildSupabaseRegisterRequest("Ihor", "mail@example.com", "secret", "http://localhost:5173/app");
assert.equal(registerRequest.options.data.name, "Ihor");
assert.equal(registerRequest.options.emailRedirectTo, "http://localhost:5173/app");
assert.equal(buildSupabaseLoginRequest("mail@example.com", "secret").password, "secret");
assert.equal(buildSupabaseProfileSelectRequest("user-1").userId, "user-1");
const profileUpdatePayload = buildSupabaseProfileUpdatePayload({
  name: "Ihor",
  theme: "dark",
  defaults: { sm: 5, sy: 2026, nm: 12 },
});
assert.equal(profileUpdatePayload.name, "Ihor");
assert.equal(profileUpdatePayload.default_sm, 5);
assert.equal(profileUpdatePayload.default_sy, 2026);
assert.equal(profileUpdatePayload.default_nm, 12);
const activityWriteRequest = buildActivityWriteRequest({
  projectId: "project-1",
  actorId: "owner-1",
  actorName: "Owner Name",
  actorEmail: "owner@example.com",
  eventType: "share.granted",
  payload: { entityType: "share", entityId: "share-1", role: "manager" },
});
assert.equal(activityWriteRequest.payload.project_id, "project-1");
assert.equal(activityWriteRequest.payload.entity_type, "share");
assert.equal(activityWriteRequest.payload.entity_id, "share-1");
assert.equal(activityWriteRequest.payload.payload.role, "manager");
const shareGrantInput = normalizeShareGrantInput(" USER@Example.com ", "manager", (role) => ["viewer", "editor", "manager"].includes(role));
assert.equal(shareGrantInput.normalizedEmail, "user@example.com");
assert.equal(shareGrantInput.normalizedRole, "manager");
const shareGrantRequest = buildShareGrantRequest({
  projectId: "project-1",
  userId: "user-2",
  role: "manager",
  invitedBy: "owner-1",
});
assert.equal(shareGrantRequest.project_id, "project-1");
assert.equal(shareGrantRequest.user_id, "user-2");
assert.equal(buildShareGrantResult("user-2", "user@example.com", "viewer").email, "user@example.com");
assert.equal(buildShareLookupRequest("user@example.com").p_email, "user@example.com");
assert.equal(resolveShareTargetUser("user-2", "owner-1"), "user-2");
assert.equal(buildSupabaseCollaborationErrorMessages().invitePermissionDenied, "You do not have permission to invite users.");
assert.equal(buildShareUpsertOptions().onConflict, "project_id,user_id");
assert.equal(buildShareRoleUpdateRequest("editor", (role) => ["viewer", "editor", "manager"].includes(role)).role, "editor");
assert.equal(buildShareRoleUpdateResult("admin"), "manager");
assert.equal(buildShareListRpcRequest("project-1").p_project_id, "project-1");
assert.equal(buildShareListFallbackRequest("project-1").projectId, "project-1");
assert.equal(buildShareRemoveRequest("share-1").shareId, "share-1");
assert.equal(resolveActivityLogLimit(999), 500);
assert.equal(resolveActivityLogLimit(0), 100);
const activityLogReadRequest = buildActivityLogReadRequest("project-1", 999);
assert.equal(activityLogReadRequest.projectId, "project-1");
assert.equal(activityLogReadRequest.limit, 500);
assert.equal(resolveLoadedProjectRole("owner-1", "owner-1", "viewer"), "owner");
assert.equal(resolveLoadedProjectRole("owner-1", "user-2", "editor"), "editor");
const projectTasksRpcRequest = buildProjectTasksRpcRequest("project-1", snapshot.tasks);
assert.equal(projectTasksRpcRequest.p_project_id, "project-1");
assert.equal(projectTasksRpcRequest.p_tasks.length, snapshot.tasks.length);
const projectSyncMutationRequest = buildProjectSyncMutationRequest(
  "project-1",
  snapshot,
  "2026-05-20T00:00:00.000Z",
);
assert.equal(projectSyncMutationRequest.projectId, "project-1");
assert.equal(projectSyncMutationRequest.updatePayload.updated_at, "2026-05-20T00:00:00.000Z");
assert.equal(projectSyncMutationRequest.expectedTaskCount, snapshot.tasks.length);
const projectCreateMutationRequest = buildProjectCreateMutationRequest(snapshot, "owner-1");
assert.equal(projectCreateMutationRequest.insertPayload.owner_id, "owner-1");
assert.equal(projectCreateMutationRequest.expectedTaskCount, snapshot.tasks.length);
assert.equal(projectCreateMutationRequest.tasksRpc?.p_project_id, "__PROJECT_ID__");
const boundProjectCreateTasksRpcRequest = bindProjectCreateTasksRpcRequest(projectCreateMutationRequest, "project-2");
assert.equal(boundProjectCreateTasksRpcRequest?.p_project_id, "project-2");
assert.equal(buildProjectDeleteRequest("project-3").projectId, "project-3");

const groupedProjects = groupProjectEntriesByAccess([
  ["local-only", buffered.localOnly],
  ["shared-shell", shell],
]);
assert.equal(groupedProjects.own.length, 1);
assert.equal(groupedProjects.shared.length, 1);

const sharedLabels = getSharedProjectLabels(shell._access);
assert.equal(sharedLabels.isShared, true);
assert.equal(sharedLabels.ownerLabel, "Owner Name");
assert.equal(sharedLabels.invitedByLabel, "Manager Name");

assert.equal(getProjectRoleLabel("manager"), "Менеджер");
assert.equal(buildSharedProjectMetaText(shell._access), "Owner Name · Manager Name");
assert.equal(buildSharedProjectMetaLine(shell._access), "Власник: Owner Name · Поділився: Manager Name");

const accessBanner = buildAccessBannerModel("viewer", shell._access);
assert.equal(accessBanner.shouldShow, true);
assert.equal(accessBanner.roleLabel, "Перегляд");
assert.equal(accessBanner.sharedMetaText, "Owner Name · Manager Name");

const syncState = getProjectSyncState(shell);
assert.equal(syncState.hasServerCopy, true);
assert.equal(syncState.localVersion, 3);
assert.equal(syncState.serverVersion, 2);
assert.equal(syncState.hasLocalChanges, true);

const syncBadge = getSyncBadge(true, "ok", syncState);
assert.equal(syncBadge.status, "warn");

const accountSyncPanel = buildAccountSyncPanelModel(syncState, "viewer", "Shared Project");
assert.equal(accountSyncPanel.roleLabel, "Перегляд");
assert.equal(accountSyncPanel.projectName, "Shared Project");
assert.equal(accountSyncPanel.hasServerCopyText, "yes");
assert.equal(accountSyncPanel.localVersionText, "3");

const loginForm = buildAuthFormModel("login");
assert.equal(loginForm.isLogin, true);
assert.equal(loginForm.submitLabel, "Sign in");
const registerForm = buildAuthFormModel("register");
assert.equal(registerForm.isLogin, false);
assert.equal(registerForm.submitLabel, "Register");
assert.equal(getAuthTabButtonClass("login", "login"), "btn btn-sm btn-acc");
assert.equal(getAuthTabButtonClass("register", "login"), "btn btn-sm");

const themeToggle = buildThemeToggleModel("dark");
assert.equal(themeToggle.icon, "sun");
assert.equal(themeToggle.label, "Light");

const userIdentity = buildUserIdentityModel({
  name: "Ihor",
  email: "ihor@example.com",
  avatar: "https://example.com/avatar.png",
  theme: "light",
});
assert.equal(userIdentity.displayName, "Ihor");
assert.equal(userIdentity.emailText, "ihor@example.com");
assert.equal(userIdentity.initial, "I");
assert.equal(userIdentity.avatarUrl, "https://example.com/avatar.png");
assert.equal(userIdentity.themeToggle.icon, "moon");

const baselinePanel = buildBaselinePanelModel({
  hasBaseline: true,
  baselineDate: "2026-05-01",
  showBaseline: false,
});
assert.equal(baselinePanel.sectionTitle, "Baseline");
assert.equal(baselinePanel.savedLabel, "Saved: 2026-05-01");
assert.equal(baselinePanel.toggleLabel, "Show");
assert.equal(baselinePanel.saveActionLabel, "Overwrite");
assert.equal(buildBaselineSavedToastModel("2026-05-01").title, "Базовий план збережено (2026-05-01)");
assert.equal(buildBaselineClearDialogModel().confirmButtonText, "Очистити");
assert.equal(buildBaselineMissingModel().title, "Базовий план не збережено");

const guardToast = buildGuardToastModel("редагування");
assert.equal(guardToast.title, "У вас немає прав на редагування");
assert.equal(guardToast.text, "Зверніться до власника проєкту щоб отримати доступ.");
const guardedActions = buildGuardedActionLabels();
assert.equal(guardedActions.saveProjSettings?.capability, "canManageProject");
assert.equal(guardedActions.deleteProject?.label, "видалення проєкту");

const defaultsPanel = buildProjectDefaultsPanelModel();
assert.equal(defaultsPanel.sectionTitle, "Project defaults");
assert.equal(defaultsPanel.startMonthLabel, "Start month");

const themePanel = buildThemePanelModel();
assert.equal(themePanel.sectionTitle, "Appearance");
assert.equal(themePanel.themeLabel, "Theme");

const accountSection = buildAccountSectionModel();
assert.equal(accountSection.sectionTitle, "Cloud account");
assert.equal(accountSection.logoutLabel, "Log out");
assert.equal(accountSection.lastLocalChangeLabel, "Last local change");

const authFlowMessages = buildAuthFlowMessages();
assert.equal(authFlowMessages.loginSuccessTitle, "Вхід виконано");
assert.equal(authFlowMessages.projectsBootstrapWarningTitle, "Вхід виконано, але проєкти не завантажились");

const profileFeedback = buildProfileFeedbackMessages();
assert.equal(profileFeedback.profileSavedTitle, "Профіль збережено");
assert.equal(profileFeedback.avatarTooLargeText, "Максимум 2 МБ.");

const auditModal = buildAuditLogModalModel();
assert.equal(auditModal.modalTitle, "Журнал змін");
assert.equal(auditModal.actorCaption, "Хто");

const taskRangeWarning = buildTaskRangeWarningModel();
assert.equal(taskRangeWarning.title, "Невірний діапазон");

const taskDepWarning = buildTaskDependencyWarningDialogModel();
assert.equal(taskDepWarning.confirmButtonText, "Зберегти");

const taskSavedToast = buildTaskSavedToastModel(true);
assert.equal(taskSavedToast.title, "Роботу оновлено");

const taskDeleteDialog = buildTaskDeleteDialogModel("Task");
assert.equal(taskDeleteDialog.cancelButtonText, "Скасувати");

const projectManagerList = buildProjectManagerListModel();
assert.equal(projectManagerList.ownGroupTitle, "Мої проєкти");
assert.equal(projectManagerList.tasksCountLabel(3), "3 робіт");

const demoProjectDialog = buildDemoProjectDialogModel();
assert.equal(demoProjectDialog.loadedToastTitle, "Демо-проєкт завантажено");

const createProjectDialog = buildCreateProjectDialogModel();
assert.equal(createProjectDialog.inputLabel, "Назва проєкту");

const cannotDeleteLastProject = buildCannotDeleteLastProjectModel();
assert.equal(cannotDeleteLastProject.text, "Має залишатися хоча б один проєкт.");

const deleteProjectDialog = buildDeleteProjectDialogModel("Alpha");
assert.equal(deleteProjectDialog.title, "Видалити проєкт?");
assert.ok(deleteProjectDialog.html.includes("Alpha"));

const notesModal = buildNotesModalModel();
assert.equal(notesModal.emptyStateText, "Нотаток поки немає");
assert.equal(notesModal.countTitle(2), "2 нотаток");
assert.equal(notesModal.unknownAuthorLabel, "—");

const categoryEditor = buildCategoryEditorModel();
assert.equal(categoryEditor.accessDeniedTitle, "У вас немає прав на зміну категорій");
assert.equal(categoryEditor.newCategoryName, "Нова категорія");

const dependencyListModal = buildDependencyListModalModel();
assert.equal(dependencyListModal.emptyFilteredText, "Немає залежностей вибраного типу");
assert.equal(dependencyListModal.allFilterLabel(4), "Всі (4)");
assert.equal(dependencyListModal.countLabel(2, 5), "2 з 5");
assert.equal(dependencyListModal.predecessorHeader, "Попередник");
assert.equal(dependencyListModal.criticalPathTitle, "Критичний шлях");
assert.equal(dependencyListModal.criticalRowTitle, "Критична залежність");

const dependencyEditor = buildDependencyEditorModel();
assert.equal(dependencyEditor.independentLabel, "Незал.");
assert.equal(dependencyEditor.minThresholdLabel, "Мін.:");

const projectSelectLabels = buildProjectSelectLabels();
assert.equal(projectSelectLabels.ownGroupLabel, "Мої проєкти");
assert.equal(projectSelectLabels.sharedRoleSeparator, " · ");

const ganttToolbarLabels = buildGanttToolbarLabels();
assert.equal(ganttToolbarLabels.searchPlaceholder, "Пошук по назві...");
assert.equal(ganttToolbarLabels.criticalPathLabel, "Критичний шлях");

const tableLabels = buildTableLabels();
assert.equal(tableLabels.addTaskLabel, "+ Робота");
assert.equal(tableLabels.notesCountLabel(3), "3 нотаток");
assert.equal(tableLabels.phaseCountTitle(2), "2 фаз");

assert.equal(
  buildHeaderDateText(
    [{ name: "Травень", y: 2026 }, { name: "Червень", y: 2026 }],
    2,
  ),
  "Травень 2026 – Червень 2026 · 2 міс.",
);

const legendModel = buildLegendItems(
  [
    { name: "General", color: "#111111" },
    { name: "Finishing", color: "#222222" },
  ],
  1,
  new Set([0]),
);
assert.equal(legendModel.hasFilter, true);
assert.equal(legendModel.items[0]?.className, "cat-chip off");
assert.equal(legendModel.items[1]?.className, "cat-chip active");

const yearGroups = buildVisibleYearGroups([
  { name: "Травень", y: 2026 },
  { name: "Червень", y: 2026 },
  { name: "Січень", y: 2027 },
]);
assert.deepEqual(yearGroups, [
  { year: 2026, cols: 8 },
  { year: 2027, cols: 4 },
]);

const renderTaskWindow = buildTaskWindowModel({
  task: {
    id: "task-1",
    n: 1,
    name: "Concrete works",
    cat: 0,
    ms: 0,
    ws: 0,
    me: 1,
    we: 1,
    prog: 40,
    phases: [
      { ms: 0, ws: 0, me: 0, we: 1, prog: 100 },
      { ms: 0, ws: 2, me: 1, we: 1, prog: 20 },
    ],
    notes: [{}, { deleted: true }],
  },
  visStart: 0,
  totalWeeks: 12,
  zoomLevel: 25,
  taskSearch: "concrete",
  warnings: ["late"],
  baselinePos: { ms: 0, ws: 0, me: 1, we: 1 },
  isCritical: true,
});
assert.equal(renderTaskWindow?.notesCount, 1);
assert.equal(renderTaskWindow?.searchClass, "task-search-match");
assert.equal(renderTaskWindow?.isCritical, true);
assert.equal(renderTaskWindow?.warningsTitleSuffix, " ⚠ late");
assert.equal(renderTaskWindow?.baselineStart, 0);
assert.equal(renderTaskWindow?.baselineWidth, 150);
assert.equal(renderTaskWindow?.bar?.width, 150);
assert.equal(renderTaskWindow?.phases.length, 2);

const appUi = buildAppUiModel();
assert.equal(appUi.importedProjectFallbackName, "Імпортований проєкт");
assert.equal(appUi.copiedTaskSuffix, " (копія)");
assert.equal(appUi.numberedCopySuffix(3), " (копія 3)");
assert.equal(appUi.importSuccessTitle("Alpha"), "Імпортовано: «Alpha»");
assert.equal(appUi.workbookSheets.schedule, "Графік");
assert.equal(appUi.overdueShowMoreLabel(2), "▼ Показати ще 2");

const apiUi = buildApiUiModel();
assert.equal(apiUi.sessionExpiredTitle, "Сесія закінчилась — увійдіть знову");
assert.equal(apiUi.share.confirmButtonText, "Надати доступ");
assert.equal(apiUi.auth.loginTabLabel, "Увійти");
assert.equal(apiUi.auth.loginSuccessTitle("Ігор"), "Вітаємо, Ігор! ☁ Синхронізацію увімкнено");

const chartsUi = buildChartsUiModel();
assert.equal(chartsUi.axisLabels.prog, "Виконання (%)");
assert.equal(chartsUi.actionLabels.printTitle, "Друк");
assert.equal(chartsUi.autoCharts[0]?.id, "a1");

const chartData = buildChartData({
  tasks: [
    { n: 1, name: "Alpha task", cat: 0, ms: 0, prog: 100, budget: 100, spent: 100, contr: "Acme" },
    { n: 2, name: "Beta task", cat: 0, ms: 0, prog: 50, budget: 200, spent: 80, contr: "" },
    { n: 3, name: "Gamma task", cat: 1, ms: 1, prog: 0, budget: 300, spent: 0, contr: "Zen" },
  ],
  xKey: "status",
  yKey: "count",
  catFilter: "",
  statFilter: "",
  hiddenCats: new Set([1]),
  noContractorLabel: "(none)",
  statusLabels: { done: "Done", active: "Active", pending: "Pending" },
  getCategoryName: (cat) => (cat === 0 ? "General" : "Other"),
  getMonthLabel: (month) => (month === 0 ? "May 2026" : "Jun 2026"),
  getTaskContractors: (task) => (task.contr ? [task.contr] : []),
  getTaskDuration: () => 4,
});
assert.deepEqual(chartData.labels, ["Done", "Active"]);
assert.deepEqual(chartData.values, [1, 1]);

const chartColors = buildChartColors({
  xKey: "status",
  labels: ["Done", "Active", "Pending"],
  categories: [{ name: "General", color: "#123456" }],
  statusLabels: { done: "Done", active: "Active", pending: "Pending" },
});
assert.deepEqual(chartColors, ["#16803c", "#c07800", "#a09d97"]);

const chartOptions = buildChartOptions("bar", true);
assert.equal(chartOptions.indexAxis, "y");
assert.equal(chartOptions.plugins.legend.display, false);
assert.ok("scales" in chartOptions);

const chartDefinition = buildChartDefinition({
  id: "cc-1",
  type: "bar",
  xKey: "cat",
  yKey: "budget",
  catF: "",
  statF: "",
  labels: ["General"],
  values: [300],
  colors: ["#123456"],
  axisLabels: chartsUi.axisLabels,
});
assert.equal(chartDefinition.title, "Бюджет (грн) за Категорія");

const chartDefaults = getChartAutoDefaults("a4", chartsUi.autoCharts);
assert.equal(chartDefaults.type, "bar");
assert.equal(chartDefaults.x, "task");
assert.equal(chartDefaults.y, "dur");

const chartRenderType = normalizeChartRenderType("horizontalBar");
assert.equal(chartRenderType.realType, "bar");
assert.equal(chartRenderType.isHoriz, true);

const financeUi = buildFinanceUiModel();
assert.equal(financeUi.filters.searchPlaceholder, "Пошук у фінансах...");
assert.equal(financeUi.deleteDialogs.finalConfirmLabel, "Видалити");
assert.equal(financeUi.chart.projectedLabel, "Прогноз, грн");

assert.equal(
  hasFinanceFilters(
    { cat: ["1"], stat: [], contr: [], budgetMin: "", budgetMax: "", onlyBudget: false },
    (value) => Array.isArray(value) ? value.map(String) : [],
  ),
  true,
);
assert.equal(financeItemTotal({ qty: 2, unitPrice: 150 }), 300);

const financeTask = {
  n: 1,
  name: "Finance Task",
  cat: 0,
  budget: 1000,
  spent: 400,
  prog: 40,
  costItems: [
    {
      supplier: "Acme",
      qty: 2,
      unitPrice: 150,
      payments: [{ amount: 100, type: "act", date: "2026-05-01" }],
      acts: [{}],
      type: "service",
      name: "Install",
    },
    {
      supplier: "Other",
      qty: 1,
      unitPrice: 200,
      payments: [{ amount: 50, type: "invoice", date: "2026-05-03" }],
      acts: [],
      type: "material",
      name: "Steel",
    },
  ],
};
const contractorKey = (name: string) => String(name || "").trim().toLowerCase();
const getTaskItems = (task: any) => task.costItems || [];
const scopedItems = financeScopedCostItems(financeTask, ["acme"], contractorKey, getTaskItems);
assert.equal(scopedItems.length, 1);
const scopedScope = financeTaskScope(financeTask, ["acme"], contractorKey, getTaskItems);
assert.equal(scopedScope.budget, 300);
assert.equal(scopedScope.spent, 100);
assert.equal(scopedScope.payments.length, 1);
const fullScope = financeTaskScope(financeTask, [], contractorKey, getTaskItems);
assert.equal(fullScope.budget, 1000);
assert.equal(fullScope.spent, 400);

const financeSearch = buildFinanceSearchText(
  financeTask,
  ["Acme"],
  financeTask.costItems,
  "General",
  { service: { label: "Service" }, material: { label: "Material" } },
  { act: "Act", invoice: "Invoice" },
);
assert.equal(financeSearch.includes("finance task"), true);
assert.equal(financeSearch.includes("acme"), true);

const financeSummary = summarizeFinanceDeletion([0], [financeTask], getTaskItems);
assert.equal(financeSummary.tasks, 1);
assert.equal(financeSummary.items, 2);
assert.equal(financeSummary.payments, 2);

const overview = calculateFinanceOverview([financeTask]);
assert.equal(overview.budget, 1000);
assert.equal(overview.spent, 400);
assert.equal(overview.rest, 600);
assert.equal(overview.spentPct, 40);

const financeRows = buildFinanceRows(
  [{ ...financeTask, __ti: 0 }, { ...financeTask, __ti: 1, name: "Another", budget: 200, spent: 50 }],
  { col: "budget", dir: -1 },
  () => 6,
  () => 3,
);
assert.equal(financeRows[0]?.budget, 1000);
assert.equal(financeRows[0]?.ti, 0);
assert.equal(financeRows[0]?.rate, 200);

const printUi = buildPrintUiModel();
assert.equal(printUi.noChartsText, "Немає побудованих графіків");
assert.equal(printUi.financeTitle, "Фінансовий звіт");
assert.equal(printUi.exportPdfSuccessTitle, "PDF збережено");
assert.equal(printUi.previewPagesLabel(3), "3 стор.");
assert.equal(printUi.pdfPageProgressText(2, 5), "Сторінка 2 з 5...");

const printSections = resolvePrintSections({
  charts: true,
  chartIds: ["chart-1", "", "chart-2"],
});
assert.equal(printSections.gantt, true);
assert.equal(printSections.charts, true);
assert.deepEqual(printSections.chartIds, ["chart-1", "chart-2"]);
assert.equal(printSections.range, "all");

const printSettings = resolvePrintSettings(
  {
    paper: "letter",
    orientation: "portrait",
    contentScale: 2,
    renderScale: 0.5,
    margin: -3,
    fitMode: "height",
  },
  {
    paper: "a3",
    orientation: "landscape",
    contentScale: 1,
    renderScale: 1,
    margin: 5,
    fitMode: "paginate",
  },
);
assert.equal(printSettings.paper, "letter");
assert.equal(printSettings.orientation, "portrait");
assert.equal(printSettings.contentScale, 1);
assert.equal(printSettings.renderScale, 1);
assert.equal(printSettings.margin, 0);
assert.equal(printSettings.fitMode, "height");

const printMetrics = getPrintMetrics(printSettings, {
  a3: { w: 297, h: 420 },
  a4: { w: 210, h: 297 },
  letter: { w: 215.9, h: 279.4 },
});
assert.equal(printMetrics.pageW, 215.9);
assert.equal(printMetrics.pageH, 279.4);
assert.equal(printMetrics.contentWmm, 215.9);
assert.equal(printMetrics.contentHmm, 279.4);
assert.equal(printMetrics.contentWpx > 0, true);
assert.equal(printMetrics.contentHpx > 0, true);

const printPreviewState = getPrintPreviewState({
  currentPage: 5,
  pagesCount: 3,
  availableWidth: 300,
  availableHeight: 200,
  pageWidth: 600,
  pageHeight: 400,
});
assert.equal(printPreviewState?.pageIndex, 2);
assert.equal(printPreviewState?.pageLabel, "3 / 3");
assert.equal(printPreviewState?.prevDisabled, false);
assert.equal(printPreviewState?.nextDisabled, true);
assert.equal(printPreviewState?.targetWidth, 300);
assert.equal(printPreviewState?.targetHeight, 200);
assert.equal(printPreviewState?.targetLeft, 0);
assert.equal(printPreviewState?.targetTop, 0);
assert.equal(printPreviewState?.scale, 0.5);

const printGanttLayout = resolvePrintGanttLayout({
  settings: {
    paper: "a3",
    orientation: "landscape",
    contentScale: 1,
    renderScale: 1,
    margin: 5,
    fitMode: "page",
  },
  metrics: {
    pageW: 420,
    pageH: 297,
    contentWmm: 410,
    contentHmm: 287,
    contentWpx: 1550,
    contentHpx: 1085,
  },
  taskCount: 24,
  allWeeks: 18,
});
assert.equal(printGanttLayout.weeksPerPage, 18);
assert.equal(printGanttLayout.rowsPerPage, 24);
assert.equal(printGanttLayout.fixedW > 0, true);
assert.equal(printGanttLayout.weekW >= 2, true);
assert.equal(printGanttLayout.rowH >= 12, true);

const storageUi = buildStorageUiModel();
assert.equal(storageUi.offlineIndicatorText, "⚠ офлайн — зміни збережено локально");

const contractorSummaryLabels = buildContractorSummaryLabels();
assert.equal(contractorSummaryLabels.contractors, "Контрагентів");
assert.equal(contractorSummaryLabels.currencyUnit, "грн");

const contractorFilterLabels = buildContractorFilterLabels();
assert.equal(contractorFilterLabels.statusLabel, "Статус");
assert.equal(contractorFilterLabels.statusDebtLabel, "Є залишок");

const contractorSelectionLabels = buildContractorSelectionLabels();
assert.equal(contractorSelectionLabels.showSelectionLabel, "Вибрати");
assert.equal(contractorSelectionLabels.deleteSelectedLabel, "Видалити вибраних");

const contractorTableLabels = buildContractorTableLabels();
assert.equal(contractorTableLabels.noActOptionLabel.length > 0, true);
assert.equal(contractorTableLabels.importSkipRowLabel.length > 0, true);
assert.equal(contractorTableLabels.importNoChangesValidation.length > 0, true);
assert.equal(contractorTableLabels.importReviewActionHeader.length > 0, true);
assert.equal(contractorTableLabels.emptyContractorName, "Без контрагента");
assert.equal(contractorTableLabels.paymentsCountHeader, "Платежів");
assert.equal(contractorTableLabels.emDash, "—");
assert.equal(contractorTableLabels.contractActEmptyText, "Договорів по цьому контрагенту ще немає");
assert.equal(contractorTableLabels.addPaymentTitle, "Додати платіж");
assert.equal(contractorTableLabels.bulkDeleteConfirmTitle, "Підтвердьте видалення");
assert.equal(contractorTableLabels.registerNameTitle, "Назва реєстру");
assert.equal(contractorTableLabels.importReviewTitle, "Перевірка імпорту");
assert.equal(contractorTableLabels.editPaymentTitle("Acme"), "Редагувати платіж: Acme");
assert.equal(contractorTableLabels.paymentAmountValidation, "Вкажіть суму платежу");
assert.equal(contractorTableLabels.contractPlaceholder, "Договір №");

assert.equal(contractorName("", "Без контрагента"), "Без контрагента");
assert.equal(contractorKey("Acme", "Без контрагента"), "acme");
assert.equal(contractorItemTotal({ qty: 3, unitPrice: 200 }), 600);
assert.equal(contractorStatus({ budget: 100, paid: 0, rest: 100 }).key, "debt");
assert.deepEqual(selectedContractorKeys(["a", "b", "__forecast__"], (key) => key.startsWith("__")), ["a", "b"]);
assert.deepEqual(summarizeContractorBulkDelete([{ itemsCount: 2, paymentsCount: 3, acts: [1] }]), {
  contractors: 1,
  items: 2,
  payments: 3,
  acts: 1,
});
assert.equal(
  hasContractorFilters(
    { status: ["debt"], type: [], cat: [] },
    (selected) => Array.isArray(selected) ? selected.map(String) : [],
  ),
  true,
);
assert.equal(
  hasContractorFilters(
    { status: [], type: [], cat: [] },
    (selected) => Array.isArray(selected) ? selected.map(String) : [],
  ),
  false,
);

const contractorRows = buildContractorRows(
  [
    {
      id: "task-1",
      n: 1,
      name: "Foundation",
      cat: 0,
      budget: 1000,
      spent: 300,
      costItems: [{
        id: "item-1",
        supplier: "Acme",
        type: "work",
        contractNo: "C-1",
        qty: 2,
        unitPrice: 150,
        payments: [{ amount: 100, date: "2026-05-01", type: "act" }],
        acts: [{ amount: 120, date: "2026-04-20", type: "act", name: "A-1" }],
      }],
    },
  ],
  {
    filters: { q: "", status: [], type: [], cat: [] },
    emptyName: "Без контрагента",
    multiFilterHas: (selected, value) => !Array.isArray(selected) || !selected.length || selected.includes(value),
    multiFilterValues: (selected) => Array.isArray(selected) ? selected.map(String) : [],
    getTaskCostItems: (task) => task.costItems || [],
    sort: { col: "paid", dir: -1 },
  },
);
assert.equal(contractorRows.length, 1);
assert.equal(contractorRows[0]?.supplier, "Acme");
assert.equal(contractorRows[0]?.budget, 300);
assert.equal(contractorRows[0]?.paid, 100);
assert.equal(contractorRows[0]?.status, "debt");
const contractorSummary = buildContractorSummaryModel(contractorRows);
assert.equal(contractorSummary.realContractors, 1);
assert.equal(contractorSummary.total.budget, 300);
assert.equal(contractorSummary.total.paid, 100);
const visibleContractors = getVisibleDeletableContractorRows(contractorRows, (key) => key === "__blocked__");
assert.equal(visibleContractors.length, 1);
const contractorBulkDelete = buildContractorBulkDeleteModel(
  ["acme", "__blocked__", "acme"],
  contractorRows,
  (key) => key === "__blocked__",
  summarizeContractorBulkDelete,
);
assert.deepEqual(contractorBulkDelete.uniqueKeys, ["acme"]);
assert.equal(contractorBulkDelete.summary.contractors, 1);

const registerRows = paymentRegisterRowsFromContractorRows([{
  supplier: "Acme",
  isForecast: false,
  payments: [{ date: "2026-05-01", amount: 100, typeLabel: "Act", taskNo: 1, taskName: "Foundation", itemName: "Work", note: "" }],
}]);
assert.equal(registerRows.length, 1);
assert.equal(registerRows[0]?.type, "Act");
assert.equal(paymentRegisterTotal(registerRows), 100);
assert.equal(
  paymentRegisterFiltersLabel(
    { q: "acme", status: ["debt"], type: ["work"], cat: ["0"] },
    (selected) => Array.isArray(selected) ? selected.map(String) : [],
    (type) => ({ work: "Роботи" }[type] || type),
    (cat) => ({ "0": "General" }[cat] || cat),
  ),
  "пошук: acme; статус: debt; тип: Роботи; категорія: General",
);

const currentPaymentRegister = buildPaymentRegisterCurrentState(
  [{
    supplier: "Acme",
    isForecast: false,
    payments: [{ date: "2026-05-01", amount: 100, type: "act", taskNo: 1, taskName: "Foundation", itemName: "Work", note: "" }],
  }],
  (type) => ({ act: "Act" }[type] || type),
);
assert.equal(currentPaymentRegister.count, 1);
assert.equal(currentPaymentRegister.total, 100);
assert.equal(currentPaymentRegister.rows[0]?.type, "Act");
const savedRegister = buildSavedPaymentRegister({
  id: "reg-1",
  name: "Register",
  createdAt: "2026-05-23",
  filters: { q: "acme" },
  filtersLabel: "РїРѕС€СѓРє: acme",
  total: 100,
  rows: currentPaymentRegister.rows,
});
assert.equal(savedRegister.name, "Register");
assert.equal(savedRegister.filters.q, "acme");
const registerListItems = buildPaymentRegisterListItems([savedRegister]);
assert.equal(registerListItems[0]?.count, 1);
assert.equal(registerListItems[0]?.total, 100);
assert.equal(findPaymentRegisterById([savedRegister], "reg-1")?.name, "Register");

const costUi = buildCostUiModel();
assert.equal(costUi.labels.addPaymentLabel, "+ Платіж");
assert.equal(costUi.labels.contractNamePrefix, "Договір");
assert.equal(costUi.costTypes.material?.label, "Матеріали");

const createdCostItem = createCostItem({ id: 101, type: "work", defaultUnit: "contract" });
assert.equal(createdCostItem.id, 101);
assert.equal(createdCostItem.type, "work");
assert.equal(createdCostItem.unit, "contract");

const createdPayment = createCostPayment({ id: 201, date: "2026-05-22" });
assert.equal(createdPayment.type, "act");
assert.equal(createdPayment.date, "2026-05-22");

const costItemsWithPayment = addPaymentToCostItem(
  [createdCostItem],
  101,
  { ...createdPayment, amount: 500 },
);
assert.equal(costItemsWithPayment[0]?.payments?.length, 1);

const updatedCostItems = updateCostItemField(costItemsWithPayment, 101, "unitPrice", 1200);
assert.equal(updatedCostItems[0]?.unitPrice, 1200);

const renamedCostItems = updateCostItemContract(updatedCostItems, 101, "A-12", "Contract");
assert.equal(renamedCostItems[0]?.contractNo, "A-12");
assert.equal(renamedCostItems[0]?.name, "Contract A-12");

const updatedPaymentItems = updateCostPaymentField(renamedCostItems, 101, 0, "amount", 650);
assert.equal(updatedPaymentItems[0]?.payments?.[0]?.amount, 650);

assert.equal(calculateCostItemTotal({ ...updatedPaymentItems[0], qty: 2 }), 2400);
assert.equal(calculateCostSpent(updatedPaymentItems[0]), 650);

const totals = calculateCostTotals([{ ...updatedPaymentItems[0], qty: 2 }]);
assert.equal(totals.budget, 2400);
assert.equal(totals.spent, 650);
assert.equal(totals.rest, 1750);

assert.deepEqual(toggleExpandedCostId([1, 2], 2), [1]);
assert.deepEqual(toggleExpandedCostId([1], 3), [1, 3]);
assert.equal(removePaymentFromCostItem(updatedPaymentItems, 101, 0)[0]?.payments?.length, 0);
assert.equal(removeCostItem(updatedPaymentItems, 101).length, 0);

const taskFormPanel = buildTaskFormPanelModel();
assert.equal(taskFormPanel.newTaskTitle, "Нова робота");
assert.equal(taskFormPanel.weeklyRateUnit, "грн/тижд.");

const demoProjectSeed = buildDemoProjectSeedModel();
assert.equal(demoProjectSeed.projectName, "Ремонт офісу (демо)");

assert.equal(snapToHalfWeek("2026-05-09"), "2026-05-08");
assert.equal(phaseToDateStr({ sy: 2026, sm: 0, nm: 12 }, 1, 2), "2026-02-15");
assert.deepEqual(dateStrToPhase({ sy: 2026, sm: 0, nm: 12 }, "2026-02-18"), { mi: 1, wi: 2 });
assert.equal(getProjectMinDate({ sy: 2026, sm: 4, nm: 12 }), "2026-05-01");
assert.equal(getProjectMaxDate({ sy: 2026, sm: 4, nm: 12 }), "2027-04-28");
assert.equal(
  getWeightedProgress([
    { ms: 0, ws: 0, me: 0, we: 1, prog: 100 },
    { ms: 0, ws: 2, me: 1, we: 1, prog: 20 },
  ]),
  47,
);
assert.equal(getActivePhaseIndex([{ prog: 0 }, { prog: 25 }, { prog: 10 }]), 2);
assert.equal(remWeeks({ ms: 0, ws: 0, me: 1, we: 1 }), 6);
const modalCalc = buildTaskCalcModel({
  budget: 1000,
  spent: 250,
  phase: { ms: 0, ws: 0, me: 1, we: 1 },
});
assert.equal(modalCalc.remainder, 750);
assert.equal(modalCalc.weeks, 6);
assert.equal(modalCalc.weeklyRate, 125);
const depListState = buildDependencyListState({
  tasks: [
    { id: "a", n: 1, name: "Prep", cat: 0, deps: [] },
    { id: "b", n: 2, name: "Build", cat: 1, deps: [{ id: "a", type: "FS" }] },
    { id: "c", n: 3, name: "Finish", cat: 0, deps: [{ id: "b", type: "SS", threshold: 25 }] },
  ],
  filter: "all",
  criticalSet: new Set([0, 1]),
  categories: [{ color: "#111111" }, { color: "#222222" }],
  normDep: (dep) => dep,
});
assert.equal(depListState.allCount, 2);
assert.equal(depListState.filteredCount, 2);
assert.equal(depListState.counts.FS, 1);
assert.equal(depListState.counts.SS, 1);
assert.equal(depListState.rows[0]?.typeLabel, "FS");
assert.equal(depListState.rows[1]?.typeLabel, "SS+25%");
assert.equal(depListState.rows[0]?.isCritical, true);
const clonedCostItems = cloneModalCostItems([{
  id: "ci-1",
  payments: [{ id: "pay-1", amount: 100 }],
  acts: [{ id: "act-1", amount: 50 }],
}]);
assert.notEqual(clonedCostItems[0], undefined);
assert.notEqual(clonedCostItems[0], null);
assert.notEqual(clonedCostItems[0]?.payments, undefined);
assert.notEqual(clonedCostItems[0]?.payments, null);
assert.notEqual(clonedCostItems[0]?.payments, ([{ id: "pay-1", amount: 100 }]));
const clonedPhases = cloneModalPhasesFromTask({
  ms: 1, ws: 0, me: 2, we: 0, prog: 10, dsExact: "2026-02-01", deExact: "2026-03-01",
});
assert.equal(clonedPhases.length, 1);
assert.equal(clonedPhases[0]?.prog, 10);
const modalEditState = buildTaskModalEditState({
  task: {
    name: "Modal Task",
    budget: 0,
    spent: 200,
    contractsOverrideBudget: true,
    deps: [{ id: "dep-1", type: "FS" }],
    phases: [{ ms: 0, ws: 0, me: 1, we: 1, prog: 25 }],
    costItems: [{ payments: [{ amount: 100 }], acts: [{ amount: 50 }] }],
  },
  editFallbackTitle: "Fallback",
  totalBudget: 1200,
  totalSpent: 200,
  normDep: (dep) => dep,
});
assert.equal(modalEditState.title, "Modal Task");
assert.equal(modalEditState.hasItems, true);
assert.equal(modalEditState.budgetValue, 1200);
assert.equal(modalEditState.modalDeps.length, 1);
const modalSaveModel = buildTaskModalSaveModel({
  name: "Saved Task",
  cat: 2,
  phases: [{ ms: 0, ws: 0, me: 1, we: 1, prog: 50, dsExact: "2026-01-01", deExact: "2026-02-01" }],
  deps: [{ id: "dep-1", type: "FS" }],
  costItems: [{ payments: [{ amount: 100 }], acts: [{ amount: 40 }] }],
  contractsOverrideBudget: true,
  manualBudget: 0,
  manualSpent: 0,
  totalBudget: 900,
  totalSpent: 100,
});
assert.equal(modalSaveModel.isValidRange, true);
assert.equal(modalSaveModel.taskPatch.budget, 900);
assert.equal(modalSaveModel.taskPatch.spent, 100);
assert.equal(modalSaveModel.taskPatch.phases, null);
const appliedTaskSave = applyTaskSave({
  tasks: [{ id: "t-1", n: 1, name: "Old", notes: [] }],
  editIdx: null,
  nextN: 2,
  taskPatch: modalSaveModel.taskPatch,
  newTaskId: "t-2",
});
assert.equal(appliedTaskSave.isEdit, false);
assert.equal(appliedTaskSave.savedTask.id, "t-2");
assert.equal(appliedTaskSave.nextN, 3);
const removedTaskState = removeTaskAt(appliedTaskSave.tasks, 1);
assert.equal(removedTaskState.removedTask?.id, "t-2");
assert.equal(removedTaskState.tasks.length, 1);
const clonedNotes = cloneTaskNotes([{ text: "Hello", author: "Ihor", date: "2026-05-23", history: [{ action: "edit", text: "Prev", author: "Ihor", date: "2026-05-22" }] }]);
assert.equal(clonedNotes.length, 1);
assert.equal(clonedNotes[0]?.history?.length, 1);
const addedNotes = addTaskNote({
  notes: [],
  id: 1,
  text: "New note",
  author: "Ihor",
  date: "2026-05-23",
});
assert.equal(addedNotes.length, 1);
assert.equal(addedNotes[0]?.text, "New note");
const editedNotes = editTaskNote({
  notes: addedNotes,
  index: 0,
  text: "Updated note",
  author: "Ihor",
  date: "2026-05-24",
});
assert.equal(editedNotes[0]?.text, "Updated note");
assert.equal(editedNotes[0]?.history?.length, 1);
const deletedNotes = deleteTaskNote({
  notes: editedNotes,
  index: 0,
  author: "Ihor",
  date: "2026-05-25",
  deletedPlaceholderText: "[deleted]",
});
assert.equal(deletedNotes[0]?.deleted, true);
assert.equal(countVisibleTaskNotes(deletedNotes), 0);
const clonedCats = cloneCategoryDrafts([{ name: "General", color: "#111111" }]);
assert.equal(clonedCats.length, 1);
const nextCats = createNextCategoryDraft({
  categories: clonedCats,
  palette: ["#111111", "#222222", "#333333"],
  newCategoryName: "New category",
});
assert.equal(nextCats.length, 2);
assert.equal(nextCats[1]?.name, "New category");
assert.equal(removeCategoryDraftAt(nextCats, 0).length, 1);
assert.equal(isCategoryUsedByTasks([{ n: 1, name: "Task", cat: 1, ms: 0, ws: 0, me: 0, we: 0, prog: 0 }], 1), true);
const projectManagerGroups = buildProjectManagerGroupModel({
  projects: {
    own: { proj: { name: "Own" }, tasks: [{}, {}], _role: "owner", _access: { source: "own" } },
    shared: {
      proj: { name: "Shared" },
      tasks: [{}],
      _role: "viewer",
      _access: {
        source: "shared",
        ownerId: "owner-1",
        ownerName: "Owner Name",
        ownerEmail: "owner@example.com",
        invitedBy: "manager-1",
        invitedByName: "Manager Name",
        invitedByEmail: "manager@example.com",
      },
    },
  },
  currentId: "shared",
  canManageProject: (projectId) => projectId === "own",
  getRoleLabel: (role) => role.toUpperCase(),
  getSharedMetaLine: (access) => access?.source === "shared" ? "Owner · Manager" : "Власний проєкт",
});
assert.equal(projectManagerGroups.own.length, 1);
assert.equal(projectManagerGroups.shared.length, 1);
assert.equal(projectManagerGroups.shared[0]?.isActive, true);
assert.equal(projectManagerGroups.shared[0]?.sharedMetaLine, "Owner · Manager");

const resolvedSyncStatus = resolveSyncStatus(null, {
  loggedIn: true,
  online: true,
  projectSyncState: syncState,
});
assert.equal(resolvedSyncStatus, "warn");

const updatedMeta = buildProjectSnapshotMeta(shell, { _localUpdatedAt: "2026-05-19T12:00:00.000Z" });
assert.equal(updatedMeta._localVersion, 4);
assert.equal(updatedMeta._serverVersion, 2);
assert.equal(updatedMeta._role, "editor");

const initialMeta = buildInitialProjectSnapshotMeta({ _role: "owner" });
assert.equal(initialMeta._localVersion, 1);
assert.equal(initialMeta._serverVersion, 0);
assert.equal(initialMeta._role, "owner");

const normalizedProjects = normalizeBufferedProjectRoles({
  a: { _role: "admin" },
  b: { _role: "viewer" },
});
assert.equal(normalizedProjects.a?._role, "manager");
assert.equal(normalizedProjects.b?._role, "viewer");

const storagePayload = buildStorageBufferPayload({ shell }, "shell", "user-1");
assert.equal(storagePayload.currentId, "shell");
assert.equal(storagePayload._userId, "user-1");

const emptyProject = createEmptyProjectSnapshot({
  name: "  Alpha  ",
  defaults: { sm: 2, sy: 2026, nm: 10 },
  categories: [{ name: "General", color: "#000000" }],
  meta: { _localVersion: 1, _serverVersion: 0 },
});
assert.equal(emptyProject.proj.name, "Alpha");
assert.equal(emptyProject.proj.sm, 2);
assert.equal(emptyProject.tasks.length, 0);

const demoProject = createDemoProjectSnapshot({
  projectName: "Demo",
  startYear: 2027,
  categories: [{ name: "Demo Cat", color: "#ffffff" }],
  tasks: [{ n: 1, name: "Task", cat: 0, ms: 1, ws: 0, me: 2, we: 0, prog: 0 }],
  nextN: 2,
  meta: { _localVersion: 1 },
});
assert.equal(demoProject.proj.name, "Demo");
assert.equal(demoProject.proj.sy, 2027);
assert.equal(demoProject.nextN, 2);

const projectSettingsUpdate = applyProjectSettingsUpdate({
  snapshot: {
    proj: { name: "Project", sm: 5, sy: 2026, nm: 12 },
    cats: [],
    tasks: [{ n: 1, name: "Task", cat: 0, ms: 2, ws: 0, me: 3, we: 0, prog: 0 }],
    nextN: 2,
  },
  name: "Updated Project",
  sm: 3,
  sy: 2026,
  nm: 14,
});
assert.equal(projectSettingsUpdate.after.name, "Updated Project");
assert.equal(projectSettingsUpdate.after.nm, 14);
assert.equal(projectSettingsUpdate.shiftedTasks, true);
assert.equal(projectSettingsUpdate.snapshot.tasks[0]?.ms, 4);
assert.equal(projectSettingsUpdate.snapshot.tasks[0]?.me, 5);

assert.equal(canDeleteProjectCount(1), false);
assert.equal(canDeleteProjectCount(2), true);
assert.equal(resolveNextProjectAfterDeletion(["a", "b", "c"], "b", "b"), "a");
assert.equal(resolveNextProjectAfterDeletion(["a"], "a", "a"), null);

const copiedTask = createCopiedTask({
  task: {
    id: "task-1",
    n: 1,
    name: "Original",
    cat: 0,
    ms: 1,
    ws: 0,
    me: 2,
    we: 0,
    prog: 10,
    notes: [{ text: "keep source clean" }],
    costItems: [{ name: "Material" }],
    deps: [{ id: "other" }],
  },
  nextN: 8,
  newId: "task-copy",
  copiedTaskSuffix: " (copy)",
});
assert.equal(copiedTask.id, "task-copy");
assert.equal(copiedTask.n, 8);
assert.equal(copiedTask.name, "Original (copy)");
assert.equal(copiedTask.notes?.length, 0);
assert.equal(copiedTask.deps?.length, 0);

assert.equal(projectNameExists({ a: { proj: { name: "Alpha" } } }, " alpha "), true);
assert.equal(projectNameExists({ a: { proj: { name: "Alpha" } } }, "Beta"), false);

const uniqueProjectName = resolveUniqueProjectName({
  projects: {
    a: { proj: { name: "Alpha" } },
    b: { proj: { name: "Alpha (copy)" } },
  },
  baseName: "Alpha",
  fallbackName: "Imported project",
  copiedTaskSuffix: " (copy)",
  numberedCopySuffix: (count) => ` (copy ${count})`,
});
assert.equal(uniqueProjectName, "Alpha (copy 2)");

const normalizedBaseline = normalizeImportedBaseline(
  [{ id: "legacy-1", n: 1, prog: 10 }],
  new Map([["legacy-1", "mapped-1"]]),
);
assert.equal(normalizedBaseline?.[0]?.id, "mapped-1");

const importedSnapshot = buildImportedProjectSnapshot({
  data: {
    proj: { name: "Legacy Import", sm: 1, sy: 2026, nm: 12, baseline: [{ id: "legacy-1" }] },
    cats: [{ name: "Imported", color: "#123456" }],
    tasks: [
      {
        id: "legacy-1",
        n: 4,
        name: "Imported Task",
        cat: 0,
        ms: 1,
        ws: 0,
        me: 2,
        we: 0,
        prog: 25,
        deps: [],
        cost_items: [{ name: "Service" }],
      },
    ],
  },
  fallbackProjectName: "Fallback",
  resolvedName: "Resolved Import",
  fallbackCategories: [{ name: "Fallback Cat", color: "#abcdef" }],
  generatedTaskIds: ["task-import-1"],
  meta: { _role: "owner", _localVersion: 1 },
});
assert.equal(importedSnapshot.proj.name, "Resolved Import");
assert.equal(importedSnapshot.tasks[0]?.id, "task-import-1");
assert.equal(importedSnapshot.tasks[0]?.costItems?.[0]?.name, "Service");
assert.equal(importedSnapshot.proj.baseline?.[0]?.id, "task-import-1");
assert.equal(importedSnapshot.nextN, 5);

console.log("Supabase helper verification passed.");
