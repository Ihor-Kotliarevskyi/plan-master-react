type CostPayment = Record<string, any>;
type CostItem = Record<string, any>;

export interface CreateCostItemInput {
  id: number | string;
  type?: string;
  defaultUnit: string;
}

export interface CreateCostPaymentInput {
  id: number | string;
  date: string;
  type?: string;
}

export function createCostItem(input: CreateCostItemInput): CostItem {
  const { id, type = "material", defaultUnit } = input;
  return {
    id,
    type,
    name: "",
    supplier: "",
    unit: defaultUnit,
    qty: 1,
    unitPrice: null,
    contractNo: "",
    contractNote: "",
    payments: [],
  };
}

export function createCostPayment(input: CreateCostPaymentInput): CostPayment {
  const { id, date, type = "act" } = input;
  return {
    id,
    date,
    type,
    amount: null,
    note: "",
  };
}

export function removeCostItem(items: CostItem[], id: number | string): CostItem[] {
  return items.filter((item) => item.id !== id);
}

export function updateCostItemField(
  items: CostItem[],
  id: number | string,
  field: string,
  value: unknown,
): CostItem[] {
  return items.map((item) => {
    if (item.id !== id) return item;
    const nextValue = value === "__custom" ? "" : value;
    return {
      ...item,
      [field]: nextValue,
      ...(field === "contractNote" ? { note: nextValue } : {}),
    };
  });
}

export function updateCostItemContract(
  items: CostItem[],
  id: number | string,
  value: string,
  contractNamePrefix: string,
): CostItem[] {
  return items.map((item) =>
    item.id !== id
      ? item
      : {
          ...item,
          contractNo: value,
          name: value ? `${contractNamePrefix} ${value}` : "",
        },
  );
}

export function toggleExpandedCostId(
  expandedIds: Array<number | string>,
  id: number | string,
): Array<number | string> {
  return expandedIds.includes(id)
    ? expandedIds.filter((entry) => entry !== id)
    : [...expandedIds, id];
}

export function addPaymentToCostItem(
  items: CostItem[],
  itemId: number | string,
  payment: CostPayment,
): CostItem[] {
  return items.map((item) =>
    item.id !== itemId
      ? item
      : {
          ...item,
          payments: [...(Array.isArray(item.payments) ? item.payments : []), payment],
        },
  );
}

export function removePaymentFromCostItem(
  items: CostItem[],
  itemId: number | string,
  paymentIndex: number,
): CostItem[] {
  return items.map((item) => {
    if (item.id !== itemId || !Array.isArray(item.payments)) return item;
    return {
      ...item,
      payments: item.payments.filter((_: unknown, index: number) => index !== paymentIndex),
    };
  });
}

export function updateCostPaymentField(
  items: CostItem[],
  itemId: number | string,
  paymentIndex: number,
  field: string,
  value: unknown,
): CostItem[] {
  return items.map((item) => {
    if (item.id !== itemId || !Array.isArray(item.payments)) return item;
    return {
      ...item,
      payments: item.payments.map((payment, index) =>
        index !== paymentIndex ? payment : { ...payment, [field]: value },
      ),
    };
  });
}

export function calculateCostItemTotal(item: CostItem): number {
  const qty = item.qty == null ? 1 : (+item.qty || 0);
  return qty * (+item.unitPrice || 0);
}

export function calculateCostSpent(item: CostItem): number {
  return (Array.isArray(item.payments) ? item.payments : []).reduce(
    (sum: number, payment: CostPayment) => sum + (+payment.amount || 0),
    0,
  );
}

export function calculateCostTotals(items: CostItem[]) {
  const budget = Math.round(items.reduce((sum, item) => sum + calculateCostItemTotal(item), 0));
  const spent = Math.round(items.reduce((sum, item) => sum + calculateCostSpent(item), 0));
  const rest = budget - spent;
  const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  return { budget, spent, rest, pct };
}
