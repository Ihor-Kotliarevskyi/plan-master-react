export interface PrintUiModel {
  noChartsText: string;
  previewLoadingText: string;
  previewPagesLabel: (pages: number) => string;
  reportTitle: string;
  nothingSelectedText: string;
  projectFallbackTitle: string;
  ganttTitle: string;
  ganttEmptyText: string;
  financeTitle: string;
  sCurveTitle: string;
  sCurveAlt: string;
  sCurveUnavailableText: string;
  weeklyCostTitle: string;
  weeklyCostAlt: string;
  weeklyCostUnavailableText: string;
  chartFallbackTitle: string;
  exportPdfTitle: string;
  exportPdfProgressText: string;
  exportPdfSuccessTitle: string;
  exportPdfErrorTitle: string;
  pdfPageProgressText: (current: number, total: number) => string;
  ganttPageTitlePrefix: string;
  tasksMetaLabel: string;
  workTypeHeader: string;
  plannedLabel: string;
  actualLabel: string;
  financeBudgetLabel: string;
  financeSpentLabel: string;
  financeRestLabel: string;
  financeTasksLabel: string;
  financeDoneSuffix: string;
  currencyUnit: string;
  financeTableHeaders: {
    task: string;
    category: string;
    weeks: string;
    budget: string;
    spent: string;
    rest: string;
    progress: string;
  };
  noTasksShortText: string;
  chartPageFallbackTitle: string;
}

export function buildPrintUiModel(): PrintUiModel {
  return {
    noChartsText: "Немає побудованих графіків",
    previewLoadingText: "Оновлення передперегляду...",
    previewPagesLabel: (pages: number) => `${pages} стор.`,
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
    pdfPageProgressText: (current: number, total: number) => `Сторінка ${current} з ${total}...`,
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
      progress: "%",
    },
    noTasksShortText: "Немає робіт.",
    chartPageFallbackTitle: "Графік",
  };
}
