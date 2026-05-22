export interface FinanceStatusOption {
  value: string;
  label: string;
}

export interface FinanceFilterLabels {
  overviewTabLabel: string;
  tableTabLabel: string;
  searchPlaceholder: string;
  clearSearchTitle: string;
  categoryLabel: string;
  categoryAllLabel: string;
  statusLabel: string;
  statusAllLabel: string;
  contractorLabel: string;
  contractorAllLabel: string;
  budgetMinLabel: string;
  budgetMaxLabel: string;
  budgetMinPlaceholder: string;
  budgetMaxPlaceholder: string;
  onlyBudgetLabel: string;
  resetFiltersTitle: string;
  evmToggleLabel: string;
  evmToggleTitle: string;
  deleteTasksLabel: string;
  deleteTasksTitle: string;
}

export interface FinanceDeleteDialogs {
  noTasksTitle: string;
  confirmTitle: string;
  continueLabel: string;
  finalTitle: string;
  finalInputLabel: string;
  finalConfirmLabel: string;
  cancelLabel: string;
  validationMessage: string;
  filteredScopeLabel: string;
  fullScopeLabel: string;
}

export interface FinanceChartLabels {
  plannedLabel: string;
  actualLabel: string;
  projectedLabel: string;
  tooltipCurrencyUnit: string;
}

export interface FinanceUiModel {
  statusOptions: FinanceStatusOption[];
  filters: FinanceFilterLabels;
  deleteDialogs: FinanceDeleteDialogs;
  chart: FinanceChartLabels;
}

export function buildFinanceUiModel(): FinanceUiModel {
  return {
    statusOptions: [
      { value: "done", label: "Завершено (100%)" },
      { value: "active", label: "В роботі" },
      { value: "pending", label: "Не розпочато" },
      { value: "warn", label: "З порушеннями" },
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
      deleteTasksTitle: "Видалити всі роботи за поточними фільтрами",
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
      fullScopeLabel: "усі роботи проєкту",
    },
    chart: {
      plannedLabel: "План, грн",
      actualLabel: "Факт, грн",
      projectedLabel: "Прогноз, грн",
      tooltipCurrencyUnit: "грн",
    },
  };
}
