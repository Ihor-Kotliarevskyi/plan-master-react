export interface ContractorSummaryLabels {
  contractors: string;
  contracts: string;
  budget: string;
  paid: string;
  actsAmount: string;
  actsDebt: string;
  rest: string;
  currencyUnit: string;
}

export interface ContractorFilterLabels {
  statusLabel: string;
  statusAllLabel: string;
  statusDebtLabel: string;
  statusPaidLabel: string;
  statusOverpaidLabel: string;
  statusUnpaidLabel: string;
  typeLabel: string;
  typeAllLabel: string;
  categoryLabel: string;
  categoryAllLabel: string;
  resetFiltersTitle: string;
  chooseVisibleTitle: string;
}

export interface ContractorSelectionLabels {
  showSelectionLabel: string;
  hideSelectionLabel: string;
  selectedLabel: string;
  clearSelectionLabel: string;
  deleteSelectedLabel: string;
}

export interface ContractorTableLabels {
  emptyContractorName: string;
  noPermissionTitle: string;
  emptyFilteredText: string;
  selectAllTitle: string;
  rowNoHeader: string;
  supplierHeader: string;
  tasksCountHeader: string;
  itemsCountHeader: string;
  budgetHeader: string;
  paidHeader: string;
  restHeader: string;
  actsAmountHeader: string;
  actsDebtHeader: string;
  paymentsCountHeader: string;
  lastPaymentHeader: string;
  statusHeader: string;
  emDash: string;
  contractActEmptyText: string;
  actEmptyText: string;
  paymentEmptyText: string;
  forecastEmptyText: string;
  addActTitle: string;
  addPaymentTitle: string;
  editActTitle: string;
  deleteActTitle: string;
  editPaymentTitle: string;
  deletePaymentTitle: string;
}

export function buildContractorSummaryLabels(): ContractorSummaryLabels {
  return {
    contractors: "Контрагентів",
    contracts: "Договорів",
    budget: "Кошторис",
    paid: "Оплачено",
    actsAmount: "Сума актів",
    actsDebt: "Борг по актах",
    rest: "Залишок",
    currencyUnit: "грн",
  };
}

export function buildContractorFilterLabels(): ContractorFilterLabels {
  return {
    statusLabel: "Статус",
    statusAllLabel: "Усі статуси",
    statusDebtLabel: "Є залишок",
    statusPaidLabel: "Оплачено",
    statusOverpaidLabel: "Переплата",
    statusUnpaidLabel: "Без оплат",
    typeLabel: "Тип",
    typeAllLabel: "Усі типи",
    categoryLabel: "Категорія",
    categoryAllLabel: "Усі категорії",
    resetFiltersTitle: "Скинути фільтри контрагентів",
    chooseVisibleTitle: "Вибрати всі видимі контрагенти",
  };
}

export function buildContractorSelectionLabels(): ContractorSelectionLabels {
  return {
    showSelectionLabel: "Вибрати",
    hideSelectionLabel: "Сховати вибір",
    selectedLabel: "Вибрано",
    clearSelectionLabel: "Очистити",
    deleteSelectedLabel: "Видалити вибраних",
  };
}

export function buildContractorTableLabels(): ContractorTableLabels {
  return {
    emptyContractorName: "Без контрагента",
    noPermissionTitle: "У вас немає прав на зміну контрагентів у цьому проєкті",
    emptyFilteredText: "Немає контрагентів за вибраними фільтрами",
    selectAllTitle: "Вибрати всі видимі контрагенти",
    rowNoHeader: "№",
    supplierHeader: "Контрагент",
    tasksCountHeader: "Робіт",
    itemsCountHeader: "Договорів",
    budgetHeader: "Кошторис",
    paidHeader: "Оплачено",
    restHeader: "Залишок",
    actsAmountHeader: "Сума актів",
    actsDebtHeader: "Заборг. по актах",
    paymentsCountHeader: "Платежів",
    lastPaymentHeader: "Остання оплата",
    statusHeader: "Статус",
    emDash: "—",
    contractActEmptyText: "Договорів по цьому контрагенту ще немає",
    actEmptyText: "Актів по цьому контрагенту ще немає",
    paymentEmptyText: "Платежів по цьому контрагенту ще немає",
    forecastEmptyText: "Планового кошторису без контрагента немає",
    addActTitle: "Додати акт",
    addPaymentTitle: "Додати платіж",
    editActTitle: "Редагувати акт",
    deleteActTitle: "Видалити акт",
    editPaymentTitle: "Редагувати платіж",
    deletePaymentTitle: "Видалити платіж",
  };
}
