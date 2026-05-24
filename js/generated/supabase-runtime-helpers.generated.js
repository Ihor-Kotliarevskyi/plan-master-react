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

  // src/services/api/account-runtime.ts
  function resetFallbackAuthState() {
    return {
      token: null,
      user: null,
      projectRole: null
    };
  }
  function buildFallbackRegisterRequest(name, email, password) {
    return {
      name,
      email,
      password
    };
  }
  function buildFallbackLoginRequest(email, password) {
    return {
      email,
      password
    };
  }
  function buildFallbackProfileUpdateRequest(updates) {
    return {
      body: { ...updates || {} }
    };
  }
  function buildFallbackAuthHydratedState(token, user) {
    return {
      token,
      user,
      projectRole: null
    };
  }
  function buildFallbackSyncIndicatorPlan(timeoutMs = 1800) {
    return {
      status: "syncing",
      timeoutMs
    };
  }

  // src/services/api/http-runtime.ts
  function buildFallbackHttpRequestOptions(authToken) {
    const headers = {
      "Content-Type": "application/json"
    };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    return { headers };
  }
  function resolveFallbackHttpOutcome(status, data) {
    if (status === 401 && data?.expired) {
      return { kind: "session_expired" };
    }
    if (status >= 200 && status < 300) {
      return { kind: "ok" };
    }
    return {
      kind: "error",
      message: typeof data?.error === "string" && data.error ? data.error : `HTTP ${status}`
    };
  }

  // src/services/api/fallback-runtime.ts
  function buildFallbackProjectShell(project) {
    const normalizedRole = normalizeProjectRole(project.role || "owner");
    return {
      proj: {
        name: project.name,
        sm: project.sm,
        sy: project.sy,
        nm: project.nm
      },
      cats: [],
      tasks: [],
      nextN: 1,
      _serverId: project.id,
      _role: normalizedRole
    };
  }
  function buildFallbackLoadedProjectSnapshot(localId, project, tasks, resolvedRole, getStoredRole2) {
    const normalizedRole = normalizeProjectRole(resolvedRole || "viewer");
    return {
      proj: {
        name: project.name,
        sm: project.sm,
        sy: project.sy,
        nm: project.nm,
        baseline: project.baseline,
        baselineDate: project.baselineDate || null
      },
      cats: project.cats || [],
      tasks: tasks || [],
      nextN: project.nextN || 1,
      _serverId: project._id,
      _role: typeof getStoredRole2 === "function" ? getStoredRole2(localId, normalizedRole) : normalizedRole
    };
  }
  function buildFallbackProjectSyncRequest(snapshot) {
    return {
      projectPayload: {
        name: snapshot.proj.name,
        sm: snapshot.proj.sm,
        sy: snapshot.proj.sy,
        nm: snapshot.proj.nm,
        cats: snapshot.cats,
        nextN: snapshot.nextN,
        baseline: snapshot.proj.baseline || null,
        baselineDate: snapshot.proj.baselineDate || null
      },
      tasksPayload: {
        tasks: snapshot.tasks
      }
    };
  }
  function buildFallbackProjectCreateRequest(snapshot) {
    return {
      payload: {
        name: snapshot.proj.name,
        sm: snapshot.proj.sm,
        sy: snapshot.proj.sy,
        nm: snapshot.proj.nm,
        cats: snapshot.cats,
        tasks: snapshot.tasks,
        nextN: snapshot.nextN
      }
    };
  }
  function buildFallbackProjectDeleteRequest(projectId) {
    return { projectId };
  }
  function buildFallbackShareGrantRequest(email, role, isShareableRole) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) throw new Error("Enter email");
    const normalizedRole = normalizeProjectRole(role);
    if (!isShareableRole(normalizedRole)) throw new Error("Unsupported access role");
    return {
      email: normalizedEmail,
      role: normalizedRole
    };
  }
  function buildFallbackShareRoleUpdateRequest(role, isShareableRole) {
    const normalizedRole = normalizeProjectRole(role);
    if (!isShareableRole(normalizedRole)) throw new Error("Unsupported access role");
    return {
      role: normalizedRole
    };
  }
  function buildFallbackShareRemoveRequest(userId) {
    return { userId };
  }
  function buildFallbackShareModalState(shares, getRoleLabel) {
    return {
      items: (shares || []).map((share) => {
        const normalizedRole = normalizeProjectRole(share.role || "viewer");
        return {
          userId: String(share.userId?._id || ""),
          displayName: share.userId?.name || "—",
          displayEmail: share.userId?.email || "",
          normalizedRole,
          roleLabel: getRoleLabel(normalizedRole)
        };
      })
    };
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

  // src/domain/render.ts
  function buildHeaderDateText(months, nm) {
    if (!months.length) return "";
    return `${months[0]?.name} ${months[0]?.y} – ${months[months.length - 1]?.name} ${months[months.length - 1]?.y} · ${nm} міс.`;
  }
  function buildLegendItems(categories, filterCat, hiddenCats) {
    const hasFilter = filterCat !== null || hiddenCats.size > 0;
    return {
      hasFilter,
      items: categories.map((category, index) => {
        const isExclusive = filterCat === index;
        const isOff = hiddenCats.has(index);
        let className = "cat-chip";
        if (isExclusive) className += " active";
        else if (isOff) className += " off";
        else if (hasFilter) className += " dim";
        return {
          index,
          name: category.name,
          color: category.color,
          className
        };
      })
    };
  }
  function buildVisibleYearGroups(visibleMonths) {
    const groups = [];
    visibleMonths.forEach((month) => {
      const last = groups[groups.length - 1];
      if (last && last.year === month.y) last.cols += 4;
      else groups.push({ year: month.y, cols: 4 });
    });
    return groups;
  }
  function buildTaskWindowModel(input) {
    const { task, visStart, totalWeeks, zoomLevel, taskSearch, warnings, baselinePos, isCritical } = input;
    const startWeek = task.ms * 4 + task.ws;
    const endWeek = task.me * 4 + task.we;
    if (endWeek < visStart || startWeek >= totalWeeks) return null;
    const showFull = startWeek >= visStart;
    const showPartial = !showFull && task.prog < 100 && endWeek >= visStart;
    const showBar = showFull || showPartial;
    const barStart = showFull ? startWeek : visStart;
    const barWidth = showBar ? (endWeek - barStart + 1) * zoomLevel : 0;
    const progressWidth = showBar ? Math.round(task.prog * Math.max(0, barWidth - Math.min(12, zoomLevel * 0.4)) / 100) : 0;
    const notesCount = (task.notes || []).filter((note) => !note?.deleted).length || 0;
    const searchNeedle = String(taskSearch || "").trim().toLowerCase();
    const searchClass = searchNeedle ? String(task.name || "").toLowerCase().includes(searchNeedle) ? "task-search-match" : "task-search-dim" : "";
    const baselineStartAbs = baselinePos ? Math.max(baselinePos.ms * 4 + baselinePos.ws, visStart) : null;
    const baselineEndAbs = baselinePos ? baselinePos.me * 4 + baselinePos.we : null;
    const baselineWidth = baselineStartAbs !== null && baselineEndAbs !== null && baselineEndAbs >= visStart ? (baselineEndAbs - baselineStartAbs + 1) * zoomLevel : 0;
    const phases = (task.phases && task.phases.length > 1 ? task.phases : []).map((phase, index) => {
      const phaseStart = phase.ms * 4 + phase.ws;
      const phaseEnd = phase.me * 4 + phase.we;
      if (phaseEnd < visStart || phaseStart >= totalWeeks) return null;
      const progress = phase.prog || 0;
      const phaseShowFull = phaseStart >= visStart;
      const phaseShowPartial = !phaseShowFull && progress < 100 && phaseEnd >= visStart;
      if (!phaseShowFull && !phaseShowPartial) return null;
      const start = phaseShowFull ? phaseStart : visStart;
      const width = (phaseEnd - start + 1) * zoomLevel;
      return {
        index,
        start,
        width,
        progressWidth: Math.round(progress * Math.max(0, width - Math.min(12, zoomLevel * 0.4)) / 100),
        progress,
        isPartial: phaseShowPartial,
        showFull: phaseShowFull
      };
    }).filter(Boolean);
    return {
      startWeek,
      endWeek,
      notesCount,
      notesCellClass: notesCount > 0 ? "td-notes has-notes" : "td-notes",
      searchClass,
      isCritical,
      warningsTitleSuffix: warnings.length ? ` ⚠ ${warnings.join("; ")}` : "",
      baselineStart: baselineStartAbs,
      baselineWidth,
      bar: showBar ? {
        start: barStart,
        width: barWidth,
        progressWidth,
        isPartial: showPartial,
        showFull,
        showPartial
      } : null,
      phases
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
  function buildFallbackAuthModalRenderModel(tab, ui) {
    const isLogin = tab === "login";
    return {
      isLogin,
      loginTabClassName: `auth-tab${isLogin ? " active" : ""}`,
      registerTabClassName: `auth-tab${!isLogin ? " active" : ""}`,
      submitLabel: isLogin ? ui.loginSubmitLabel : ui.registerSubmitLabel,
      showNameField: !isLogin
    };
  }
  function buildFallbackAuthButtonModel(isLoggedIn, userName, ui) {
    if (isLoggedIn && userName) {
      return {
        text: `☃ ${userName}`,
        title: ui.syncedTitle,
        mode: "logout"
      };
    }
    return {
      text: ui.loginButtonLabel,
      title: "",
      mode: "login"
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

  // src/domain/charts.ts
  function buildChartData(params) {
    const src = params.tasks.filter((task) => {
      if (params.hiddenCats.has(task.cat)) return false;
      if (params.catFilter !== "" && task.cat !== Number(params.catFilter)) return false;
      if (params.statFilter === "done" && task.prog < 100) return false;
      if (params.statFilter === "active" && (task.prog === 0 || task.prog === 100)) return false;
      if (params.statFilter === "pending" && task.prog !== 0) return false;
      return true;
    });
    const groups = {};
    const counts = {};
    const getKey = (task) => {
      if (params.xKey === "cat") return params.getCategoryName(task.cat);
      if (params.xKey === "contr") {
        const contractors = params.getTaskContractors(task);
        return contractors.length ? contractors.join(", ") : params.noContractorLabel;
      }
      if (params.xKey === "status") {
        if (task.prog === 100) return params.statusLabels.done;
        if (task.prog > 0) return params.statusLabels.active;
        return params.statusLabels.pending;
      }
      if (params.xKey === "task") return `${task.n}. ${String(task.name || "").substring(0, 22)}`;
      if (params.xKey === "month") return params.getMonthLabel(task.ms);
      return "?";
    };
    const getValue = (task) => {
      if (params.yKey === "count") return 1;
      if (params.yKey === "budget") return Number(task.budget) || 0;
      if (params.yKey === "spent") return Number(task.spent) || 0;
      if (params.yKey === "rest") return (Number(task.budget) || 0) - (Number(task.spent) || 0);
      if (params.yKey === "prog") return Number(task.prog) || 0;
      if (params.yKey === "dur") return params.getTaskDuration(task);
      return 0;
    };
    src.forEach((task) => {
      const key = getKey(task);
      const value = getValue(task);
      groups[key] = (groups[key] || 0) + value;
      counts[key] = (counts[key] || 0) + 1;
    });
    if (params.yKey === "prog") {
      Object.keys(groups).forEach((key) => {
        groups[key] = Math.round(groups[key] / Math.max(1, counts[key] || 1));
      });
    }
    const labels = Object.keys(groups);
    const values = Object.values(groups);
    if (params.xKey === "task") {
      return {
        labels: labels.slice(0, 15),
        values: values.slice(0, 15)
      };
    }
    return { labels, values };
  }
  function buildChartColors(params) {
    if (params.xKey === "cat") {
      return params.labels.map((label) => {
        const category = params.categories.find((item) => item.name === label);
        return category?.color || "#888";
      });
    }
    if (params.xKey === "status") {
      return params.labels.map((label) => {
        if (label === params.statusLabels.done) return "#16803c";
        if (label === params.statusLabels.active) return "#c07800";
        return "#a09d97";
      });
    }
    const palette = [
      "#2563eb",
      "#16803c",
      "#c07800",
      "#b71c1c",
      "#006494",
      "#8a6200",
      "#5a5a5a",
      "#7c3aed",
      "#0891b2",
      "#be185d"
    ];
    return params.labels.map((_, index) => palette[index % palette.length]);
  }
  function normalizeChartRenderType(type) {
    return {
      realType: type === "horizontalBar" ? "bar" : type,
      isHoriz: type === "horizontalBar"
    };
  }
  function buildChartOptions(type, isHoriz) {
    return {
      indexAxis: isHoriz ? "y" : void 0,
      responsive: true,
      plugins: {
        legend: {
          display: type === "pie" || type === "doughnut",
          position: "bottom",
          labels: { font: { size: 10 }, boxWidth: 10 }
        }
      },
      scales: type === "pie" || type === "doughnut" ? {} : {
        x: { ticks: { font: { size: 9 }, maxRotation: isHoriz ? 0 : 35 } },
        y: {
          ticks: {
            font: { size: 9 }
          }
        }
      }
    };
  }
  function buildChartDefinition(input) {
    return {
      ...input,
      title: `${input.axisLabels[input.yKey] || input.yKey} за ${input.axisLabels[input.xKey] || input.xKey}`
    };
  }
  function getChartAutoDefaults(id, presets) {
    const match = presets.find((preset) => preset.id === id);
    return match || { type: "bar", x: "cat", y: "count" };
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

  // src/domain/finance.ts
  function financeItemTotal(item) {
    const qty = item?.qty == null ? 1 : +item.qty || 0;
    return qty * (+item?.unitPrice || 0);
  }
  function hasFinanceFilters(filters, multiValues) {
    return !!(multiValues(filters.cat).length || multiValues(filters.stat).length || multiValues(filters.contr).length || filters.budgetMin !== "" || filters.budgetMax !== "" || filters.onlyBudget);
  }
  function financeScopedCostItems(task, selectedContractors, contractorKey2, getTaskCostItems) {
    const items = getTaskCostItems(task);
    if (!selectedContractors.length) return items;
    return items.filter((item) => selectedContractors.includes(contractorKey2(item.supplier)));
  }
  function financeTaskScope(task, selectedContractors, contractorKey2, getTaskCostItems) {
    const items = financeScopedCostItems(task, selectedContractors, contractorKey2, getTaskCostItems);
    const payments = items.flatMap((item) => item.payments || []);
    if (selectedContractors.length) {
      const budget = items.reduce((sum, item) => sum + financeItemTotal(item), 0);
      const spent = payments.reduce((sum, payment) => sum + (+payment.amount || 0), 0);
      return { budget, spent, payments, items };
    }
    return {
      budget: +task.budget || 0,
      spent: +task.spent || 0,
      payments,
      items
    };
  }
  function buildFinanceSearchText(task, contractors, items, categoryName, itemTypeLabels, paymentTypeLabels) {
    const parts = [
      task.n,
      task.name,
      categoryName,
      task.prog,
      task.budget,
      task.spent,
      (+task.budget || 0) - (+task.spent || 0)
    ];
    contractors.forEach((name) => parts.push(name));
    items.forEach((item) => {
      parts.push(
        item.type,
        itemTypeLabels?.[item.type]?.label,
        item.name,
        item.supplier,
        item.unit,
        item.qty,
        item.unitPrice,
        financeItemTotal(item)
      );
      (item.payments || []).forEach((payment) => {
        parts.push(
          payment.date,
          payment.amount,
          payment.type,
          paymentTypeLabels?.[payment.type],
          payment.note
        );
      });
    });
    return parts.filter((value) => value !== null && value !== void 0).join(" ").toLocaleLowerCase("uk-UA");
  }
  function summarizeFinanceDeletion(indexes, tasks, getTaskCostItems) {
    return indexes.reduce(
      (acc, index) => {
        const task = tasks[index];
        const items = getTaskCostItems(task);
        acc.tasks += 1;
        acc.budget += +task.budget || 0;
        acc.spent += +task.spent || 0;
        acc.items += items.length;
        items.forEach((item) => {
          acc.acts += (item.acts || []).length;
          acc.payments += (item.payments || []).length;
        });
        return acc;
      },
      { tasks: 0, budget: 0, spent: 0, items: 0, acts: 0, payments: 0 }
    );
  }
  function calculateFinanceOverview(tasks) {
    const budget = tasks.reduce((sum, task) => sum + (+task.budget || 0), 0);
    const spent = tasks.reduce((sum, task) => sum + (+task.spent || 0), 0);
    const rest = budget - spent;
    const spentPct = budget > 0 ? Math.round(spent / budget * 100) : 0;
    const bcwp = tasks.reduce((sum, task) => sum + (+task.budget || 0) * ((+task.prog || 0) / 100), 0);
    const acwp = spent;
    const bac = budget;
    const cpi = acwp > 0 ? bcwp / acwp : null;
    const eac = cpi && cpi > 0 ? bac / cpi : null;
    const etc = eac !== null ? eac - acwp : null;
    const vac = eac !== null ? bac - eac : null;
    return { budget, spent, rest, spentPct, bcwp, acwp, bac, cpi, eac, etc, vac };
  }
  function buildFinanceRows(filteredTasks, sort, getDuration, getRemainingWeeks) {
    const rows = filteredTasks.map((task, index) => ({
      ...task,
      ti: task.__ti ?? index,
      dur: getDuration(task),
      rest: (+task.budget || 0) - (+task.spent || 0),
      pct: task.budget > 0 ? Math.round(task.spent / task.budget * 100) : 0,
      rate: (() => {
        const remainingWeeks = getRemainingWeeks(task);
        const rest = (+task.budget || 0) - (+task.spent || 0);
        return remainingWeeks > 0 ? Math.round(rest / remainingWeeks) : 0;
      })()
    }));
    rows.sort((a, b) => {
      const av = a[sort.col];
      const bv = b[sort.col];
      return typeof av === "string" ? sort.dir * String(av ?? "").localeCompare(String(bv ?? ""), "uk") : sort.dir * ((Number(av) || 0) - (Number(bv) || 0));
    });
    return rows;
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

  // src/domain/print.ts
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
  function resolvePrintSections(input) {
    return {
      gantt: input.gantt ?? true,
      finance: input.finance ?? false,
      charts: input.charts ?? false,
      chartIds: Array.isArray(input.chartIds) ? input.chartIds.filter(Boolean) : [],
      range: input.range || "all"
    };
  }
  function resolvePrintSettings(input, defaults) {
    const paper = typeof input.paper === "string" ? input.paper : defaults.paper;
    const orientation = typeof input.orientation === "string" ? input.orientation : defaults.orientation;
    const fitMode = typeof input.fitMode === "string" ? input.fitMode : defaults.fitMode;
    const contentScale = Number.isFinite(Number(input.contentScale)) ? Number(input.contentScale) : defaults.contentScale;
    const renderScale = Number.isFinite(Number(input.renderScale)) ? Number(input.renderScale) : defaults.renderScale;
    const margin = Number.isFinite(Number(input.margin)) ? Number(input.margin) : defaults.margin;
    return {
      paper: ["a3", "a4", "letter"].includes(paper) ? paper : "a3",
      orientation: ["landscape", "portrait"].includes(orientation) ? orientation : "landscape",
      contentScale: clamp(contentScale, 0.25, 1),
      renderScale: clamp(renderScale, 1, 2),
      margin: clamp(margin, 0, 25),
      fitMode: ["paginate", "width", "height", "page"].includes(fitMode) ? fitMode : "paginate"
    };
  }
  function getPrintMetrics(settings, paperMm) {
    const base = paperMm[settings.paper] || paperMm.a3;
    const pageW = settings.orientation === "landscape" ? base.h : base.w;
    const pageH = settings.orientation === "landscape" ? base.w : base.h;
    const contentWmm = Math.max(50, pageW - settings.margin * 2);
    const contentHmm = Math.max(50, pageH - settings.margin * 2);
    const pxPerMm = 96 / 25.4;
    return {
      pageW,
      pageH,
      contentWmm,
      contentHmm,
      contentWpx: Math.round(contentWmm * pxPerMm),
      contentHpx: Math.round(contentHmm * pxPerMm)
    };
  }
  function getPrintPreviewState(input) {
    const { pagesCount, availableWidth, availableHeight, pageWidth, pageHeight } = input;
    if (!pagesCount || !pageWidth || !pageHeight) return null;
    const pageIndex = Math.min(pagesCount - 1, Math.max(0, input.currentPage));
    const scale = Math.min(1, availableWidth / pageWidth, availableHeight / pageHeight);
    return {
      pageIndex,
      pageLabel: `${pageIndex + 1} / ${pagesCount}`,
      prevDisabled: pageIndex <= 0,
      nextDisabled: pageIndex >= pagesCount - 1,
      targetWidth: Math.ceil(pageWidth * scale),
      targetHeight: Math.ceil(pageHeight * scale),
      targetLeft: Math.max(0, (availableWidth - pageWidth * scale) / 2),
      targetTop: Math.max(0, (availableHeight - pageHeight * scale) / 2),
      cloneWidth: pageWidth,
      cloneHeight: pageHeight,
      scale
    };
  }
  function resolvePrintGanttLayout(input) {
    const { settings, metrics, taskCount, allWeeks } = input;
    const density = settings.contentScale;
    const headH = 118;
    const nW = Math.max(20, Math.round(34 * density));
    const nameW = Math.max(110, Math.round(220 * density));
    const progW = Math.max(34, Math.round(46 * density));
    const fixedW = nW + nameW + progW;
    let weekW = Math.max(8, Math.round(22 * density));
    let rowH = Math.max(22, Math.round(28 * density));
    if (settings.fitMode === "width" || settings.fitMode === "page") {
      weekW = Math.max(2, Math.floor((metrics.contentWpx - fixedW - 2) / Math.max(1, allWeeks)));
    }
    if (settings.fitMode === "height" || settings.fitMode === "page") {
      rowH = Math.max(12, Math.floor((metrics.contentHpx - headH) / Math.max(1, taskCount)));
    }
    return {
      nW,
      nameW,
      progW,
      fixedW,
      weekW,
      rowH,
      weeksPerPage: settings.fitMode === "width" || settings.fitMode === "page" ? Math.max(1, allWeeks) : Math.max(4, Math.floor((metrics.contentWpx - fixedW - 2) / weekW)),
      rowsPerPage: settings.fitMode === "height" || settings.fitMode === "page" ? Math.max(1, taskCount) : Math.max(8, Math.floor((metrics.contentHpx - headH) / rowH))
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
      noImportOptionLabel: "Не імпортувати",
      noActOptionLabel: "Без акту",
      contractFieldLabel: "Договір",
      paymentDateFieldLabel: "Дата платежу",
      paymentAmountFieldLabel: "Сума платежу",
      paymentActFieldLabel: "Згідно акту",
      actTypeFieldLabel: "Тип акту",
      actNumberFieldLabel: "Номер акту",
      actDateFieldLabel: "Дата акту",
      actAmountFieldLabel: "Сума акту",
      actItemNameFieldLabel: "Опис товару/послуги",
      paymentOrActNoteFieldLabel: "Примітка",
      actPlaceholder: "Акт №",
      importReviewRowsTitle: "Рядки імпорту",
      importReviewNoteTitle: "Примітка",
      importReviewFallbackTaskNote: "Частина рядків без роботи буде прив’язана до типової імпортної роботи.",
      importReviewRefHeader: "Рядок",
      importReviewSupplierHeader: "Контрагент",
      importReviewPositionHeader: "Позиція",
      importReviewPaymentHeader: "Платіж",
      importReviewIssueHeader: "Проблема",
      importReviewActionHeader: "Дія",
      importFilterRowsLabel: "рядків",
      importFilterContractorsLabel: "контрагентів",
      importFilterTasksLabel: "робіт",
      importFilterCreatedLabel: "нових позицій",
      importFilterUpdatedLabel: "оновлень",
      importFilterPaymentsLabel: "платежів",
      importFilterDuplicatesLabel: "дублікатів",
      importFilterSkippedLabel: "пропусків",
      importFilterIssuesLabel: "проблем",
      importSkipRowLabel: "Пропустити рядок",
      importCreateItemLabel: "Створити нову позицію",
      importFallbackTaskLabel: "Імпортувати в типову роботу",
      importSkipWithoutPaymentLabel: "Імпортувати рядок без платежу",
      importUseTodayPaymentLabel: "Імпортувати платіж з поточною датою",
      importSkipDuplicateLabel: "Пропустити дублікат",
      importForcePaymentLabel: "Імпортувати все одно",
      importRowDecisionLabel: "Імпортувати рядок",
      importSkipLabel: "Пропустити",
      importAutoLabel: "Авто",
      importNoChangesValidation: "Немає змін для імпорту",
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

  // src/domain/contractors.ts
  function contractorName(name, emptyName) {
    const text = String(name ?? "").trim();
    return text || emptyName;
  }
  function contractorKey(name, emptyName) {
    return contractorName(name, emptyName).toLocaleLowerCase("uk-UA");
  }
  function contractorItemTotal(item) {
    const qty = item?.qty == null ? 1 : +item.qty || 0;
    return qty * (+item?.unitPrice || 0);
  }
  function contractorStatus(row) {
    if (row.rest < -0.5) return { key: "over", label: "Переплата" };
    if (row.budget > 0 && row.paid <= 0.5) return { key: "debt", label: "Без оплати" };
    if (row.budget > 0 && row.rest > 0.5) return { key: "debt", label: "Залишок" };
    if (row.budget > 0 && Math.abs(row.rest) <= 0.5) return { key: "paid", label: "Оплачено" };
    return { key: "empty", label: "Без сум" };
  }
  function isPinnedContractorRow(row, emptyName) {
    return !!row?.isForecast || row?.key === contractorKey(emptyName, emptyName);
  }
  function pinnedContractorRank(row, emptyName) {
    if (row?.isForecast) return 0;
    if (row?.key === contractorKey(emptyName, emptyName)) return 1;
    return 2;
  }
  function selectedContractorKeys(selected, isBlocked) {
    return Array.from(selected).filter((key) => !isBlocked(key));
  }
  function paymentRegisterTotal(rows) {
    return rows.reduce((sum, row) => sum + (+row.amount || 0), 0);
  }
  function paymentRegisterRowsFromContractorRows(rows) {
    return rows.filter((row) => !row.isForecast).flatMap(
      (row) => (row.payments || []).map((payment) => ({
        supplier: row.supplier,
        date: payment.date || "",
        amount: +payment.amount || 0,
        type: payment.typeLabel || payment.type || "Інше",
        taskNo: payment.taskNo,
        taskName: payment.taskName,
        itemName: payment.itemName,
        note: payment.note || ""
      }))
    ).sort(
      (a, b) => (a.date || "").localeCompare(b.date || "") || String(a.supplier || "").localeCompare(String(b.supplier || ""), "uk")
    );
  }
  function paymentRegisterFiltersLabel(filters, multiValues, typeLabel, categoryLabel) {
    const parts = [];
    if (filters.q) parts.push(`пошук: ${filters.q}`);
    const statuses = multiValues(filters.status);
    if (statuses.length) parts.push(`статус: ${statuses.join(", ")}`);
    const types = multiValues(filters.type);
    if (types.length) parts.push(`тип: ${types.map(typeLabel).join(", ")}`);
    const cats = multiValues(filters.cat);
    if (cats.length) parts.push(`категорія: ${cats.map(categoryLabel).join(", ")}`);
    return parts.join("; ") || "усі платежі";
  }
  function summarizeContractorBulkDelete(rows) {
    return rows.reduce(
      (acc, row) => {
        acc.contractors += 1;
        acc.items += row.itemsCount || 0;
        acc.payments += row.paymentsCount || 0;
        acc.acts += (row.acts || []).length || 0;
        return acc;
      },
      { contractors: 0, items: 0, payments: 0, acts: 0 }
    );
  }
  function buildContractorRows(tasks, options) {
    const {
      filters,
      emptyName,
      multiFilterHas,
      multiFilterValues,
      getTaskCostItems,
      addForecastRemainder,
      sort
    } = options;
    const buckets = /* @__PURE__ */ new Map();
    tasks.forEach((task, ti) => {
      if (!multiFilterHas(filters.cat, String(task.cat))) return;
      const costItems = getTaskCostItems(task);
      costItems.forEach((item, itemIndex) => {
        if (!multiFilterHas(filters.type, item.type || "other")) return;
        const supplier = contractorName(item.supplier, emptyName);
        const key = contractorKey(supplier, emptyName);
        const bucket = buckets.get(key) || {
          key,
          supplier,
          budget: 0,
          paid: 0,
          rest: 0,
          actsAmount: 0,
          actsDebt: 0,
          tasks: /* @__PURE__ */ new Set(),
          taskNames: /* @__PURE__ */ new Map(),
          items: [],
          acts: [],
          payments: [],
          lastPayment: "",
          search: ""
        };
        const itemBudget = contractorItemTotal(item);
        const itemPayments = item.payments || [];
        const itemPaid = itemPayments.reduce((sum, payment) => sum + (+payment.amount || 0), 0);
        const itemName = item.name || "Опис товару/послуги";
        bucket.budget += itemBudget;
        bucket.paid += itemPaid;
        bucket.tasks.add(task.id || String(task.n));
        bucket.taskNames.set(task.id || String(task.n), task.name);
        bucket.items.push({
          ti,
          itemId: item.id,
          itemIndex,
          taskNo: task.n,
          taskName: task.name,
          contractNo: item.contractNo || "-",
          itemName,
          type: item.type,
          total: itemBudget,
          budget: itemBudget,
          paid: itemPaid,
          note: item.contractNote || item.note || ""
        });
        (item.acts || []).forEach((act) => {
          const actAmount = +act.amount || 0;
          bucket.actsAmount += actAmount;
          bucket.acts.push({
            ti,
            taskNo: task.n,
            taskName: task.name,
            itemName,
            contractNo: item.contractNo || "",
            contractAmount: itemBudget,
            type: act.type || "contract",
            name: act.name || "",
            date: act.date || "",
            amount: actAmount,
            note: act.note || ""
          });
        });
        itemPayments.forEach((payment) => {
          bucket.payments.push({
            ti,
            taskNo: task.n,
            taskName: task.name,
            itemName,
            date: payment.date || "",
            type: payment.type || "other",
            amount: +payment.amount || 0,
            typeLabel: payment.typeLabel,
            contractNo: item.contractNo || "",
            contractAmount: itemBudget,
            actId: payment.actId || "",
            actNo: payment.actNo || "",
            note: payment.note || ""
          });
          if (payment.date && payment.date > bucket.lastPayment) bucket.lastPayment = payment.date;
        });
        bucket.search += ` ${supplier} ${task.name} ${itemName} ${item.type || ""} ${itemPayments.map((payment) => `${payment.note || ""} ${payment.amount || ""}`).join(" ")}`;
        buckets.set(key, bucket);
      });
      if (!multiFilterValues(filters.type).length && typeof addForecastRemainder === "function") {
        addForecastRemainder(buckets, task, ti, costItems);
      }
    });
    const q = String(filters.q || "").trim().toLocaleLowerCase("uk-UA");
    const rows = Array.from(buckets.values()).map((row) => {
      row.actsAmount = row.actsAmount || 0;
      row.rest = row.budget - row.paid;
      row.actsDebt = row.isForecast ? 0 : row.actsAmount - row.paid;
      row.tasksCount = row.tasks.size;
      row.itemsCount = row.items.length;
      row.paymentsCount = row.payments.length;
      row.topTask = Array.from(row.taskNames.values())[0] || "";
      row.status = contractorStatus(row).key;
      return row;
    }).filter((row) => {
      if (q && !String(row.search || "").toLocaleLowerCase("uk-UA").includes(q)) return false;
      const statuses = multiFilterValues(filters.status);
      if (statuses.length) {
        const matchesStatus = statuses.includes("debt") && row.rest > 0.5 || statuses.includes("paid") && row.budget > 0 && Math.abs(row.rest) <= 0.5 || statuses.includes("over") && row.rest < -0.5 || statuses.includes("unpaid") && row.budget > 0 && row.paid <= 0.5;
        if (!matchesStatus) return false;
      }
      return true;
    });
    rows.sort((a, b) => {
      const ap = isPinnedContractorRow(a, emptyName);
      const bp = isPinnedContractorRow(b, emptyName);
      if (ap !== bp) return ap ? -1 : 1;
      if (ap && bp) return pinnedContractorRank(a, emptyName) - pinnedContractorRank(b, emptyName);
      const av = a[sort.col];
      const bv = b[sort.col];
      const cmp = typeof av === "string" ? String(av ?? "").localeCompare(String(bv ?? ""), "uk") : (Number(av) || 0) - (Number(bv) || 0);
      return sort.dir * cmp;
    });
    rows.forEach((row, index) => {
      row.rowNo = index + 1;
    });
    return rows;
  }

  // src/domain/contractors-panel.ts
  function buildContractorSummaryModel(rows) {
    const total = rows.reduce(
      (acc, row) => {
        acc.budget += +row?.budget || 0;
        acc.paid += +row?.paid || 0;
        acc.rest += +row?.rest || 0;
        acc.actsAmount += +row?.actsAmount || 0;
        acc.actsDebt += +row?.actsDebt || 0;
        acc.payments += +row?.paymentsCount || 0;
        acc.items += +row?.itemsCount || 0;
        return acc;
      },
      { budget: 0, paid: 0, rest: 0, actsAmount: 0, actsDebt: 0, payments: 0, items: 0 }
    );
    return {
      total,
      realContractors: rows.filter((row) => !row?.isForecast).length,
      withDebt: rows.filter((row) => (+row?.rest || 0) > 0.5).length
    };
  }
  function hasContractorFilters(filters, multiValues) {
    return !!(multiValues(filters?.status).length || multiValues(filters?.type).length || multiValues(filters?.cat).length);
  }
  function getVisibleDeletableContractorRows(rows, isBlocked) {
    return (rows || []).filter((row) => !isBlocked(String(row?.key || "")) && !row?.isForecast);
  }
  function buildContractorBulkDeleteModel(keys, rows, isBlocked, summarize) {
    const uniqueKeys = Array.from(new Set(Array.from(keys || []))).filter((key) => !isBlocked(String(key || "")));
    const matchedRows = (rows || []).filter((row) => uniqueKeys.includes(String(row?.key || "")));
    return {
      uniqueKeys,
      rows: matchedRows,
      summary: summarize(matchedRows)
    };
  }
  function buildPaymentRegisterCurrentState(contractorRows, typeLabel) {
    const rows = (contractorRows || []).map((row) => ({
      ...row,
      payments: (row?.payments || []).map((payment) => ({
        ...payment,
        typeLabel: typeLabel(String(payment?.type || ""))
      }))
    }));
    const registerRows = rows.filter((row) => !row?.isForecast).flatMap(
      (row) => (row.payments || []).map((payment) => ({
        supplier: row.supplier,
        date: payment.date || "",
        amount: +payment.amount || 0,
        type: payment.typeLabel || payment.type || "",
        taskNo: payment.taskNo,
        taskName: payment.taskName,
        itemName: payment.itemName,
        note: payment.note || ""
      }))
    ).sort(
      (a, b) => String(a.date || "").localeCompare(String(b.date || "")) || String(a.supplier || "").localeCompare(String(b.supplier || ""), "uk")
    );
    const total = registerRows.reduce((sum, row) => sum + (+row.amount || 0), 0);
    return {
      rows: registerRows,
      total,
      count: registerRows.length
    };
  }
  function buildPaymentRegisterListItems(registers) {
    return (registers || []).map((register) => ({
      id: String(register?.id || ""),
      name: String(register?.name || ""),
      createdAt: String(register?.createdAt || ""),
      count: Array.isArray(register?.rows) ? register.rows.length : 0,
      total: +register?.total || 0,
      filtersLabel: String(register?.filtersLabel || "")
    }));
  }
  function buildSavedPaymentRegister(params) {
    return {
      id: params.id,
      name: params.name,
      createdAt: params.createdAt,
      filters: { ...params.filters },
      filtersLabel: params.filtersLabel,
      total: params.total,
      rows: params.rows
    };
  }
  function findPaymentRegisterById(registers, id) {
    return (registers || []).find((register) => String(register?.id) === String(id));
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

  // src/domain/costs.ts
  function createCostItem(input) {
    const { id, type = "material", defaultUnit } = input;
    return {
      id,
      type,
      name: "",
      supplier: "",
      unit: defaultUnit,
      qty: 1,
      unitPrice: null,
      contractNo: "",
      contractNote: "",
      payments: []
    };
  }
  function createCostPayment(input) {
    const { id, date, type = "act" } = input;
    return {
      id,
      date,
      type,
      amount: null,
      note: ""
    };
  }
  function removeCostItem(items, id) {
    return items.filter((item) => item.id !== id);
  }
  function updateCostItemField(items, id, field, value) {
    return items.map((item) => {
      if (item.id !== id) return item;
      const nextValue = value === "__custom" ? "" : value;
      return {
        ...item,
        [field]: nextValue,
        ...field === "contractNote" ? { note: nextValue } : {}
      };
    });
  }
  function updateCostItemContract(items, id, value, contractNamePrefix) {
    return items.map(
      (item) => item.id !== id ? item : {
        ...item,
        contractNo: value,
        name: value ? `${contractNamePrefix} ${value}` : ""
      }
    );
  }
  function toggleExpandedCostId(expandedIds, id) {
    return expandedIds.includes(id) ? expandedIds.filter((entry) => entry !== id) : [...expandedIds, id];
  }
  function addPaymentToCostItem(items, itemId, payment) {
    return items.map(
      (item) => item.id !== itemId ? item : {
        ...item,
        payments: [...Array.isArray(item.payments) ? item.payments : [], payment]
      }
    );
  }
  function removePaymentFromCostItem(items, itemId, paymentIndex) {
    return items.map((item) => {
      if (item.id !== itemId || !Array.isArray(item.payments)) return item;
      return {
        ...item,
        payments: item.payments.filter((_, index) => index !== paymentIndex)
      };
    });
  }
  function updateCostPaymentField(items, itemId, paymentIndex, field, value) {
    return items.map((item) => {
      if (item.id !== itemId || !Array.isArray(item.payments)) return item;
      return {
        ...item,
        payments: item.payments.map(
          (payment, index) => index !== paymentIndex ? payment : { ...payment, [field]: value }
        )
      };
    });
  }
  function calculateCostItemTotal(item) {
    const qty = item.qty == null ? 1 : +item.qty || 0;
    return qty * (+item.unitPrice || 0);
  }
  function calculateCostSpent(item) {
    return (Array.isArray(item.payments) ? item.payments : []).reduce(
      (sum, payment) => sum + (+payment.amount || 0),
      0
    );
  }
  function calculateCostTotals(items) {
    const budget = Math.round(items.reduce((sum, item) => sum + calculateCostItemTotal(item), 0));
    const spent = Math.round(items.reduce((sum, item) => sum + calculateCostSpent(item), 0));
    const rest = budget - spent;
    const pct = budget > 0 ? Math.round(spent / budget * 100) : 0;
    return { budget, spent, rest, pct };
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

  // src/domain/modal.ts
  function snapToHalfWeek(dateStr) {
    if (!dateStr) return dateStr;
    const [y, m, d] = dateStr.split("-").map(Number);
    const halfWeeks = [1, 4, 8, 11, 15, 18, 22, 25];
    let best = halfWeeks[0];
    let bestDiff = Math.abs(d - halfWeeks[0]);
    for (const day of halfWeeks) {
      const diff = Math.abs(d - day);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = day;
      }
    }
    return `${y}-${String(m).padStart(2, "0")}-${String(best).padStart(2, "0")}`;
  }
  function phaseToDateStr(project, mi, wi) {
    const absMonth = project.sy * 12 + project.sm + mi;
    const year = Math.floor(absMonth / 12);
    const month = absMonth % 12;
    const day = Math.min(1 + wi * 7, 28);
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  function dateStrToPhase(project, str) {
    if (!str) return { mi: 0, wi: 0 };
    const [y, m, d] = str.split("-").map(Number);
    const absMonth = y * 12 + (m - 1);
    const projectStart = project.sy * 12 + project.sm;
    return {
      mi: Math.max(0, Math.min(project.nm - 1, absMonth - projectStart)),
      wi: Math.min(3, Math.max(0, Math.floor((d - 1) / 7)))
    };
  }
  function getProjectMinDate(project) {
    return `${project.sy}-${String(project.sm + 1).padStart(2, "0")}-01`;
  }
  function getProjectMaxDate(project) {
    const absEnd = project.sy * 12 + project.sm + project.nm - 1;
    const year = Math.floor(absEnd / 12);
    const month = absEnd % 12 + 1;
    return `${year}-${String(month).padStart(2, "0")}-28`;
  }
  function getWeightedProgress(phases) {
    if (!phases?.length) return 0;
    if (phases.length === 1) return phases[0]?.prog || 0;
    const totalDuration = phases.reduce((sum, phase) => {
      return sum + Math.max(1, phase.me * 4 + phase.we - (phase.ms * 4 + phase.ws) + 1);
    }, 0);
    const weighted = phases.reduce((sum, phase) => {
      const duration = Math.max(1, phase.me * 4 + phase.we - (phase.ms * 4 + phase.ws) + 1);
      return sum + (phase.prog || 0) * duration;
    }, 0);
    return Math.round(weighted / totalDuration);
  }
  function getActivePhaseIndex(phases) {
    let last = 0;
    phases.forEach((phase, index) => {
      if ((phase.prog || 0) > 0) last = index;
    });
    return last;
  }
  function remWeeks(phase) {
    return Math.max(1, phase.me * 4 + phase.we - (phase.ms * 4 + phase.ws) + 1);
  }
  function buildTaskCalcModel(input) {
    const remainder = input.budget - input.spent;
    const weeks = input.phase ? remWeeks(input.phase) : 0;
    return {
      remainder,
      weeks,
      weeklyRate: weeks > 0 ? Math.round(remainder / weeks) : 0
    };
  }
  function buildDependencyListState(input) {
    const all = [];
    input.tasks.forEach((task, toTi) => {
      (task.deps || []).forEach((raw) => {
        const dep = input.normDep(raw);
        const fromTask = input.tasks.find((candidate) => candidate.id === dep.id);
        if (!fromTask) return;
        const fromTi = input.tasks.indexOf(fromTask);
        const type = dep.type || "FS";
        const threshold = dep.threshold || 0;
        all.push({
          index: all.length + 1,
          fromTi,
          toTi,
          fromTask,
          toTask: task,
          type,
          threshold,
          typeLabel: type === "SS" && threshold ? `SS+${threshold}%` : type,
          isCritical: input.criticalSet.has(fromTi) && input.criticalSet.has(toTi),
          fromColor: input.categories[fromTask.cat]?.color || "var(--txt3)",
          toColor: input.categories[task.cat]?.color || "var(--txt3)"
        });
      });
    });
    const counts = { all: all.length, FS: 0, SS: 0, FF: 0 };
    all.forEach((row) => {
      counts[row.type] = (counts[row.type] || 0) + 1;
    });
    const rows = input.filter === "all" ? all : all.filter((row) => row.type === input.filter);
    return {
      allCount: all.length,
      filteredCount: rows.length,
      counts,
      rows
    };
  }

  // src/domain/modal-orchestration.ts
  function cloneModalCostItems(items) {
    return (items || []).map((item) => ({
      ...item,
      payments: (item?.payments || []).map((payment) => ({ ...payment })),
      acts: (item?.acts || []).map((act) => ({ ...act }))
    }));
  }
  function cloneModalPhasesFromTask(task) {
    if (Array.isArray(task?.phases) && task.phases.length > 0) {
      return task.phases.map((phase) => ({ ...phase, prog: phase?.prog ?? 0 }));
    }
    return [{
      ms: task?.ms ?? 0,
      ws: task?.ws ?? 0,
      me: task?.me ?? 0,
      we: task?.we ?? 0,
      prog: task?.prog || 0,
      dsExact: task?.dsExact || null,
      deExact: task?.deExact || null
    }];
  }
  function buildTaskModalEditState(params) {
    const modalPhases = cloneModalPhasesFromTask(params.task);
    const modalDeps = (params.task?.deps || []).map((dep) => params.normDep(dep));
    const costItems = cloneModalCostItems(params.task?.costItems || []);
    const hasItems = costItems.length > 0;
    const contractsOverrideBudget = !!params.task?.contractsOverrideBudget;
    const taskBudget = +params.task?.budget || 0;
    return {
      modalPhases,
      modalDeps,
      costItems,
      hasItems,
      title: params.task?.name || params.editFallbackTitle,
      budgetValue: hasItems && (taskBudget <= 0 || contractsOverrideBudget) ? params.totalBudget : params.task?.budget || "",
      spentValue: hasItems ? params.totalSpent : params.task?.spent || "",
      contractsOverrideBudget
    };
  }
  function buildTaskModalCreateState(params) {
    return {
      editIdx: null,
      editingDepId: null,
      modalDeps: [],
      modalPhases: [{ ms: 0, ws: 0, me: 1, we: 3, prog: 0 }],
      costTi: null,
      costItems: [],
      expandedIds: /* @__PURE__ */ new Set(),
      title: params.title,
      budgetValue: "",
      spentValue: "",
      contractsOverrideBudget: false,
      calcInfoText: params.fillCostHint,
      showDependencyWarning: false,
      showDependencyEditor: false,
      hasItems: false,
      focusField: "name"
    };
  }
  function buildTaskModalSaveModel(params) {
    const phases = (params.phases || []).map((phase) => ({ ...phase }));
    const first = phases[0] || { ms: 0, ws: 0 };
    const last = phases[phases.length - 1] || first;
    const startIndex = first.ms * 4 + first.ws;
    const endIndex = last.me * 4 + last.we;
    const costItems = params.costItems.length > 0 ? cloneModalCostItems(params.costItems) : null;
    const budget = costItems && (params.contractsOverrideBudget || params.manualBudget <= 0) ? params.totalBudget : params.manualBudget;
    const spent = costItems ? params.totalSpent : params.manualSpent;
    const prog = getWeightedProgress(phases);
    return {
      isValidRange: startIndex <= endIndex,
      startIndex,
      endIndex,
      prog,
      budget,
      spent,
      taskPatch: {
        name: params.name,
        cat: params.cat,
        ms: first.ms,
        ws: first.ws,
        me: last.me,
        we: last.we,
        prog,
        budget,
        spent,
        contractsOverrideBudget: params.contractsOverrideBudget,
        deps: params.deps,
        phases: phases.length > 1 ? phases : null,
        costItems,
        dsExact: phases.length === 1 ? first.dsExact || null : null,
        deExact: phases.length === 1 ? first.deExact || null : null
      }
    };
  }
  function applyTaskSave(params) {
    const isEdit = params.editIdx !== null;
    if (isEdit) {
      const nextTasks = params.tasks.map(
        (task, index) => index === params.editIdx ? { ...task, ...params.taskPatch, notes: task.notes || [] } : task
      );
      return {
        tasks: nextTasks,
        nextN: params.nextN,
        savedTask: nextTasks[params.editIdx],
        isEdit: true
      };
    }
    const savedTask = {
      id: params.newTaskId,
      n: params.nextN,
      ...params.taskPatch,
      notes: []
    };
    return {
      tasks: [...params.tasks, savedTask],
      nextN: params.nextN + 1,
      savedTask,
      isEdit: false
    };
  }
  function removeTaskAt(tasks, index) {
    if (index < 0 || index >= tasks.length) return { tasks: [...tasks], removedTask: null };
    return {
      tasks: tasks.filter((_, taskIndex) => taskIndex !== index),
      removedTask: tasks[index] || null
    };
  }

  // src/domain/modal-panels.ts
  function cloneTaskNotes(notes) {
    return (notes || []).map((note) => ({
      ...note,
      history: (note.history || []).map((entry) => ({ ...entry }))
    }));
  }
  function addTaskNote(params) {
    const nextNotes = cloneTaskNotes(params.notes);
    nextNotes.push({
      id: params.id,
      text: params.text,
      author: params.author,
      date: params.date,
      history: []
    });
    return nextNotes;
  }
  function editTaskNote(params) {
    const nextNotes = cloneTaskNotes(params.notes);
    const target = nextNotes[params.index];
    if (!target) return nextNotes;
    target.history = target.history || [];
    target.history.push({
      action: "edit",
      text: target.text,
      author: params.author,
      date: params.date
    });
    target.text = params.text;
    return nextNotes;
  }
  function deleteTaskNote(params) {
    const nextNotes = cloneTaskNotes(params.notes);
    const target = nextNotes[params.index];
    if (!target) return nextNotes;
    target.history = target.history || [];
    target.history.push({
      action: "delete",
      text: target.text,
      author: params.author,
      date: params.date
    });
    target.text = params.deletedPlaceholderText;
    target.deleted = true;
    return nextNotes;
  }
  function countVisibleTaskNotes(notes) {
    return (notes || []).filter((note) => !note.deleted).length;
  }
  function cloneCategoryDrafts(categories) {
    return (categories || []).map((category) => ({ ...category }));
  }
  function removeCategoryDraftAt(categories, index) {
    return (categories || []).filter((_, categoryIndex) => categoryIndex !== index);
  }
  function createNextCategoryDraft(params) {
    const usedColors = params.categories.map((category) => category.color);
    const color = params.palette.find((candidate) => !usedColors.includes(candidate)) || params.palette[params.categories.length % params.palette.length];
    return [
      ...cloneCategoryDrafts(params.categories),
      { name: params.newCategoryName, color }
    ];
  }
  function isCategoryUsedByTasks(tasks, index) {
    return (tasks || []).some((task) => task.cat === index);
  }
  function buildProjectManagerGroupModel(params) {
    const grouped = groupProjectEntriesByAccess(Object.entries(params.projects || {}));
    const mapRow = ([id, snapshot]) => ({
      id,
      name: snapshot?.proj?.name || "",
      role: snapshot?._role || "owner",
      roleLabel: params.getRoleLabel(snapshot?._role || "owner"),
      tasksCount: Array.isArray(snapshot?.tasks) ? snapshot.tasks.length : 0,
      sharedMetaLine: params.getSharedMetaLine(snapshot?._access || null),
      canManageProject: params.canManageProject(id, snapshot),
      isActive: id === params.currentId
    });
    return {
      own: (grouped.own || []).map(mapRow),
      shared: (grouped.shared || []).map(mapRow)
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
  function resolveProjectDefaults(userDefaults, fallbackDefaults) {
    return {
      sm: userDefaults?.sm ?? fallbackDefaults.sm,
      sy: userDefaults?.sy ?? fallbackDefaults.sy,
      nm: userDefaults?.nm ?? fallbackDefaults.nm
    };
  }
  function canDeleteProjectCount(projectCount) {
    return projectCount > 1;
  }
  function resolveNextProjectAfterDeletion(projectIds, currentId, deletedId) {
    if (currentId !== deletedId) return currentId;
    return projectIds.find((projectId) => projectId !== deletedId) || null;
  }
  function buildProjectDeletionState(projectIds, currentId, deletedId) {
    const remainingProjectIds = (projectIds || []).filter((projectId) => projectId !== deletedId);
    const nextCurrentId = resolveNextProjectAfterDeletion(projectIds, currentId, deletedId);
    return {
      nextCurrentId,
      shouldReloadCurrent: currentId === deletedId && !!nextCurrentId,
      remainingProjectIds
    };
  }

  // src/domain/project-import.ts
  function createCopiedTask(input) {
    const { task, nextN, newId, copiedTaskSuffix } = input;
    return {
      ...task,
      id: newId,
      n: nextN,
      name: `${task.name}${copiedTaskSuffix}`,
      notes: [],
      phases: task.phases ? task.phases.map((phase) => ({ ...phase })) : null,
      ...Array.isArray(task.costItems) ? { costItems: task.costItems.map((item) => ({ ...item })) } : {},
      deps: []
    };
  }
  function projectNameExists(projects, name) {
    const needle = String(name || "").trim().toLowerCase();
    if (!needle) return false;
    return Object.values(projects || {}).some(
      (project) => String(project?.proj?.name || "").trim().toLowerCase() === needle
    );
  }
  function resolveUniqueProjectName(input) {
    const {
      projects,
      baseName,
      fallbackName,
      copiedTaskSuffix,
      numberedCopySuffix
    } = input;
    const cleanBase = String(baseName || fallbackName).trim() || fallbackName;
    if (!projectNameExists(projects, cleanBase)) return cleanBase;
    const firstCopy = `${cleanBase}${copiedTaskSuffix}`;
    if (!projectNameExists(projects, firstCopy)) return firstCopy;
    for (let i = 2; i < 1e3; i += 1) {
      const candidate = `${cleanBase}${numberedCopySuffix(i)}`;
      if (!projectNameExists(projects, candidate)) return candidate;
    }
    return `${cleanBase}${numberedCopySuffix(Date.now())}`;
  }
  function normalizeImportedBaseline(baseline, idMap) {
    if (!Array.isArray(baseline)) return baseline || null;
    return baseline.map((entry) => {
      const mappedId = idMap.get(String(entry?.id)) || idMap.get(String(entry?.n));
      if (!mappedId) return null;
      return { ...entry, id: mappedId };
    }).filter(Boolean);
  }
  function buildImportedProjectSnapshot(input) {
    const {
      data,
      fallbackProjectName,
      resolvedName,
      fallbackCategories,
      generatedTaskIds,
      meta
    } = input;
    const rawTasks = Array.isArray(data?.tasks) ? data.tasks : [];
    const idMap = /* @__PURE__ */ new Map();
    rawTasks.forEach((task, idx) => {
      const nextId = generatedTaskIds[idx] || `imported-task-${idx + 1}`;
      if (task?.id) idMap.set(String(task.id), nextId);
      if (task?.n !== void 0) idMap.set(String(task.n), nextId);
      idMap.set(String(idx + 1), nextId);
    });
    const normalizeDeps = (deps) => (Array.isArray(deps) ? deps : []).map((dep) => {
      const rawId = dep && typeof dep === "object" ? dep.id || dep.n : dep;
      const mappedId = idMap.get(String(rawId));
      if (!mappedId) return null;
      return {
        id: mappedId,
        type: dep?.type || "FS",
        threshold: dep?.threshold || 0
      };
    }).filter(Boolean);
    const tasks = rawTasks.map((task, idx) => {
      const taskId = idMap.get(String(task?.id || task?.n || idx + 1)) || generatedTaskIds[idx] || `imported-task-${idx + 1}`;
      const normalizedTask = {
        ...task,
        id: taskId,
        n: Number.isFinite(+task?.n) ? +task.n : idx + 1,
        name: String(task?.name || `Task ${idx + 1}`),
        cat: Number.isFinite(+task?.cat) ? +task.cat : 0,
        ms: Number.isFinite(+task?.ms) ? +task.ms : 0,
        ws: Number.isFinite(+task?.ws) ? +task.ws : 0,
        me: Number.isFinite(+task?.me) ? +task.me : 0,
        we: Number.isFinite(+task?.we) ? +task.we : 0,
        prog: Number.isFinite(+task?.prog) ? +task.prog : 0,
        budget: Number(task?.budget) || 0,
        spent: Number(task?.spent) || 0,
        deps: normalizeDeps(task?.deps),
        notes: Array.isArray(task?.notes) ? task.notes.map((note) => ({ ...note })) : []
      };
      if (Array.isArray(task?.phases)) {
        normalizedTask.phases = task.phases.map((phase) => ({
          ...phase,
          ms: Number.isFinite(+phase?.ms) ? +phase.ms : 0,
          me: Number.isFinite(+phase?.me) ? +phase.me : 0
        }));
      } else {
        normalizedTask.phases = null;
      }
      if (Array.isArray(task?.costItems)) {
        normalizedTask.costItems = task.costItems.map((item) => ({ ...item }));
      } else if (Array.isArray(task?.cost_items)) {
        normalizedTask.costItems = task.cost_items.map((item) => ({ ...item }));
      }
      delete normalizedTask.cost_items;
      return normalizedTask;
    });
    const maxN = tasks.reduce((maxValue, task) => Math.max(maxValue, +task.n || 0), 0);
    const importedProj = data?.proj || { name: fallbackProjectName };
    return {
      proj: {
        ...importedProj,
        name: resolvedName,
        baseline: normalizeImportedBaseline(importedProj.baseline, idMap)
      },
      cats: Array.isArray(data?.cats) ? data.cats.map((category) => ({
        name: String(category?.name || ""),
        color: String(category?.color || "#94a3b8")
      })) : fallbackCategories.map((category) => ({ ...category })),
      tasks,
      nextN: maxN + 1,
      ...meta || {}
    };
  }

  // src/domain/app.ts
  function buildMonthText(monthLabels, monthIndex) {
    return `${monthLabels[monthIndex]?.name || ""} ${monthLabels[monthIndex]?.y || ""}`.trim();
  }
  function buildDependencyText(deps) {
    return deps.map(
      (dep) => typeof dep === "number" ? dep : `${dep.n}(${dep.type}${dep.type === "SS" ? `+${dep.threshold || 0}%` : ""})`
    ).join(", ");
  }
  function buildProjectWorkbookExport(input) {
    const {
      projectName,
      tasks,
      categories,
      monthLabels,
      scheduleHeader,
      summaryHeader,
      estimateHeader,
      paymentsHeader,
      workbookSheets,
      getCategoryName,
      getTaskDuration,
      getTaskCostItems,
      costTypeLabels,
      paymentTypeLabels
    } = input;
    const scheduleRows = tasks.map((task) => [
      task.n,
      task.name,
      getCategoryName(task.cat),
      String(task.contr || ""),
      buildMonthText(monthLabels, task.ms),
      task.ws + 1,
      buildMonthText(monthLabels, task.me),
      task.we + 1,
      getTaskDuration(task),
      task.prog,
      Number(task.budget) || 0,
      Number(task.spent) || 0,
      (Number(task.budget) || 0) - (Number(task.spent) || 0),
      buildDependencyText(Array.isArray(task.deps) ? task.deps : [])
    ]);
    const summaryRows = categories.map((category, index) => {
      const categoryTasks = tasks.filter((task) => task.cat === index);
      const budget = categoryTasks.reduce((sum, task) => sum + (Number(task.budget) || 0), 0);
      const spent = categoryTasks.reduce((sum, task) => sum + (Number(task.spent) || 0), 0);
      const progress = categoryTasks.length ? Math.round(categoryTasks.reduce((sum, task) => sum + task.prog, 0) / categoryTasks.length) : 0;
      return [category.name, categoryTasks.length, budget, spent, budget - spent, progress];
    });
    const estimateRows = [];
    const paymentRows = [];
    tasks.forEach((task) => {
      getTaskCostItems(task).forEach((item) => {
        const qty = item.qty == null ? 1 : +item.qty || 0;
        const paid = (Array.isArray(item.payments) ? item.payments : []).reduce(
          (sum, payment) => sum + (+payment.amount || 0),
          0
        );
        estimateRows.push([
          task.n,
          task.name,
          costTypeLabels[item.type] || item.type,
          item.name,
          item.supplier,
          item.unit,
          qty,
          item.unitPrice || 0,
          qty * (+item.unitPrice || 0),
          paid
        ]);
        (Array.isArray(item.payments) ? item.payments : []).forEach((payment) => {
          paymentRows.push([
            task.n,
            task.name,
            item.supplier || "",
            costTypeLabels[item.type] || item.type || "",
            item.name || "",
            payment.date || "",
            paymentTypeLabels[payment.type] || payment.type || "",
            +payment.amount || 0,
            payment.note || ""
          ]);
        });
      });
    });
    const sheets = [
      {
        name: workbookSheets.schedule,
        rows: [scheduleHeader, ...scheduleRows],
        cols: [
          { wch: 5 },
          { wch: 36 },
          { wch: 22 },
          { wch: 18 },
          { wch: 16 },
          { wch: 7 },
          { wch: 16 },
          { wch: 7 },
          { wch: 10 },
          { wch: 10 },
          { wch: 14 },
          { wch: 14 },
          { wch: 14 },
          { wch: 18 }
        ],
        freeze: { xSplit: 0, ySplit: 1 }
      },
      {
        name: workbookSheets.summary,
        rows: [summaryHeader, ...summaryRows],
        cols: [
          { wch: 24 },
          { wch: 12 },
          { wch: 14 },
          { wch: 14 },
          { wch: 14 },
          { wch: 16 }
        ]
      }
    ];
    if (estimateRows.length) {
      sheets.push({
        name: workbookSheets.estimate,
        rows: [estimateHeader, ...estimateRows],
        cols: [
          { wch: 5 },
          { wch: 30 },
          { wch: 14 },
          { wch: 28 },
          { wch: 20 },
          { wch: 6 },
          { wch: 7 },
          { wch: 10 },
          { wch: 14 },
          { wch: 14 }
        ]
      });
    }
    if (paymentRows.length) {
      sheets.push({
        name: workbookSheets.payments,
        rows: [paymentsHeader, ...paymentRows],
        cols: [
          { wch: 5 },
          { wch: 30 },
          { wch: 24 },
          { wch: 14 },
          { wch: 28 },
          { wch: 13 },
          { wch: 12 },
          { wch: 16 },
          { wch: 28 }
        ]
      });
    }
    return {
      filename: `${projectName}.xlsx`,
      sheets
    };
  }
  function resolveImportSource(input) {
    const { data, fileName, fallbackProjectName, currentId } = input;
    const importBaseName = String(fileName || fallbackProjectName).replace(/\.json$/i, "");
    const projectName = String(data?.proj?.name || importBaseName || fallbackProjectName).trim() || fallbackProjectName;
    return {
      shouldSaveCurrent: Boolean(currentId),
      importBaseName,
      projectName,
      newProjectId: `p_${Date.now()}`
    };
  }
  function buildImportedProjectActivationState(input) {
    const nextProjects = {
      ...input.projects || {},
      [input.projectId]: input.snapshot
    };
    return {
      projects: nextProjects,
      currentId: input.projectId,
      role: input.role,
      hiddenCats: []
    };
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

  // src/services/supabase/runtime.ts
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
      const localMatch = Object.entries(localSynced).find(
        ([, localProject]) => localProject?._serverId === item.project_id
      );
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
  function buildSupabaseProjectSnapshot(localId, projectRow, taskRows, previousSnapshot, role, getStoredRole2) {
    const snapshot = mapProjectRowToSnapshot(projectRow, taskRows, role, {
      _access: previousSnapshot?._access,
      _localVersion: previousSnapshot?._localVersion,
      _serverVersion: previousSnapshot?._serverVersion,
      _localUpdatedAt: previousSnapshot?._localUpdatedAt
    });
    return {
      ...snapshot,
      _role: typeof getStoredRole2 === "function" ? getStoredRole2(localId, role) : role
    };
  }
  function resolveProjectLoadDecision(snapshot) {
    return {
      shouldSyncFirst: (snapshot?._localVersion || 0) > (snapshot?._serverVersion || 0),
      serverId: snapshot?._serverId || null,
      localVersion: snapshot?._localVersion || 0,
      serverVersion: snapshot?._serverVersion || 0
    };
  }
  function buildProjectSyncSuccessSnapshot(snapshot) {
    return {
      ...snapshot,
      _serverVersion: snapshot._localVersion || 0
    };
  }
  function buildProjectCreateSuccessSnapshot(snapshot, serverId) {
    return {
      ...snapshot,
      _serverId: serverId,
      _role: "owner"
    };
  }
  function resolveCurrentProjectId(projects, currentId, bufferCurrentId) {
    if (bufferCurrentId && projects[bufferCurrentId]) return bufferCurrentId;
    if (currentId && projects[currentId]) return currentId;
    return Object.keys(projects)[0] || null;
  }

  // src/services/supabase/account-runtime.ts
  function buildAuthRedirectUrl(origin, pathname) {
    return `${origin}${pathname}`;
  }
  function buildSupabaseRegisterRequest(name, email, password, redirectUrl) {
    return {
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: redirectUrl
      }
    };
  }
  function buildSupabaseLoginRequest(email, password) {
    return {
      email,
      password
    };
  }
  function buildSupabaseProfileSelectRequest(userId) {
    return {
      userId
    };
  }
  function buildSupabaseProfileUpdatePayload(updates) {
    const dbUpdates = {};
    if (updates.name !== void 0) dbUpdates.name = updates.name;
    if (updates.avatar !== void 0) dbUpdates.avatar = updates.avatar;
    if (updates.theme !== void 0) dbUpdates.theme = updates.theme;
    if (updates.defaults) {
      if (updates.defaults.sm !== void 0) dbUpdates.default_sm = updates.defaults.sm;
      if (updates.defaults.sy !== void 0) dbUpdates.default_sy = updates.defaults.sy;
      if (updates.defaults.nm !== void 0) dbUpdates.default_nm = updates.defaults.nm;
    }
    return dbUpdates;
  }
  function buildSupabaseAccountErrorMessages() {
    return {
      missingConfig: "Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
      emailConfirmationRequired: "Check your email to confirm registration."
    };
  }

  // src/services/supabase/auth-runtime.ts
  function resetSupabaseAuthState() {
    return {
      user: null,
      profile: null,
      projectRole: null
    };
  }
  function buildLogoutSyncDecision(snapshot) {
    return {
      shouldSync: (snapshot?._localVersion || 0) > (snapshot?._serverVersion || 0)
    };
  }
  function buildHydratedAuthState(user, profile) {
    return {
      user,
      profile
    };
  }
  function resolveSupabaseAuthEventPlan(event, hasSessionUser) {
    if ((event === "INITIAL_SESSION" || event === "SIGNED_IN") && hasSessionUser) {
      return {
        kind: "hydrate",
        loadProjects: true
      };
    }
    if (event === "TOKEN_REFRESHED" && hasSessionUser) {
      return {
        kind: "refresh",
        loadProjects: false
      };
    }
    if (event === "USER_UPDATED" && hasSessionUser) {
      return {
        kind: "hydrate",
        loadProjects: false
      };
    }
    if (event === "SIGNED_OUT") {
      return {
        kind: "signed_out",
        loadProjects: false,
        refreshStatus: "offline"
      };
    }
    return {
      kind: "noop",
      loadProjects: false
    };
  }

  // src/services/supabase/project-runtime.ts
  function resolveLoadedProjectRole(ownerId, authUserId, shareRole) {
    if (ownerId && ownerId === authUserId) return "owner";
    return normalizeProjectRole(shareRole || "viewer");
  }
  function buildProjectTasksRpcRequest(projectId, tasks) {
    return {
      p_project_id: projectId,
      p_tasks: buildUpsertTasksPayload(tasks || [])
    };
  }
  function buildProjectSyncMutationRequest(projectId, snapshot, updatedAt = (/* @__PURE__ */ new Date()).toISOString()) {
    return {
      projectId,
      updatePayload: {
        ...buildProjectMutationPayload(snapshot),
        updated_at: updatedAt
      },
      tasksRpc: buildProjectTasksRpcRequest(projectId, snapshot.tasks || []),
      expectedTaskCount: (snapshot.tasks || []).length
    };
  }
  function buildProjectCreateMutationRequest(snapshot, ownerId) {
    const expectedTaskCount = (snapshot.tasks || []).length;
    return {
      insertPayload: buildProjectInsertPayload(snapshot, ownerId),
      tasksRpc: expectedTaskCount > 0 ? buildProjectTasksRpcRequest("__PROJECT_ID__", snapshot.tasks || []) : null,
      expectedTaskCount
    };
  }
  function bindProjectCreateTasksRpcRequest(request, projectId) {
    if (!request.tasksRpc) return null;
    return {
      ...request.tasksRpc,
      p_project_id: projectId
    };
  }
  function buildProjectDeleteRequest(projectId) {
    return { projectId };
  }

  // src/services/supabase/collaboration-runtime.ts
  function buildActivityWriteRequest(params) {
    const activityPayload = { ...params.payload || {} };
    const entityType = typeof activityPayload.entityType === "string" && activityPayload.entityType ? activityPayload.entityType : "project";
    const entityId = activityPayload.entityId != null ? String(activityPayload.entityId) : null;
    delete activityPayload.entityType;
    delete activityPayload.entityId;
    return {
      eventType: params.eventType,
      payload: buildActivityInsertPayload({
        projectId: params.projectId,
        actorId: params.actorId,
        actorName: params.actorName ?? null,
        actorEmail: params.actorEmail ?? null,
        eventType: params.eventType,
        entityType,
        entityId,
        payload: activityPayload
      })
    };
  }
  function normalizeShareGrantInput(email, role, isShareableRole) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) throw new Error(buildSupabaseCollaborationErrorMessages().emptyEmail);
    const normalizedRole = normalizeProjectRole(role);
    if (!isShareableRole(normalizedRole)) throw new Error(buildSupabaseCollaborationErrorMessages().unsupportedRole);
    return {
      normalizedEmail,
      normalizedRole
    };
  }
  function buildShareGrantRequest(params) {
    return buildProjectShareUpsertPayload({
      projectId: params.projectId,
      userId: params.userId,
      role: params.role,
      invitedBy: params.invitedBy
    });
  }
  function buildShareGrantResult(userId, email, role) {
    return {
      userId,
      email,
      role
    };
  }
  function buildShareLookupRequest(email) {
    return {
      p_email: email
    };
  }
  function resolveShareTargetUser(targetUserId, authUserId) {
    if (!targetUserId) {
      throw new Error(buildSupabaseCollaborationErrorMessages().userNotFound);
    }
    if (targetUserId === authUserId) {
      throw new Error(buildSupabaseCollaborationErrorMessages().ownerAlreadyHasAccess);
    }
    return targetUserId;
  }
  function buildShareUpsertOptions() {
    return {
      onConflict: "project_id,user_id"
    };
  }
  function buildShareRoleUpdateRequest(role, isShareableRole) {
    const normalizedRole = normalizeProjectRole(role);
    if (!isShareableRole(normalizedRole)) throw new Error(buildSupabaseCollaborationErrorMessages().unsupportedRole);
    return buildProjectShareRoleUpdatePayload(normalizedRole);
  }
  function buildShareRoleUpdateResult(role) {
    return normalizeProjectRole(role);
  }
  function buildShareListRpcRequest(projectId) {
    return {
      p_project_id: projectId
    };
  }
  function buildShareListFallbackRequest(projectId) {
    return {
      projectId
    };
  }
  function buildShareRemoveRequest(shareId) {
    return {
      shareId
    };
  }
  function resolveActivityLogLimit(limit) {
    return Math.max(1, Math.min(500, Number(limit) || 100));
  }
  function buildActivityLogReadRequest(projectId, limit) {
    return {
      projectId,
      limit: resolveActivityLogLimit(limit)
    };
  }
  function buildSupabaseCollaborationErrorMessages() {
    return {
      invitePermissionDenied: "You do not have permission to invite users.",
      manageAccessPermissionDenied: "You do not have permission to manage access.",
      removeAccessPermissionDenied: "You do not have permission to remove access.",
      emptyEmail: "Enter email.",
      unsupportedRole: "Unsupported access role.",
      userNotFound: "User with this email was not found. They need to register first.",
      ownerAlreadyHasAccess: "You already have access to this project as the owner."
    };
  }

  // src/services/supabase/ui-runtime.ts
  function buildSupabaseShareModalState(params) {
    return {
      projectName: params.projectName,
      items: (params.shares || []).map((share) => ({
        id: String(share.id || ""),
        role: String(share.role || "viewer"),
        normalizedRole: normalizeProjectRole(String(share.role || "viewer")),
        roleLabel: params.getRoleLabel(String(share.role || "viewer")),
        displayLabel: share.user?.email || share.user?.name || share.user?.id || "-"
      }))
    };
  }
  function buildSupabaseShareRoleOptions(roles, getRoleLabel, selectedRole) {
    const normalizedSelectedRole = normalizeProjectRole(selectedRole || "viewer");
    return (roles || []).map(
      (role) => `<option value="${role}"${normalizeProjectRole(role) === normalizedSelectedRole ? " selected" : ""}>${getRoleLabel(role)}</option>`
    ).join("");
  }
  function buildSupabaseShareRoleGuide() {
    return [
      {
        role: "manager",
        title: "Manager",
        description: "manages access and project settings."
      },
      {
        role: "editor",
        title: "Editor",
        description: "edits tasks but cannot manage access."
      },
      {
        role: "viewer",
        title: "Viewer",
        description: "read-only access."
      }
    ];
  }
  function buildSupabaseShareDialogModel() {
    return {
      accessDeniedTitle: "You do not have permission to manage access.",
      emptyText: "No shared users yet",
      modalTitle: "Shared Access",
      projectLabel: "Project",
      grantSectionTitle: "Grant access:",
      emailPlaceholder: "email@example.com",
      confirmButtonText: "Grant access",
      cancelButtonText: "Close",
      emailRequiredMessage: "Enter email"
    };
  }
  function buildSupabaseShareErrorMessages() {
    return {
      updateRoleErrorTitle: "Failed to update role",
      updateRoleErrorText: "Try again.",
      removeAccessErrorTitle: "Failed to remove access",
      removeAccessErrorText: "Try again."
    };
  }
  function buildSupabaseReadOnlyUiState(params) {
    return {
      readonly: params.readonly,
      showReadonlyBanner: params.readonly,
      headerBannerVisible: params.bannerModel.shouldShow,
      headerBannerClassName: `project-access-banner${params.readonly ? " is-readonly" : " is-limited"}`,
      headerBannerHtml: params.bannerModel.shouldShow ? `<span class="project-access-pill">${params.bannerModel.roleLabel}</span><span class="project-access-text">${params.bannerModel.roleHint}${params.bannerModel.sharedMetaText ? ` ${params.bannerModel.sharedMetaText}` : ""}</span>` : "",
      ganttPointerEvents: params.readonly ? "none" : "",
      ganttOpacity: params.readonly ? "0.85" : "",
      ganttTitle: params.readonly ? "View-only mode - editing is disabled" : "",
      addButtonVisible: !params.readonly,
      shareButtonVisible: params.isLoggedIn && params.canShare
    };
  }
  function buildSupabaseRoleUpdatedToast(roleLabel) {
    return {
      title: `Role updated: ${roleLabel}`,
      timer: 2600
    };
  }
  function buildSupabaseShareGrantedToast(roleLabel, email) {
    return {
      title: `Access granted: ${roleLabel}`,
      text: email,
      timer: 2800
    };
  }
  function buildSupabaseShareRemovedToast() {
    return {
      title: "Access removed",
      timer: 2400
    };
  }
  function buildSupabaseSyncIndicatorPlan(timeoutMs = 1800) {
    return {
      status: "syncing",
      timeoutMs
    };
  }

  // src/runtime/supabase-runtime-helpers.ts
  function getStoredRole(localId, role) {
    const scope = globalThis;
    return typeof scope.getStoredProjectRole === "function" ? scope.getStoredProjectRole(localId, role) : role;
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
    buildRuntimeResetFallbackAuthState: resetFallbackAuthState,
    buildRuntimeFallbackRegisterRequest: buildFallbackRegisterRequest,
    buildRuntimeFallbackLoginRequest: buildFallbackLoginRequest,
    buildRuntimeFallbackProfileUpdateRequest: buildFallbackProfileUpdateRequest,
    buildRuntimeFallbackAuthHydratedState: buildFallbackAuthHydratedState,
    buildRuntimeFallbackSyncIndicatorPlan: buildFallbackSyncIndicatorPlan,
    buildRuntimeFallbackHttpRequestOptions: buildFallbackHttpRequestOptions,
    buildRuntimeFallbackHttpOutcome: resolveFallbackHttpOutcome,
    buildRuntimeFallbackProjectShell: buildFallbackProjectShell,
    buildRuntimeFallbackLoadedProjectSnapshot: buildFallbackLoadedProjectSnapshot,
    buildRuntimeFallbackProjectSyncRequest: buildFallbackProjectSyncRequest,
    buildRuntimeFallbackProjectCreateRequest: buildFallbackProjectCreateRequest,
    buildRuntimeFallbackProjectDeleteRequest: buildFallbackProjectDeleteRequest,
    buildRuntimeFallbackShareGrantRequest: buildFallbackShareGrantRequest,
    buildRuntimeFallbackShareRoleUpdateRequest: buildFallbackShareRoleUpdateRequest,
    buildRuntimeFallbackShareRemoveRequest: buildFallbackShareRemoveRequest,
    buildRuntimeFallbackShareModalState: buildFallbackShareModalState,
    analyzeBufferedProjectsForUser: analyzeBufferedProjects,
    mergeAccessibleProjectsIntoLocalState,
    buildRuntimeResolveProjectLoadDecision: resolveProjectLoadDecision,
    buildRuntimeResolveCurrentProjectId: resolveCurrentProjectId,
    buildRuntimeAuthRedirectUrl: buildAuthRedirectUrl,
    buildRuntimeSupabaseRegisterRequest: buildSupabaseRegisterRequest,
    buildRuntimeSupabaseLoginRequest: buildSupabaseLoginRequest,
    buildRuntimeSupabaseAccountErrorMessages: buildSupabaseAccountErrorMessages,
    buildRuntimeSupabaseProfileSelectRequest: buildSupabaseProfileSelectRequest,
    buildRuntimeSupabaseProfileUpdatePayload: buildSupabaseProfileUpdatePayload,
    buildRuntimeResetSupabaseAuthState: resetSupabaseAuthState,
    buildRuntimeLogoutSyncDecision: buildLogoutSyncDecision,
    buildRuntimeHydratedAuthState: buildHydratedAuthState,
    buildRuntimeResolveSupabaseAuthEventPlan: resolveSupabaseAuthEventPlan,
    buildRuntimeSupabaseShareModalState: buildSupabaseShareModalState,
    buildRuntimeSupabaseShareRoleOptions: buildSupabaseShareRoleOptions,
    buildRuntimeSupabaseShareRoleGuide: buildSupabaseShareRoleGuide,
    buildRuntimeSupabaseShareDialogModel: buildSupabaseShareDialogModel,
    buildRuntimeSupabaseShareErrorMessages: buildSupabaseShareErrorMessages,
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
    buildRuntimeSupabaseCollaborationErrorMessages: buildSupabaseCollaborationErrorMessages,
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
    buildSupabaseProjectSnapshot: (localId, projectRow, taskRows, previousSnapshot, role) => buildSupabaseProjectSnapshot(localId, projectRow, taskRows, previousSnapshot, role, getStoredRole),
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
    getRuntimeProjectSyncState: getProjectSyncState,
    getRuntimeSyncBadge: getSyncBadge,
    resolveRuntimeSyncStatus: resolveSyncStatus,
    buildRuntimeProjectSnapshotMeta: buildProjectSnapshotMeta,
    buildRuntimeInitialProjectSnapshotMeta: buildInitialProjectSnapshotMeta,
    buildRuntimeStorageBufferPayload: buildStorageBufferPayload,
    buildRuntimeStorageUiModel: buildStorageUiModel,
    buildRuntimeProjectSettingsUpdate: applyProjectSettingsUpdate,
    buildRuntimeProjectDeletionState: buildProjectDeletionState,
    buildRuntimeCreateEmptyProjectSnapshot: createEmptyProjectSnapshot,
    buildRuntimeCreateDemoProjectSnapshot: createDemoProjectSnapshot,
    canRuntimeDeleteProjectCount: canDeleteProjectCount,
    buildRuntimeResolveProjectDefaults: resolveProjectDefaults,
    resolveRuntimeNextProjectAfterDeletion: resolveNextProjectAfterDeletion,
    buildRuntimeCopiedTask: createCopiedTask,
    checkRuntimeProjectNameExists: projectNameExists,
    buildRuntimeUniqueProjectName: resolveUniqueProjectName,
    buildRuntimeNormalizeImportedBaseline: normalizeImportedBaseline,
    buildRuntimeImportedProjectSnapshot: buildImportedProjectSnapshot,
    buildRuntimeProjectWorkbookExport: buildProjectWorkbookExport,
    buildRuntimeResolveImportSource: resolveImportSource,
    buildRuntimeImportedProjectActivationState: buildImportedProjectActivationState,
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
    buildRuntimeFallbackAuthModalRenderModel: buildFallbackAuthModalRenderModel,
    buildRuntimeFallbackAuthButtonModel: buildFallbackAuthButtonModel,
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
    buildRuntimeTaskModalCreateState: buildTaskModalCreateState,
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
    buildRuntimeAuditLogModalModel: buildAuditLogModalModel
  };
  Object.assign(globalThis, runtimeHelpers);
})();
