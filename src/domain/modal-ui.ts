export interface TaskRangeWarningModel {
  title: string;
  text: string;
}

export interface TaskDependencyWarningDialogModel {
  title: string;
  confirmButtonText: string;
  cancelButtonText: string;
}

export interface TaskSavedToastModel {
  title: string;
}

export interface TaskDeleteDialogModel {
  title: string;
  confirmButtonText: string;
  confirmButtonColor: string;
  cancelButtonText: string;
}

export interface ProjectManagerListModel {
  ownGroupTitle: string;
  sharedGroupTitle: string;
  ownProjectMeta: string;
  tasksCountLabel: (count: number) => string;
  deleteTitle: string;
}

export interface DemoProjectDialogModel {
  title: string;
  html: string;
  confirmButtonText: string;
  cancelButtonText: string;
  loadedToastTitle: string;
}

export interface CreateProjectDialogModel {
  title: string;
  inputLabel: string;
  inputValue: string;
  confirmButtonText: string;
  cancelButtonText: string;
  inputRequiredMessage: string;
}

export interface CannotDeleteLastProjectModel {
  title: string;
  text: string;
}

export interface DeleteProjectDialogModel {
  title: string;
  html: string;
  confirmButtonText: string;
  confirmButtonColor: string;
  cancelButtonText: string;
}

export interface NotesModalModel {
  emptyStateText: string;
  countTitle: (count: number) => string;
  defaultTitle: string;
  editButtonLabel: string;
  deleteButtonLabel: string;
  saveButtonLabel: string;
  cancelButtonLabel: string;
  deletedHistoryLabel: string;
  editedHistoryLabel: string;
  deletedPlaceholderText: string;
  defaultAuthorLabel: string;
  deleteDialogTitle: string;
  deleteDialogConfirmButtonText: string;
  deleteDialogConfirmButtonColor: string;
  deleteDialogCancelButtonText: string;
}

export interface CategoryEditorModel {
  accessDeniedTitle: string;
  namePlaceholder: string;
  swatchTitle: string;
  deleteTitle: string;
  colorCustomLabel: string;
  deleteInUseTitle: string;
  deleteInUseText: string;
  deleteConfirmButtonText: string;
  deleteConfirmButtonColor: string;
  deleteCancelButtonText: string;
  newCategoryName: string;
}

export interface DependencyListModalModel {
  emptyFilteredText: string;
  emptyProjectText: string;
}

export function buildTaskRangeWarningModel(): TaskRangeWarningModel {
  return {
    title: "Невірний діапазон",
    text: "Початок не може бути після кінця.",
  };
}

export function buildTaskDependencyWarningDialogModel(): TaskDependencyWarningDialogModel {
  return {
    title: "Порушення залежностей",
    confirmButtonText: "Зберегти",
    cancelButtonText: "Повернутися",
  };
}

export function buildTaskSavedToastModel(isEdit: boolean): TaskSavedToastModel {
  return {
    title: isEdit ? "Роботу оновлено" : "Роботу додано",
  };
}

export function buildTaskDeleteDialogModel(taskName: string): TaskDeleteDialogModel {
  return {
    title: "Видалити роботу?",
    confirmButtonText: "Видалити",
    confirmButtonColor: "#c42b2b",
    cancelButtonText: "Скасувати",
  };
}

export function buildProjectManagerListModel(): ProjectManagerListModel {
  return {
    ownGroupTitle: "Мої проєкти",
    sharedGroupTitle: "Розшарені проєкти",
    ownProjectMeta: "Власний проєкт",
    tasksCountLabel: (count: number) => `${count} робіт`,
    deleteTitle: "Видалити",
  };
}

export function buildDemoProjectDialogModel(): DemoProjectDialogModel {
  return {
    title: "Завантажити демо-проєкт?",
    html: `<div class="swal-info-text">Буде створено проєкт «Ремонт офісу» з прикладом задач, категорій та бюджету.<br><br>Ваші поточні проєкти залишаться без змін.</div>`,
    confirmButtonText: "Завантажити",
    cancelButtonText: "Скасувати",
    loadedToastTitle: "Демо-проєкт завантажено",
  };
}

export function buildCreateProjectDialogModel(): CreateProjectDialogModel {
  return {
    title: "Новий проєкт",
    inputLabel: "Назва проєкту",
    inputValue: "Новий проєкт",
    confirmButtonText: "Створити",
    cancelButtonText: "Скасувати",
    inputRequiredMessage: "Введіть назву",
  };
}

export function buildCannotDeleteLastProjectModel(): CannotDeleteLastProjectModel {
  return {
    title: "Неможливо видалити",
    text: "Має залишатися хоча б один проєкт.",
  };
}

export function buildDeleteProjectDialogModel(projectName: string): DeleteProjectDialogModel {
  return {
    title: "Видалити проєкт?",
    html: `«${projectName}»<br><small>Цю дію неможливо скасувати.</small>`,
    confirmButtonText: "Видалити",
    confirmButtonColor: "#c42b2b",
    cancelButtonText: "Скасувати",
  };
}

export function buildNotesModalModel(): NotesModalModel {
  return {
    emptyStateText: "Нотаток поки немає",
    countTitle: (count: number) => `${count} нотаток`,
    defaultTitle: "Нотатки",
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

export function buildCategoryEditorModel(): CategoryEditorModel {
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

export function buildDependencyListModalModel(): DependencyListModalModel {
  return {
    emptyFilteredText: "Немає залежностей вибраного типу",
    emptyProjectText: "У проєкті немає залежностей між роботами",
  };
}
