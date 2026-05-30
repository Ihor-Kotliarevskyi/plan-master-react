import { useEffect, useState } from "react";
import { applyChartEdit, closeChartEdit, readChartEditSnapshot, subscribeChartEditSync } from "../bridge/chart-edit";
import type { ChartEditSnapshot } from "../types";

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
  { value: "prog", label: "Виконання (%)" },
  { value: "dur", label: "Тривалість (тижд.)" },
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
    <div className="fg">
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

export function ChartEditModal() {
  const [snapshot, setSnapshot] = useState<ChartEditSnapshot>(() => readChartEditSnapshot());

  useEffect(() => {
    const sync = () => setSnapshot(readChartEditSnapshot());
    sync();
    return subscribeChartEditSync(sync);
  }, []);

  useEffect(() => {
    const modalRoot = document.getElementById("chart-edit-modal");
    if (!modalRoot) return;

    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target === modalRoot) closeChartEdit();
    };

    modalRoot.addEventListener("click", handleBackdropClick);
    return () => {
      modalRoot.removeEventListener("click", handleBackdropClick);
    };
  }, []);

  return (
    <>
      <h3>{snapshot.labels.title}</h3>
      <input id="ce-id" key={`chart-id-${snapshot.chartId}`} defaultValue={snapshot.chartId} type="hidden" />
      <div className="row2">
        <SelectField id="ce-type" label={snapshot.labels.typeLabel} value={snapshot.form.type} options={TYPE_OPTIONS} />
        <SelectField id="ce-x" label={snapshot.labels.xAxisLabel} value={snapshot.form.xKey} options={AXIS_OPTIONS} />
      </div>
      <div className="row2">
        <SelectField id="ce-y" label={snapshot.labels.yAxisLabel} value={snapshot.form.yKey} options={AXIS_OPTIONS} />
        <div className="fg">
          <label>{snapshot.labels.categoryLabel}</label>
          <select
            id="ce-fcat"
            key={`ce-fcat-${snapshot.capturedAt}`}
            defaultValue={snapshot.form.category}
            dangerouslySetInnerHTML={{ __html: snapshot.categoryOptionsHtml }}
          />
        </div>
      </div>
      <SelectField id="ce-fstat" label={snapshot.labels.statusLabel} value={snapshot.form.status} options={STATUS_OPTIONS} />
      <div className="m-btns">
        <button className="btn" onClick={closeChartEdit} type="button">{snapshot.labels.cancelButton}</button>
        <button className="btn btn-acc" onClick={applyChartEdit} type="button">{snapshot.labels.applyButton}</button>
      </div>
    </>
  );
}
