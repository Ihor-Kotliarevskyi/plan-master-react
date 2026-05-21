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
