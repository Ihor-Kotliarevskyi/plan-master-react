type AnyRecord = Record<string, any>;

export interface ContractorFilterShape {
  q?: string;
  status?: unknown;
  type?: unknown;
  cat?: unknown;
}

export interface ContractorBucketRow extends AnyRecord {
  key: string;
  supplier: string;
  budget: number;
  paid: number;
  rest: number;
  actsAmount: number;
  actsDebt: number;
  tasksCount: number;
  itemsCount: number;
  paymentsCount: number;
  lastPayment: string;
  status: string;
  rowNo: number;
}

export function contractorName(name: unknown, emptyName: string): string {
  const text = String(name ?? "").trim();
  return text || emptyName;
}

export function contractorKey(name: unknown, emptyName: string): string {
  return contractorName(name, emptyName).toLocaleLowerCase("uk-UA");
}

export function contractorItemTotal(item: AnyRecord): number {
  const qty = item?.qty == null ? 1 : (+item.qty || 0);
  return qty * (+item?.unitPrice || 0);
}

export function contractorStatus(row: AnyRecord) {
  if (row.rest < -0.5) return { key: "over", label: "Переплата" };
  if (row.budget > 0 && row.paid <= 0.5) return { key: "debt", label: "Без оплати" };
  if (row.budget > 0 && row.rest > 0.5) return { key: "debt", label: "Залишок" };
  if (row.budget > 0 && Math.abs(row.rest) <= 0.5) return { key: "paid", label: "Оплачено" };
  return { key: "empty", label: "Без сум" };
}

export function isPinnedContractorRow(row: AnyRecord, emptyName: string): boolean {
  return !!row?.isForecast || row?.key === contractorKey(emptyName, emptyName);
}

export function pinnedContractorRank(row: AnyRecord, emptyName: string): number {
  if (row?.isForecast) return 0;
  if (row?.key === contractorKey(emptyName, emptyName)) return 1;
  return 2;
}

export function selectedContractorKeys(
  selected: Iterable<string>,
  isBlocked: (key: string) => boolean,
): string[] {
  return Array.from(selected).filter((key) => !isBlocked(key));
}

export function paymentRegisterTotal(rows: AnyRecord[]): number {
  return rows.reduce((sum, row) => sum + (+row.amount || 0), 0);
}

export function paymentRegisterRowsFromContractorRows(rows: AnyRecord[]): AnyRecord[] {
  return rows
    .filter((row) => !row.isForecast)
    .flatMap((row) =>
      (row.payments || []).map((payment: AnyRecord) => ({
        supplier: row.supplier,
        date: payment.date || "",
        amount: +payment.amount || 0,
        type: payment.typeLabel || payment.type || "Інше",
        taskNo: payment.taskNo,
        taskName: payment.taskName,
        itemName: payment.itemName,
        note: payment.note || "",
      })),
    )
    .sort(
      (a, b) =>
        (a.date || "").localeCompare(b.date || "") ||
        String(a.supplier || "").localeCompare(String(b.supplier || ""), "uk"),
    );
}

export function paymentRegisterFiltersLabel(
  filters: ContractorFilterShape,
  multiValues: (value: unknown) => string[],
  typeLabel: (value: string) => string,
  categoryLabel: (value: string) => string,
): string {
  const parts: string[] = [];
  if (filters.q) parts.push(`пошук: ${filters.q}`);
  const statuses = multiValues(filters.status);
  if (statuses.length) parts.push(`статус: ${statuses.join(", ")}`);
  const types = multiValues(filters.type);
  if (types.length) parts.push(`тип: ${types.map(typeLabel).join(", ")}`);
  const cats = multiValues(filters.cat);
  if (cats.length) parts.push(`категорія: ${cats.map(categoryLabel).join(", ")}`);
  return parts.join("; ") || "усі платежі";
}

export function summarizeContractorBulkDelete(rows: AnyRecord[]) {
  return rows.reduce(
    (acc, row) => {
      acc.contractors += 1;
      acc.items += row.itemsCount || 0;
      acc.payments += row.paymentsCount || 0;
      acc.acts += (row.acts || []).length || 0;
      return acc;
    },
    { contractors: 0, items: 0, payments: 0, acts: 0 },
  );
}

export function buildContractorRows(
  tasks: AnyRecord[],
  options: {
    filters: ContractorFilterShape;
    emptyName: string;
    multiFilterHas: (selected: unknown, value: string) => boolean;
    multiFilterValues: (selected: unknown) => string[];
    getTaskCostItems: (task: AnyRecord) => AnyRecord[];
    getTaskSearchText?: (task: AnyRecord) => string;
    addForecastRemainder?: (buckets: Map<string, AnyRecord>, task: AnyRecord, ti: number, costItems: AnyRecord[]) => void;
    sort: { col: string; dir: number };
  },
): ContractorBucketRow[] {
  const {
    filters,
    emptyName,
    multiFilterHas,
    multiFilterValues,
    getTaskCostItems,
    addForecastRemainder,
    sort,
  } = options;

  const buckets = new Map<string, AnyRecord>();

  tasks.forEach((task, ti) => {
    if (!multiFilterHas(filters.cat, String(task.cat))) return;

    const costItems = getTaskCostItems(task);
    costItems.forEach((item, itemIndex) => {
      if (!multiFilterHas(filters.type, item.type || "other")) return;

      const supplier = contractorName(item.supplier, emptyName);
      const key = contractorKey(supplier, emptyName);
      const bucket = buckets.get(key) || {
        key,
        supplier,
        budget: 0,
        paid: 0,
        rest: 0,
        actsAmount: 0,
        actsDebt: 0,
        tasks: new Set(),
        taskNames: new Map(),
        items: [],
        acts: [],
        payments: [],
        lastPayment: "",
        search: "",
      };

      const itemBudget = contractorItemTotal(item);
      const itemPayments = item.payments || [];
      const itemPaid = itemPayments.reduce((sum: number, payment: AnyRecord) => sum + (+payment.amount || 0), 0);
      const itemName = item.name || "Опис товару/послуги";

      bucket.budget += itemBudget;
      bucket.paid += itemPaid;
      bucket.tasks.add(task.id || String(task.n));
      bucket.taskNames.set(task.id || String(task.n), task.name);
      bucket.items.push({
        ti,
        itemId: item.id,
        itemIndex,
        taskNo: task.n,
        taskName: task.name,
        contractNo: item.contractNo || "-",
        itemName,
        type: item.type,
        total: itemBudget,
        budget: itemBudget,
        paid: itemPaid,
        note: item.contractNote || item.note || "",
      });
      (item.acts || []).forEach((act: AnyRecord) => {
        const actAmount = +act.amount || 0;
        bucket.actsAmount += actAmount;
        bucket.acts.push({
          ti,
          taskNo: task.n,
          taskName: task.name,
          itemName,
          contractNo: item.contractNo || "",
          contractAmount: itemBudget,
          type: act.type || "contract",
          name: act.name || "",
          date: act.date || "",
          amount: actAmount,
          note: act.note || "",
        });
      });
      itemPayments.forEach((payment: AnyRecord) => {
        bucket.payments.push({
          ti,
          taskNo: task.n,
          taskName: task.name,
          itemName,
          date: payment.date || "",
          type: payment.type || "other",
          amount: +payment.amount || 0,
          typeLabel: payment.typeLabel,
          contractNo: item.contractNo || "",
          contractAmount: itemBudget,
          actId: payment.actId || "",
          actNo: payment.actNo || "",
          note: payment.note || "",
        });
        if (payment.date && payment.date > bucket.lastPayment) bucket.lastPayment = payment.date;
      });

      bucket.search += ` ${supplier} ${task.name} ${itemName} ${item.type || ""} ${itemPayments
        .map((payment: AnyRecord) => `${payment.note || ""} ${payment.amount || ""}`)
        .join(" ")}`;
      buckets.set(key, bucket);
    });

    if (!multiFilterValues(filters.type).length && typeof addForecastRemainder === "function") {
      addForecastRemainder(buckets, task, ti, costItems);
    }
  });

  const q = String(filters.q || "").trim().toLocaleLowerCase("uk-UA");
  const rows = Array.from(buckets.values())
    .map((row) => {
      row.actsAmount = row.actsAmount || 0;
      row.rest = row.budget - row.paid;
      row.actsDebt = row.isForecast ? 0 : row.actsAmount - row.paid;
      row.tasksCount = row.tasks.size;
      row.itemsCount = row.items.length;
      row.paymentsCount = row.payments.length;
      row.topTask = Array.from(row.taskNames.values())[0] || "";
      row.status = contractorStatus(row).key;
      return row;
    })
    .filter((row) => {
      if (q && !String(row.search || "").toLocaleLowerCase("uk-UA").includes(q)) return false;
      const statuses = multiFilterValues(filters.status);
      if (statuses.length) {
        const matchesStatus =
          (statuses.includes("debt") && row.rest > 0.5) ||
          (statuses.includes("paid") && row.budget > 0 && Math.abs(row.rest) <= 0.5) ||
          (statuses.includes("over") && row.rest < -0.5) ||
          (statuses.includes("unpaid") && row.budget > 0 && row.paid <= 0.5);
        if (!matchesStatus) return false;
      }
      return true;
    });

  rows.sort((a, b) => {
    const ap = isPinnedContractorRow(a, emptyName);
    const bp = isPinnedContractorRow(b, emptyName);
    if (ap !== bp) return ap ? -1 : 1;
    if (ap && bp) return pinnedContractorRank(a, emptyName) - pinnedContractorRank(b, emptyName);
    const av = (a as Record<string, unknown>)[sort.col];
    const bv = (b as Record<string, unknown>)[sort.col];
    const cmp = typeof av === "string"
      ? String(av ?? "").localeCompare(String(bv ?? ""), "uk")
      : (Number(av) || 0) - (Number(bv) || 0);
    return sort.dir * cmp;
  });

  rows.forEach((row, index) => {
    row.rowNo = index + 1;
  });

  return rows as ContractorBucketRow[];
}
