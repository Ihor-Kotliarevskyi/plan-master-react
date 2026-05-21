export interface ProjectSelectLabels {
  ownGroupLabel: string;
  sharedGroupLabel: string;
  sharedRoleSeparator: string;
}

export interface GanttToolbarLabels {
  searchPlaceholder: string;
  clearSearchTitle: string;
  contractorLabel: string;
  allContractorsLabel: string;
  paymentLabel: string;
  allPaymentsLabel: string;
  debtLabel: string;
  paidLabel: string;
  overpaidLabel: string;
  unpaidLabel: string;
  hasPaymentsLabel: string;
  noPaymentsLabel: string;
  resetFiltersTitle: string;
  criticalPathLabel: string;
  dependencyArrowsTitle: string;
  dependencyArrowsLabel: string;
  dependencyListTitle: string;
  dependencyListLabel: string;
  groupByCategoryTitle: string;
  groupByCategoryLabel: string;
  overdueLabel: string;
  zoomOutTitle: string;
  zoomInTitle: string;
  monoBarTitle: string;
  monoBarColorTitle: string;
}

export interface TableLabels {
  reorderTitle: string;
  workTypeHeader: string;
  addTaskTitle: string;
  addTaskLabel: string;
  notesTitle: string;
  hidePastShowTitle: string;
  hidePastHideTitle: string;
  groupDoneLabel: (done: number, total: number, budgetText: string) => string;
  copyTaskTitle: string;
  notesCountLabel: (count: number) => string;
  notesDefaultLabel: string;
  phaseCountTitle: (count: number) => string;
  phaseBarTitle: (index: number, progress: number) => string;
}

export function buildProjectSelectLabels(): ProjectSelectLabels {
  return {
    ownGroupLabel: "Мої проєкти",
    sharedGroupLabel: "Розшарені",
    sharedRoleSeparator: " · ",
  };
}

export function buildGanttToolbarLabels(): GanttToolbarLabels {
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
    monoBarColorTitle: "Колір барів",
  };
}

export function buildTableLabels(): TableLabels {
  return {
    reorderTitle: "Перетягни для зміни порядку",
    workTypeHeader: "Вид робіт",
    addTaskTitle: "Додати роботу",
    addTaskLabel: "+ Робота",
    notesTitle: "Нотатки",
    hidePastShowTitle: "Показати минулі тижні",
    hidePastHideTitle: "Сховати минулі тижні",
    groupDoneLabel: (done: number, total: number, budgetText: string) =>
      `${done}/${total} виконано${budgetText ? " · " + budgetText : ""}`,
    copyTaskTitle: "Копіювати роботу",
    notesCountLabel: (count: number) => `${count} нотаток`,
    notesDefaultLabel: "Нотатки",
    phaseCountTitle: (count: number) => `${count} фаз`,
    phaseBarTitle: (index: number, progress: number) => `Фаза ${index + 1}: ${progress}%`,
  };
}
