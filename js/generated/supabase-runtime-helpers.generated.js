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
  function buildBaselineSavedToastModel(baselineDate) {
    return {
      title: `Базовий план збережено (${baselineDate})`
    };
  }
  function buildBaselineClearDialogModel() {
    return {
      title: "Очистити базовий план?",
      text: "Ghost-бари зникнуть. Відновити буде неможливо.",
      confirmButtonText: "Очистити",
      cancelButtonText: "Скасувати"
    };
  }
  function buildBaselineMissingModel() {
    return {
      title: "Базовий план не збережено",
      text: "Натисніть «Зберегти базовий план» щоб зафіксувати поточний стан."
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

  // src/domain/app-ui.ts
  function buildAppUiModel() {
    return {
      importedProjectFallbackName: "Імпортований проєкт",
      copiedTaskSuffix: " (копія)",
      duplicateProjectTitle: "Проєкт з такою назвою вже існує",
      duplicateProjectText: "Щоб не плутати копії, задайте назву для імпортованого проєкту.",
      importConfirmButtonText: "Імпортувати",
      cancelButtonText: "Скасувати",
      requiredProjectNameMessage: "Введіть назву проєкту",
      duplicateProjectNameMessage: "Проєкт з такою назвою вже існує",
      numberedCopySuffix: (count) => ` (копія ${count})`,
      importSuccessTitle: (projectName) => `Імпортовано: «${projectName}»`,
      importInvalidTitle: "Помилка",
      importInvalidText: "Не вдалося прочитати файл. Перевірте формат JSON.",
      workbookSheets: {
        schedule: "Графік",
        summary: "Зведення",
        estimate: "Кошторис",
        payments: "Платежі"
      },
      scheduleHeader: [
        "№",
        "Назва",
        "Категорія",
        "Підрядник",
        "Початок (міс.)",
        "Початок (тижд.)",
        "Кінець (міс.)",
        "Кінець (тижд.)",
        "Тривалість (тижд.)",
        "Виконання (%)",
        "Бюджет (грн)",
        "Витрачено (грн)",
        "Залишок (грн)",
        "Залежності"
      ],
      summaryHeader: [
        "Категорія",
        "Кількість робіт",
        "Бюджет (грн)",
        "Витрачено (грн)",
        "Залишок (грн)",
        "Середнє виконання (%)"
      ],
      estimateHeader: [
        "№",
        "Назва роботи",
        "Тип",
        "Матеріал/Послуга",
        "Постач./Підр.",
        "Од.",
        "К-ть",
        "Ціна/од.",
        "Кошторис (грн)",
        "Сплачено (грн)"
      ],
      paymentsHeader: [
        "№",
        "Назва роботи",
        "Контрагент",
        "Тип позиції",
        "Матеріал/Послуга",
        "Дата платежу",
        "Тип платежу",
        "Сума платежу (грн)",
        "Примітка"
      ],
      overdueWeeksLabel: (weeks) => `${weeks} тижд.`,
      overdueMonthsLabel: (months) => `${months} міс.`,
      overdueRemainingLabel: (remaining) => `залишилось <b>${remaining}%</b>`,
      overdueLateLabel: (duration) => `прострочено <b>${duration}</b>`,
      overdueTitle: (count) => `Прострочено ${count} ${count === 1 ? "роботу" : count < 5 ? "роботи" : "робіт"}`,
      overdueShowMoreLabel: (count) => `▼ Показати ще ${count}`,
      overdueCollapseLabel: "▲ Згорнути",
      overdueCloseTitle: "Закрити"
    };
  }

  // src/domain/api-ui.ts
  function buildApiUiModel() {
    return {
      sessionExpiredTitle: "Сесія закінчилась — увійдіть знову",
      share: {
        accessDeniedTitle: "У вас немає прав на керування доступом",
        emptyText: "Нікому не надано доступ",
        modalTitle: "👥 Спільний доступ",
        projectLabel: "Проєкт",
        grantSectionTitle: "Надати доступ:",
        confirmButtonText: "Надати доступ",
        cancelButtonText: "Закрити",
        emailRequiredMessage: "Введіть email"
      },
      auth: {
        loginTabLabel: "Увійти",
        registerTabLabel: "Реєстрація",
        nameLabel: "Ім'я",
        namePlaceholder: "Ваше ім'я",
        passwordLabel: "Пароль",
        passwordPlaceholder: "Мінімум 6 символів",
        loginSubmitLabel: "Увійти",
        registerSubmitLabel: "Зареєструватись",
        nameRequiredMessage: "Введіть ім'я",
        loginSuccessTitle: (name) => `Вітаємо, ${name}! ☁ Синхронізацію увімкнено`,
        authErrorFallback: "Помилка авторизації",
        syncedTitle: "Синхронізовано. Клік — вийти",
        syncedLogoutPromptTitle: "Вийти?",
        syncedLogoutPromptText: "Дані залишаться в браузері.",
        logoutConfirmButtonText: "Вийти",
        loginButtonLabel: "☁ Увійти"
      }
    };
  }

  // src/domain/charts-ui.ts
  function buildChartsUiModel() {
    const axisLabels = {
      count: "Кількість",
      budget: "Бюджет (грн)",
      spent: "Витрачено (грн)",
      rest: "Залишок (грн)",
      prog: "Виконання (%)",
      dur: "Тривалість (тиж.)",
      cat: "Категорія",
      contr: "Підрядник",
      status: "Статус",
      month: "Місяць",
      task: "Робота"
    };
    return {
      axisLabels,
      actionLabels: {
        allCategoriesLabel: "Усі",
        noContractorLabel: "(без підрядника)",
        doneStatusLabel: "Завершено",
        activeStatusLabel: "В роботі",
        pendingStatusLabel: "Не розпочато",
        editTitle: "Редагувати",
        printTitle: "Друк",
        deleteTitle: "Видалити",
        chartFallbackTitle: "Chart"
      },
      autoCharts: [
        { id: "a1", type: "pie", x: "cat", y: "count", title: "Кількість робіт за категорією" },
        { id: "a2", type: "bar", x: "cat", y: "prog", title: "Середнє виконання за категорією (%)" },
        { id: "a3", type: "doughnut", x: "status", y: "count", title: "Статус виконання" },
        { id: "a4", type: "bar", x: "task", y: "dur", title: "Тривалість (тиж., топ 15)" },
        { id: "a5", type: "line", x: "month", y: "count", title: "Активних робіт по місяцях" }
      ]
    };
  }

  // src/domain/finance-ui.ts
  function buildFinanceUiModel() {
    return {
      statusOptions: [
        { value: "done", label: "Завершено (100%)" },
        { value: "active", label: "В роботі" },
        { value: "pending", label: "Не розпочато" },
        { value: "warn", label: "З порушеннями" }
      ],
      filters: {
        overviewTabLabel: "Графік",
        tableTabLabel: "Таблиця",
        searchPlaceholder: "Пошук у фінансах...",
        clearSearchTitle: "Очистити пошук",
        categoryLabel: "Категорія",
        categoryAllLabel: "Усі категорії",
        statusLabel: "Статус",
        statusAllLabel: "Усі",
        contractorLabel: "Підрядник",
        contractorAllLabel: "Усі",
        budgetMinLabel: "Бюджет від",
        budgetMaxLabel: "Бюджет до",
        budgetMinPlaceholder: "0",
        budgetMaxPlaceholder: "∞",
        onlyBudgetLabel: "Тільки з бюджетом",
        resetFiltersTitle: "Скинути фільтри фінансів",
        evmToggleLabel: "EVM",
        evmToggleTitle: "Показати/сховати EVM метрики",
        deleteTasksLabel: "Видалити роботи",
        deleteTasksTitle: "Видалити всі роботи за поточними фільтрами"
      },
      deleteDialogs: {
        noTasksTitle: "Немає робіт для видалення",
        confirmTitle: "Підтвердьте видалення",
        continueLabel: "Продовжити",
        finalTitle: "Фінальне підтвердження",
        finalInputLabel: 'Введіть "ВИДАЛИТИ", щоб остаточно підтвердити',
        finalConfirmLabel: "Видалити",
        cancelLabel: "Скасувати",
        validationMessage: 'Введіть слово "ВИДАЛИТИ"',
        filteredScopeLabel: "роботи за поточними фільтрами",
        fullScopeLabel: "усі роботи проєкту"
      },
      chart: {
        plannedLabel: "План, грн",
        actualLabel: "Факт, грн",
        projectedLabel: "Прогноз, грн",
        tooltipCurrencyUnit: "грн"
      }
    };
  }

  // src/domain/print-ui.ts
  function buildPrintUiModel() {
    return {
      noChartsText: "Немає побудованих графіків",
      previewLoadingText: "Оновлення передперегляду...",
      previewPagesLabel: (pages) => `${pages} стор.`,
      reportTitle: "Звіт",
      nothingSelectedText: "Нічого не вибрано для друку.",
      projectFallbackTitle: "Проєкт",
      ganttTitle: "Діаграма Ганта",
      ganttEmptyText: "Немає робіт для друку.",
      financeTitle: "Фінансовий звіт",
      sCurveTitle: "S-крива освоєння бюджету",
      sCurveAlt: "S-крива",
      sCurveUnavailableText: "S-крива недоступна для друку.",
      weeklyCostTitle: "Тижневий графік витрат",
      weeklyCostAlt: "Тижневий графік витрат",
      weeklyCostUnavailableText: "Тижневий графік витрат недоступний для друку.",
      chartFallbackTitle: "Графік",
      exportPdfTitle: "Генерую PDF...",
      exportPdfProgressText: "Підготовка...",
      exportPdfSuccessTitle: "PDF збережено",
      exportPdfErrorTitle: "Помилка PDF",
      pdfPageProgressText: (current, total) => `Сторінка ${current} з ${total}...`,
      ganttPageTitlePrefix: "Діаграма Ганта: тижні",
      tasksMetaLabel: "робіт",
      workTypeHeader: "Вид робіт",
      plannedLabel: "Плановий",
      actualLabel: "Фактичний",
      financeBudgetLabel: "Бюджет",
      financeSpentLabel: "Витрачено",
      financeRestLabel: "Залишок",
      financeTasksLabel: "Робіт",
      financeDoneSuffix: "завершено",
      currencyUnit: "грн",
      financeTableHeaders: {
        task: "Робота",
        category: "Категорія",
        weeks: "Тиж.",
        budget: "Бюджет",
        spent: "Витрачено",
        rest: "Залишок",
        progress: "%"
      },
      noTasksShortText: "Немає робіт.",
      chartPageFallbackTitle: "Графік"
    };
  }

  // src/domain/contractors-ui.ts
  function buildContractorSummaryLabels() {
    return {
      contractors: "Контрагентів",
      contracts: "Договорів",
      budget: "Кошторис",
      paid: "Оплачено",
      actsAmount: "Сума актів",
      actsDebt: "Борг по актах",
      rest: "Залишок",
      currencyUnit: "грн"
    };
  }
  function buildContractorFilterLabels() {
    return {
      statusLabel: "Статус",
      statusAllLabel: "Усі статуси",
      statusDebtLabel: "Є залишок",
      statusPaidLabel: "Оплачено",
      statusOverpaidLabel: "Переплата",
      statusUnpaidLabel: "Без оплат",
      typeLabel: "Тип",
      typeAllLabel: "Усі типи",
      categoryLabel: "Категорія",
      categoryAllLabel: "Усі категорії",
      resetFiltersTitle: "Скинути фільтри контрагентів",
      chooseVisibleTitle: "Вибрати всі видимі контрагенти"
    };
  }
  function buildContractorSelectionLabels() {
    return {
      showSelectionLabel: "Вибрати",
      hideSelectionLabel: "Сховати вибір",
      selectedLabel: "Вибрано",
      clearSelectionLabel: "Очистити",
      deleteSelectedLabel: "Видалити вибраних"
    };
  }
  function buildContractorTableLabels() {
    return {
      emptyContractorName: "Без контрагента",
      noPermissionTitle: "У вас немає прав на зміну контрагентів у цьому проєкті",
      emptyFilteredText: "Немає контрагентів за вибраними фільтрами",
      selectAllTitle: "Вибрати всі видимі контрагенти",
      rowNoHeader: "№",
      supplierHeader: "Контрагент",
      tasksCountHeader: "Робіт",
      itemsCountHeader: "Договорів",
      budgetHeader: "Кошторис",
      paidHeader: "Оплачено",
      restHeader: "Залишок",
      actsAmountHeader: "Сума актів",
      actsDebtHeader: "Заборг. по актах",
      paymentsCountHeader: "Платежів",
      lastPaymentHeader: "Остання оплата",
      statusHeader: "Статус",
      emDash: "—",
      contractActEmptyText: "Договорів по цьому контрагенту ще немає",
      actEmptyText: "Актів по цьому контрагенту ще немає",
      paymentEmptyText: "Платежів по цьому контрагенту ще немає",
      forecastEmptyText: "Планового кошторису без контрагента немає",
      addActTitle: "Додати акт",
      addPaymentTitle: "Додати платіж",
      editActTitle: "Редагувати акт",
      deleteActTitle: "Видалити акт",
      editPaymentActionTitle: "Редагувати платіж",
      deletePaymentTitle: "Видалити платіж",
      noSelectedContractorsTitle: "Немає вибраних контрагентів",
      noVisibleContractorsTitle: "Немає контрагентів для видалення",
      bulkDeleteConfirmTitle: "Підтвердьте видалення",
      bulkDeleteContinueLabel: "Продовжити",
      finalDeleteTitle: "Фінальне підтвердження",
      finalDeleteInputLabel: 'Введіть "ВИДАЛИТИ", щоб остаточно підтвердити',
      finalDeleteConfirmLabel: 'Введіть слово "ВИДАЛИТИ"',
      finalDeleteValidationMessage: 'Введіть слово "ВИДАЛИТИ"',
      noContractsTitle: "Немає договорів",
      noContractsText: "Спочатку додайте договір для цього контрагента.",
      saveLabel: "Зберегти",
      cancelLabel: "Скасувати",
      deleteLabel: "Видалити",
      noWorksTitle: "Немає робіт",
      noWorksText: "Спочатку додайте роботу на графіку.",
      contractorUpdatedTitle: "Контрагента оновлено",
      noPaymentsTitle: "Немає платежів",
      noPaymentsRegisterText: "Поточний фільтр не містить платежів для реєстру.",
      registerNameTitle: "Назва реєстру",
      registerNameValidation: "Вкажіть назву реєстру",
      noPaymentsExportTitle: "Немає платежів для експорту",
      noPaymentsPrintTitle: "Немає платежів для друку",
      printBlockedTitle: "Браузер заблокував друк",
      printBlockedText: "Дозвольте спливаюче вікно для друку реєстру.",
      deleteRegisterTitle: "Видалити реєстр?",
      noImportRightsTitle: "У вас немає прав на імпорт",
      importUnavailableTitle: "Імпорт недоступний",
      importUnavailableText: "Бібліотека XLSX не завантажилась.",
      importNoRowsTitle: "У файлі не знайдено рядків для імпорту",
      importDoneTitle: "Імпорт завершено",
      importNoChangesTitle: "Немає змін для імпорту",
      importErrorTitle: "Помилка імпорту",
      importErrorText: "Не вдалося прочитати файл. Перевірте формат таблиці або скористайтесь шаблоном.",
      importMappingTitle: "Імпорт платежів",
      importMappingDefaultTaskLabel: "Робота за замовчуванням, якщо у файлі не знайдено роботу",
      importProjectFieldHeader: "Поле проєкту",
      importFileColumnHeader: "Колонка у файлі",
      importExamplesHeader: "Приклади",
      importContinueLabel: "Продовжити",
      importReviewTitle: "Перевірка імпорту",
      importLabel: "Імпортувати",
      importOkLabel: "OK",
      editPaymentTitle: (name) => `Редагувати платіж: ${name}`,
      deletePaymentTitlePrompt: "Видалити платіж?",
      addActTitleWithSupplier: (supplier) => `Додати акт: ${supplier}`,
      editActTitleWithSupplier: (supplier) => `Редагувати акт: ${supplier}`,
      deleteActTitlePrompt: "Видалити акт?",
      addPaymentTitleWithSupplier: (supplier) => `Додати платіж: ${supplier}`,
      correctAmountValidation: "Вкажіть коректну суму",
      actNumberValidation: "Вкажіть номер акту",
      actAmountValidation: "Вкажіть суму акту",
      paymentAmountValidation: "Вкажіть суму платежу",
      supplierLockedTitle: "Контрагент зафіксований для цього рядка",
      workFieldLabel: "Робота",
      contractNumberLabel: "Номер договору",
      dateFieldLabel: "Дата",
      amountFieldLabel: "Сума",
      noteFieldLabel: "Примітка",
      contractPlaceholder: "Договір №",
      amountPlaceholder: "0",
      contractNotePlaceholder: "Примітка до договору",
      supplierRequiredTitle: "Вкажіть контрагента",
      addContractTitle: "Додайте договір",
      contractAmountValidation: "Вкажіть суму договору"
    };
  }

  // src/domain/costs-ui.ts
  function buildCostUiModel() {
    return {
      costTypes: {
        material: { label: "Матеріали", icon: "🧱" },
        work: { label: "Роботи", icon: "👷" },
        equipment: { label: "Техніка", icon: "🔧" },
        service: { label: "Послуги", icon: "🤝" },
        other: { label: "Інше", icon: "📦" }
      },
      paymentTypes: {
        advance: "Аванс",
        act: "Акт",
        invoice: "Рахунок",
        other: "Інше"
      },
      units: [
        "м²",
        "м³",
        "пог.м",
        "т",
        "кг",
        "шт",
        "год",
        "люд*год",
        "день",
        "люд*день",
        "компл",
        "л",
        "рулон",
        "уп"
      ],
      labels: {
        emptyStateText: 'Рядків немає — натисніть кнопку "Тип" вище щоб додати',
        budgetLabel: "Кошторис:",
        spentLabel: "Сплачено:",
        restLabel: "Залишок:",
        contractPlaceholder: "Договір №",
        supplierPlaceholder: "Контрагент",
        notePlaceholder: "Примітки",
        paymentAmountPlaceholder: "Сума (грн)",
        paymentNotePlaceholder: "Примітка (акт №, аванс тощо)",
        addPaymentLabel: "+ Платіж",
        paymentCountLabel: (count, isOpen) => `${isOpen ? "▾" : "▸"} ${count} плат.`,
        deleteItemTitle: "Видалити",
        contractNamePrefix: "Договір",
        defaultUnit: "договір",
        currencyUnit: "грн"
      }
    };
  }

  // src/domain/guard-ui.ts
  function buildGuardToastModel(label) {
    return {
      title: `У вас немає прав на ${label}`,
      text: "Зверніться до власника проєкту щоб отримати доступ."
    };
  }
  function buildGuardedActionLabels() {
    return {
      openAdd: { label: "створення задачі", capability: "canEditTasks" },
      saveTask: { label: "збереження задачі", capability: "canEditTasks" },
      delTask: { label: "видалення задачі", capability: "canEditTasks" },
      saveProjSettings: { label: "зміну налаштувань", capability: "canManageProject" },
      saveCats: { label: "зміну категорій", capability: "canManageProject" },
      saveBaseline: { label: "збереження базового плану", capability: "canEditTasks" },
      clearBaseline: { label: "видалення базового плану", capability: "canEditTasks" },
      savePhases: { label: "збереження фаз", capability: "canEditTasks" },
      saveCostModal: { label: "збереження кошторису", capability: "canEditTasks" },
      deleteProject: { label: "видалення проєкту", capability: "canManageProject" },
      importJSON: { label: "імпорт", capability: "canEditTasks" },
      importContractorTable: { label: "імпорт оплат", capability: "canEditTasks" },
      saveContractorEntry: { label: "додавання контрагентів та оплат", capability: "canEditTasks" },
      editContractor: { label: "редагування контрагентів", capability: "canEditTasks" },
      deleteContractor: { label: "видалення контрагентів", capability: "canEditTasks" },
      openContractorActModal: { label: "додавання актів", capability: "canEditTasks" },
      editContractorAct: { label: "редагування актів", capability: "canEditTasks" },
      deleteContractorAct: { label: "видалення актів", capability: "canEditTasks" },
      openContractorPaymentModal: { label: "додавання платежів", capability: "canEditTasks" },
      editContractorPayment: { label: "редагування платежів", capability: "canEditTasks" },
      deleteContractorPayment: { label: "видалення платежів", capability: "canEditTasks" },
      createPaymentRegisterFromFilters: { label: "створення реєстру платежів", capability: "canEditTasks" },
      deletePaymentRegister: { label: "видалення реєстру платежів", capability: "canEditTasks" }
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

  // src/domain/storage-ui.ts
  function buildStorageUiModel() {
    return {
      offlineIndicatorText: "⚠ офлайн — зміни збережено локально"
    };
  }

  // src/domain/project-lifecycle.ts
  function clonePhaseWithShift(phase, shift) {
    return {
      ...phase,
      ms: Math.max(0, phase.ms + shift),
      me: Math.max(0, phase.me + shift)
    };
  }
  function cloneTaskWithShift(task, shift) {
    return {
      ...task,
      ms: Math.max(0, task.ms + shift),
      me: Math.max(0, task.me + shift),
      phases: task.phases?.map((phase) => clonePhaseWithShift(phase, shift)) || task.phases || null
    };
  }
  function applyProjectSettingsUpdate(input) {
    const { snapshot, name, sm, sy, nm } = input;
    const before = {
      name: snapshot.proj.name,
      sm: snapshot.proj.sm,
      sy: snapshot.proj.sy,
      nm: snapshot.proj.nm
    };
    const nextNm = Math.min(120, Math.max(3, nm));
    const oldAbsStart = snapshot.proj.sy * 12 + snapshot.proj.sm;
    const newAbsStart = sy * 12 + sm;
    const shift = oldAbsStart - newAbsStart;
    const shiftedTasks = shift !== 0;
    return {
      snapshot: {
        ...snapshot,
        proj: {
          ...snapshot.proj,
          name: name.trim() || snapshot.proj.name,
          sm,
          sy,
          nm: nextNm
        },
        tasks: shiftedTasks ? snapshot.tasks.map((task) => cloneTaskWithShift(task, shift)) : snapshot.tasks
      },
      before,
      after: {
        name: name.trim() || snapshot.proj.name,
        sm,
        sy,
        nm: nextNm
      },
      shift,
      shiftedTasks
    };
  }
  function createEmptyProjectSnapshot(input) {
    const { name, defaults, categories, meta } = input;
    return {
      proj: {
        name: name.trim(),
        sm: defaults.sm,
        sy: defaults.sy,
        nm: defaults.nm
      },
      cats: categories.map((category) => ({ ...category })),
      tasks: [],
      nextN: 1,
      ...meta || {}
    };
  }
  function createDemoProjectSnapshot(input) {
    const { projectName, startYear, categories, tasks, nextN, meta } = input;
    return {
      proj: {
        name: projectName,
        sm: 0,
        sy: startYear,
        nm: 12
      },
      cats: categories.map((category) => ({ ...category })),
      tasks: tasks.map((task) => ({ ...task })),
      nextN,
      ...meta || {}
    };
  }
  function canDeleteProjectCount(projectCount) {
    return projectCount > 1;
  }
  function resolveNextProjectAfterDeletion(projectIds, currentId, deletedId) {
    if (currentId !== deletedId) return currentId;
    return projectIds.find((projectId) => projectId !== deletedId) || null;
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
    buildRuntimeStorageUiModel: buildStorageUiModel,
    buildRuntimeProjectSettingsUpdate: applyProjectSettingsUpdate,
    buildRuntimeCreateEmptyProjectSnapshot: createEmptyProjectSnapshot,
    buildRuntimeCreateDemoProjectSnapshot: createDemoProjectSnapshot,
    canRuntimeDeleteProjectCount: canDeleteProjectCount,
    resolveRuntimeNextProjectAfterDeletion: resolveNextProjectAfterDeletion,
    normalizeRuntimeBufferedProjectRoles: normalizeBufferedProjectRoles,
    getRuntimeProjectRoleLabel: getProjectRoleLabel,
    buildRuntimeAccountSyncPanelModel: buildAccountSyncPanelModel,
    buildRuntimeProjectSelectLabels: buildProjectSelectLabels,
    buildRuntimeGanttToolbarLabels: buildGanttToolbarLabels,
    buildRuntimeTableLabels: buildTableLabels,
    buildRuntimeAppUiModel: buildAppUiModel,
    buildRuntimeApiUiModel: buildApiUiModel,
    buildRuntimeChartsUiModel: buildChartsUiModel,
    buildRuntimeFinanceUiModel: buildFinanceUiModel,
    buildRuntimePrintUiModel: buildPrintUiModel,
    buildRuntimeContractorSummaryLabels: buildContractorSummaryLabels,
    buildRuntimeContractorFilterLabels: buildContractorFilterLabels,
    buildRuntimeContractorSelectionLabels: buildContractorSelectionLabels,
    buildRuntimeContractorTableLabels: buildContractorTableLabels,
    buildRuntimeCostUiModel: buildCostUiModel,
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
