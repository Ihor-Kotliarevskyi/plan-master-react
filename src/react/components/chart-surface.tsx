import { useEffect, useState } from "react";
import { readChartSurfaceSnapshot, subscribeChartSurfaceSync } from "../bridge/chart-surface";
import { addCustomChart, openChartEdit } from "../bridge/chart-edit";
import type { ChartSurfaceSnapshot } from "../types";

declare global {
  interface Window {
    lucide?: {
      createIcons: (options?: { nodes?: Array<Element | null | undefined> }) => void;
    };
    updateCbCatFilter?: () => void;
    renderAutoCharts?: () => void;
  }
}

const TYPE_OPTIONS = [
  { value: "bar", label: "Bar" },
  { value: "horizontalBar", label: "Bar (горизонт.)" },
  { value: "line", label: "Line" },
  { value: "pie", label: "Pie" },
  { value: "doughnut", label: "Doughnut" },
];

const AXIS_OPTIONS = [
  { value: "cat", label: "Категорія" },
  { value: "contr", label: "Підрядник" },
  { value: "status", label: "Статус" },
  { value: "month", label: "Місяць" },
  { value: "task", label: "Робота (топ 15)" },
  { value: "count", label: "Кількість робіт" },
  { value: "budget", label: "Бюджет (грн)" },
  { value: "spent", label: "Витрачено (грн)" },
  { value: "rest", label: "Залишок (грн)" },
  { value: "prog", label: "Середнє виконання (%)" },
  { value: "dur", label: "Тривалість (тиж.)" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Усі" },
  { value: "done", label: "Завершено" },
  { value: "active", label: "В роботі" },
  { value: "pending", label: "Не розпочато" },
];

function SelectField({
  id,
  label,
  value,
  options,
}: {
  id: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="cb-group">
      <label>{label}</label>
      <select id={id} key={`${id}-${value}`} defaultValue={value}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ChartSurface() {
  const [snapshot, setSnapshot] = useState<ChartSurfaceSnapshot>(() => readChartSurfaceSnapshot());

  useEffect(() => {
    const sync = () => setSnapshot(readChartSurfaceSnapshot());
    sync();
    return subscribeChartSurfaceSync(sync);
  }, []);

  useEffect(() => {
    window.lucide?.createIcons({
      nodes: Array.from(document.querySelectorAll("#pane-charts [data-lucide]")),
    });
  }, [snapshot.capturedAt]);

  function handleChartGridClick(event: React.MouseEvent<HTMLElement>) {
    const actionElement = (event.target as HTMLElement).closest<HTMLElement>("[data-chart-action='open-edit']");
    if (!actionElement) return;
    openChartEdit(actionElement.dataset.chartId || "");
  }

  return (
    <>
      <div className="card">
        <div className="toolbar chart-builder">
          <SelectField id="cb-type" label={snapshot.labels.typeLabel} value={snapshot.form.type} options={TYPE_OPTIONS} />
          <SelectField id="cb-x" label={snapshot.labels.xAxisLabel} value={snapshot.form.xKey} options={AXIS_OPTIONS} />
          <SelectField id="cb-y" label={snapshot.labels.yAxisLabel} value={snapshot.form.yKey} options={AXIS_OPTIONS} />
          <div className="cb-group">
            <label>{snapshot.labels.categoryLabel}</label>
            <select
              id="cb-fcat"
              key={`cb-fcat-${snapshot.capturedAt}`}
              defaultValue={snapshot.form.category}
              dangerouslySetInnerHTML={{ __html: snapshot.categoryOptionsHtml }}
            />
          </div>
          <SelectField id="cb-fstat" label={snapshot.labels.statusLabel} value={snapshot.form.status} options={STATUS_OPTIONS} />
          <button className="btn btn-acc btn-align-end" onClick={addCustomChart} type="button">
            {snapshot.labels.buildButton}
          </button>
        </div>
      </div>
      <div className="chart-grid" id="chart-grid" onClick={handleChartGridClick}></div>
    </>
  );
}
