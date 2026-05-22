export interface PrintUiModel {
  noChartsText: string;
  previewLoadingText: string;
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
}

export function buildPrintUiModel(): PrintUiModel {
  return {
    noChartsText: "Немає побудованих графіків",
    previewLoadingText: "Оновлення передперегляду...",
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
  };
}
