export interface AppUiModel {
  importedProjectFallbackName: string;
  copiedTaskSuffix: string;
  duplicateProjectTitle: string;
  duplicateProjectText: string;
  importConfirmButtonText: string;
  cancelButtonText: string;
  requiredProjectNameMessage: string;
  duplicateProjectNameMessage: string;
  numberedCopySuffix: (count: number) => string;
  importSuccessTitle: (projectName: string) => string;
  importInvalidTitle: string;
  importInvalidText: string;
}

export function buildAppUiModel(): AppUiModel {
  return {
    importedProjectFallbackName: "Імпортований проєкт",
    copiedTaskSuffix: " (копія)",
    duplicateProjectTitle: "Проєкт з такою назвою вже існує",
    duplicateProjectText: "Щоб не плутати копії, задайте назву для імпортованого проєкту.",
    importConfirmButtonText: "Імпортувати",
    cancelButtonText: "Скасувати",
    requiredProjectNameMessage: "Введіть назву проєкту",
    duplicateProjectNameMessage: "Проєкт з такою назвою вже існує",
    numberedCopySuffix: (count: number) => ` (копія ${count})`,
    importSuccessTitle: (projectName: string) => `Імпортовано: «${projectName}»`,
    importInvalidTitle: "Помилка",
    importInvalidText: "Не вдалося прочитати файл. Перевірте формат JSON.",
  };
}
