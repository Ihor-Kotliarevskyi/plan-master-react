/* Generated from src/runtime/supabase-runtime-helpers.ts. Do not edit manually. */
"use strict";
(() => {
  // src/domain/permissions.ts
  var PROJECT_ROLES = {
    OWNER: "owner",
    MANAGER: "manager",
    EDITOR: "editor",
    VIEWER: "viewer"
  };
  var PROJECT_ROLE_LABELS = {
    owner: "Власник",
    manager: "Менеджер",
    editor: "Редактор",
    viewer: "Перегляд"
  };
  var PROJECT_ROLE_HINTS = {
    owner: "Повний доступ до проєкту, ролей і змін.",
    manager: "Може змінювати проєкт і керувати доступом користувачів.",
    editor: "Може редагувати задачі, але не керує доступом і налаштуваннями проєкту.",
    viewer: "Може лише переглядати проєкт без внесення змін."
  };
  var SHAREABLE_PROJECT_ROLES = [
    PROJECT_ROLES.VIEWER,
    PROJECT_ROLES.EDITOR,
    PROJECT_ROLES.MANAGER
  ];
  function normalizeProjectRole(role, fallbackRole = PROJECT_ROLES.VIEWER) {
    if (role === "admin") return PROJECT_ROLES.MANAGER;
    if (role === PROJECT_ROLES.OWNER) return PROJECT_ROLES.OWNER;
    if (role === PROJECT_ROLES.MANAGER) return PROJECT_ROLES.MANAGER;
    if (role === PROJECT_ROLES.EDITOR) return PROJECT_ROLES.EDITOR;
    if (role === PROJECT_ROLES.VIEWER) return PROJECT_ROLES.VIEWER;
    return fallbackRole;
  }
  function getProjectRoleHint(role) {
    return PROJECT_ROLE_HINTS[normalizeProjectRole(role)];
  }

  // src/domain/project-access.ts
  function isSharedProjectEntry(projectSnapshot) {
    if (!projectSnapshot) return false;
    return projectSnapshot._access?.source === "shared" || normalizeProjectRole(projectSnapshot._role || "owner") !== "owner";
  }
  function groupProjectEntriesByAccess(entries) {
    const own = [];
    const shared = [];
    for (const entry of entries || []) {
      const [, projectSnapshot] = entry;
      (isSharedProjectEntry(projectSnapshot) ? shared : own).push(entry);
    }
    return { own, shared };
  }
  function getSharedProjectLabels(accessMeta) {
    return {
      isShared: accessMeta?.source === "shared",
      ownerLabel: accessMeta?.ownerName || accessMeta?.ownerEmail || "",
      invitedByLabel: accessMeta?.invitedByName || accessMeta?.invitedByEmail || ""
    };
  }

  // src/domain/access-ui.ts
  function getProjectRoleLabel(role) {
    const normalizedRole = normalizeProjectRole(role);
    return PROJECT_ROLE_LABELS[normalizedRole] || normalizedRole;
  }
  function buildSharedProjectMetaText(accessMeta) {
    const labels = getSharedProjectLabels(accessMeta || null);
    if (!labels.isShared) return "";
    return [labels.ownerLabel, labels.invitedByLabel].filter(Boolean).join(" · ");
  }
  function buildSharedProjectMetaLine(accessMeta) {
    const labels = getSharedProjectLabels(accessMeta || null);
    if (!labels.isShared) return "Власний проєкт";
    const ownerText = labels.ownerLabel ? `Власник: ${labels.ownerLabel}` : "";
    const invitedByText = labels.invitedByLabel ? `Поділився: ${labels.invitedByLabel}` : "";
    return [ownerText, invitedByText].filter(Boolean).join(" · ");
  }
  function buildAccessBannerModel(role, accessMeta) {
    const normalizedRole = normalizeProjectRole(role, "owner");
    return {
      shouldShow: normalizedRole !== "owner",
      role: normalizedRole,
      roleLabel: getProjectRoleLabel(normalizedRole),
      roleHint: getProjectRoleHint(normalizedRole),
      sharedMetaText: buildSharedProjectMetaText(accessMeta || null)
    };
  }

  // src/domain/account-ui.ts
  function buildAccountSyncPanelModel(projectSyncState, currentRole, fallbackProjectName = "-") {
    const projectName = projectSyncState.snap?.proj?.name || fallbackProjectName || "-";
    return {
      roleLabel: getProjectRoleLabel(currentRole),
      projectName,
      hasServerCopyText: projectSyncState.hasServerCopy ? "yes" : "no",
      localVersionText: String(projectSyncState.localVersion ?? 0),
      serverVersionText: String(projectSyncState.serverVersion ?? 0),
      updatedAtText: projectSyncState.updatedAt || ""
    };
  }

  // src/domain/auth-ui.ts
  function buildAuthFormModel(tab) {
    const isLogin = tab === "login";
    return {
      tab,
      isLogin,
      hintText: "Sign in to save projects in the cloud and access them from any device.",
      loginTabLabel: "Sign in",
      registerTabLabel: "Register",
      nameLabel: "Name",
      namePlaceholder: "Your name",
      emailLabel: "Email",
      emailPlaceholder: "example@mail.com",
      passwordLabel: "Password",
      passwordPlaceholder: "Minimum 6 characters",
      submitLabel: isLogin ? "Sign in" : "Register"
    };
  }
  function getAuthTabButtonClass(tab, activeTab) {
    return "btn btn-sm" + (tab === activeTab ? " btn-acc" : "");
  }

  // src/domain/profile-ui.ts
  function buildThemeToggleModel(theme) {
    const normalizedTheme = theme === "dark" ? "dark" : "light";
    return {
      theme: normalizedTheme,
      icon: normalizedTheme === "dark" ? "sun" : "moon",
      label: normalizedTheme === "dark" ? "Light" : "Dark"
    };
  }
  function buildUserIdentityModel(input, fallbackName = "Profile") {
    const displayName = (input.name || "").trim() || fallbackName;
    const emailText = (input.email || "").trim();
    return {
      displayName,
      emailText,
      initial: (displayName || "?")[0].toUpperCase(),
      avatarUrl: input.avatar || null,
      themeToggle: buildThemeToggleModel(input.theme)
    };
  }

  // src/domain/baseline-ui.ts
  function buildBaselinePanelModel(options) {
    const savedDate = options.baselineDate || "-";
    return {
      sectionTitle: "Baseline",
      hasBaseline: options.hasBaseline,
      savedLabel: `Saved: ${savedDate}`,
      toggleLabel: options.showBaseline ? "Hide" : "Show",
      saveActionLabel: options.hasBaseline ? "Overwrite" : "Save baseline",
      deleteActionLabel: "Delete",
      emptyHint: "Baseline is not saved yet. Save the current task positions to compare plan vs actual later.",
      showBaseline: options.showBaseline
    };
  }

  // src/domain/settings-ui.ts
  function buildProjectDefaultsPanelModel() {
    return {
      sectionTitle: "Project defaults",
      startMonthLabel: "Start month",
      startYearLabel: "Start year",
      durationLabel: "Duration (months)"
    };
  }
  function buildThemePanelModel() {
    return {
      sectionTitle: "Appearance",
      themeLabel: "Theme"
    };
  }

  // src/domain/account-section-ui.ts
  function buildAccountSectionModel() {
    return {
      sectionTitle: "Cloud account",
      emailLabel: "Email",
      logoutLabel: "Log out",
      auditLogLabel: "Activity log",
      projectLabel: "Project",
      roleLabel: "Role",
      cloudCopyLabel: "Cloud copy",
      localVersionLabel: "Local version",
      serverVersionLabel: "Server version",
      lastLocalChangeLabel: "Last local change"
    };
  }

  // src/domain/render-ui.ts
  function buildProjectSelectLabels() {
    return {
      ownGroupLabel: "Мої проєкти",
      sharedGroupLabel: "Розшарені",
      sharedRoleSeparator: " · "
    };
  }
  function buildGanttToolbarLabels() {
    return {
      searchPlaceholder: "Пошук по назві...",
      clearSearchTitle: "Очистити пошук",
      contractorLabel: "Контрагент",
      allContractorsLabel: "Усі контрагенти",
      paymentLabel: "Оплати",
      allPaymentsLabel: "Усі оплати",
      debtLabel: "Є залишок",
      paidLabel: "Оплачено",
      overpaidLabel: "Переплата",
      unpaidLabel: "Без оплат",
      hasPaymentsLabel: "Є платежі",
      noPaymentsLabel: "Немає платежів",
      resetFiltersTitle: "Скинути фільтри графіка",
      criticalPathLabel: "Критичний шлях",
      dependencyArrowsTitle: "Відображати стрілки залежностей між роботами",
      dependencyArrowsLabel: "Залежності",
      dependencyListTitle: "Список усіх залежностей проєкту",
      dependencyListLabel: "Список",
      groupByCategoryTitle: "Групувати за категорією",
      groupByCategoryLabel: "Групи",
      overdueLabel: "Прострочені",
      zoomOutTitle: "Зменшити масштаб",
      zoomInTitle: "Збільшити масштаб",
      monoBarTitle: "Монохромний режим барів (для друку)",
      monoBarColorTitle: "Колір барів"
    };
  }
  function buildTableLabels() {
    return {
      reorderTitle: "Перетягни для зміни порядку",
      workTypeHeader: "Вид робіт",
      addTaskTitle: "Додати роботу",
      addTaskLabel: "+ Робота",
      notesTitle: "Нотатки",
      hidePastShowTitle: "Показати минулі тижні",
      hidePastHideTitle: "Сховати минулі тижні",
      groupDoneLabel: (done, total, budgetText) => `${done}/${total} виконано${budgetText ? " · " + budgetText : ""}`,
      copyTaskTitle: "Копіювати роботу",
      notesCountLabel: (count) => `${count} нотаток`,
      notesDefaultLabel: "Нотатки",
      phaseCountTitle: (count) => `${count} фаз`,
      phaseBarTitle: (index, progress) => `Фаза ${index + 1}: ${progress}%`
    };
  }

  // src/domain/modal-ui.ts
  function buildTaskRangeWarningModel() {
    return {
      title: "Невірний діапазон",
      text: "Початок не може бути після кінця."
    };
  }
  function buildTaskDependencyWarningDialogModel() {
    return {
      title: "Порушення залежностей",
      confirmButtonText: "Зберегти",
      cancelButtonText: "Повернутися"
    };
  }
  function buildTaskSavedToastModel(isEdit) {
    return {
      title: isEdit ? "Роботу оновлено" : "Роботу додано"
    };
  }
  function buildTaskDeleteDialogModel(taskName) {
    return {
      title: "Видалити роботу?",
      confirmButtonText: "Видалити",
      confirmButtonColor: "#c42b2b",
      cancelButtonText: "Скасувати"
    };
  }
  function buildProjectManagerListModel() {
    return {
      ownGroupTitle: "Мої проєкти",
      sharedGroupTitle: "Розшарені проєкти",
      ownProjectMeta: "Власний проєкт",
      tasksCountLabel: (count) => `${count} робіт`,
      deleteTitle: "Видалити"
    };
  }
  function buildDemoProjectDialogModel() {
    return {
      title: "Завантажити демо-проєкт?",
      html: `<div class="swal-info-text">Буде створено проєкт «Ремонт офісу» з прикладом задач, категорій та бюджету.<br><br>Ваші поточні проєкти залишаться без змін.</div>`,
      confirmButtonText: "Завантажити",
      cancelButtonText: "Скасувати",
      loadedToastTitle: "Демо-проєкт завантажено"
    };
  }
  function buildCreateProjectDialogModel() {
    return {
      title: "Новий проєкт",
      inputLabel: "Назва проєкту",
      inputValue: "Новий проєкт",
      confirmButtonText: "Створити",
      cancelButtonText: "Скасувати",
      inputRequiredMessage: "Введіть назву"
    };
  }
  function buildCannotDeleteLastProjectModel() {
    return {
      title: "Неможливо видалити",
      text: "Має залишатися хоча б один проєкт."
    };
  }
  function buildDeleteProjectDialogModel(projectName) {
    return {
      title: "Видалити проєкт?",
      html: `«${projectName}»<br><small>Цю дію неможливо скасувати.</small>`,
      confirmButtonText: "Видалити",
      confirmButtonColor: "#c42b2b",
      cancelButtonText: "Скасувати"
    };
  }
  function buildNotesModalModel() {
    return {
      emptyStateText: "Нотаток поки немає",
      countTitle: (count) => `${count} нотаток`,
      defaultTitle: "Нотатки",
      unknownAuthorLabel: "—",
      editButtonLabel: "Редагувати",
      deleteButtonLabel: "Видалити",
      saveButtonLabel: "Зберегти",
      cancelButtonLabel: "Скасувати",
      deletedHistoryLabel: "🗑 видалено",
      editedHistoryLabel: "✏ змінено",
      deletedPlaceholderText: "[видалено]",
      defaultAuthorLabel: "Користувач",
      deleteDialogTitle: "Видалити нотатку?",
      deleteDialogConfirmButtonText: "Видалити",
      deleteDialogConfirmButtonColor: "#c42b2b",
      deleteDialogCancelButtonText: "Скасувати"
    };
  }
  function buildCategoryEditorModel() {
    return {
      accessDeniedTitle: "У вас немає прав на зміну категорій",
      namePlaceholder: "Назва категорії",
      swatchTitle: "Вибрати колір",
      deleteTitle: "Видалити",
      colorCustomLabel: "Свій колір:",
      deleteInUseTitle: "Категорія використовується",
      deleteInUseText: "Є роботи з цією категорією. Видалити?",
      deleteConfirmButtonText: "Видалити",
      deleteConfirmButtonColor: "#c42b2b",
      deleteCancelButtonText: "Скасувати",
      newCategoryName: "Нова категорія"
    };
  }
  function buildDependencyListModalModel() {
    return {
      emptyFilteredText: "Немає залежностей вибраного типу",
      emptyProjectText: "У проєкті немає залежностей між роботами",
      allFilterLabel: (count) => `Всі (${count})`,
      fsFilterLabel: (count) => `FS (${count})`,
      ssFilterLabel: (count) => `SS (${count})`,
      ffFilterLabel: (count) => `FF (${count})`,
      countLabel: (filteredCount, totalCount) => filteredCount === totalCount ? `${totalCount}` : `${filteredCount} з ${totalCount}`,
      rowTitle: "Клік — підсвітити ланцюжок на графіку",
      predecessorHeader: "Попередник",
      typeHeader: "Тип",
      successorHeader: "Наступник",
      criticalPathTitle: "Критичний шлях",
      criticalRowTitle: "Критична залежність"
    };
  }
  function buildDependencyEditorModel() {
    return {
      deleteBadgeLabel: "Видалити",
      independentLabel: "Незал.",
      finishStartTip: "Після завершення",
      startStartTip: "Після початку + %",
      independentTip: "Незалежний зв'язок",
      minThresholdLabel: "Мін.:",
      dropdownFallbackLabel: "#?"
    };
  }
  function buildTaskFormPanelModel() {
    return {
      newTaskTitle: "Нова робота",
      editTaskFallbackTitle: "Редагувати роботу",
      newTaskNameFallback: "Нова робота",
      fillCostHint: "Заповніть вартість для розрахунку",
      totalProgressLabel: "Загальне",
      durationLabel: "Терм.",
      progressLabel: "Вик.",
      budgetRemainderLabel: "Залишок",
      weeksLabel: "Тижнів",
      weeklyRateLabel: "Ставка",
      weeklyRateUnit: "грн/тижд."
    };
  }
  function buildDemoProjectSeedModel() {
    return {
      projectName: "Ремонт офісу (демо)"
    };
  }

  // src/domain/audit-ui.ts
  var AUDIT_EVENT_LABELS = {
    "task.created": "Created task",
    "task.updated": "Updated task",
    "task.deleted": "Deleted task",
    "project.settings_updated": "Updated project settings",
    "project.baseline_saved": "Saved baseline",
    "project.baseline_cleared": "Cleared baseline",
    "share.granted": "Granted access",
    "share.role_updated": "Updated access role",
    "share.revoked": "Revoked access"
  };
  function getAuditEventLabel(eventType) {
    if (!eventType) return "Event";
    return AUDIT_EVENT_LABELS[eventType] || eventType;
  }
  function getAuditSubjectLabel(entry, fallbackProjectName = "Current project") {
    if (!entry) return "-";
    if (entry.entityType === "task") {
      const taskName = typeof entry.payload?.taskName === "string" ? entry.payload.taskName : "";
      const taskN = typeof entry.payload?.taskN === "number" || typeof entry.payload?.taskN === "string" ? entry.payload.taskN : "?";
      return taskName || `Task #${taskN}`;
    }
    if (entry.entityType === "share") {
      const email = typeof entry.payload?.email === "string" ? entry.payload.email : "";
      return email || entry.entityId || "Shared access";
    }
    return fallbackProjectName || "Current project";
  }
  function getAuditActorLabel(entry) {
    if (!entry) return "-";
    return entry.actorName || entry.actorEmail || "-";
  }
  function buildAuditEntryViewModel(entry, fallbackProjectName) {
    return {
      eventLabel: getAuditEventLabel(entry.eventType),
      actorLabel: getAuditActorLabel(entry),
      subjectLabel: getAuditSubjectLabel(entry, fallbackProjectName)
    };
  }
  function buildAuditLogModalModel() {
    return {
      accessDeniedTitle: "У вас немає прав на перегляд журналу змін",
      loadFailedTitle: "Не вдалося завантажити журнал",
      missingMigrationHint: "Схоже, ще не виконано міграцію 003_activity_log_foundation.sql.",
      retryHint: "Спробуйте пізніше",
      actorCaption: "Хто",
      subjectCaption: "Об'єкт",
      emptyHint: "Для поточного проєкту ще немає зафіксованих подій.",
      modalTitle: "Журнал змін",
      closeButtonLabel: "Закрити"
    };
  }

  // src/domain/user-feedback-ui.ts
  function buildAuthFlowMessages() {
    return {
      nameRequired: "Введіть ім'я",
      loginSuccessTitle: "Вхід виконано",
      localDataFoundTitle: "Знайдено локальні дані",
      localProjectIntro: "Ви працювали без акаунту. Знайдено локальний проєкт:",
      modifiedLabel: "Змінено",
      localDataQuestion: "Що зробити з локальними даними?",
      loadCloudConfirmLabel: "☁ Завантажити з хмари",
      saveLocalToCloudLabel: "📱 Зберегти локальні в хмару",
      projectsBootstrapWarningTitle: "Вхід виконано, але проєкти не завантажились",
      projectsBootstrapWarningText: "Перевірте стан бази даних і спробуйте оновити сторінку",
      syncEnabledTitle: "Вітаємо! ☁ Синхронізацію увімкнено"
    };
  }
  function buildProfileFeedbackMessages() {
    return {
      profileSavedTitle: "Профіль збережено",
      avatarTooLargeTitle: "Файл завеликий",
      avatarTooLargeText: "Максимум 2 МБ."
    };
  }

  // src/domain/sync.ts
  var SYNC_BADGE_LABELS = {
    offline: "Синхронізація вимкнена",
    ok: "Синхронізація увімкнена",
    syncing: "Триває синхронізація",
    error: "Помилка синхронізації",
    warn: "Є локальні зміни, що ще не відправлені"
  };
  function getProjectSyncState(snapshot) {
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
      updatedAt: safeSnapshot?._localUpdatedAt || null
    };
  }
  function getSyncBadge(loggedIn, syncStatus, projectSyncState) {
    if (!loggedIn) return { status: "offline", label: SYNC_BADGE_LABELS.offline };
    if (syncStatus === "error") return { status: "error", label: SYNC_BADGE_LABELS.error };
    if (syncStatus === "syncing") return { status: "syncing", label: SYNC_BADGE_LABELS.syncing };
    if (projectSyncState.hasLocalChanges) return { status: "warn", label: SYNC_BADGE_LABELS.warn };
    return { status: "ok", label: SYNC_BADGE_LABELS.ok };
  }
  function resolveSyncStatus(preferredStatus, options) {
    if (preferredStatus) return preferredStatus;
    if (!options.loggedIn) return "offline";
    if (!options.online) return "warn";
    return options.projectSyncState.hasLocalChanges ? "warn" : "ok";
  }

  // src/domain/storage.ts
  function buildProjectSnapshotMeta(previousSnapshot, overrides = {}) {
    return {
      _localUpdatedAt: overrides._localUpdatedAt || (/* @__PURE__ */ new Date()).toISOString(),
      _localVersion: overrides._localVersion ?? (previousSnapshot?._localVersion || 0) + 1,
      _serverVersion: overrides._serverVersion ?? (previousSnapshot?._serverVersion || 0),
      ...previousSnapshot?._serverId ? { _serverId: previousSnapshot._serverId } : {},
      ...previousSnapshot?._role ? { _role: normalizeProjectRole(previousSnapshot._role, previousSnapshot._role) } : {},
      ...previousSnapshot?._access ? { _access: previousSnapshot._access } : {},
      ...overrides
    };
  }
  function buildInitialProjectSnapshotMeta(overrides = {}) {
    return {
      _localUpdatedAt: overrides._localUpdatedAt || (/* @__PURE__ */ new Date()).toISOString(),
      _localVersion: overrides._localVersion ?? 1,
      _serverVersion: overrides._serverVersion ?? 0,
      ...overrides
    };
  }
  function buildStorageBufferPayload(allProjects, currentId, userId) {
    return {
      allProjects,
      currentId,
      _userId: userId
    };
  }
  function normalizeBufferedProjectRoles(allProjects) {
    Object.values(allProjects || {}).forEach((projectSnapshot) => {
      if (projectSnapshot && projectSnapshot._role) {
        projectSnapshot._role = normalizeProjectRole(
          projectSnapshot._role,
          projectSnapshot._role
        );
      }
    });
    return allProjects;
  }

  // src/domain/audit.ts
  function formatAuditEntry(entry) {
    return {
      ...entry,
      payload: entry.payload || {}
    };
  }

  // src/services/supabase/mappers.ts
  function mapAccessibleProjectAccess(row) {
    return {
      source: row.source,
      ownerId: row.owner_id ?? null,
      ownerName: row.owner_name ?? "",
      ownerEmail: row.owner_email ?? "",
      invitedBy: row.invited_by ?? null,
      invitedByName: row.invited_by_name ?? "",
      invitedByEmail: row.invited_by_email ?? ""
    };
  }
  function mapAccessibleProjectToSnapshotShell(row, options) {
    const role = normalizeProjectRole(options?.role ?? row.role ?? "viewer");
    return {
      proj: {
        name: row.name,
        sm: row.sm,
        sy: row.sy,
        nm: row.nm
      },
      cats: [],
      tasks: [],
      nextN: 1,
      _serverId: row.project_id,
      _role: role,
      _access: mapAccessibleProjectAccess(row),
      _localVersion: options?.localVersion ?? 0,
      _serverVersion: options?.serverVersion ?? 0,
      _localUpdatedAt: options?.localUpdatedAt
    };
  }
  function mapTaskRowToTask(row) {
    return {
      id: row.id,
      n: row.n,
      order: row.order,
      name: row.name,
      cat: row.cat,
      ms: row.ms,
      ws: row.ws,
      me: row.me,
      we: row.we,
      prog: row.prog,
      budget: Number(row.budget) || 0,
      spent: Number(row.spent) || 0,
      deps: row.deps ?? [],
      phases: row.phases ?? null,
      costItems: row.cost_items ?? void 0,
      notes: row.notes ?? []
    };
  }
  function mapProjectRowToSnapshot(project, taskRows, role, previousMeta) {
    const safeLocalVersion = previousMeta?._localVersion ?? 0;
    const safeServerVersion = previousMeta?._serverVersion ?? safeLocalVersion;
    return {
      proj: {
        name: project.name,
        sm: project.sm,
        sy: project.sy,
        nm: project.nm,
        baseline: project.baseline ?? void 0,
        baselineDate: project.baseline_date
      },
      cats: Array.isArray(project.cats) ? project.cats : [],
      tasks: taskRows.map(mapTaskRowToTask),
      nextN: project.next_n || 1,
      _serverId: project.id,
      _role: normalizeProjectRole(role),
      _access: previousMeta?._access,
      _localVersion: safeLocalVersion,
      _serverVersion: safeServerVersion,
      _localUpdatedAt: previousMeta?._localUpdatedAt
    };
  }
  function mapProjectShareRow(row) {
    return {
      id: row.id,
      role: normalizeProjectRole(row.role),
      user: {
        id: row.user_id,
        name: row.user_name || row.user_email || row.user_id,
        email: row.user_email || ""
      },
      invitedByName: row.invited_by_name || "",
      invitedByEmail: row.invited_by_email || ""
    };
  }
  function mapActivityLogRow(row) {
    return formatAuditEntry({
      id: row.id,
      projectId: row.project_id,
      actorId: row.actor_id,
      actorName: row.actor_name,
      actorEmail: row.actor_email,
      eventType: row.event_type,
      entityType: row.entity_type,
      entityId: row.entity_id,
      payload: row.payload,
      createdAt: row.created_at
    });
  }

  // src/services/supabase/payloads.ts
  function buildUpsertTasksPayload(tasks) {
    return (tasks || []).map((task, index) => ({
      id: task.id || null,
      n: Math.trunc(task.n || 0),
      order: index,
      name: task.name || "",
      cat: Math.trunc(task.cat || 0),
      ms: Math.trunc(task.ms || 0),
      ws: Math.trunc(task.ws || 0),
      me: Math.trunc(task.me || 0),
      we: Math.trunc(task.we || 0),
      prog: Math.trunc(task.prog || 0),
      budget: Number(task.budget) || 0,
      spent: Number(task.spent) || 0,
      deps: task.deps || [],
      phases: task.phases || null,
      costItems: task.costItems || null,
      notes: task.notes || []
    }));
  }
  function buildProjectMutationPayload(snapshot) {
    return {
      name: snapshot.proj.name,
      sm: snapshot.proj.sm,
      sy: snapshot.proj.sy,
      nm: snapshot.proj.nm,
      cats: snapshot.cats,
      next_n: snapshot.nextN,
      baseline: snapshot.proj.baseline || null,
      baseline_date: snapshot.proj.baselineDate || null
    };
  }
  function buildProjectInsertPayload(snapshot, ownerId) {
    return {
      owner_id: ownerId,
      ...buildProjectMutationPayload(snapshot)
    };
  }
  function buildActivityInsertPayload(input) {
    const payload = { ...input.payload || {} };
    return {
      project_id: input.projectId,
      actor_id: input.actorId,
      actor_name: input.actorName ?? null,
      actor_email: input.actorEmail ?? null,
      event_type: input.eventType,
      entity_type: input.entityType || "project",
      entity_id: input.entityId != null ? String(input.entityId) : null,
      payload
    };
  }
  function splitActivityPayload(input) {
    const details = { ...input || {} };
    const entityType = typeof details.entityType === "string" && details.entityType ? details.entityType : "project";
    const entityId = details.entityId != null ? String(details.entityId) : null;
    delete details.entityType;
    delete details.entityId;
    return {
      entityType,
      entityId,
      payload: details
    };
  }
  function buildProjectShareUpsertPayload(input) {
    return {
      project_id: input.projectId,
      user_id: input.userId,
      role: input.role,
      invited_by: input.invitedBy
    };
  }
  function buildProjectShareRoleUpdatePayload(role) {
    return { role };
  }

  // src/services/supabase/project-list.ts
  function analyzeBufferedProjects(allProjects, bufferUserId, authUserId) {
    const offlineNew = {};
    const localSynced = {};
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
  function buildAccessibleProjectsFromFallback(ownProjects, sharedProjects, authUser) {
    return [
      ...(ownProjects || []).map((project) => ({
        project_id: project.id,
        name: project.name,
        sm: project.sm,
        sy: project.sy,
        nm: project.nm,
        is_archived: !!project.is_archived,
        updated_at: project.updated_at,
        role: "owner",
        source: "own",
        owner_id: authUser.id,
        owner_name: "",
        owner_email: authUser.email || "",
        invited_by: null,
        invited_by_name: "",
        invited_by_email: ""
      })),
      ...(sharedProjects || []).filter((item) => !!item?.project?.id).map((item) => ({
        project_id: item.project.id,
        name: item.project.name,
        sm: item.project.sm,
        sy: item.project.sy,
        nm: item.project.nm,
        is_archived: !!item.project.is_archived,
        updated_at: item.project.updated_at,
        role: normalizeProjectRole(item.role || "viewer"),
        source: "shared",
        owner_id: item.project.owner_id || null,
        owner_name: "",
        owner_email: "",
        invited_by: item.invited_by || null,
        invited_by_name: "",
        invited_by_email: ""
      }))
    ];
  }

  // src/runtime/supabase-runtime-helpers.ts
  function getStoredRole(localId, role) {
    const scope = globalThis;
    return typeof scope.getStoredProjectRole === "function" ? scope.getStoredProjectRole(localId, role) : role;
  }
  function mergeAccessibleProjectsIntoLocalState(offlineNew, localSynced, accessibleProjects, authUserId) {
    const mergedProjects = { ...offlineNew };
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
        invited_by_email: item.invited_by_email || ""
      };
      const localMatch = Object.entries(localSynced).find(([, localProject]) => localProject?._serverId === item.project_id);
      if (localMatch) {
        const [localId, localProject] = localMatch;
        mergedProjects[localId] = {
          ...localProject,
          _role: normalizedRole,
          _access: mapAccessibleProjectAccess({
            ...item,
            ...fallbackMeta
          })
        };
        continue;
      }
      mergedProjects[item.project_id] = mapAccessibleProjectToSnapshotShell(item);
    }
    return mergedProjects;
  }
  function buildSupabaseProjectSnapshot(localId, projectRow, taskRows, previousSnapshot, role) {
    const snapshot = mapProjectRowToSnapshot(projectRow, taskRows, role, {
      _access: previousSnapshot?._access,
      _localVersion: previousSnapshot?._localVersion,
      _serverVersion: previousSnapshot?._serverVersion,
      _localUpdatedAt: previousSnapshot?._localUpdatedAt
    });
    return {
      ...snapshot,
      _role: getStoredRole(localId, role)
    };
  }
  function mapSupabaseShareRecord(shareRow) {
    return mapProjectShareRow(shareRow);
  }
  function mapSupabaseFallbackShareRecord(shareRow) {
    return {
      id: shareRow.id,
      role: normalizeProjectRole(shareRow.role),
      user: {
        id: shareRow.user_id,
        name: shareRow.user_id,
        email: ""
      },
      invitedByName: "",
      invitedByEmail: ""
    };
  }
  function mapSupabaseActivityRow(activityRow) {
    return mapActivityLogRow(activityRow);
  }
  var runtimeHelpers = {
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
    getRuntimeProjectSyncState: getProjectSyncState,
    getRuntimeSyncBadge: getSyncBadge,
    resolveRuntimeSyncStatus: resolveSyncStatus,
    buildRuntimeProjectSnapshotMeta: buildProjectSnapshotMeta,
    buildRuntimeInitialProjectSnapshotMeta: buildInitialProjectSnapshotMeta,
    buildRuntimeStorageBufferPayload: buildStorageBufferPayload,
    normalizeRuntimeBufferedProjectRoles: normalizeBufferedProjectRoles,
    getRuntimeProjectRoleLabel: getProjectRoleLabel,
    buildRuntimeAccountSyncPanelModel: buildAccountSyncPanelModel,
    buildRuntimeProjectSelectLabels: buildProjectSelectLabels,
    buildRuntimeGanttToolbarLabels: buildGanttToolbarLabels,
    buildRuntimeTableLabels: buildTableLabels,
    buildRuntimeAuthFormModel: buildAuthFormModel,
    getRuntimeAuthTabButtonClass: getAuthTabButtonClass,
    buildRuntimeThemeToggleModel: buildThemeToggleModel,
    buildRuntimeUserIdentityModel: buildUserIdentityModel,
    buildRuntimeBaselinePanelModel: buildBaselinePanelModel,
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
    buildRuntimeAuthFlowMessages: buildAuthFlowMessages,
    buildRuntimeProfileFeedbackMessages: buildProfileFeedbackMessages,
    buildRuntimeSharedProjectMetaText: buildSharedProjectMetaText,
    buildRuntimeSharedProjectMetaLine: buildSharedProjectMetaLine,
    buildRuntimeAccessBannerModel: buildAccessBannerModel,
    getRuntimeAuditEventLabel: getAuditEventLabel,
    getRuntimeAuditSubjectLabel: getAuditSubjectLabel,
    getRuntimeAuditActorLabel: getAuditActorLabel,
    buildRuntimeAuditEntryViewModel: buildAuditEntryViewModel,
    buildRuntimeAuditLogModalModel: buildAuditLogModalModel
  };
  Object.assign(globalThis, runtimeHelpers);
})();
