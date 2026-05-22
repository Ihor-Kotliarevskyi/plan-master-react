export interface ChartCategoryLike {
  name: string;
  color: string;
}

export interface ChartTaskLike {
  n: number;
  name: string;
  cat: number;
  ms: number;
  prog: number;
  budget?: number | string;
  spent?: number | string;
  contr?: string;
}

export interface ChartStatusLabels {
  done: string;
  active: string;
  pending: string;
}

export interface ChartDataParams {
  tasks: ChartTaskLike[];
  xKey: string;
  yKey: string;
  catFilter: string;
  statFilter: string;
  hiddenCats: Set<number>;
  noContractorLabel: string;
  statusLabels: ChartStatusLabels;
  getCategoryName: (cat: number) => string;
  getMonthLabel: (monthIndex: number) => string;
  getTaskContractors: (task: ChartTaskLike) => string[];
  getTaskDuration: (task: ChartTaskLike) => number;
}

export interface ChartDataResult {
  labels: string[];
  values: number[];
}

export interface ChartColorsParams {
  xKey: string;
  labels: string[];
  categories: ChartCategoryLike[];
  statusLabels: ChartStatusLabels;
}

export interface ChartRenderType {
  realType: string;
  isHoriz: boolean;
}

export interface ChartOptionsModel {
  indexAxis?: "y";
  responsive: boolean;
  plugins: {
    legend: {
      display: boolean;
      position: string;
      labels: {
        font: { size: number };
        boxWidth: number;
      };
    };
  };
  scales: Record<string, unknown>;
}

export interface ChartDefinitionInput {
  id: string;
  type: string;
  xKey: string;
  yKey: string;
  catF: string;
  statF: string;
  labels: string[];
  values: number[];
  colors: string[];
  axisLabels: Record<string, string>;
}

export interface ChartDefinition extends ChartDefinitionInput {
  title: string;
}

export function buildChartData(params: ChartDataParams): ChartDataResult {
  const src = params.tasks.filter((task) => {
    if (params.hiddenCats.has(task.cat)) return false;
    if (params.catFilter !== "" && task.cat !== Number(params.catFilter)) return false;
    if (params.statFilter === "done" && task.prog < 100) return false;
    if (params.statFilter === "active" && (task.prog === 0 || task.prog === 100)) return false;
    if (params.statFilter === "pending" && task.prog !== 0) return false;
    return true;
  });

  const groups: Record<string, number> = {};
  const counts: Record<string, number> = {};

  const getKey = (task: ChartTaskLike): string => {
    if (params.xKey === "cat") return params.getCategoryName(task.cat);
    if (params.xKey === "contr") {
      const contractors = params.getTaskContractors(task);
      return contractors.length ? contractors.join(", ") : params.noContractorLabel;
    }
    if (params.xKey === "status") {
      if (task.prog === 100) return params.statusLabels.done;
      if (task.prog > 0) return params.statusLabels.active;
      return params.statusLabels.pending;
    }
    if (params.xKey === "task") return `${task.n}. ${String(task.name || "").substring(0, 22)}`;
    if (params.xKey === "month") return params.getMonthLabel(task.ms);
    return "?";
  };

  const getValue = (task: ChartTaskLike): number => {
    if (params.yKey === "count") return 1;
    if (params.yKey === "budget") return Number(task.budget) || 0;
    if (params.yKey === "spent") return Number(task.spent) || 0;
    if (params.yKey === "rest") return (Number(task.budget) || 0) - (Number(task.spent) || 0);
    if (params.yKey === "prog") return Number(task.prog) || 0;
    if (params.yKey === "dur") return params.getTaskDuration(task);
    return 0;
  };

  src.forEach((task) => {
    const key = getKey(task);
    const value = getValue(task);
    groups[key] = (groups[key] || 0) + value;
    counts[key] = (counts[key] || 0) + 1;
  });

  if (params.yKey === "prog") {
    Object.keys(groups).forEach((key) => {
      groups[key] = Math.round(groups[key] / Math.max(1, counts[key] || 1));
    });
  }

  const labels = Object.keys(groups);
  const values = Object.values(groups);
  if (params.xKey === "task") {
    return {
      labels: labels.slice(0, 15),
      values: values.slice(0, 15),
    };
  }

  return { labels, values };
}

export function buildChartColors(params: ChartColorsParams): string[] {
  if (params.xKey === "cat") {
    return params.labels.map((label) => {
      const category = params.categories.find((item) => item.name === label);
      return category?.color || "#888";
    });
  }

  if (params.xKey === "status") {
    return params.labels.map((label) => {
      if (label === params.statusLabels.done) return "#16803c";
      if (label === params.statusLabels.active) return "#c07800";
      return "#a09d97";
    });
  }

  const palette = [
    "#2563eb",
    "#16803c",
    "#c07800",
    "#b71c1c",
    "#006494",
    "#8a6200",
    "#5a5a5a",
    "#7c3aed",
    "#0891b2",
    "#be185d",
  ];
  return params.labels.map((_, index) => palette[index % palette.length]);
}

export function normalizeChartRenderType(type: string): ChartRenderType {
  return {
    realType: type === "horizontalBar" ? "bar" : type,
    isHoriz: type === "horizontalBar",
  };
}

export function buildChartOptions(type: string, isHoriz: boolean): ChartOptionsModel {
  return {
    indexAxis: isHoriz ? "y" : undefined,
    responsive: true,
    plugins: {
      legend: {
        display: type === "pie" || type === "doughnut",
        position: "bottom",
        labels: { font: { size: 10 }, boxWidth: 10 },
      },
    },
    scales:
      type === "pie" || type === "doughnut"
        ? {}
        : {
            x: { ticks: { font: { size: 9 }, maxRotation: isHoriz ? 0 : 35 } },
            y: {
              ticks: {
                font: { size: 9 },
              },
            },
          },
  };
}

export function buildChartDefinition(input: ChartDefinitionInput): ChartDefinition {
  return {
    ...input,
    title: `${input.axisLabels[input.yKey] || input.yKey} за ${input.axisLabels[input.xKey] || input.xKey}`,
  };
}

export function getChartAutoDefaults(id: string, presets: Array<{ id: string; type: string; x: string; y: string }>) {
  const match = presets.find((preset) => preset.id === id);
  return match || { type: "bar", x: "cat", y: "count" };
}
