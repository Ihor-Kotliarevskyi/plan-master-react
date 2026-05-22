import assert from "node:assert/strict";

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
import { buildAppUiModel } from "../src/domain/app-ui";
import { buildApiUiModel } from "../src/domain/api-ui";
import { buildChartsUiModel } from "../src/domain/charts-ui";
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
  canDeleteProjectCount,
  createDemoProjectSnapshot,
  createEmptyProjectSnapshot,
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
