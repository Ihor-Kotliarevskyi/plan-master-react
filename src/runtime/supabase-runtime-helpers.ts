import { normalizeProjectRole } from "../domain/permissions";
import type { ProjectRole, ProjectSnapshot } from "../domain/types";
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
  buildBaselineClearDialogModel,
  buildBaselineMissingModel,
  buildBaselinePanelModel,
  buildBaselineSavedToastModel,
} from "../domain/baseline-ui";
import { buildProjectDefaultsPanelModel, buildThemePanelModel } from "../domain/settings-ui";
import { buildAccountSectionModel } from "../domain/account-section-ui";
import {
  buildGanttToolbarLabels,
  buildProjectSelectLabels,
  buildTableLabels,
} from "../domain/render-ui";
import {
  buildHeaderDateText,
  buildLegendItems,
  buildTaskWindowModel,
  buildVisibleYearGroups,
} from "../domain/render";
import { buildAppUiModel } from "../domain/app-ui";
import { buildApiUiModel } from "../domain/api-ui";
import { buildChartsUiModel } from "../domain/charts-ui";
import {
  buildChartColors,
  buildChartData,
  buildChartDefinition,
  buildChartOptions,
  getChartAutoDefaults,
  normalizeChartRenderType,
} from "../domain/charts";
import { buildFinanceUiModel } from "../domain/finance-ui";
import {
  buildFinanceRows,
  buildFinanceSearchText,
  calculateFinanceOverview,
  financeItemTotal,
  financeScopedCostItems,
  financeTaskScope,
  hasFinanceFilters,
  summarizeFinanceDeletion,
} from "../domain/finance";
import { buildPrintUiModel } from "../domain/print-ui";
import {
  getPrintMetrics,
  getPrintPreviewState,
  resolvePrintGanttLayout,
  resolvePrintSections,
  resolvePrintSettings,
} from "../domain/print";
import {
  buildContractorFilterLabels,
  buildContractorSelectionLabels,
  buildContractorSummaryLabels,
  buildContractorTableLabels,
} from "../domain/contractors-ui";
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
} from "../domain/contractors";
import {
  buildContractorBulkDeleteModel,
  buildContractorSummaryModel,
  buildPaymentRegisterCurrentState,
  buildPaymentRegisterListItems,
  buildSavedPaymentRegister,
  findPaymentRegisterById,
  getVisibleDeletableContractorRows,
  hasContractorFilters,
} from "../domain/contractors-panel";
import { buildCostUiModel } from "../domain/costs-ui";
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
} from "../domain/costs";
import { buildGuardedActionLabels, buildGuardToastModel } from "../domain/guard-ui";
import {
  buildDependencyEditorModel,
  buildCategoryEditorModel,
  buildCannotDeleteLastProjectModel,
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
  buildDemoProjectSeedModel,
} from "../domain/modal-ui";
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
} from "../domain/modal";
import {
  applyTaskSave,
  buildTaskModalEditState,
  buildTaskModalSaveModel,
  cloneModalCostItems,
  cloneModalPhasesFromTask,
  removeTaskAt,
} from "../domain/modal-orchestration";
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
} from "../domain/modal-panels";
import {
  buildAuditEntryViewModel,
  buildAuditLogModalModel,
  getAuditActorLabel,
  getAuditEventLabel,
  getAuditSubjectLabel,
} from "../domain/audit-ui";
import {
  buildAuthFlowMessages,
  buildProfileFeedbackMessages,
} from "../domain/user-feedback-ui";
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
import { buildStorageUiModel } from "../domain/storage-ui";
import {
  applyProjectSettingsUpdate,
  canDeleteProjectCount,
  createDemoProjectSnapshot,
  createEmptyProjectSnapshot,
  resolveNextProjectAfterDeletion,
} from "../domain/project-lifecycle";
import {
  buildImportedProjectSnapshot,
  createCopiedTask,
  normalizeImportedBaseline,
  projectNameExists,
  resolveUniqueProjectName,
} from "../domain/project-import";
import {
  mapAccessibleProjectToSnapshotShell,
  mapActivityLogRow,
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
import {
  buildProjectCreateSuccessSnapshot,
  buildProjectSyncSuccessSnapshot,
  buildSupabaseProjectSnapshot,
  mergeAccessibleProjectsIntoLocalState,
  resolveCurrentProjectId,
  resolveProjectLoadDecision,
} from "../services/supabase/runtime";
import {
  buildAuthRedirectUrl,
  buildSupabaseLoginRequest,
  buildSupabaseProfileSelectRequest,
  buildSupabaseProfileUpdatePayload,
  buildSupabaseRegisterRequest,
} from "../services/supabase/account-runtime";
import {
  buildHydratedAuthState,
  buildLogoutSyncDecision,
  resetSupabaseAuthState,
  resolveSupabaseAuthEventPlan,
} from "../services/supabase/auth-runtime";
import {
  bindProjectCreateTasksRpcRequest,
  buildProjectCreateMutationRequest,
  buildProjectDeleteRequest,
  buildProjectSyncMutationRequest,
  buildProjectTasksRpcRequest,
  resolveLoadedProjectRole,
} from "../services/supabase/project-runtime";
import {
  buildActivityLogReadRequest,
  buildActivityWriteRequest,
  buildShareListFallbackRequest,
  buildShareListRpcRequest,
  buildShareGrantRequest,
  buildShareGrantResult,
  buildShareLookupRequest,
  buildShareRemoveRequest,
  buildShareRoleUpdateRequest,
  buildShareRoleUpdateResult,
  buildShareUpsertOptions,
  normalizeShareGrantInput,
  resolveActivityLogLimit,
  resolveShareTargetUser,
} from "../services/supabase/collaboration-runtime";
import {
  buildSupabaseReadOnlyUiState,
  buildSupabaseShareRoleGuide,
  buildSupabaseShareRoleOptions,
  buildSupabaseRoleUpdatedToast,
  buildSupabaseShareGrantedToast,
  buildSupabaseShareModalState,
  buildSupabaseShareRemovedToast,
  buildSupabaseSyncIndicatorPlan,
} from "../services/supabase/ui-runtime";
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
  buildRuntimeResolveProjectLoadDecision: resolveProjectLoadDecision,
  buildRuntimeResolveCurrentProjectId: resolveCurrentProjectId,
  buildRuntimeAuthRedirectUrl: buildAuthRedirectUrl,
  buildRuntimeSupabaseRegisterRequest: buildSupabaseRegisterRequest,
  buildRuntimeSupabaseLoginRequest: buildSupabaseLoginRequest,
  buildRuntimeSupabaseProfileSelectRequest: buildSupabaseProfileSelectRequest,
  buildRuntimeSupabaseProfileUpdatePayload: buildSupabaseProfileUpdatePayload,
  buildRuntimeResetSupabaseAuthState: resetSupabaseAuthState,
  buildRuntimeLogoutSyncDecision: buildLogoutSyncDecision,
  buildRuntimeHydratedAuthState: buildHydratedAuthState,
  buildRuntimeResolveSupabaseAuthEventPlan: resolveSupabaseAuthEventPlan,
  buildRuntimeSupabaseShareModalState: buildSupabaseShareModalState,
  buildRuntimeSupabaseShareRoleOptions: buildSupabaseShareRoleOptions,
  buildRuntimeSupabaseShareRoleGuide: buildSupabaseShareRoleGuide,
  buildRuntimeSupabaseReadOnlyUiState: buildSupabaseReadOnlyUiState,
  buildRuntimeSupabaseRoleUpdatedToast: buildSupabaseRoleUpdatedToast,
  buildRuntimeSupabaseShareGrantedToast: buildSupabaseShareGrantedToast,
  buildRuntimeSupabaseShareRemovedToast: buildSupabaseShareRemovedToast,
  buildRuntimeSupabaseSyncIndicatorPlan: buildSupabaseSyncIndicatorPlan,
  buildRuntimeSupabaseActivityWriteRequest: buildActivityWriteRequest,
  buildRuntimeSupabaseActivityLogReadRequest: buildActivityLogReadRequest,
  buildRuntimeNormalizeShareGrantInput: normalizeShareGrantInput,
  buildRuntimeBuildShareLookupRequest: buildShareLookupRequest,
  buildRuntimeResolveShareTargetUser: resolveShareTargetUser,
  buildRuntimeBuildShareGrantRequest: buildShareGrantRequest,
  buildRuntimeBuildShareGrantResult: buildShareGrantResult,
  buildRuntimeBuildShareUpsertOptions: buildShareUpsertOptions,
  buildRuntimeBuildShareRoleUpdateRequest: buildShareRoleUpdateRequest,
  buildRuntimeBuildShareRoleUpdateResult: buildShareRoleUpdateResult,
  buildRuntimeBuildShareListRpcRequest: buildShareListRpcRequest,
  buildRuntimeBuildShareListFallbackRequest: buildShareListFallbackRequest,
  buildRuntimeBuildShareRemoveRequest: buildShareRemoveRequest,
  buildRuntimeResolveActivityLogLimit: resolveActivityLogLimit,
  buildRuntimeResolveLoadedProjectRole: resolveLoadedProjectRole,
  buildRuntimeProjectTasksRpcRequest: buildProjectTasksRpcRequest,
  buildRuntimeProjectSyncMutationRequest: buildProjectSyncMutationRequest,
  buildRuntimeProjectCreateMutationRequest: buildProjectCreateMutationRequest,
  buildRuntimeBindProjectCreateTasksRpcRequest: bindProjectCreateTasksRpcRequest,
  buildRuntimeProjectDeleteRequest: buildProjectDeleteRequest,
  mapSupabaseTaskRow: mapTaskRowToTask,
  buildSupabaseProjectSnapshot: (
    localId: string,
    projectRow: ProjectRow,
    taskRows: TaskRow[],
    previousSnapshot: AnyRecord | undefined,
    role: ProjectRole,
  ) => buildSupabaseProjectSnapshot(localId, projectRow, taskRows, previousSnapshot as ProjectSnapshot | undefined, role, getStoredRole),
  buildRuntimeProjectSyncSuccessSnapshot: buildProjectSyncSuccessSnapshot,
  buildRuntimeProjectCreateSuccessSnapshot: buildProjectCreateSuccessSnapshot,
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
  buildRuntimeStorageUiModel: buildStorageUiModel,
  buildRuntimeProjectSettingsUpdate: applyProjectSettingsUpdate,
  buildRuntimeCreateEmptyProjectSnapshot: createEmptyProjectSnapshot,
  buildRuntimeCreateDemoProjectSnapshot: createDemoProjectSnapshot,
  canRuntimeDeleteProjectCount: canDeleteProjectCount,
  resolveRuntimeNextProjectAfterDeletion: resolveNextProjectAfterDeletion,
  buildRuntimeCopiedTask: createCopiedTask,
  checkRuntimeProjectNameExists: projectNameExists,
  buildRuntimeUniqueProjectName: resolveUniqueProjectName,
  buildRuntimeNormalizeImportedBaseline: normalizeImportedBaseline,
  buildRuntimeImportedProjectSnapshot: buildImportedProjectSnapshot,
  normalizeRuntimeBufferedProjectRoles: normalizeBufferedProjectRoles,
  getRuntimeProjectRoleLabel: getProjectRoleLabel,
  buildRuntimeAccountSyncPanelModel: buildAccountSyncPanelModel,
  buildRuntimeProjectSelectLabels: buildProjectSelectLabels,
  buildRuntimeGanttToolbarLabels: buildGanttToolbarLabels,
  buildRuntimeTableLabels: buildTableLabels,
  buildRuntimeHeaderDateText: buildHeaderDateText,
  buildRuntimeLegendItems: buildLegendItems,
  buildRuntimeVisibleYearGroups: buildVisibleYearGroups,
  buildRuntimeTaskWindowModel: buildTaskWindowModel,
  buildRuntimeAppUiModel: buildAppUiModel,
  buildRuntimeApiUiModel: buildApiUiModel,
  buildRuntimeChartsUiModel: buildChartsUiModel,
  buildRuntimeChartData: buildChartData,
  buildRuntimeChartColors: buildChartColors,
  buildRuntimeChartOptions: buildChartOptions,
  buildRuntimeChartDefinition: buildChartDefinition,
  buildRuntimeChartAutoDefaults: getChartAutoDefaults,
  buildRuntimeNormalizeChartRenderType: normalizeChartRenderType,
  buildRuntimeFinanceUiModel: buildFinanceUiModel,
  buildRuntimeHasFinanceFilters: hasFinanceFilters,
  buildRuntimeFinanceItemTotal: financeItemTotal,
  buildRuntimeFinanceScopedCostItems: financeScopedCostItems,
  buildRuntimeFinanceTaskScope: financeTaskScope,
  buildRuntimeFinanceSearchText: buildFinanceSearchText,
  buildRuntimeSummarizeFinanceDeletion: summarizeFinanceDeletion,
  buildRuntimeCalculateFinanceOverview: calculateFinanceOverview,
  buildRuntimeBuildFinanceRows: buildFinanceRows,
  buildRuntimePrintUiModel: buildPrintUiModel,
  buildRuntimeResolvePrintSections: resolvePrintSections,
  buildRuntimeResolvePrintSettings: resolvePrintSettings,
  buildRuntimeGetPrintMetrics: getPrintMetrics,
  buildRuntimeGetPrintPreviewState: getPrintPreviewState,
  buildRuntimeResolvePrintGanttLayout: resolvePrintGanttLayout,
  buildRuntimeContractorSummaryLabels: buildContractorSummaryLabels,
  buildRuntimeContractorFilterLabels: buildContractorFilterLabels,
  buildRuntimeContractorSelectionLabels: buildContractorSelectionLabels,
  buildRuntimeContractorTableLabels: buildContractorTableLabels,
  buildRuntimeContractorName: contractorName,
  buildRuntimeContractorKey: contractorKey,
  buildRuntimeContractorItemTotal: contractorItemTotal,
  buildRuntimeContractorStatus: contractorStatus,
  buildRuntimeSelectedContractorKeys: selectedContractorKeys,
  buildRuntimeSummarizeContractorBulkDelete: summarizeContractorBulkDelete,
  buildRuntimeContractorRows: buildContractorRows,
  buildRuntimePaymentRegisterRowsFromContractorRows: paymentRegisterRowsFromContractorRows,
  buildRuntimePaymentRegisterTotal: paymentRegisterTotal,
  buildRuntimePaymentRegisterFiltersLabel: paymentRegisterFiltersLabel,
  buildRuntimeContractorSummaryModel: buildContractorSummaryModel,
  buildRuntimeHasContractorFilters: hasContractorFilters,
  buildRuntimeVisibleDeletableContractorRows: getVisibleDeletableContractorRows,
  buildRuntimeContractorBulkDeleteModel: buildContractorBulkDeleteModel,
  buildRuntimePaymentRegisterCurrentState: buildPaymentRegisterCurrentState,
  buildRuntimePaymentRegisterListItems: buildPaymentRegisterListItems,
  buildRuntimeSavedPaymentRegister: buildSavedPaymentRegister,
  buildRuntimeFindPaymentRegisterById: findPaymentRegisterById,
  buildRuntimeCostUiModel: buildCostUiModel,
  buildRuntimeCreateCostItem: createCostItem,
  buildRuntimeCreateCostPayment: createCostPayment,
  buildRuntimeRemoveCostItem: removeCostItem,
  buildRuntimeUpdateCostItemField: updateCostItemField,
  buildRuntimeUpdateCostItemContract: updateCostItemContract,
  buildRuntimeToggleExpandedCostId: toggleExpandedCostId,
  buildRuntimeAddPaymentToCostItem: addPaymentToCostItem,
  buildRuntimeRemovePaymentFromCostItem: removePaymentFromCostItem,
  buildRuntimeUpdateCostPaymentField: updateCostPaymentField,
  buildRuntimeCalculateCostItemTotal: calculateCostItemTotal,
  buildRuntimeCalculateCostSpent: calculateCostSpent,
  buildRuntimeCalculateCostTotals: calculateCostTotals,
  buildRuntimeGuardToastModel: buildGuardToastModel,
  buildRuntimeGuardedActionLabels: buildGuardedActionLabels,
  buildRuntimeAuthFormModel: buildAuthFormModel,
  getRuntimeAuthTabButtonClass: getAuthTabButtonClass,
  buildRuntimeThemeToggleModel: buildThemeToggleModel,
  buildRuntimeUserIdentityModel: buildUserIdentityModel,
  buildRuntimeBaselinePanelModel: buildBaselinePanelModel,
  buildRuntimeBaselineSavedToastModel: buildBaselineSavedToastModel,
  buildRuntimeBaselineClearDialogModel: buildBaselineClearDialogModel,
  buildRuntimeBaselineMissingModel: buildBaselineMissingModel,
  buildRuntimeProjectDefaultsPanelModel: buildProjectDefaultsPanelModel,
  buildRuntimeThemePanelModel: buildThemePanelModel,
  buildRuntimeAccountSectionModel: buildAccountSectionModel,
  buildRuntimeTaskRangeWarningModel: buildTaskRangeWarningModel,
  buildRuntimeTaskDependencyWarningDialogModel: buildTaskDependencyWarningDialogModel,
  buildRuntimeTaskSavedToastModel: buildTaskSavedToastModel,
  buildRuntimeTaskDeleteDialogModel: buildTaskDeleteDialogModel,
  buildRuntimeProjectManagerListModel: buildProjectManagerListModel,
  buildRuntimeDemoProjectDialogModel: buildDemoProjectDialogModel,
  buildRuntimeCreateProjectDialogModel: buildCreateProjectDialogModel,
  buildRuntimeCannotDeleteLastProjectModel: buildCannotDeleteLastProjectModel,
  buildRuntimeDeleteProjectDialogModel: buildDeleteProjectDialogModel,
  buildRuntimeNotesModalModel: buildNotesModalModel,
  buildRuntimeCategoryEditorModel: buildCategoryEditorModel,
  buildRuntimeDependencyEditorModel: buildDependencyEditorModel,
  buildRuntimeDependencyListModalModel: buildDependencyListModalModel,
  buildRuntimeTaskFormPanelModel: buildTaskFormPanelModel,
  buildRuntimeDemoProjectSeedModel: buildDemoProjectSeedModel,
  buildRuntimeSnapToHalfWeek: snapToHalfWeek,
  buildRuntimePhaseToDateStr: phaseToDateStr,
  buildRuntimeDateStrToPhase: dateStrToPhase,
  buildRuntimeProjectMinDate: getProjectMinDate,
  buildRuntimeProjectMaxDate: getProjectMaxDate,
  buildRuntimeWeightedProgress: getWeightedProgress,
  buildRuntimeActivePhaseIndex: getActivePhaseIndex,
  buildRuntimeRemWeeks: remWeeks,
  buildRuntimeTaskCalcModel: buildTaskCalcModel,
  buildRuntimeDependencyListState: buildDependencyListState,
  buildRuntimeCloneModalCostItems: cloneModalCostItems,
  buildRuntimeCloneModalPhasesFromTask: cloneModalPhasesFromTask,
  buildRuntimeTaskModalEditState: buildTaskModalEditState,
  buildRuntimeTaskModalSaveModel: buildTaskModalSaveModel,
  buildRuntimeApplyTaskSave: applyTaskSave,
  buildRuntimeRemoveTaskAt: removeTaskAt,
  buildRuntimeCloneTaskNotes: cloneTaskNotes,
  buildRuntimeAddTaskNote: addTaskNote,
  buildRuntimeEditTaskNote: editTaskNote,
  buildRuntimeDeleteTaskNote: deleteTaskNote,
  buildRuntimeCountVisibleTaskNotes: countVisibleTaskNotes,
  buildRuntimeCloneCategoryDrafts: cloneCategoryDrafts,
  buildRuntimeRemoveCategoryDraftAt: removeCategoryDraftAt,
  buildRuntimeCreateNextCategoryDraft: createNextCategoryDraft,
  buildRuntimeIsCategoryUsedByTasks: isCategoryUsedByTasks,
  buildRuntimeProjectManagerGroupModel: buildProjectManagerGroupModel,
  buildRuntimeAuthFlowMessages: buildAuthFlowMessages,
  buildRuntimeProfileFeedbackMessages: buildProfileFeedbackMessages,
  buildRuntimeSharedProjectMetaText: buildSharedProjectMetaText,
  buildRuntimeSharedProjectMetaLine: buildSharedProjectMetaLine,
  buildRuntimeAccessBannerModel: buildAccessBannerModel,
  getRuntimeAuditEventLabel: getAuditEventLabel,
  getRuntimeAuditSubjectLabel: getAuditSubjectLabel,
  getRuntimeAuditActorLabel: getAuditActorLabel,
  buildRuntimeAuditEntryViewModel: buildAuditEntryViewModel,
  buildRuntimeAuditLogModalModel: buildAuditLogModalModel,
};

Object.assign(globalThis, runtimeHelpers);
