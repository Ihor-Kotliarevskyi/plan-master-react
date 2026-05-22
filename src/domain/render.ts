export interface RenderMonthLike {
  name: string;
  y: number | string;
}

export interface RenderCategoryLike {
  name: string;
  color: string;
}

export interface RenderTaskPhaseLike {
  ms: number;
  ws: number;
  me: number;
  we: number;
  prog?: number;
}

export interface RenderTaskNoteLike {
  deleted?: boolean;
}

export interface RenderBaselinePosLike {
  ms: number;
  ws: number;
  me: number;
  we: number;
}

export interface RenderTaskLike {
  id?: string;
  n: number;
  name: string;
  cat: number;
  ms: number;
  ws: number;
  me: number;
  we: number;
  prog: number;
  phases?: RenderTaskPhaseLike[] | null;
  notes?: RenderTaskNoteLike[] | null;
}

export interface LegendItemModel {
  index: number;
  name: string;
  color: string;
  className: string;
}

export interface YearGroupModel {
  year: number | string;
  cols: number;
}

export interface TaskBarModel {
  start: number;
  width: number;
  progressWidth: number;
  isPartial: boolean;
  showFull: boolean;
  showPartial: boolean;
}

export interface PhaseBarModel {
  index: number;
  start: number;
  width: number;
  progressWidth: number;
  progress: number;
  isPartial: boolean;
  showFull: boolean;
}

export interface TaskWindowModel {
  startWeek: number;
  endWeek: number;
  notesCount: number;
  notesCellClass: string;
  searchClass: string;
  isCritical: boolean;
  warningsTitleSuffix: string;
  baselineStart: number | null;
  baselineWidth: number;
  bar: TaskBarModel | null;
  phases: PhaseBarModel[];
}

export function buildHeaderDateText(months: RenderMonthLike[], nm: number): string {
  if (!months.length) return "";
  return `${months[0]?.name} ${months[0]?.y} – ${months[months.length - 1]?.name} ${months[months.length - 1]?.y} · ${nm} міс.`;
}

export function buildLegendItems(
  categories: RenderCategoryLike[],
  filterCat: number | null,
  hiddenCats: Set<number>,
): { items: LegendItemModel[]; hasFilter: boolean } {
  const hasFilter = filterCat !== null || hiddenCats.size > 0;
  return {
    hasFilter,
    items: categories.map((category, index) => {
      const isExclusive = filterCat === index;
      const isOff = hiddenCats.has(index);
      let className = "cat-chip";
      if (isExclusive) className += " active";
      else if (isOff) className += " off";
      else if (hasFilter) className += " dim";
      return {
        index,
        name: category.name,
        color: category.color,
        className,
      };
    }),
  };
}

export function buildVisibleYearGroups(visibleMonths: RenderMonthLike[]): YearGroupModel[] {
  const groups: YearGroupModel[] = [];
  visibleMonths.forEach((month) => {
    const last = groups[groups.length - 1];
    if (last && last.year === month.y) last.cols += 4;
    else groups.push({ year: month.y, cols: 4 });
  });
  return groups;
}

export function buildTaskWindowModel(input: {
  task: RenderTaskLike;
  visStart: number;
  totalWeeks: number;
  zoomLevel: number;
  taskSearch: string;
  warnings: string[];
  baselinePos: RenderBaselinePosLike | null;
  isCritical: boolean;
}): TaskWindowModel | null {
  const { task, visStart, totalWeeks, zoomLevel, taskSearch, warnings, baselinePos, isCritical } = input;
  const startWeek = task.ms * 4 + task.ws;
  const endWeek = task.me * 4 + task.we;
  if (endWeek < visStart || startWeek >= totalWeeks) return null;

  const showFull = startWeek >= visStart;
  const showPartial = !showFull && task.prog < 100 && endWeek >= visStart;
  const showBar = showFull || showPartial;
  const barStart = showFull ? startWeek : visStart;
  const barWidth = showBar ? (endWeek - barStart + 1) * zoomLevel : 0;
  const progressWidth = showBar
    ? Math.round((task.prog * Math.max(0, barWidth - Math.min(12, zoomLevel * 0.4))) / 100)
    : 0;

  const notesCount = (task.notes || []).filter((note) => !note?.deleted).length || 0;
  const searchNeedle = String(taskSearch || "").trim().toLowerCase();
  const searchClass = searchNeedle
    ? String(task.name || "").toLowerCase().includes(searchNeedle)
      ? "task-search-match"
      : "task-search-dim"
    : "";

  const baselineStartAbs = baselinePos ? Math.max(baselinePos.ms * 4 + baselinePos.ws, visStart) : null;
  const baselineEndAbs = baselinePos ? baselinePos.me * 4 + baselinePos.we : null;
  const baselineWidth =
    baselineStartAbs !== null && baselineEndAbs !== null && baselineEndAbs >= visStart
      ? (baselineEndAbs - baselineStartAbs + 1) * zoomLevel
      : 0;

  const phases = (task.phases && task.phases.length > 1 ? task.phases : [])
    .map((phase, index) => {
      const phaseStart = phase.ms * 4 + phase.ws;
      const phaseEnd = phase.me * 4 + phase.we;
      if (phaseEnd < visStart || phaseStart >= totalWeeks) return null;
      const progress = phase.prog || 0;
      const phaseShowFull = phaseStart >= visStart;
      const phaseShowPartial = !phaseShowFull && progress < 100 && phaseEnd >= visStart;
      if (!phaseShowFull && !phaseShowPartial) return null;
      const start = phaseShowFull ? phaseStart : visStart;
      const width = (phaseEnd - start + 1) * zoomLevel;
      return {
        index,
        start,
        width,
        progressWidth: Math.round((progress * Math.max(0, width - Math.min(12, zoomLevel * 0.4))) / 100),
        progress,
        isPartial: phaseShowPartial,
        showFull: phaseShowFull,
      };
    })
    .filter(Boolean) as PhaseBarModel[];

  return {
    startWeek,
    endWeek,
    notesCount,
    notesCellClass: notesCount > 0 ? "td-notes has-notes" : "td-notes",
    searchClass,
    isCritical,
    warningsTitleSuffix: warnings.length ? ` ⚠ ${warnings.join("; ")}` : "",
    baselineStart: baselineStartAbs,
    baselineWidth,
    bar: showBar
      ? {
          start: barStart,
          width: barWidth,
          progressWidth,
          isPartial: showPartial,
          showFull,
          showPartial,
        }
      : null,
    phases,
  };
}
