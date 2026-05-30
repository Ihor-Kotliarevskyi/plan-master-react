let _modalPhases = [];
let _modalDeps = [];
let _editingDepId = null;
let _notesSession = typeof buildRuntimeCloseTaskNotesSession === "function"
  ? buildRuntimeCloseTaskNotesSession()
  : { taskIndex: null, title: "", notes: [], exists: false, visible: false };
let _reactProjectManagerState = {
  visible: false,
};
let _reactProjectSettingsState = {
  visible: false,
};

function isReactProjectManagerEnabled() {
  return document.body?.dataset?.reactTransitionProjectManager === "enabled";
}

function syncReactProjectManagerBridge() {
  document.dispatchEvent(new CustomEvent("plan-master:project-manager-sync"));
}

function isReactProjectSettingsEnabled() {
  return document.body?.dataset?.reactTransitionProjectSettings === "enabled";
}

function syncReactProjectSettingsBridge() {
  document.dispatchEvent(new CustomEvent("plan-master:project-settings-sync"));
}

function _getTaskRangeWarningModel() {
  if (typeof buildRuntimeTaskRangeWarningModel === "function") return buildRuntimeTaskRangeWarningModel();
  return { title: "Невірний діапазон", text: "Початок не може бути після кінця." };
}

function _getTaskDependencyWarningDialogModel() {
  if (typeof buildRuntimeTaskDependencyWarningDialogModel === "function") return buildRuntimeTaskDependencyWarningDialogModel();
  return { title: "Порушення залежностей", confirmButtonText: "Зберегти", cancelButtonText: "Повернутися" };
}

function _getTaskSavedToastModel(isEdit) {
  if (typeof buildRuntimeTaskSavedToastModel === "function") return buildRuntimeTaskSavedToastModel(isEdit);
  return { title: isEdit ? "Роботу оновлено" : "Роботу додано" };
}

function _getTaskDeleteDialogModel(taskName) {
  if (typeof buildRuntimeTaskDeleteDialogModel === "function") return buildRuntimeTaskDeleteDialogModel(taskName);
  return { title: "Видалити роботу?", confirmButtonText: "Видалити", confirmButtonColor: "#c42b2b", cancelButtonText: "Скасувати" };
}

function _getProjectManagerListModel() {
  if (typeof buildRuntimeProjectManagerListModel === "function") return buildRuntimeProjectManagerListModel();
  return {
    ownGroupTitle: "Мої проєкти",
    sharedGroupTitle: "Розшарені проєкти",
    ownProjectMeta: "Власний проєкт",
    tasksCountLabel: (count) => `${count} робіт`,
    deleteTitle: "Видалити",
  };
}

function _getDemoProjectDialogModel() {
  if (typeof buildRuntimeDemoProjectDialogModel === "function") return buildRuntimeDemoProjectDialogModel();
  return {
    title: "Завантажити демо-проєкт?",
    html: `<div class="swal-info-text">Буде створено проєкт «Ремонт офісу» з прикладом задач, категорій та бюджету.<br><br>Ваші поточні проєкти залишаться без змін.</div>`,
    confirmButtonText: "Завантажити",
    cancelButtonText: "Скасувати",
    loadedToastTitle: "Демо-проєкт завантажено",
  };
}

function _getCreateProjectDialogModel() {
  if (typeof buildRuntimeCreateProjectDialogModel === "function") return buildRuntimeCreateProjectDialogModel();
  return {
    title: "Новий проєкт",
    inputLabel: "Назва проєкту",
    inputValue: "Новий проєкт",
    confirmButtonText: "Створити",
    cancelButtonText: "Скасувати",
    inputRequiredMessage: "Введіть назву",
  };
}

function _getCannotDeleteLastProjectModel() {
  if (typeof buildRuntimeCannotDeleteLastProjectModel === "function") return buildRuntimeCannotDeleteLastProjectModel();
  return { title: "Неможливо видалити", text: "Має залишатися хоча б один проєкт." };
}

function _getDeleteProjectDialogModel(projectName) {
  if (typeof buildRuntimeDeleteProjectDialogModel === "function") return buildRuntimeDeleteProjectDialogModel(projectName);
  return {
    title: "Видалити проєкт?",
    html: `«${projectName}»<br><small>Цю дію неможливо скасувати.</small>`,
    confirmButtonText: "Видалити",
    confirmButtonColor: "#c42b2b",
    cancelButtonText: "Скасувати",
  };
}

function _getProjectManagerBridgeState() {
  const projectManagerList = _getProjectManagerListModel();
  const getManagePermission = (projectId) => {
    if (typeof getProjectPermissions !== "function") return true;
    const role = typeof getStoredProjectRole === "function"
      ? getStoredProjectRole(projectId, "owner")
      : allProjects?.[projectId]?._role || (projectId === currentId ? _projectRole : "owner");
    return getProjectPermissions(role).canManageProject;
  };
  const roleLabels = typeof PROJECT_ROLE_LABELS !== "undefined" ? PROJECT_ROLE_LABELS : {};
  const groups = typeof buildRuntimeProjectManagerGroupModel === "function"
    ? buildRuntimeProjectManagerGroupModel({
        projects: allProjects || {},
        currentId,
        canManageProject: (projectId) => getManagePermission(projectId),
        getRoleLabel: (role) => typeof getRuntimeProjectRoleLabel === "function"
          ? getRuntimeProjectRoleLabel(role)
          : (roleLabels[role] || role),
        getSharedMetaLine: (access) => typeof buildRuntimeSharedProjectMetaLine === "function"
          ? buildRuntimeSharedProjectMetaLine(access || null)
          : projectManagerList.ownProjectMeta,
      })
    : { own: [], shared: [] };

  return {
    visible: _reactProjectManagerState.visible,
    labels: {
      title: "Управління проєктами",
      createButton: "+ Новий проєкт",
      loadDemoButton: "Завантажити демо-проєкт",
      closeButton: "Закрити",
      ownGroupTitle: projectManagerList.ownGroupTitle,
      sharedGroupTitle: projectManagerList.sharedGroupTitle,
      ownProjectMeta: projectManagerList.ownProjectMeta,
      deleteTitle: projectManagerList.deleteTitle,
      createDialog: _getCreateProjectDialogModel(),
      demoDialog: _getDemoProjectDialogModel(),
      cannotDelete: _getCannotDeleteLastProjectModel(),
    },
    groups,
    canDeleteMultipleProjects: _canDeleteProjectCount(Object.keys(allProjects || {}).length),
    capturedAt: new Date().toISOString(),
  };
}

function _getProjectSettingsBridgeState() {
  const canManage = typeof canManageProject === "function" ? canManageProject() : true;
  const formState = typeof buildRuntimeProjectSettingsFormState === "function"
    ? buildRuntimeProjectSettingsFormState({ project: proj, canManage })
    : {
        name: proj.name,
        sm: proj.sm,
        sy: proj.sy,
        nm: proj.nm,
        canManage,
      };

  return {
    visible: _reactProjectSettingsState.visible,
    labels: {
      title: "Налаштування проєкту",
      nameLabel: "Назва",
      startMonthLabel: "Початок місяць",
      yearLabel: "Рік",
      durationLabel: "Тривалість (міс.)",
      categoriesButton: "Редагувати категорії",
      cancelButton: "Скасувати",
      saveButton: "Зберегти",
    },
    formState,
    monthOptions: MN.map((name, index) => ({ value: index, label: name })),
    capturedAt: new Date().toISOString(),
  };
}

function _getNotesModalModel() {
  if (typeof buildRuntimeNotesModalModel === "function") return buildRuntimeNotesModalModel();
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
    deleteDialogCancelButtonText: "Скасувати",
  };
}

function _getCategoryEditorModel() {
  if (typeof buildRuntimeCategoryEditorModel === "function") return buildRuntimeCategoryEditorModel();
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
    newCategoryName: "Нова категорія",
  };
}

function _getDependencyListModalModel() {
  if (typeof buildRuntimeDependencyListModalModel === "function") return buildRuntimeDependencyListModalModel();
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
    criticalRowTitle: "Критична залежність",
  };
}

function _getDependencyEditorModel() {
  if (typeof buildRuntimeDependencyEditorModel === "function") return buildRuntimeDependencyEditorModel();
  return {
    deleteBadgeLabel: "Видалити",
    independentLabel: "Незал.",
    finishStartTip: "Після завершення",
    startStartTip: "Після початку + %",
    independentTip: "Незалежний зв'язок",
    minThresholdLabel: "Мін.:",
    dropdownFallbackLabel: "#?",
  };
}

function _getTaskFormPanelModel() {
  if (typeof buildRuntimeTaskFormPanelModel === "function") return buildRuntimeTaskFormPanelModel();
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
    weeklyRateUnit: "грн/тижд.",
  };
}

function _getDemoProjectSeedModel() {
  if (typeof buildRuntimeDemoProjectSeedModel === "function") return buildRuntimeDemoProjectSeedModel();
  return {
    projectName: "Ремонт офісу (демо)",
  };
}

function _buildProjectLifecycleMeta() {
  if (typeof buildRuntimeInitialProjectSnapshotMeta === "function") {
    return buildRuntimeInitialProjectSnapshotMeta();
  }
  return {
    _localUpdatedAt: new Date().toISOString(),
    _localVersion: 1,
    _serverVersion: 0,
  };
}

function _buildProjectSettingsUpdate(snapshot, updates) {
  if (typeof buildRuntimeProjectSettingsUpdate === "function") {
    return buildRuntimeProjectSettingsUpdate({
      snapshot,
      name: updates.name,
      sm: updates.sm,
      sy: updates.sy,
      nm: updates.nm,
    });
  }

  const before = { name: snapshot.proj.name, sm: snapshot.proj.sm, sy: snapshot.proj.sy, nm: snapshot.proj.nm };
  const name = updates.name.trim() || snapshot.proj.name;
  const sm = +updates.sm;
  const sy = +updates.sy;
  const nm = Math.min(120, Math.max(3, +updates.nm));
  const oldAbsStart = snapshot.proj.sy * 12 + snapshot.proj.sm;
  const newAbsStart = sy * 12 + sm;
  const shift = oldAbsStart - newAbsStart;
  const shiftedTasks = shift !== 0;

  return {
    snapshot: {
      ...snapshot,
      proj: { ...snapshot.proj, name, sm, sy, nm },
      tasks: shiftedTasks
        ? snapshot.tasks.map((task) => ({
            ...task,
            ms: Math.max(0, task.ms + shift),
            me: Math.max(0, task.me + shift),
            phases: task.phases
              ? task.phases.map((phase) => ({
                  ...phase,
                  ms: Math.max(0, phase.ms + shift),
                  me: Math.max(0, phase.me + shift),
                }))
              : task.phases || null,
          }))
        : snapshot.tasks,
    },
    before,
    after: { name, sm, sy, nm },
    shift,
    shiftedTasks,
  };
}

function _buildEmptyProjectSnapshot(name, defaults) {
  const meta = _buildProjectLifecycleMeta();
  if (typeof buildRuntimeCreateEmptyProjectSnapshot === "function") {
    return buildRuntimeCreateEmptyProjectSnapshot({
      name,
      defaults,
      categories: DEF_CATS,
      meta,
    });
  }

  return {
    proj: {
      name: name.trim(),
      sm: defaults.sm,
      sy: defaults.sy,
      nm: defaults.nm,
    },
    cats: DEF_CATS.map((c) => ({ ...c })),
    tasks: [],
    nextN: 1,
    ...meta,
  };
}

function _buildDemoProjectSnapshot(projectName, startYear) {
  const meta = _buildProjectLifecycleMeta();
  if (typeof buildRuntimeCreateDemoProjectSnapshot === "function") {
    return buildRuntimeCreateDemoProjectSnapshot({
      projectName,
      startYear,
      categories: DEF_CATS,
      tasks: DEF_TASKS,
      nextN: DEF_TASKS.length + 1,
      meta,
    });
  }

  return {
    proj: { name: projectName, sm: 0, sy: startYear, nm: 12 },
    cats: DEF_CATS.map((c) => ({ ...c })),
    tasks: DEF_TASKS.map((t) => ({ ...t })),
    nextN: DEF_TASKS.length + 1,
    ...meta,
  };
}

function _canDeleteProjectCount(projectCount) {
  if (typeof canRuntimeDeleteProjectCount === "function") return canRuntimeDeleteProjectCount(projectCount);
  return projectCount > 1;
}

function _resolveNextProjectAfterDeletion(projectIds, currentProjectId, deletedProjectId) {
  if (typeof resolveRuntimeNextProjectAfterDeletion === "function") {
    return resolveRuntimeNextProjectAfterDeletion(projectIds, currentProjectId, deletedProjectId);
  }
  if (currentProjectId !== deletedProjectId) return currentProjectId;
  return projectIds.find((projectId) => projectId !== deletedProjectId) || null;
}

function renameProjectFromManager(id, name) {
  const role = typeof getStoredProjectRole === "function"
    ? getStoredProjectRole(id, "owner")
    : allProjects?.[id]?._role || (id === currentId ? _projectRole : "owner");
  if (typeof canManageProject === "function" && !canManageProject(role)) {
    return allProjects?.[id]?.proj?.name || "";
  }

  const renameResult = typeof buildRuntimeRenameProjectInCollection === "function"
    ? buildRuntimeRenameProjectInCollection(allProjects || {}, id, name)
    : {
        projects: {
          ...(allProjects || {}),
          [id]: {
            ...(allProjects?.[id] || {}),
            proj: {
              ...(allProjects?.[id]?.proj || {}),
              name: (name || "").trim() || allProjects?.[id]?.proj?.name || "",
            },
          },
        },
        nextName: (name || "").trim() || allProjects?.[id]?.proj?.name || "",
        changed: true,
      };

  allProjects = renameResult.projects;
  if (id === currentId && proj) proj.name = renameResult.nextName;
  if (renameResult.changed) saveAll();
  updateProjSel();
  if (isReactProjectManagerEnabled()) syncReactProjectManagerBridge();
  return renameResult.nextName;
}

/* ── Хелпери конвертації місяць/тиждень ↔ дата ── */

/** Прив'язує дату до найближчої межі пів-тижня (1, 4, 8, 11, 15, 18, 22, 25). */
function _snapToHalfWeek(dateStr) {
  if (typeof buildRuntimeSnapToHalfWeek === "function") return buildRuntimeSnapToHalfWeek(dateStr);
  return dateStr;
}

function _phaseToDateStr(mi, wi) {
  if (typeof buildRuntimePhaseToDateStr === "function") return buildRuntimePhaseToDateStr(proj, mi, wi);
  return "";
}
function _dateStrToPhase(str) {
  if (typeof buildRuntimeDateStrToPhase === "function") return buildRuntimeDateStrToPhase(proj, str);
  return { mi: 0, wi: 0 };
}
function _projMinDate() {
  if (typeof buildRuntimeProjectMinDate === "function") return buildRuntimeProjectMinDate(proj);
  return "";
}
function _projMaxDate() {
  if (typeof buildRuntimeProjectMaxDate === "function") return buildRuntimeProjectMaxDate(proj);
  return "";
}

function adjNum(id, delta) {
  const el = document.getElementById(id);
  if (!el || el.readOnly) return;
  el.value = Math.max(0, (+el.value || 0) + delta);
  updCalc();
}

/** Рендерить chips вибору категорії (ідентичні легенді графіку). */
function buildChips(sel) {
  selCat = sel;
  document.getElementById("cat-chips").innerHTML = cats
    .map(
      (c, i) =>
        `<button class="cat-chip${i === sel ? " active" : ""}" style="--chip-color:${c.color}"
          data-task-modal-action="pick-category" data-category-index="${i}" type="button"><span class="chip-dot"></span>${c.name}</button>`,
    )
    .join("");
}

function pickCat(i) {
  if (!_canMutateTaskModal()) return;
  selCat = i;
  document.querySelectorAll("#cat-chips .cat-chip").forEach((c, j) => c.classList.toggle("active", j === i));
}

function _canMutateTaskModal() {
  return typeof canEditTasks !== "function" || canEditTasks();
}

function _applyTaskModalPermissions() {
  const modal = document.getElementById("modal");
  if (!modal) return;
  const editable = _canMutateTaskModal();

  modal.querySelectorAll("input, select, textarea, button").forEach((el) => {
    if (el.closest(".m-btns") || el.closest(".task-tabs")) return;
    el.disabled = !editable;
    if (el.matches("input, textarea")) el.readOnly = !editable;
  });

  const saveBtn = modal.querySelector(".m-btns .btn-acc");
  if (saveBtn) saveBtn.style.display = editable ? "" : "none";
}

function _applyNotesModalPermissions() {
  const editable = _canMutateTaskModal();
  const addRow = document.querySelector("#notes-modal .notes-add-row");
  if (addRow) addRow.style.display = editable ? "" : "none";
  document.querySelectorAll("#notes-modal .note-actions, #notes-modal .note-edit-actions").forEach((el) => {
    el.style.display = editable ? "" : "none";
  });
}

/** Зважений загальний прогрес фаз з урахуванням тривалості кожної. */
function _weightedProg(phases) {
  if (typeof buildRuntimeWeightedProgress === "function") return buildRuntimeWeightedProgress(phases || []);
  return 0;
}

/** Рендерить інлайн-список фаз у модалі задачі. */
function renderModalPhases() {
  const taskFormPanel = _getTaskFormPanelModel();
  const isMulti = _modalPhases.length > 1;
  const totalProg = isMulti ? _weightedProg(_modalPhases) : (_modalPhases[0]?.prog ?? 0);

  const minD = _projMinDate();
  const maxD = _projMaxDate();

  const rows = _modalPhases
    .map((ph, pi) => {
      const locked = pi > 0 && (_modalPhases[pi - 1].prog || 0) < 100;
      const activePct = isMulti && pi === _activePhaseIdx();
      return `<div class="mph-row">
      <div class="mph-top">
        ${isMulti ? `<span class="mph-label">Ф${pi + 1}</span>` : `<span class="mph-label">${taskFormPanel.durationLabel}</span>`}
        <input type="date" id="mph-ds-${pi}" class="mph-date-inp"
               value="${ph.dsExact || _phaseToDateStr(ph.ms, ph.ws)}"
               min="${minD}" max="${maxD}"
               data-task-modal-input="phase-date" data-phase-index="${pi}">
        <span class="mph-arrow">&rarr;</span>
        <input type="date" id="mph-de-${pi}" class="mph-date-inp"
               value="${ph.deExact || _phaseToDateStr(ph.me, ph.we)}"
               min="${minD}" max="${maxD}"
               data-task-modal-input="phase-date" data-phase-index="${pi}">
        ${isMulti && pi > 0 ? `<span class="phase-del" data-task-modal-action="remove-phase" data-phase-index="${pi}"><i data-lucide="x"></i></span>` : ""}
      </div>
      <div class="mph-prog-row">
        <span class="mph-hint">${taskFormPanel.progressLabel}</span>
        <input type="range" id="mph-prog-${pi}" class="mph-range-inp"
               min="0" max="100" step="5" value="${ph.prog || 0}"
               ${locked ? "disabled" : ""} data-task-modal-input="phase-progress" data-phase-index="${pi}">
        <span id="mph-prog-lbl-${pi}" class="mph-pct${activePct ? " mph-pct-active" : ""}">${ph.prog || 0}%</span>
      </div>
    </div>`;
    })
    .join("");

  const summary = isMulti
    ? `<div class="mph-summary">${taskFormPanel.totalProgressLabel}: <b>${totalProg}%</b></div>`
    : "";

  document.getElementById("modal-phases").innerHTML = rows + summary;
  lucide.createIcons({ nodes: [document.getElementById("modal-phases")] });
  _syncModalPhasesToHidden();
  _applyTaskModalPermissions();
}

/** Повертає індекс активної фази (остання з prog > 0, або перша). */
function _activePhaseIdx() {
  if (typeof buildRuntimeActivePhaseIndex === "function") return buildRuntimeActivePhaseIndex(_modalPhases || []);
  return 0;
}

/** Зчитує поточні значення полів фаз у _modalPhases. */
function _flushModalPhases() {
  _modalPhases.forEach((_, pi) => {
    const dsEl = document.getElementById(`mph-ds-${pi}`);
    const deEl = document.getElementById(`mph-de-${pi}`);
    if (dsEl?.value) {
      _modalPhases[pi].dsExact = _snapToHalfWeek(dsEl.value);
      const { mi, wi } = _dateStrToPhase(_modalPhases[pi].dsExact);
      _modalPhases[pi].ms = mi;
      _modalPhases[pi].ws = wi;
    }
    if (deEl?.value) {
      _modalPhases[pi].deExact = _snapToHalfWeek(deEl.value);
      const { mi, wi } = _dateStrToPhase(_modalPhases[pi].deExact);
      _modalPhases[pi].me = mi;
      _modalPhases[pi].we = wi;
    }
    const prog = document.getElementById(`mph-prog-${pi}`)?.value;
    if (prog !== undefined) _modalPhases[pi].prog = +prog;
  });
}

function onModalPhaseChange() {
  _flushModalPhases();
  renderModalPhases();
  updCalc();
}

function onModalProgChange(pi, val) {
  const nextState = typeof buildRuntimeUpdateModalPhaseProgress === "function"
    ? buildRuntimeUpdateModalPhaseProgress(_modalPhases, pi, +val, _weightedProg)
    : {
        phases: _modalPhases.map((phase) => ({ ...phase })),
        totalProgress: 0,
      };
  _modalPhases = nextState.phases;
  // Оновлюємо DOM напряму, щоб не переривати drag слайдера
  const lbl = document.getElementById(`mph-prog-lbl-${pi}`);
  if (lbl) lbl.textContent = `${+val}%`;
  _modalPhases.forEach((p, i) => {
    if (i <= pi) return;
    const locked = (_modalPhases[i - 1]?.prog ?? 0) < 100;
    const slider = document.getElementById(`mph-prog-${i}`);
    if (slider) { slider.disabled = locked; slider.value = p.prog || 0; }
    const l = document.getElementById(`mph-prog-lbl-${i}`);
    if (l) l.textContent = `${p.prog || 0}%`;
  });
  if (_modalPhases.length > 1) {
    const sumEl = document.querySelector(".mph-summary b");
    if (sumEl) sumEl.textContent = `${nextState.totalProgress || _weightedProg(_modalPhases)}%`;
  }
}

function _syncModalPhasesToHidden() {
  // Значення зчитуються в saveTask() з _modalPhases напряму.
}

function modalAddPhase() {
  if (!_canMutateTaskModal()) return;
  _flushModalPhases();
  _modalPhases = typeof buildRuntimeAddModalPhase === "function"
    ? buildRuntimeAddModalPhase(_modalPhases, proj.nm)
    : _modalPhases;
  renderModalPhases();
}

function modalRemovePhase(pi) {
  if (!_canMutateTaskModal()) return;
  _flushModalPhases();
  _modalPhases = typeof buildRuntimeRemoveModalPhase === "function"
    ? buildRuntimeRemoveModalPhase(_modalPhases, pi)
    : _modalPhases;
  renderModalPhases();
}

/** Міні-граф залежностей у модалці задачі. */
function renderModalNet() {
  const sec   = document.getElementById('modal-net-section');
  const graph = document.getElementById('modal-net-graph');
  if (!sec || !graph) return;

  const currTask = editIdx !== null ? tasks[editIdx] : null;
  const currId   = currTask?.id;

  // Попередники (з _modalDeps)
  const preds = _modalDeps
    .map(d => ({ task: tasks.find(t => t.id === d.id), type: d.type || 'FS' }))
    .filter(p => p.task);

  // Наступники (роботи, що залежать від поточної)
  const succs = currTask
    ? tasks
        .filter((t, i) => i !== editIdx && (t.deps || []).some(raw => normDep(raw).id === currId))
        .map(t => {
          const raw = (t.deps || []).find(d => normDep(d).id === currId);
          return { task: t, type: raw ? normDep(raw).type : 'FS' };
        })
    : [];

  if (!preds.length && !succs.length) { sec.style.display = 'none'; return; }
  sec.style.display = 'block';

  const NW = 150, NH = 46, GX = 62, GY = 10, PAD = 14;
  const DEP_COLS = { FS: '#2563eb', SS: '#d97706', FF: '#6b7280' };

  const hasPreds = preds.length > 0;
  const hasSuccs = succs.length > 0;
  const numCols  = hasPreds && hasSuccs ? 3 : 2;
  const maxRows  = Math.max(hasPreds ? preds.length : 0, hasSuccs ? succs.length : 0, 1);
  const maxH     = maxRows * (NH + GY) - GY;
  const svgH     = PAD * 2 + maxH;
  const svgW     = numCols * NW + (numCols - 1) * GX + PAD * 2;

  const defs = `<defs>${Object.entries(DEP_COLS).map(([tp, col]) =>
    `<marker id="mn-${tp}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto">
       <path d="M0 0L8 4L0 8z" fill="${col}"/>
     </marker>`).join('')}</defs>`;

  function colX(idx) { return PAD + idx * (NW + GX); }

  function ysFor(count) {
    const blockH = count * (NH + GY) - GY;
    const top    = PAD + (maxH - blockH) / 2;
    return Array.from({ length: count }, (_, i) => top + i * (NH + GY));
  }

  function node(t, x, y, isCurr) {
    const col = cats[t.cat]?.color || '#888';
    const nm  = t.name.length > 17 ? t.name.slice(0, 16) + '…' : t.name;
    return `
      <rect x="${x}" y="${y}" width="${NW}" height="${NH}" rx="6"
            fill="var(--surf)" stroke="${col}" stroke-width="${isCurr ? 2.5 : 1.5}"/>
      <rect x="${x}" y="${y}" width="5" height="${NH}" rx="3" fill="${col}" opacity=".9"/>
      <text x="${x+13}" y="${y+16}" font-size="9" fill="${col}" font-weight="700" font-family="inherit">#${t.n}</text>
      <text x="${x+24}" y="${y+18}" font-size="11" font-weight="${isCurr ? 700 : 600}"
            fill="var(--txt)" font-family="inherit">${nm}</text>
      <text x="${x+13}" y="${y+33}" font-size="9.5" fill="var(--txt3)" font-family="inherit">
        ${cats[t.cat]?.name || ''}${t.prog > 0 ? ' · ' + t.prog + '%' : ''}
      </text>`;
  }

  function edge(x1, y1, x2, y2, type) {
    const col = DEP_COLS[type] || DEP_COLS.FS;
    const mx  = (x1 + x2) / 2;
    return `<path d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}"
              fill="none" stroke="${col}" stroke-width="1.5" opacity=".65"
              marker-end="url(#mn-${type || 'FS'})"/>`;
  }

  const currDisplay = currTask || {
    n: '?', name: document.getElementById('f-name')?.value || 'Нова робота', cat: selCat || 0,
  };

  let nodesHtml = '', edgesHtml = '';

  if (hasPreds && hasSuccs) {
    const cx = colX(1), cy = PAD + (maxH - NH) / 2;
    nodesHtml += node(currDisplay, cx, cy, true);
    ysFor(preds.length).forEach((py, i) => {
      const px = colX(0);
      nodesHtml += node(preds[i].task, px, py);
      edgesHtml += edge(px + NW, py + NH / 2, cx, cy + NH / 2, preds[i].type);
    });
    ysFor(succs.length).forEach((sy, i) => {
      const sx = colX(2);
      nodesHtml += node(succs[i].task, sx, sy);
      edgesHtml += edge(cx + NW, cy + NH / 2, sx, sy + NH / 2, succs[i].type);
    });
  } else if (hasPreds) {
    const cx = colX(1), cy = PAD + (maxH - NH) / 2;
    nodesHtml += node(currDisplay, cx, cy, true);
    ysFor(preds.length).forEach((py, i) => {
      const px = colX(0);
      nodesHtml += node(preds[i].task, px, py);
      edgesHtml += edge(px + NW, py + NH / 2, cx, cy + NH / 2, preds[i].type);
    });
  } else {
    const cx = colX(0), cy = PAD + (maxH - NH) / 2;
    nodesHtml += node(currDisplay, cx, cy, true);
    ysFor(succs.length).forEach((sy, i) => {
      const sx = colX(1);
      nodesHtml += node(succs[i].task, sx, sy);
      edgesHtml += edge(cx + NW, cy + NH / 2, sx, sy + NH / 2, succs[i].type);
    });
  }

  graph.innerHTML = `<svg viewBox="0 0 ${svgW} ${svgH}" width="${svgW}"
      style="min-height:${svgH}px;display:block;max-width:100%">
    ${defs}${edgesHtml}${nodesHtml}
  </svg>`;
}

/** Рендерить чіпи залежностей. */
function renderDepTags() {
  const dependencyEditor = _getDependencyEditorModel();
  const tagsEl = document.getElementById("dep-tags");
  if (!tagsEl) return;

  const TYPE_LABELS = { FS: "FS", SS: "SS", FF: "—" };
  const TYPE_COLORS = { FS: "var(--acc)", SS: "var(--warn)", FF: "var(--txt3)" };

  tagsEl.innerHTML = _modalDeps
    .map((dep) => {
      const t = tasks.find((x) => x.id === dep.id);
      const label = t
        ? `#${t.n} ${t.name.slice(0, 20)}${t.name.length > 20 ? "…" : ""}`
        : dependencyEditor.dropdownFallbackLabel;
      const badge =
        dep.type === "SS" && dep.threshold
          ? `${TYPE_LABELS[dep.type]} ${dep.threshold}%`
          : TYPE_LABELS[dep.type] || "FS";
      return `<div class="dep-tag ${_editingDepId === dep.id ? "editing" : ""}"
                   data-task-modal-action="edit-dependency" data-dependency-id="${dep.id}">
        <span class="dep-tag-label">${label}</span>
        <span class="dep-tag-badge" style="background:${TYPE_COLORS[dep.type] || "var(--acc)"}">${badge}</span>
        <span class="dep-tag-del" title="${dependencyEditor.deleteBadgeLabel}"
          data-task-modal-action="remove-dependency" data-dependency-id="${dep.id}">×</span>
      </div>`;
    })
    .join("");

  renderModalNet();
  _applyTaskModalPermissions();
}

/** Показує dropdown з фільтрацією задач. */
function showDepDropdown() {
  if (!_canMutateTaskModal()) return;
  filterDepSearch(document.getElementById("dep-search")?.value || "");
}

function filterDepSearch(q) {
  if (!_canMutateTaskModal()) return;
  const dd = document.getElementById("dep-dropdown");
  if (!dd) return;
  const dropdownState = typeof buildRuntimeDependencyDropdownState === "function"
    ? buildRuntimeDependencyDropdownState({
        tasks,
        editIdx,
        modalDeps: _modalDeps,
        query: q,
      })
    : { items: [], visible: false };

  if (!dropdownState.visible) {
    dd.style.display = "none";
    return;
  }
  dd.style.display = "block";
  dd.innerHTML = dropdownState.items
    .map(
      (item) =>
        `<div class="dep-dd-item" data-task-modal-action="add-dependency" data-dependency-id="${item.id}">
           <span class="dep-dd-num">#${item.taskNumber}</span> ${item.name}
         </div>`,
    )
    .join("");
}

function addDepTag(id) {
  if (!_canMutateTaskModal()) return;
  const nextState = typeof buildRuntimeAddModalDependency === "function"
    ? buildRuntimeAddModalDependency(_modalDeps, id)
    : { deps: _modalDeps, editingDepId: id, didAdd: false };
  if (!nextState.didAdd) return;
  _modalDeps = nextState.deps;
  _editingDepId = nextState.editingDepId;
  renderDepTags();
  const inp = document.getElementById("dep-search");
  if (inp) inp.value = "";
  document.getElementById("dep-dropdown").style.display = "none";
  renderDepTypeEditor();
}

function removeDepTag(id) {
  if (!_canMutateTaskModal()) return;
  const nextState = typeof buildRuntimeRemoveModalDependency === "function"
    ? buildRuntimeRemoveModalDependency(_modalDeps, id, _editingDepId)
    : { deps: _modalDeps.filter((d) => d.id !== id), editingDepId: _editingDepId === id ? null : _editingDepId };
  _modalDeps = nextState.deps;
  _editingDepId = nextState.editingDepId;
  renderDepTypeEditor();
  renderDepTags();
}

function editDepTag(id) {
  if (!_canMutateTaskModal()) return;
  _editingDepId = typeof buildRuntimeToggleModalDependencyEditor === "function"
    ? buildRuntimeToggleModalDependencyEditor(_editingDepId, id)
    : (_editingDepId === id ? null : id);
  renderDepTags();
  renderDepTypeEditor();
}

function renderDepTypeEditor() {
  const dependencyEditor = _getDependencyEditorModel();
  const el = document.getElementById("dep-type-editor");
  if (!el) return;
  const editorState = typeof buildRuntimeModalDependencyEditorState === "function"
    ? buildRuntimeModalDependencyEditorState({
        deps: _modalDeps,
        editingDepId: _editingDepId,
        tasks,
      })
    : { visible: false, dependency: null, taskNumber: "?", taskName: "" };
  if (!editorState.visible || !editorState.dependency) {
    el.style.display = "none";
    return;
  }
  const dep = editorState.dependency;
  const name = editorState.taskName.length > 22 ? editorState.taskName.slice(0, 22) + "…" : editorState.taskName;
  const dispN = editorState.taskNumber;
  el.style.display = "block";
  el.innerHTML = `
    <div class="dep-type-edit-row">
      <span class="dep-type-title">#${dispN} ${name}</span>
      <div class="dep-type-btns">
        ${[
          { v: "FS", l: "FS", tip: dependencyEditor.finishStartTip },
          { v: "SS", l: "SS+%", tip: dependencyEditor.startStartTip },
          { v: "FF", l: dependencyEditor.independentLabel, tip: dependencyEditor.independentTip },
        ]
          .map(
            (opt) => `<button class="dep-type-btn${dep.type === opt.v ? " active" : ""}" type="button"
              title="${opt.tip}"
              data-task-modal-action="set-dependency-type" data-dependency-id="${dep.id}" data-dependency-type="${opt.v}">${opt.l}</button>`,
          )
          .join("")}
        ${
          dep.type === "SS"
            ? `<span class="dep-threshold-lbl">${dependencyEditor.minThresholdLabel}</span>
               <div class="dep-thr-wrap">
                  <button class="dep-thr-btn" type="button" data-task-modal-action="adjust-dependency-threshold"
                    data-dependency-id="${dep.id}" data-delta="-5">−</button>
                 <input type="number" value="${dep.threshold || 25}" min="1" max="99"
                        data-task-modal-input="dependency-threshold" data-dependency-id="${dep.id}"
                        class="dep-threshold-inp">
                 <button class="dep-thr-btn" type="button" data-task-modal-action="adjust-dependency-threshold"
                    data-dependency-id="${dep.id}" data-delta="5">+</button>
               </div>
               <span class="dep-threshold-unit">%</span>`
            : ""
        }
      </div>
    </div>`;
  _applyTaskModalPermissions();
}

function setDepType(id, type) {
  _modalDeps = typeof buildRuntimeUpdateModalDependencyType === "function"
    ? buildRuntimeUpdateModalDependencyType(_modalDeps, id, type)
    : _modalDeps;
  renderDepTags();
  renderDepTypeEditor();
}

function setDepThreshold(id, val) {
  _modalDeps = typeof buildRuntimeUpdateModalDependencyThreshold === "function"
    ? buildRuntimeUpdateModalDependencyThreshold(_modalDeps, id, +val)
    : _modalDeps;
  renderDepTags();
  renderDepTypeEditor();
}

function adjDepThr(id, delta) {
  const dep = _modalDeps.find((d) => d.id === id);
  if (!dep) return;
  _modalDeps = typeof buildRuntimeUpdateModalDependencyThreshold === "function"
    ? buildRuntimeUpdateModalDependencyThreshold(_modalDeps, id, (dep.threshold || 25) + delta)
    : _modalDeps;
  const nextDep = _modalDeps.find((item) => item.id === id);
  const inp = document.querySelector(".dep-threshold-inp");
  if (inp) inp.value = nextDep?.threshold || 25;
  renderDepTags();
  renderDepTypeEditor();
}

function switchTaskTab(tab) {
  ["general", "costs"].forEach((t) => {
    document.getElementById(`ttab-${t}`)?.classList.toggle("active", t === tab);
    const pane = document.getElementById(`task-pane-${t}`);
    if (pane) pane.style.display = t === tab ? (t === "costs" ? "flex" : "block") : "none";
  });
  if (tab === "costs") renderCostTable();
}

/** Показує або ховає «авто» бейджи на полях бюджету. */
function _updateAutoBadges(spentAuto, budgetAuto = spentAuto) {
  const bb = document.getElementById("budget-auto-badge");
  const sb = document.getElementById("spent-auto-badge");
  if (bb) bb.style.display = budgetAuto ? "inline" : "none";
  if (sb) sb.style.display = spentAuto ? "inline" : "none";
  const bi = document.getElementById("f-budget");
  const si = document.getElementById("f-spent");
  if (bi) {
    bi.readOnly = budgetAuto;
    bi.style.background = budgetAuto ? "var(--surf2)" : "";
  }
  if (si) {
    si.readOnly = spentAuto;
    si.style.background = spentAuto ? "var(--surf2)" : "";
  }
}

/** Оновлює рядок залишку/ставки під полями бюджету. */
function updCalc() {
  const taskFormPanel = _getTaskFormPanelModel();
  const hasItems = _costItems && _costItems.length > 0;
  const overrideBudget = !!document.getElementById("f-contracts-override-budget")?.checked;
  const currentBudget = +document.getElementById("f-budget").value || 0;
  const b = hasItems && (overrideBudget || currentBudget <= 0) ? _totalBudget() : currentBudget;
  const s = hasItems ? _totalSpent() : (+document.getElementById("f-spent").value || 0);
  if (hasItems) {
    if (overrideBudget || currentBudget <= 0) document.getElementById("f-budget").value = b;
    document.getElementById("f-spent").value = s;
  }
  _updateAutoBadges(hasItems, hasItems && (overrideBudget || currentBudget <= 0));
  const calc = typeof buildRuntimeTaskCalcModel === "function"
    ? buildRuntimeTaskCalcModel({
        budget: b,
        spent: s,
        phase: _modalPhases[0] || null,
      })
    : { remainder: b - s, weeks: 0, weeklyRate: 0 };
  document.getElementById("calc-info").innerHTML =
    `${taskFormPanel.budgetRemainderLabel}: <b>${fmtM(calc.remainder)} грн</b> · ${taskFormPanel.weeksLabel}: <b>${calc.weeks}</b> · ${taskFormPanel.weeklyRateLabel}: <b>${calc.weeks > 0 ? fmtM(calc.weeklyRate) + " " + taskFormPanel.weeklyRateUnit : "—"}</b>`;
}

function _applyTaskModalUiState(state) {
  editIdx = state.editIdx;
  _editingDepId = state.editingDepId;
  _modalDeps = state.modalDeps;
  _modalPhases = state.modalPhases;
  _costTi = state.costTi;
  _costItems = state.costItems;
  _expandedIds = state.expandedIds;

  document.getElementById("m-title").textContent = state.title;
  document.getElementById("f-name").value = state.nameValue;
  document.getElementById("f-budget").value = state.budgetValue;
  document.getElementById("f-spent").value = state.spentValue;
  document.getElementById("f-contracts-override-budget").checked = state.contractsOverrideBudget;
  document.getElementById("calc-info").textContent = state.calcInfoText || "";

  const warnBox = document.getElementById("dep-warn");
  warnBox.innerHTML = state.dependencyWarningHtml || "";
  warnBox.classList.toggle("show", !!state.showDependencyWarning);
  document.getElementById("dep-type-editor").style.display = state.showDependencyEditor ? "" : "none";

  _updateAutoBadges(state.hasItems, state.autoBudget);
  buildChips(state.selectedCategory);
  renderModalPhases();
  renderDepTags();
  renderDepTypeEditor();
  renderCostTable();
  document.getElementById("dep-dropdown").style.display = "none";
  switchTaskTab(state.activeTab || "general");
  document.getElementById("modal").style.display = "flex";
  _applyTaskModalPermissions();

  if (_canMutateTaskModal() && state.focusField === "name") {
    setTimeout(() => document.getElementById("f-name").focus(), 50);
  }
}

function openAdd() {
  const taskFormPanel = _getTaskFormPanelModel();
  const createState = typeof buildRuntimeTaskModalCreateState === "function"
    ? buildRuntimeTaskModalCreateState({
        title: taskFormPanel.newTaskTitle,
        fillCostHint: taskFormPanel.fillCostHint,
      })
    : {
        editIdx: null,
        editingDepId: null,
        modalDeps: [],
        modalPhases: [{ ms: 0, ws: 0, me: 1, we: 3, prog: 0 }],
        costTi: null,
        costItems: [],
        expandedIds: new Set(),
        title: taskFormPanel.newTaskTitle,
        budgetValue: "",
        spentValue: "",
        contractsOverrideBudget: false,
        calcInfoText: taskFormPanel.fillCostHint,
        showDependencyWarning: false,
        showDependencyEditor: false,
        hasItems: false,
        focusField: "name",
      };
  const uiState = typeof buildRuntimeTaskModalCreateUiState === "function"
    ? buildRuntimeTaskModalCreateUiState({ createState, selectedCategory: 0 })
    : null;
  _applyTaskModalUiState(uiState || {
    ...createState,
    nameValue: "",
    dependencyWarningHtml: "",
    autoBudget: false,
    selectedCategory: 0,
    activeTab: "general",
  });
}

function openEdit(ti) {
  const taskFormPanel = _getTaskFormPanelModel();
  editIdx = ti;
  _editingDepId = null;
  const t = tasks[ti];
  const totalBudget = typeof _totalBudget === "function" ? _totalBudget() : 0;
  const totalSpent = typeof _totalSpent === "function" ? _totalSpent() : 0;
  const editState = typeof buildRuntimeTaskModalEditState === "function"
    ? buildRuntimeTaskModalEditState({
        task: t,
        editFallbackTitle: taskFormPanel.editTaskFallbackTitle,
        totalBudget,
        totalSpent,
        normDep,
      })
    : {
        modalPhases: t.phases && t.phases.length > 0
          ? t.phases.map((p) => ({ ...p, prog: p.prog ?? 0 }))
          : [{ ms: t.ms, ws: t.ws, me: t.me, we: t.we, prog: t.prog || 0, dsExact: t.dsExact || null, deExact: t.deExact || null }],
        modalDeps: (t.deps || []).map((d) => normDep(d)),
        costItems: (t.costItems || []).map((it) => ({
          ...it,
          payments: (it.payments || []).map((p) => ({ ...p })),
          acts: (it.acts || []).map((a) => ({ ...a })),
        })),
        hasItems: !!(t.costItems || []).length,
        title: t.name || taskFormPanel.editTaskFallbackTitle,
        budgetValue: t.budget || "",
        spentValue: t.spent || "",
        contractsOverrideBudget: !!t.contractsOverrideBudget,
      };
  const warns = checkDeps(t);
  const uiState = typeof buildRuntimeTaskModalEditUiState === "function"
    ? buildRuntimeTaskModalEditUiState({
        task: t,
        editIdx: ti,
        editState,
        dependencyWarnings: warns,
      })
    : null;
  _applyTaskModalUiState(uiState || {
    ...editState,
    editIdx: ti,
    editingDepId: null,
    costTi: ti,
    expandedIds: new Set(),
    nameValue: t.name,
    dependencyWarningHtml: warns.length ? "⚠ " + warns.join("<br>") : "",
    showDependencyWarning: warns.length > 0,
    autoBudget: editState.hasItems && (!!editState.contractsOverrideBudget || (+t.budget || 0) <= 0),
    selectedCategory: t.cat,
    focusField: null,
    activeTab: "general",
  });
  updCalc();
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
  document.getElementById("dep-dropdown").style.display = "none";
}

/** Зберігає задачу (нову або відредаговану). */
async function saveTask() {
  if (typeof canEditTasks === "function" && !canEditTasks()) return;

  const name = document.getElementById("f-name").value.trim();
  if (!name) {
    document.getElementById("f-name").focus();
    return;
  }

  _flushModalPhases();
  _flushCostEdits();

  const contractsOverrideBudget = !!document.getElementById("f-contracts-override-budget")?.checked;
  const manualBudget = +document.getElementById("f-budget").value || 0;
  const manualSpent = +document.getElementById("f-spent").value || 0;
  const totalBudget = typeof _totalBudget === "function" ? _totalBudget() : 0;
  const totalSpent = typeof _totalSpent === "function" ? _totalSpent() : 0;
  const saveModel = typeof buildRuntimeTaskModalSaveModel === "function"
    ? buildRuntimeTaskModalSaveModel({
        name,
        cat: selCat,
        phases: _modalPhases,
        deps: _modalDeps,
        costItems: _costItems,
        contractsOverrideBudget,
        manualBudget,
        manualSpent,
        totalBudget,
        totalSpent,
      })
    : null;

  if (saveModel && !saveModel.isValidRange) {
    const warningModel = _getTaskRangeWarningModel();
    Swal.fire({ icon: "warning", title: warningModel.title, text: warningModel.text });
    return;
  }

  const obj = saveModel
    ? saveModel.taskPatch
    : {
        name,
        cat: selCat,
        ms: _modalPhases[0].ms,
        ws: _modalPhases[0].ws,
        me: _modalPhases[_modalPhases.length - 1].me,
        we: _modalPhases[_modalPhases.length - 1].we,
        prog: _weightedProg(_modalPhases),
        budget: _costItems.length > 0 && (contractsOverrideBudget || manualBudget <= 0) ? totalBudget : manualBudget,
        spent: _costItems.length > 0 ? totalSpent : manualSpent,
        contractsOverrideBudget,
        deps: _modalDeps,
        phases: _modalPhases.length > 1 ? _modalPhases.map((p) => ({ ...p })) : null,
        costItems: _costItems.length > 0
          ? _costItems.map((it) => ({
              ...it,
              payments: (it.payments || []).map((p) => ({ ...p })),
              acts: (it.acts || []).map((a) => ({ ...a })),
            }))
          : null,
        dsExact: _modalPhases.length === 1 ? (_modalPhases[0].dsExact || null) : null,
        deExact: _modalPhases.length === 1 ? (_modalPhases[0].deExact || null) : null,
      };

  const warns = checkDeps(obj);
  if (warns.length) {
    const depWarningDialog = _getTaskDependencyWarningDialogModel();
    const res = await Swal.fire({
      icon: "warning",
      title: depWarningDialog.title,
      html: warns.map((w) => `• ${w}`).join("<br>"),
      showCancelButton: true,
      confirmButtonText: depWarningDialog.confirmButtonText,
      cancelButtonText: depWarningDialog.cancelButtonText,
    });
    if (!res.isConfirmed) return;
  }

  const applied = typeof buildRuntimeApplyTaskSave === "function"
    ? buildRuntimeApplyTaskSave({
        tasks,
        editIdx,
        nextN,
        taskPatch: obj,
        newTaskId: genId(),
      })
    : null;
  const isEdit = applied ? applied.isEdit : editIdx !== null;
  if (applied?.changed) {
    tasks = applied.tasks;
    nextN = applied.nextN;
  } else if (isEdit) {
    tasks[editIdx] = { ...tasks[editIdx], ...obj, notes: tasks[editIdx].notes || [] };
  } else {
    tasks.push({ id: genId(), n: nextN++, ...obj, notes: [] });
  }
  const savedTask = applied ? applied.savedTask : (isEdit ? tasks[editIdx] : tasks[tasks.length - 1]);

  closeModal();
  saveAll();
  render();
  await logTaskActivity(isEdit ? AUDIT_EVENT_TYPES.TASK_UPDATED : AUDIT_EVENT_TYPES.TASK_CREATED, savedTask, {
    category: savedTask?.cat ?? selCat,
    hasPhases: Array.isArray(savedTask?.phases) && savedTask.phases.length > 1,
  });
  const savedToast = _getTaskSavedToastModel(isEdit);
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title: savedToast.title,
    showConfirmButton: false,
    timer: 2000,
  });
}

async function delTask(ti) {
  if (typeof canEditTasks === "function" && !canEditTasks()) return;
  const task = tasks[ti];
  const deleteDialog = _getTaskDeleteDialogModel(task?.name || "");

  const res = await Swal.fire({
    icon: "warning",
    title: deleteDialog.title,
    text: `«${task.name}»`,
    showCancelButton: true,
    confirmButtonText: deleteDialog.confirmButtonText,
    confirmButtonColor: deleteDialog.confirmButtonColor,
    cancelButtonText: deleteDialog.cancelButtonText,
  });
  if (!res.isConfirmed) return;
  const removed = typeof buildRuntimeRemoveTaskAt === "function"
    ? buildRuntimeRemoveTaskAt(tasks, ti)
    : null;
  tasks = removed?.changed ? removed.tasks : tasks.filter((_, index) => index !== ti);
  saveAll();
  render();
  await logTaskActivity(AUDIT_EVENT_TYPES.TASK_DELETED, removed?.removedTask || task);
}

function openNotesModal(ti) {
  const session = typeof buildRuntimeTaskNotesOpenState === "function"
    ? buildRuntimeTaskNotesOpenState({ tasks, taskIndex: ti })
    : {
        taskIndex: ti,
        title: tasks?.[ti]?.name || "",
        notes: typeof buildRuntimeCloneTaskNotes === "function"
          ? buildRuntimeCloneTaskNotes(tasks?.[ti]?.notes || [])
          : (tasks?.[ti]?.notes || []),
        exists: !!tasks?.[ti],
        visible: !!tasks?.[ti],
      };
  if (!session.exists) return;
  _notesSession = session;
  document.getElementById("notes-modal-title").textContent = session.title;
  renderNotes(session.notes);
  document.getElementById("notes-modal").style.display = session.visible ? "flex" : "none";
  _applyNotesModalPermissions();
}

function closeNotesModal() {
  document.getElementById("notes-modal").style.display = "none";
  _notesSession = typeof buildRuntimeCloseTaskNotesSession === "function"
    ? buildRuntimeCloseTaskNotesSession()
    : { taskIndex: null, title: "", notes: [], exists: false, visible: false };
}

function renderNotes(notes) {
  const notesModal = _getNotesModalModel();
  const el = document.getElementById("notes-list");
  if (!el) return;
  if (!notes || !notes.length) {
    el.innerHTML = `<div class="note-empty">${notesModal.emptyStateText}</div>`;
    return;
  }
  el.innerHTML = notes
    .map((n, i) => {
      const histBtn = n.history?.length
        ? `<button class="note-hist-btn" data-notes-action="toggle-history" data-note-index="${i}"><i data-lucide="clock"></i> ${n.history.length}</button>`
        : "";
      const histHtml = n.history?.length
        ? `<div class="note-history" id="note-hist-${i}" style="display:none">
             ${n.history
                .map(
                  (h) => `<div class="note-hist-item">
                <span class="note-hist-action ${h.action}">${h.action === "edit" ? notesModal.editedHistoryLabel : notesModal.deletedHistoryLabel}</span>
                <span class="note-hist-meta">${h.author} · ${h.date}</span>
                <div class="note-hist-text">${_escHtml(h.text)}</div>
              </div>`,
               )
               .join("")}
           </div>`
        : "";
      return `<div class="note-item" id="note-item-${i}">
      <div class="note-meta">${n.author || notesModal.unknownAuthorLabel} · ${n.date || ""}${histBtn}</div>
      <div class="note-text" id="note-text-${i}">${_escHtml(n.text)}</div>
      <div class="note-edit-row" id="note-edit-row-${i}" style="display:none">
        <textarea class="note-edit-ta" id="note-edit-ta-${i}">${_escHtml(n.text)}</textarea>
        <div class="note-edit-actions">
          <button class="btn btn-acc btn-sm" data-notes-action="save-edit" data-note-index="${i}">${notesModal.saveButtonLabel}</button>
          <button class="btn btn-sm" data-notes-action="cancel-edit" data-note-index="${i}">${notesModal.cancelButtonLabel}</button>
        </div>
      </div>
      <div class="note-actions">
        <button class="note-act-btn" data-notes-action="start-edit" data-note-index="${i}" title="${notesModal.editButtonLabel}"><i data-lucide="pencil"></i></button>
        <button class="note-act-btn del" data-notes-action="delete-note" data-note-index="${i}" title="${notesModal.deleteButtonLabel}"><i data-lucide="trash-2"></i></button>
      </div>
      ${histHtml}
    </div>`;
    })
    .join("");
  lucide.createIcons({ nodes: [el] });
  el.scrollTop = el.scrollHeight;
  _applyNotesModalPermissions();
}

function _getNotes() {
  return typeof buildRuntimeGetTaskNotesByIndex === "function"
    ? buildRuntimeGetTaskNotesByIndex(tasks, _notesSession.taskIndex)
    : (_notesSession.taskIndex !== null ? tasks?.[_notesSession.taskIndex]?.notes || [] : []);
}
function _setNotes(n) {
  const nextState = typeof buildRuntimeApplyTaskNotesToTasks === "function"
    ? buildRuntimeApplyTaskNotesToTasks({
        tasks,
        taskIndex: _notesSession.taskIndex,
        notes: n,
      })
    : {
        tasks: _notesSession.taskIndex !== null
          ? tasks.map((task, index) => index === _notesSession.taskIndex ? { ...task, notes: n } : task)
          : tasks,
        changed: _notesSession.taskIndex !== null,
      };
  if (!nextState.changed) return;
  tasks = nextState.tasks;
  saveAll();
  _syncNotesCell(_notesSession.taskIndex);
}

function _syncNotesCell(ti) {
  const notesModal = _getNotesModalModel();
  if (ti == null) return;
  const t = tasks[ti];
  const cellState = typeof buildRuntimeNotesCellState === "function"
    ? buildRuntimeNotesCellState({
        notes: t.notes || [],
        countTitle: notesModal.countTitle,
        defaultTitle: notesModal.defaultTitle,
      })
    : (() => {
        const count = typeof buildRuntimeCountVisibleTaskNotes === "function"
          ? buildRuntimeCountVisibleTaskNotes(t.notes || [])
          : (t.notes?.filter((n) => !n.deleted).length || 0);
        return {
          count,
          className: count > 0 ? "td-notes has-notes" : "td-notes",
          title: count > 0 ? notesModal.countTitle(count) : notesModal.defaultTitle,
          hasNotes: count > 0,
        };
      })();
  const cell = document.querySelector(`#tr${ti} .td-notes`);
  if (!cell) return;
  cell.className = cellState.className;
  cell.title = cellState.title;
  cell.innerHTML = cellState.hasNotes
    ? `<i data-lucide="message-square-text"></i><span class="notes-count">${cellState.count}</span>`
    : `<i data-lucide="message-square"></i>`;
  lucide.createIcons({ nodes: [cell] });
}
function _noteDate() {
  return new Date().toLocaleString("uk-UA", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function addNote() {
  const notesModal = _getNotesModalModel();
  if (!_canMutateTaskModal()) return;
  const ta = document.getElementById("note-input");
  const text = ta?.value?.trim();
  if (!text) return;
  const notes = typeof buildRuntimeAddTaskNote === "function"
    ? buildRuntimeAddTaskNote({
        notes: _getNotes(),
        id: Date.now(),
        text,
        author: userProfile?.name || notesModal.defaultAuthorLabel,
        date: _noteDate(),
      })
    : [..._getNotes(), {
        id: Date.now(),
        text,
        author: userProfile?.name || notesModal.defaultAuthorLabel,
        date: _noteDate(),
        history: [],
      }];
  _setNotes(notes);
  renderNotes(notes);
  ta.value = "";
}

function startNoteEdit(i) {
  if (!_canMutateTaskModal()) return;
  document.getElementById(`note-text-${i}`).style.display = "none";
  document.getElementById(`note-edit-row-${i}`).style.display = "block";
  document.getElementById(`note-edit-ta-${i}`)?.focus();
}

function cancelNoteEdit(i) {
  document.getElementById(`note-text-${i}`).style.display = "";
  document.getElementById(`note-edit-row-${i}`).style.display = "none";
}

function saveNoteEdit(i) {
  const notesModal = _getNotesModalModel();
  if (!_canMutateTaskModal()) return;
  const ta = document.getElementById(`note-edit-ta-${i}`);
  const txt = ta?.value?.trim();
  if (!txt) return;
  const notes = typeof buildRuntimeEditTaskNote === "function"
    ? buildRuntimeEditTaskNote({
        notes: _getNotes(),
        index: i,
        text: txt,
        author: userProfile?.name || notesModal.defaultAuthorLabel,
        date: _noteDate(),
      })
    : _getNotes();
  _setNotes(notes);
  renderNotes(notes);
}

async function deleteNote(i) {
  const notesModal = _getNotesModalModel();
  if (!_canMutateTaskModal()) return;
  const res = await Swal.fire({
    icon: "warning",
    title: notesModal.deleteDialogTitle,
    showCancelButton: true,
    confirmButtonText: notesModal.deleteDialogConfirmButtonText,
    confirmButtonColor: notesModal.deleteDialogConfirmButtonColor,
    cancelButtonText: notesModal.deleteDialogCancelButtonText,
  });
  if (!res.isConfirmed) return;
  const notes = typeof buildRuntimeDeleteTaskNote === "function"
    ? buildRuntimeDeleteTaskNote({
        notes: _getNotes(),
        index: i,
        author: userProfile?.name || notesModal.defaultAuthorLabel,
        date: _noteDate(),
        deletedPlaceholderText: notesModal.deletedPlaceholderText,
      })
    : _getNotes();
  _setNotes(notes);
  renderNotes(notes);
}

function toggleNoteHistory(i) {
  const el = document.getElementById(`note-hist-${i}`);
  if (el) el.style.display = el.style.display === "none" ? "block" : "none";
}

function _escHtml(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function openCatEditor() {
  const categoryEditor = _getCategoryEditorModel();
  if (typeof canManageProject === "function" && !canManageProject()) {
    Swal.fire({ icon: "info", title: categoryEditor.accessDeniedTitle });
    return;
  }
  tempCats = typeof buildRuntimeCategoryEditorState === "function"
    ? buildRuntimeCategoryEditorState(cats).categories
    : (typeof buildRuntimeCloneCategoryDrafts === "function"
        ? buildRuntimeCloneCategoryDrafts(cats)
        : cats.map((c) => ({ ...c })));
  renderCatList();
  document.getElementById("cat-modal").style.display = "flex";
}

function renderCatList() {
  const categoryEditor = _getCategoryEditorModel();
  const el = document.getElementById("cat-editor-list");
  el.innerHTML = "";
  tempCats.forEach((c, i) => {
    const row = document.createElement("div");
    row.className = "cat-row";
    row.dataset.i = i;
    const pickerWrap = document.createElement("div");
    pickerWrap.className = "color-picker-wrap";
    const swatch = document.createElement("button");
    swatch.className = "cat-swatch";
    swatch.style.background = c.color;
    swatch.title = categoryEditor.swatchTitle;
    swatch.type = "button";
    swatch.dataset.projectAction = "toggle-category-color";
    swatch.dataset.catIndex = String(i);
    const dropdown = document.createElement("div");
    dropdown.className = "color-dropdown";
    dropdown.innerHTML = _buildColorDropdownHTML(i);
    pickerWrap.appendChild(swatch);
    pickerWrap.appendChild(dropdown);
    const nameInp = document.createElement("input");
    nameInp.className = "cat-name-inp";
    nameInp.value = c.name;
    nameInp.placeholder = categoryEditor.namePlaceholder;
    nameInp.dataset.projectInput = "category-name";
    nameInp.dataset.catIndex = String(i);
    const delBtn = document.createElement("span");
    delBtn.className = "cat-del";
    delBtn.innerHTML = '<i data-lucide="x"></i>';
    delBtn.title = categoryEditor.deleteTitle;
    delBtn.dataset.projectAction = "delete-category";
    delBtn.dataset.catIndex = String(i);
    row.appendChild(pickerWrap);
    row.appendChild(nameInp);
    row.appendChild(delBtn);
    el.appendChild(row);
  });
  lucide.createIcons({ nodes: [document.getElementById("cat-editor-list")] });
}

function _buildColorDropdownHTML(catIdx) {
  const categoryEditor = _getCategoryEditorModel();
  const cur = tempCats[catIdx]?.color || "#888";
  const dots = CAT_PALETTE.map(
    (hex) =>
      `<div class="pal-dot${hex === cur ? " active" : ""}" style="background:${hex}" title="${hex}"
            data-project-action="pick-category-color" data-cat-index="${catIdx}" data-color="${hex}"></div>`,
  ).join("");
  return `<div class="color-dropdown-inner">
    <div class="pal-grid">${dots}</div>
    <div class="color-custom-row">
      <span class="color-custom-lbl">${categoryEditor.colorCustomLabel}</span>
      <input type="color" value="${cur}" data-project-input="category-color" data-cat-index="${catIdx}" />
    </div></div>`;
}

function setCatDraftName(catIdx, value) {
  const updated = typeof buildRuntimeUpdateCategoryDraftAt === "function"
    ? buildRuntimeUpdateCategoryDraftAt(tempCats, catIdx, { name: value })
    : { categories: tempCats.map((cat, index) => index === catIdx ? { ...cat, name: value } : cat), changed: !!tempCats[catIdx] };
  if (!updated.changed) return;
  tempCats = updated.categories;
}

function pickCatColor(catIdx, hex, dotEl) {
  const updated = typeof buildRuntimeUpdateCategoryDraftAt === "function"
    ? buildRuntimeUpdateCategoryDraftAt(tempCats, catIdx, { color: hex })
    : { categories: tempCats.map((cat, index) => index === catIdx ? { ...cat, color: hex } : cat), changed: !!tempCats[catIdx] };
  if (!updated.changed) return;
  tempCats = updated.categories;
  const rows = document.querySelectorAll("#cat-editor-list .cat-row");
  rows[catIdx]?.querySelector(".cat-swatch")?.style.setProperty("background", hex);
  rows[catIdx]
    ?.querySelectorAll(".pal-dot")
    .forEach((d) => d.classList.toggle("active", d.title === hex));
  if (dotEl) rows[catIdx]?.querySelector(".color-dropdown")?.classList.remove("open");
}

function toggleCatColorDropdown(catIdx) {
  const rows = document.querySelectorAll("#cat-editor-list .cat-row");
  const dropdown = rows[catIdx]?.querySelector(".color-dropdown");
  if (!dropdown) return;
  document
    .querySelectorAll(".color-dropdown.open")
    .forEach((node) => { if (node !== dropdown) node.classList.remove("open"); });
  dropdown.classList.toggle("open");
}

async function deleteCat(catIdx) {
  const categoryEditor = _getCategoryEditorModel();
  const deletionState = typeof buildRuntimeCategoryDeletionState === "function"
    ? buildRuntimeCategoryDeletionState({
        categories: tempCats,
        index: catIdx,
        tasks,
      })
    : {
        isUsed: typeof buildRuntimeIsCategoryUsedByTasks === "function"
          ? buildRuntimeIsCategoryUsedByTasks(tasks, catIdx)
          : tasks.some((t) => t.cat === catIdx),
        categories: typeof buildRuntimeRemoveCategoryDraftAt === "function"
          ? buildRuntimeRemoveCategoryDraftAt(tempCats, catIdx)
          : tempCats.filter((_, idx) => idx !== catIdx),
      };
  if (deletionState.isUsed) {
    const res = await Swal.fire({
      icon: "warning",
      title: categoryEditor.deleteInUseTitle,
      text: categoryEditor.deleteInUseText,
      showCancelButton: true,
      confirmButtonText: categoryEditor.deleteConfirmButtonText,
      confirmButtonColor: categoryEditor.deleteConfirmButtonColor,
      cancelButtonText: categoryEditor.deleteCancelButtonText,
    });
    if (!res.isConfirmed) return;
  }
  flushCatNames();
  tempCats = deletionState.categories;
  renderCatList();
}

function _closeColorDropdowns(e) {
  if (!e.target.closest(".color-picker-wrap"))
    document.querySelectorAll(".color-dropdown.open").forEach((d) => d.classList.remove("open"));
}

function flushCatNames() {
  const values = [...document.querySelectorAll("#cat-editor-list .cat-row .cat-name-inp")]
    .map((inp) => inp.value);
  tempCats = typeof buildRuntimeApplyCategoryNamesFromValues === "function"
    ? buildRuntimeApplyCategoryNamesFromValues(tempCats, values)
    : tempCats.map((cat, i) => ({ ...cat, name: values[i] ?? cat.name }));
}

function addCat() {
  const categoryEditor = _getCategoryEditorModel();
  flushCatNames();
  tempCats = typeof buildRuntimeCreateNextCategoryDraft === "function"
    ? buildRuntimeCreateNextCategoryDraft({
        categories: tempCats,
        palette: CAT_PALETTE,
        newCategoryName: categoryEditor.newCategoryName,
      })
    : [...tempCats, { name: categoryEditor.newCategoryName, color: CAT_PALETTE[tempCats.length % CAT_PALETTE.length] }];
  renderCatList();
  setTimeout(() => {
    const rows = document.querySelectorAll("#cat-editor-list .cat-row");
    const last = rows[rows.length - 1];
    if (last) {
      last.scrollIntoView({ behavior: "smooth" });
      last.querySelector(".cat-name-inp")?.select();
    }
  }, 50);
}

function saveCats() {
  flushCatNames();
  cats = [...tempCats];
  saveAll();
  render();
  closeCatModal();
}

function closeCatModal() {
  document.querySelectorAll(".color-dropdown.open").forEach((d) => d.classList.remove("open"));
  document.getElementById("cat-modal").style.display = "none";
}

/* ── СПИСОК ЗАЛЕЖНОСТЕЙ ─────────────────────────────────────────────────── */
let _dlFilter = "all"; // 'all' | 'FS' | 'SS' | 'FF'

function openDepList() {
  const session = typeof buildRuntimeDependencyListOpenSession === "function"
    ? buildRuntimeDependencyListOpenSession()
    : { filter: "all", visible: true };
  _dlFilter = session.filter;
  _renderDepList();
  document.getElementById("dep-list-modal").style.display = session.visible ? "flex" : "none";
}

function closeDepList() {
  document.getElementById("dep-list-modal").style.display = "none";
}

function setDepListFilter(f) {
  _dlFilter = typeof buildRuntimeApplyDependencyListFilter === "function"
    ? buildRuntimeApplyDependencyListFilter(_dlFilter, f)
    : f;
  document.querySelectorAll(".dl-filter-btn").forEach(b =>
    b.classList.toggle("on", b.dataset.f === f));
  _renderDepList();
}

function _renderDepList() {
  const dependencyListModal = _getDependencyListModalModel();
  const TC = { FS: "var(--acc)", SS: "var(--warn)", FF: "var(--txt3)" };
  const depState = typeof buildRuntimeDependencyListState === "function"
    ? buildRuntimeDependencyListState({
        tasks,
        filter: _dlFilter,
        criticalSet,
        categories: cats,
        normDep,
      })
    : { allCount: 0, filteredCount: 0, counts: { all: 0, FS: 0, SS: 0, FF: 0 }, rows: [] };

  document.getElementById("dl-count").textContent =
    dependencyListModal.countLabel(depState.filteredCount, depState.allCount);

  document.querySelectorAll(".dl-filter-btn").forEach(b => {
    const f = b.dataset.f;
    b.textContent = f === "all" ? dependencyListModal.allFilterLabel(depState.counts.all) :
                    f === "FS"  ? dependencyListModal.fsFilterLabel(depState.counts.FS || 0) :
                    f === "SS"  ? dependencyListModal.ssFilterLabel(depState.counts.SS || 0) :
                                  dependencyListModal.ffFilterLabel(depState.counts.FF || 0);
    b.classList.toggle("on", f === _dlFilter);
  });

  const body = document.getElementById("dl-body");
  if (!depState.rows.length) {
    body.innerHTML = `<div class="dl-empty">${
      depState.allCount ? dependencyListModal.emptyFilteredText : dependencyListModal.emptyProjectText
    }</div>`;
    return;
  }

  const rows = depState.rows.map((d) => {
    return `<tr class="dl-row" data-dep-action="go-to-task" data-task-index="${d.fromTi}" title="${dependencyListModal.rowTitle}">
      <td class="dl-i">${d.index}</td>
      <td class="dl-task">
        <span class="dl-dot" style="background:${d.fromColor}"></span>
        <span class="dl-tn" style="color:${d.fromColor}">#${d.fromTask.n}</span>
        <span class="dl-nm">${d.fromTask.name}</span>
      </td>
      <td class="dl-arrow">
        <span class="dep-tag-badge" style="background:${TC[d.type] || "var(--acc)"}">${d.typeLabel}</span>
      </td>
      <td class="dl-task">
        <span class="dl-dot" style="background:${d.toColor}"></span>
        <span class="dl-tn" style="color:${d.toColor}">#${d.toTask.n}</span>
        <span class="dl-nm">${d.toTask.name}</span>
      </td>
      <td class="dl-crit">${d.isCritical ? `<span class="dl-crit-ic" title="${dependencyListModal.criticalRowTitle}"></span>` : ""}</td>
    </tr>`;
  }).join("");

  body.innerHTML = `<table class="dl-tbl">
    <thead><tr>
      <th class="dl-i">#</th>
      <th>${dependencyListModal.predecessorHeader}</th>
      <th class="dl-arrow">${dependencyListModal.typeHeader}</th>
      <th>${dependencyListModal.successorHeader}</th>
      <th class="dl-crit" title="${dependencyListModal.criticalPathTitle}"><i data-lucide="activity" style="width:12px;height:12px"></i></th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
  lucide.createIcons({ nodes: [body] });
}

function depListGo(fromTi) {
  closeDepList();
  const ganttPane = document.getElementById("pane-gantt");
  const navPlan = typeof buildRuntimeDependencyNavigationPlan === "function"
    ? buildRuntimeDependencyNavigationPlan(fromTi, !!ganttPane?.classList.contains("active"))
    : {
        shouldActivateGantt: !!ganttPane && !ganttPane.classList.contains("active"),
        targetRowId: `tr${fromTi}`,
        taskIndex: fromTi,
      };
  if (navPlan.shouldActivateGantt) {
    document.querySelector('[data-app-shell-action="switch-tab"][data-tab-id="gantt"]')?.click();
  }
  requestAnimationFrame(() => {
    highlightDepChain(navPlan.taskIndex);
    document.getElementById(navPlan.targetRowId)?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

function openProj() {
  const canManage = typeof canManageProject === "function" ? canManageProject() : true;
  const formState = typeof buildRuntimeProjectSettingsFormState === "function"
    ? buildRuntimeProjectSettingsFormState({ project: proj, canManage })
    : {
        name: proj.name,
        sm: proj.sm,
        sy: proj.sy,
        nm: proj.nm,
        canManage,
      };
  if (isReactProjectSettingsEnabled()) {
    _reactProjectSettingsState.visible = true;
    document.getElementById("proj-modal").style.display = "flex";
    syncReactProjectSettingsBridge();
    return;
  }
  const sel = document.getElementById("p-sm");
  sel.innerHTML = MN.map((m, i) => `<option value="${i}">${m}</option>`).join("");
  sel.value = String(formState.sm);
  const nameInput = document.getElementById("p-name");
  const yearInput = document.getElementById("p-sy");
  const durationInput = document.getElementById("p-nm");
  const modal = document.getElementById("proj-modal");

  nameInput.value = formState.name;
  yearInput.value = formState.sy;
  durationInput.value = formState.nm;

  [nameInput, sel, yearInput, durationInput].forEach((el) => {
    if (!el) return;
    el.disabled = !formState.canManage;
    el.readOnly = !formState.canManage;
  });

  modal.querySelectorAll(".num-btn").forEach((btn) => {
    btn.disabled = !formState.canManage;
    btn.style.display = formState.canManage ? "" : "none";
  });

  const catsBtn = modal.querySelector(".proj-modal-cats .btn");
  if (catsBtn) catsBtn.style.display = formState.canManage ? "" : "none";

  const saveBtn = modal.querySelector(".m-btns .btn-acc");
  if (saveBtn) saveBtn.style.display = formState.canManage ? "" : "none";

  modal.style.display = "flex";
}

function closeProjModal() {
  document.getElementById("proj-modal").style.display = "none";
  _reactProjectSettingsState.visible = false;
  if (isReactProjectSettingsEnabled()) syncReactProjectSettingsBridge();
}

async function saveProjSettings(nextState = null) {
  if (typeof canManageProject === "function" && !canManageProject()) return;

  const updated = _buildProjectSettingsUpdate(
    {
      proj: { ...proj },
      cats: cats.map((c) => ({ ...c })),
      tasks: tasks.map((t) => ({ ...t })),
      nextN,
    },
    {
      name: nextState?.name ?? document.getElementById("p-name").value,
      sm: +(nextState?.sm ?? document.getElementById("p-sm").value),
      sy: +(nextState?.sy ?? document.getElementById("p-sy").value),
      nm: +(nextState?.nm ?? document.getElementById("p-nm").value),
    },
  );

  proj = { ...updated.snapshot.proj };
  tasks = updated.snapshot.tasks.map((t) => ({ ...t }));
  closeProjModal();
  saveAll();
  render();
  await logProjectMutation(AUDIT_EVENT_TYPES.PROJECT_SETTINGS_UPDATED, {
    before: updated.before,
    after: updated.after,
    shiftedTasks: updated.shiftedTasks,
  });
  if (isReactProjectSettingsEnabled()) syncReactProjectSettingsBridge();
  return { ok: true };
}

function getProjectSettingsBridgeSnapshot() {
  return _getProjectSettingsBridgeState();
}

function closeReactProjectSettings() {
  closeProjModal();
}

async function saveProjectSettingsFromReact(nextState) {
  return saveProjSettings(nextState);
}

function openProjManager() {
  if (isReactProjectManagerEnabled()) {
    _reactProjectManagerState.visible = true;
    document.getElementById("projmgr-modal").style.display = "flex";
    syncReactProjectManagerBridge();
    return;
  }
  const projectManagerList = _getProjectManagerListModel();
  const getManagePermission = (projectId) => {
    if (typeof getProjectPermissions !== "function") return true;
    const role = typeof getStoredProjectRole === "function"
      ? getStoredProjectRole(projectId, "owner")
      : allProjects?.[projectId]?._role || (projectId === currentId ? _projectRole : "owner");
    return getProjectPermissions(role).canManageProject;
  };
  const roleLabels = typeof PROJECT_ROLE_LABELS !== "undefined" ? PROJECT_ROLE_LABELS : {};
  const groups = typeof buildRuntimeProjectManagerGroupModel === "function"
    ? buildRuntimeProjectManagerGroupModel({
        projects: allProjects || {},
        currentId,
        canManageProject: (projectId) => getManagePermission(projectId),
        getRoleLabel: (role) => typeof getRuntimeProjectRoleLabel === "function"
          ? getRuntimeProjectRoleLabel(role)
          : (roleLabels[role] || role),
        getSharedMetaLine: (access) => typeof buildRuntimeSharedProjectMetaLine === "function"
          ? buildRuntimeSharedProjectMetaLine(access || null)
          : projectManagerList.ownProjectMeta,
      })
    : { own: [], shared: [] };

  const renderProjectRow = (row) => {
    return `<div class="pj-row${row.isActive ? " active" : ""}" data-project-manager-action="switch-project" data-project-id="${row.id}">
       <div class="pj-main">
         <input class="pj-name-inp" value="${row.name}" data-project-id="${row.id}" ${row.canManageProject ? "" : "disabled"}>
         <span class="pj-role-chip pj-role-${row.role}">${row.roleLabel}</span>
       </div>
       <div class="pj-sub">
         <span class="pj-tasks-count">${projectManagerList.tasksCountLabel(row.tasksCount || 0)}</span>
         <div class="pj-meta">${row.sharedMetaLine || projectManagerList.ownProjectMeta}</div>
       </div>
       ${
          row.canManageProject
            ? `<span class="pj-del" data-project-manager-action="delete-project" data-project-id="${row.id}" title="${projectManagerList.deleteTitle}"><i data-lucide="trash-2"></i></span>`
            : ""
        }
      </div>`;
  };

  const renderGroup = (title, list) =>
    list.length
      ? `<div class="proj-group">
          <div class="proj-group-title">${title}</div>
          ${list.map(renderProjectRow).join("")}
        </div>`
      : "";

  document.getElementById("proj-list-el").innerHTML = [
    renderGroup(projectManagerList.ownGroupTitle, groups.own || []),
    renderGroup(projectManagerList.sharedGroupTitle, groups.shared || []),
  ].join("");
  lucide.createIcons({ nodes: [document.getElementById("proj-list-el")] });
  document.getElementById("projmgr-modal").style.display = "flex";
}

function closeProjMgr() {
  document.getElementById("projmgr-modal").style.display = "none";
  _reactProjectManagerState.visible = false;
  if (isReactProjectManagerEnabled()) syncReactProjectManagerBridge();
}

async function loadDemoProject(skipConfirm = false) {
  const demoProjectDialog = _getDemoProjectDialogModel();
  const demoProjectSeed = _getDemoProjectSeedModel();
  if (!skipConfirm) {
    const { isConfirmed } = await Swal.fire({
      icon: "info",
      title: demoProjectDialog.title,
      html: demoProjectDialog.html,
      showCancelButton: true,
      confirmButtonText: demoProjectDialog.confirmButtonText,
      cancelButtonText: demoProjectDialog.cancelButtonText,
    });
    if (!isConfirmed) return;
  }

  const id = "p_" + Date.now();
  const snapshot = _buildDemoProjectSnapshot(demoProjectSeed.projectName, new Date().getFullYear());
  allProjects = typeof buildRuntimeAddProjectToCollection === "function"
    ? buildRuntimeAddProjectToCollection(allProjects || {}, id, snapshot)
    : { ...(allProjects || {}), [id]: snapshot };
  try {
    const payload = typeof buildRuntimeStorageBufferPayload === "function"
      ? buildRuntimeStorageBufferPayload(allProjects, currentId, null)
      : { allProjects, currentId };
    localStorage.setItem(SK_BUF, JSON.stringify(payload));
  } catch (_) {}
  switchProject(id);
  closeProjMgr();
  Swal.fire({
    toast: true, position: "top-end", icon: "success",
    title: demoProjectDialog.loadedToastTitle,
    showConfirmButton: false, timer: 2500,
  });
  if (isReactProjectManagerEnabled()) syncReactProjectManagerBridge();
}

async function createProject(nameFromReact = null) {
  const createProjectDialog = _getCreateProjectDialogModel();
  let name = nameFromReact;
  if (name == null) {
    const result = await Swal.fire({
      title: createProjectDialog.title,
      input: "text",
      inputLabel: createProjectDialog.inputLabel,
      inputValue: createProjectDialog.inputValue,
      inputAttributes: { maxlength: 80 },
      showCancelButton: true,
      confirmButtonText: createProjectDialog.confirmButtonText,
      cancelButtonText: createProjectDialog.cancelButtonText,
      inputValidator: (v) => !v.trim() && createProjectDialog.inputRequiredMessage,
    });
    name = result.value;
  }
  if (!String(name || "").trim()) {
    return { ok: false, error: createProjectDialog.inputRequiredMessage };
  }
  const id = "p_" + Date.now();
  const defaults = typeof buildRuntimeResolveProjectDefaults === "function"
    ? buildRuntimeResolveProjectDefaults(userProfile?.defaults || null, DEF_PROJ)
    : {
        sm: userProfile?.defaults?.sm ?? DEF_PROJ.sm,
        sy: userProfile?.defaults?.sy ?? DEF_PROJ.sy,
        nm: userProfile?.defaults?.nm ?? DEF_PROJ.nm,
      };
  const snapshot = _buildEmptyProjectSnapshot(String(name).trim(), {
    sm: defaults.sm,
    sy: defaults.sy,
    nm: defaults.nm,
  });
  allProjects = typeof buildRuntimeAddProjectToCollection === "function"
    ? buildRuntimeAddProjectToCollection(allProjects || {}, id, snapshot)
    : { ...(allProjects || {}), [id]: snapshot };
  saveAll();
  switchProject(id);
  openProjManager();
  if (isReactProjectManagerEnabled()) syncReactProjectManagerBridge();
  return { ok: true };
}

async function deleteProject(id, skipConfirm = false) {
  const role = typeof getStoredProjectRole === "function"
    ? getStoredProjectRole(id, "owner")
    : allProjects?.[id]?._role || (id === currentId ? _projectRole : "owner");
  if (typeof canManageProject === "function" && !canManageProject(role)) return;

  if (!_canDeleteProjectCount(Object.keys(allProjects).length)) {
    const cannotDelete = _getCannotDeleteLastProjectModel();
    if (!skipConfirm) Swal.fire({ icon: "info", title: cannotDelete.title, text: cannotDelete.text });
    return { ok: false, error: cannotDelete.text };
  }
  const deleteProjectDialog = _getDeleteProjectDialogModel(allProjects[id]?.proj?.name || "");
  if (!skipConfirm) {
    const res = await Swal.fire({
      icon: "warning",
      title: deleteProjectDialog.title,
      html: deleteProjectDialog.html,
      showCancelButton: true,
      confirmButtonText: deleteProjectDialog.confirmButtonText,
      confirmButtonColor: deleteProjectDialog.confirmButtonColor,
      cancelButtonText: deleteProjectDialog.cancelButtonText,
    });
    if (!res.isConfirmed) return { ok: false, cancelled: true };
  }
  if (typeof apiDeleteProject === "function" && typeof isLoggedIn === "function" && isLoggedIn()) {
    await apiDeleteProject(id);
  }
  const collectionDeletion = typeof buildRuntimeApplyProjectDeletionToCollection === "function"
    ? buildRuntimeApplyProjectDeletionToCollection(allProjects || {}, currentId, id)
    : {
        projects: Object.fromEntries(Object.entries(allProjects || {}).filter(([projectId]) => projectId !== id)),
        deletionState: typeof buildRuntimeProjectDeletionState === "function"
          ? buildRuntimeProjectDeletionState(Object.keys(allProjects || {}), currentId, id)
          : {
              nextCurrentId: _resolveNextProjectAfterDeletion(Object.keys(allProjects || {}), currentId, id),
              shouldReloadCurrent: currentId === id,
              remainingProjectIds: Object.keys(allProjects || {}).filter((projectId) => projectId !== id),
            },
      };
  allProjects = collectionDeletion.projects;
  const deletionState = collectionDeletion.deletionState;
  if (currentId === id) {
    currentId = deletionState.nextCurrentId;
    if (deletionState.shouldReloadCurrent && currentId) loadCurrent();
  }
  saveAll();
  render();
  openProjManager();
  if (isReactProjectManagerEnabled()) syncReactProjectManagerBridge();
  return { ok: true };
}

function closeReactProjectManager() {
  closeProjMgr();
}

async function createProjectFromReact(name) {
  return createProject(name);
}

async function loadDemoProjectFromReact() {
  return loadDemoProject(true);
}

async function deleteProjectFromReact(id) {
  return deleteProject(id, true);
}

function getProjectManagerBridgeSnapshot() {
  return _getProjectManagerBridgeState();
}

function openPhaseEditor(ti) { openEdit(ti); }
function closePhaseModal() {}
function savePhases() {}
function clearPhases(ti) {
  const nextState = typeof buildRuntimeClearTaskPhasesAt === "function"
    ? buildRuntimeClearTaskPhasesAt(tasks, ti)
    : {
        tasks: tasks[ti]
          ? tasks.map((task, index) => index === ti ? { ...task, phases: null } : task)
          : tasks,
        changed: !!tasks[ti],
      };
  if (!nextState.changed) return;
  tasks = nextState.tasks;
  saveAll();
  render();
}
