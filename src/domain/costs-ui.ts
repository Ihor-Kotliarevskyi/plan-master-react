export interface CostTypeOption {
  label: string;
  icon: string;
}

export interface CostTableLabels {
  emptyStateText: string;
  budgetLabel: string;
  spentLabel: string;
  restLabel: string;
  contractPlaceholder: string;
  supplierPlaceholder: string;
  notePlaceholder: string;
  paymentAmountPlaceholder: string;
  paymentNotePlaceholder: string;
  addPaymentLabel: string;
  paymentCountLabel: (count: number, isOpen: boolean) => string;
  deleteItemTitle: string;
  contractNamePrefix: string;
  defaultUnit: string;
  currencyUnit: string;
}

export interface CostUiModel {
  costTypes: Record<string, CostTypeOption>;
  paymentTypes: Record<string, string>;
  units: string[];
  labels: CostTableLabels;
}

export function buildCostUiModel(): CostUiModel {
  return {
    costTypes: {
      material: { label: "Матеріали", icon: "🧱" },
      work: { label: "Роботи", icon: "👷" },
      equipment: { label: "Техніка", icon: "🔧" },
      service: { label: "Послуги", icon: "🤝" },
      other: { label: "Інше", icon: "📦" },
    },
    paymentTypes: {
      advance: "Аванс",
      act: "Акт",
      invoice: "Рахунок",
      other: "Інше",
    },
    units: [
      "м²", "м³", "пог.м", "т", "кг", "шт", "год",
      "люд*год", "день", "люд*день", "компл", "л", "рулон", "уп",
    ],
    labels: {
      emptyStateText: "Рядків немає — натисніть кнопку \"Тип\" вище щоб додати",
      budgetLabel: "Кошторис:",
      spentLabel: "Сплачено:",
      restLabel: "Залишок:",
      contractPlaceholder: "Договір №",
      supplierPlaceholder: "Контрагент",
      notePlaceholder: "Примітки",
      paymentAmountPlaceholder: "Сума (грн)",
      paymentNotePlaceholder: "Примітка (акт №, аванс тощо)",
      addPaymentLabel: "+ Платіж",
      paymentCountLabel: (count: number, isOpen: boolean) => `${isOpen ? "▾" : "▸"} ${count} плат.`,
      deleteItemTitle: "Видалити",
      contractNamePrefix: "Договір",
      defaultUnit: "договір",
      currencyUnit: "грн",
    },
  };
}
