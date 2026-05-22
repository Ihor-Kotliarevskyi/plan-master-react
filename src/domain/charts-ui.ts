export interface ChartAxisLabels {
  count: string;
  budget: string;
  spent: string;
  rest: string;
  prog: string;
  dur: string;
  cat: string;
  contr: string;
  status: string;
  month: string;
  task: string;
}

export interface ChartActionLabels {
  allCategoriesLabel: string;
  noContractorLabel: string;
  doneStatusLabel: string;
  activeStatusLabel: string;
  pendingStatusLabel: string;
  editTitle: string;
  printTitle: string;
  deleteTitle: string;
  chartFallbackTitle: string;
}

export interface AutoChartPreset {
  id: string;
  type: string;
  x: string;
  y: string;
  title: string;
}

export interface ChartsUiModel {
  axisLabels: ChartAxisLabels;
  actionLabels: ChartActionLabels;
  autoCharts: AutoChartPreset[];
}

export function buildChartsUiModel(): ChartsUiModel {
  const axisLabels: ChartAxisLabels = {
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
    task: "Робота",
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
      chartFallbackTitle: "Chart",
    },
    autoCharts: [
      { id: "a1", type: "pie", x: "cat", y: "count", title: "Кількість робіт за категорією" },
      { id: "a2", type: "bar", x: "cat", y: "prog", title: "Середнє виконання за категорією (%)" },
      { id: "a3", type: "doughnut", x: "status", y: "count", title: "Статус виконання" },
      { id: "a4", type: "bar", x: "task", y: "dur", title: "Тривалість (тиж., топ 15)" },
      { id: "a5", type: "line", x: "month", y: "count", title: "Активних робіт по місяцях" },
    ],
  };
}
