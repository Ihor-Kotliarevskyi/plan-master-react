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
