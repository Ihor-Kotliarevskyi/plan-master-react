export interface AppUiModel {
  importedProjectFallbackName: string;
  copiedTaskSuffix: string;
  duplicateProjectTitle: string;
  duplicateProjectText: string;
  importConfirmButtonText: string;
  cancelButtonText: string;
  requiredProjectNameMessage: string;
  duplicateProjectNameMessage: string;
  numberedCopySuffix: (count: number | string) => string;
  importSuccessTitle: (projectName: string) => string;
  importInvalidTitle: string;
  importInvalidText: string;
  workbookSheets: {
    schedule: string;
    summary: string;
    estimate: string;
    payments: string;
  };
  scheduleHeader: string[];
  summaryHeader: string[];
  estimateHeader: string[];
  paymentsHeader: string[];
  overdueWeeksLabel: (weeks: number) => string;
  overdueMonthsLabel: (months: number) => string;
  overdueRemainingLabel: (remaining: number) => string;
  overdueLateLabel: (duration: string) => string;
  overdueTitle: (count: number) => string;
  overdueShowMoreLabel: (count: number) => string;
  overdueCollapseLabel: string;
  overdueCloseTitle: string;
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
    numberedCopySuffix: (count: number | string) => ` (копія ${count})`,
    importSuccessTitle: (projectName: string) => `Імпортовано: «${projectName}»`,
    importInvalidTitle: "Помилка",
    importInvalidText: "Не вдалося прочитати файл. Перевірте формат JSON.",
    workbookSheets: {
      schedule: "Графік",
      summary: "Зведення",
      estimate: "Кошторис",
      payments: "Платежі",
    },
    scheduleHeader: [
      "№", "Назва", "Категорія", "Підрядник",
      "Початок (міс.)", "Початок (тижд.)",
      "Кінець (міс.)", "Кінець (тижд.)",
      "Тривалість (тижд.)", "Виконання (%)",
      "Бюджет (грн)", "Витрачено (грн)", "Залишок (грн)",
      "Залежності",
    ],
    summaryHeader: [
      "Категорія", "Кількість робіт", "Бюджет (грн)",
      "Витрачено (грн)", "Залишок (грн)", "Середнє виконання (%)",
    ],
    estimateHeader: [
      "№", "Назва роботи", "Тип", "Матеріал/Послуга",
      "Постач./Підр.", "Од.", "К-ть", "Ціна/од.",
      "Кошторис (грн)", "Сплачено (грн)",
    ],
    paymentsHeader: [
      "№", "Назва роботи", "Контрагент", "Тип позиції", "Матеріал/Послуга",
      "Дата платежу", "Тип платежу", "Сума платежу (грн)", "Примітка",
    ],
    overdueWeeksLabel: (weeks: number) => `${weeks} тижд.`,
    overdueMonthsLabel: (months: number) => `${months} міс.`,
    overdueRemainingLabel: (remaining: number) => `залишилось <b>${remaining}%</b>`,
    overdueLateLabel: (duration: string) => `прострочено <b>${duration}</b>`,
    overdueTitle: (count: number) =>
      `Прострочено ${count} ${count === 1 ? "роботу" : count < 5 ? "роботи" : "робіт"}`,
    overdueShowMoreLabel: (count: number) => `▼ Показати ще ${count}`,
    overdueCollapseLabel: "▲ Згорнути",
    overdueCloseTitle: "Закрити",
  };
}
