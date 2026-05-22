export interface PrintSections {
  gantt: boolean;
  finance: boolean;
  charts: boolean;
  chartIds: string[];
  range: string;
}

export interface PrintDefaults {
  paper: string;
  orientation: string;
  contentScale: number;
  renderScale: number;
  margin: number;
  fitMode: string;
}

export interface PrintSettings {
  paper: "a3" | "a4" | "letter";
  orientation: "landscape" | "portrait";
  contentScale: number;
  renderScale: number;
  margin: number;
  fitMode: "paginate" | "width" | "height" | "page";
}

export interface PrintMetrics {
  pageW: number;
  pageH: number;
  contentWmm: number;
  contentHmm: number;
  contentWpx: number;
  contentHpx: number;
}

export interface PrintPreviewState {
  pageIndex: number;
  pageLabel: string;
  prevDisabled: boolean;
  nextDisabled: boolean;
  targetWidth: number;
  targetHeight: number;
  targetLeft: number;
  targetTop: number;
  cloneWidth: number;
  cloneHeight: number;
  scale: number;
}

export interface PrintGanttLayout {
  nW: number;
  nameW: number;
  progW: number;
  fixedW: number;
  weekW: number;
  rowH: number;
  weeksPerPage: number;
  rowsPerPage: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function resolvePrintSections(input: Partial<PrintSections>): PrintSections {
  return {
    gantt: input.gantt ?? true,
    finance: input.finance ?? false,
    charts: input.charts ?? false,
    chartIds: Array.isArray(input.chartIds) ? input.chartIds.filter(Boolean) : [],
    range: input.range || "all",
  };
}

export function resolvePrintSettings(
  input: Partial<Record<keyof PrintDefaults, unknown>>,
  defaults: PrintDefaults,
): PrintSettings {
  const paper = typeof input.paper === "string" ? input.paper : defaults.paper;
  const orientation = typeof input.orientation === "string" ? input.orientation : defaults.orientation;
  const fitMode = typeof input.fitMode === "string" ? input.fitMode : defaults.fitMode;
  const contentScale = Number.isFinite(Number(input.contentScale)) ? Number(input.contentScale) : defaults.contentScale;
  const renderScale = Number.isFinite(Number(input.renderScale)) ? Number(input.renderScale) : defaults.renderScale;
  const margin = Number.isFinite(Number(input.margin)) ? Number(input.margin) : defaults.margin;

  return {
    paper: ["a3", "a4", "letter"].includes(paper) ? (paper as PrintSettings["paper"]) : "a3",
    orientation: ["landscape", "portrait"].includes(orientation) ? (orientation as PrintSettings["orientation"]) : "landscape",
    contentScale: clamp(contentScale, 0.25, 1),
    renderScale: clamp(renderScale, 1, 2),
    margin: clamp(margin, 0, 25),
    fitMode: ["paginate", "width", "height", "page"].includes(fitMode) ? (fitMode as PrintSettings["fitMode"]) : "paginate",
  };
}

export function getPrintMetrics(
  settings: PrintSettings,
  paperMm: Record<string, { w: number; h: number }>,
): PrintMetrics {
  const base = paperMm[settings.paper] || paperMm.a3;
  const pageW = settings.orientation === "landscape" ? base.h : base.w;
  const pageH = settings.orientation === "landscape" ? base.w : base.h;
  const contentWmm = Math.max(50, pageW - settings.margin * 2);
  const contentHmm = Math.max(50, pageH - settings.margin * 2);
  const pxPerMm = 96 / 25.4;
  return {
    pageW,
    pageH,
    contentWmm,
    contentHmm,
    contentWpx: Math.round(contentWmm * pxPerMm),
    contentHpx: Math.round(contentHmm * pxPerMm),
  };
}

export function getPrintPreviewState(input: {
  currentPage: number;
  pagesCount: number;
  availableWidth: number;
  availableHeight: number;
  pageWidth: number;
  pageHeight: number;
}): PrintPreviewState | null {
  const { pagesCount, availableWidth, availableHeight, pageWidth, pageHeight } = input;
  if (!pagesCount || !pageWidth || !pageHeight) return null;
  const pageIndex = Math.min(pagesCount - 1, Math.max(0, input.currentPage));
  const scale = Math.min(1, availableWidth / pageWidth, availableHeight / pageHeight);
  return {
    pageIndex,
    pageLabel: `${pageIndex + 1} / ${pagesCount}`,
    prevDisabled: pageIndex <= 0,
    nextDisabled: pageIndex >= pagesCount - 1,
    targetWidth: Math.ceil(pageWidth * scale),
    targetHeight: Math.ceil(pageHeight * scale),
    targetLeft: Math.max(0, (availableWidth - pageWidth * scale) / 2),
    targetTop: Math.max(0, (availableHeight - pageHeight * scale) / 2),
    cloneWidth: pageWidth,
    cloneHeight: pageHeight,
    scale,
  };
}

export function resolvePrintGanttLayout(input: {
  settings: PrintSettings;
  metrics: PrintMetrics;
  taskCount: number;
  allWeeks: number;
}): PrintGanttLayout {
  const { settings, metrics, taskCount, allWeeks } = input;
  const density = settings.contentScale;
  const headH = 118;
  const nW = Math.max(20, Math.round(34 * density));
  const nameW = Math.max(110, Math.round(220 * density));
  const progW = Math.max(34, Math.round(46 * density));
  const fixedW = nW + nameW + progW;
  let weekW = Math.max(8, Math.round(22 * density));
  let rowH = Math.max(22, Math.round(28 * density));

  if (settings.fitMode === "width" || settings.fitMode === "page") {
    weekW = Math.max(2, Math.floor((metrics.contentWpx - fixedW - 2) / Math.max(1, allWeeks)));
  }

  if (settings.fitMode === "height" || settings.fitMode === "page") {
    rowH = Math.max(12, Math.floor((metrics.contentHpx - headH) / Math.max(1, taskCount)));
  }

  return {
    nW,
    nameW,
    progW,
    fixedW,
    weekW,
    rowH,
    weeksPerPage:
      settings.fitMode === "width" || settings.fitMode === "page"
        ? Math.max(1, allWeeks)
        : Math.max(4, Math.floor((metrics.contentWpx - fixedW - 2) / weekW)),
    rowsPerPage:
      settings.fitMode === "height" || settings.fitMode === "page"
        ? Math.max(1, taskCount)
        : Math.max(8, Math.floor((metrics.contentHpx - headH) / rowH)),
  };
}
