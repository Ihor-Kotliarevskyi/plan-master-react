import type { Category, ProjectSnapshot, Task } from "./types";

type AnyRecord = Record<string, any>;

export interface WorkbookSheetModel {
  name: string;
  rows: Array<Array<string | number>>;
  cols: Array<{ wch: number }>;
  freeze?: { xSplit: number; ySplit: number };
}

export interface BuildProjectWorkbookExportInput {
  projectName: string;
  tasks: Task[];
  categories: Category[];
  monthLabels: Array<{ name?: string; y?: number }>;
  scheduleHeader: string[];
  summaryHeader: string[];
  estimateHeader: string[];
  paymentsHeader: string[];
  workbookSheets: {
    schedule: string;
    summary: string;
    estimate: string;
    payments: string;
  };
  getCategoryName: (index: number) => string;
  getTaskDuration: (task: Task) => number;
  getTaskCostItems: (task: Task) => AnyRecord[];
  costTypeLabels: Record<string, string>;
  paymentTypeLabels: Record<string, string>;
}

export interface ProjectWorkbookExportModel {
  filename: string;
  sheets: WorkbookSheetModel[];
}

export interface ResolveImportSourceInput {
  data: AnyRecord;
  fileName: string;
  fallbackProjectName: string;
  currentId?: string | null;
}

export interface ImportSourceState {
  shouldSaveCurrent: boolean;
  importBaseName: string;
  projectName: string;
  newProjectId: string;
}

export interface BuildImportedProjectActivationStateInput {
  projects: Record<string, ProjectSnapshot | undefined>;
  projectId: string;
  snapshot: ProjectSnapshot;
  role: string;
}

export interface ImportedProjectActivationState {
  projects: Record<string, ProjectSnapshot | undefined>;
  currentId: string;
  role: string;
  hiddenCats: number[];
}

function buildMonthText(monthLabels: Array<{ name?: string; y?: number }>, monthIndex: number): string {
  return `${monthLabels[monthIndex]?.name || ""} ${monthLabels[monthIndex]?.y || ""}`.trim();
}

function buildDependencyText(deps: AnyRecord[]): string {
  return deps
    .map((dep) =>
      typeof dep === "number"
        ? dep
        : `${dep.n}(${dep.type}${dep.type === "SS" ? `+${dep.threshold || 0}%` : ""})`,
    )
    .join(", ");
}

export function buildProjectWorkbookExport(
  input: BuildProjectWorkbookExportInput,
): ProjectWorkbookExportModel {
  const {
    projectName,
    tasks,
    categories,
    monthLabels,
    scheduleHeader,
    summaryHeader,
    estimateHeader,
    paymentsHeader,
    workbookSheets,
    getCategoryName,
    getTaskDuration,
    getTaskCostItems,
    costTypeLabels,
    paymentTypeLabels,
  } = input;

  const scheduleRows = tasks.map((task) => [
    task.n,
    task.name,
    getCategoryName(task.cat),
    String((task as AnyRecord).contr || ""),
    buildMonthText(monthLabels, task.ms),
    task.ws + 1,
    buildMonthText(monthLabels, task.me),
    task.we + 1,
    getTaskDuration(task),
    task.prog,
    Number(task.budget) || 0,
    Number(task.spent) || 0,
    (Number(task.budget) || 0) - (Number(task.spent) || 0),
    buildDependencyText(Array.isArray(task.deps) ? task.deps as AnyRecord[] : []),
  ]);

  const summaryRows = categories.map((category, index) => {
    const categoryTasks = tasks.filter((task) => task.cat === index);
    const budget = categoryTasks.reduce((sum, task) => sum + (Number(task.budget) || 0), 0);
    const spent = categoryTasks.reduce((sum, task) => sum + (Number(task.spent) || 0), 0);
    const progress = categoryTasks.length
      ? Math.round(categoryTasks.reduce((sum, task) => sum + task.prog, 0) / categoryTasks.length)
      : 0;
    return [category.name, categoryTasks.length, budget, spent, budget - spent, progress];
  });

  const estimateRows: Array<Array<string | number>> = [];
  const paymentRows: Array<Array<string | number>> = [];

  tasks.forEach((task) => {
    getTaskCostItems(task).forEach((item: AnyRecord) => {
      const qty = item.qty == null ? 1 : (+item.qty || 0);
      const paid = (Array.isArray(item.payments) ? item.payments : []).reduce(
        (sum: number, payment: AnyRecord) => sum + (+payment.amount || 0),
        0,
      );

      estimateRows.push([
        task.n,
        task.name,
        costTypeLabels[item.type] || item.type,
        item.name,
        item.supplier,
        item.unit,
        qty,
        item.unitPrice || 0,
        qty * (+item.unitPrice || 0),
        paid,
      ]);

      (Array.isArray(item.payments) ? item.payments : []).forEach((payment: AnyRecord) => {
        paymentRows.push([
          task.n,
          task.name,
          item.supplier || "",
          costTypeLabels[item.type] || item.type || "",
          item.name || "",
          payment.date || "",
          paymentTypeLabels[payment.type] || payment.type || "",
          +payment.amount || 0,
          payment.note || "",
        ]);
      });
    });
  });

  const sheets: WorkbookSheetModel[] = [
    {
      name: workbookSheets.schedule,
      rows: [scheduleHeader, ...scheduleRows],
      cols: [
        { wch: 5 }, { wch: 36 }, { wch: 22 }, { wch: 18 },
        { wch: 16 }, { wch: 7 }, { wch: 16 }, { wch: 7 },
        { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 },
        { wch: 14 }, { wch: 18 },
      ],
      freeze: { xSplit: 0, ySplit: 1 },
    },
    {
      name: workbookSheets.summary,
      rows: [summaryHeader, ...summaryRows],
      cols: [
        { wch: 24 }, { wch: 12 }, { wch: 14 },
        { wch: 14 }, { wch: 14 }, { wch: 16 },
      ],
    },
  ];

  if (estimateRows.length) {
    sheets.push({
      name: workbookSheets.estimate,
      rows: [estimateHeader, ...estimateRows],
      cols: [
        { wch: 5 }, { wch: 30 }, { wch: 14 }, { wch: 28 },
        { wch: 20 }, { wch: 6 }, { wch: 7 }, { wch: 10 },
        { wch: 14 }, { wch: 14 },
      ],
    });
  }

  if (paymentRows.length) {
    sheets.push({
      name: workbookSheets.payments,
      rows: [paymentsHeader, ...paymentRows],
      cols: [
        { wch: 5 }, { wch: 30 }, { wch: 24 }, { wch: 14 }, { wch: 28 },
        { wch: 13 }, { wch: 12 }, { wch: 16 }, { wch: 28 },
      ],
    });
  }

  return {
    filename: `${projectName}.xlsx`,
    sheets,
  };
}

export function resolveImportSource(input: ResolveImportSourceInput): ImportSourceState {
  const { data, fileName, fallbackProjectName, currentId } = input;
  const importBaseName = String(fileName || fallbackProjectName).replace(/\.json$/i, "");
  const projectName = String(data?.proj?.name || importBaseName || fallbackProjectName).trim() || fallbackProjectName;
  return {
    shouldSaveCurrent: Boolean(currentId),
    importBaseName,
    projectName,
    newProjectId: `p_${Date.now()}`,
  };
}

export function buildImportedProjectActivationState(
  input: BuildImportedProjectActivationStateInput,
): ImportedProjectActivationState {
  const nextProjects = {
    ...(input.projects || {}),
    [input.projectId]: input.snapshot,
  };
  return {
    projects: nextProjects,
    currentId: input.projectId,
    role: input.role,
    hiddenCats: [],
  };
}
