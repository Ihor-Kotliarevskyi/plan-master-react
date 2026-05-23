type AnyRecord = Record<string, any>;

export interface ContractorSummaryTotals {
  budget: number;
  paid: number;
  rest: number;
  actsAmount: number;
  actsDebt: number;
  payments: number;
  items: number;
}

export interface ContractorSummaryModel {
  total: ContractorSummaryTotals;
  realContractors: number;
  withDebt: number;
}

export interface ContractorBulkDeleteModel {
  uniqueKeys: string[];
  rows: AnyRecord[];
  summary: {
    contractors: number;
    items: number;
    payments: number;
    acts: number;
  };
}

export interface PaymentRegisterCurrentState {
  rows: AnyRecord[];
  total: number;
  count: number;
}

export interface PaymentRegisterListItem {
  id: string;
  name: string;
  createdAt: string;
  count: number;
  total: number;
  filtersLabel: string;
}

export interface ContractorFilterShape {
  q?: string;
  status?: unknown;
  type?: unknown;
  cat?: unknown;
}

export function buildContractorSummaryModel(rows: AnyRecord[]): ContractorSummaryModel {
  const total = rows.reduce<ContractorSummaryTotals>(
    (acc, row) => {
      acc.budget += +row?.budget || 0;
      acc.paid += +row?.paid || 0;
      acc.rest += +row?.rest || 0;
      acc.actsAmount += +row?.actsAmount || 0;
      acc.actsDebt += +row?.actsDebt || 0;
      acc.payments += +row?.paymentsCount || 0;
      acc.items += +row?.itemsCount || 0;
      return acc;
    },
    { budget: 0, paid: 0, rest: 0, actsAmount: 0, actsDebt: 0, payments: 0, items: 0 },
  );

  return {
    total,
    realContractors: rows.filter((row) => !row?.isForecast).length,
    withDebt: rows.filter((row) => (+row?.rest || 0) > 0.5).length,
  };
}

export function hasContractorFilters(
  filters: ContractorFilterShape,
  multiValues: (value: unknown) => string[],
): boolean {
  return !!(
    multiValues(filters?.status).length ||
    multiValues(filters?.type).length ||
    multiValues(filters?.cat).length
  );
}

export function getVisibleDeletableContractorRows(
  rows: AnyRecord[],
  isBlocked: (key: string) => boolean,
): AnyRecord[] {
  return (rows || []).filter((row) => !isBlocked(String(row?.key || "")) && !row?.isForecast);
}

export function buildContractorBulkDeleteModel(
  keys: Iterable<string>,
  rows: AnyRecord[],
  isBlocked: (key: string) => boolean,
  summarize: (rows: AnyRecord[]) => ContractorBulkDeleteModel["summary"],
): ContractorBulkDeleteModel {
  const uniqueKeys = Array.from(new Set(Array.from(keys || []))).filter((key) => !isBlocked(String(key || "")));
  const matchedRows = (rows || []).filter((row) => uniqueKeys.includes(String(row?.key || "")));
  return {
    uniqueKeys,
    rows: matchedRows,
    summary: summarize(matchedRows),
  };
}

export function buildPaymentRegisterCurrentState(
  contractorRows: AnyRecord[],
  typeLabel: (type: string) => string,
): PaymentRegisterCurrentState {
  const rows: AnyRecord[] = (contractorRows || []).map((row) => ({
    ...row,
    payments: (row?.payments || []).map((payment: AnyRecord) => ({
      ...payment,
      typeLabel: typeLabel(String(payment?.type || "")),
    })),
  }));

  const registerRows = rows
    .filter((row) => !row?.isForecast)
    .flatMap((row) =>
      (row.payments || []).map((payment: AnyRecord) => ({
        supplier: row.supplier,
        date: payment.date || "",
        amount: +payment.amount || 0,
        type: payment.typeLabel || payment.type || "",
        taskNo: payment.taskNo,
        taskName: payment.taskName,
        itemName: payment.itemName,
        note: payment.note || "",
      })),
    )
    .sort(
      (a, b) =>
        String(a.date || "").localeCompare(String(b.date || "")) ||
        String(a.supplier || "").localeCompare(String(b.supplier || ""), "uk"),
    );

  const total = registerRows.reduce((sum, row) => sum + (+row.amount || 0), 0);
  return {
    rows: registerRows,
    total,
    count: registerRows.length,
  };
}

export function buildPaymentRegisterListItems(registers: AnyRecord[]): PaymentRegisterListItem[] {
  return (registers || []).map((register) => ({
    id: String(register?.id || ""),
    name: String(register?.name || ""),
    createdAt: String(register?.createdAt || ""),
    count: Array.isArray(register?.rows) ? register.rows.length : 0,
    total: +register?.total || 0,
    filtersLabel: String(register?.filtersLabel || ""),
  }));
}

export function buildSavedPaymentRegister(params: {
  id: string;
  name: string;
  createdAt: string;
  filters: ContractorFilterShape;
  filtersLabel: string;
  total: number;
  rows: AnyRecord[];
}) {
  return {
    id: params.id,
    name: params.name,
    createdAt: params.createdAt,
    filters: { ...params.filters },
    filtersLabel: params.filtersLabel,
    total: params.total,
    rows: params.rows,
  };
}

export function findPaymentRegisterById(registers: AnyRecord[], id: string): AnyRecord | undefined {
  return (registers || []).find((register) => String(register?.id) === String(id));
}
