import { useEffect, useState } from "react";
import {
  changePrintPreviewPage,
  closePrintDialog,
  doExportPDF,
  doPrint,
  readPrintDialogSnapshot,
  schedulePrintPreview,
  subscribePrintDialogSync,
} from "../bridge/print-dialog";
import type { PrintDialogSnapshot } from "../types";

declare global {
  interface Window {
    lucide?: {
      createIcons: (options?: { nodes?: Array<Element | null | undefined> }) => void;
    };
  }
}

const PAPER_OPTIONS = [
  { value: "a3", label: "A3" },
  { value: "a4", label: "A4" },
  { value: "letter", label: "Letter" },
];

const ORIENTATION_OPTIONS = [
  { value: "landscape", label: "Альбомна" },
  { value: "portrait", label: "Книжкова" },
];

const SCALE_OPTIONS = [
  { value: "1", label: "100%" },
  { value: "0.9", label: "90%" },
  { value: "0.75", label: "75%" },
  { value: "0.5", label: "50%" },
];

const FIT_OPTIONS = [
  { value: "paginate", label: "Сторінками" },
  { value: "width", label: "Вся ширина" },
  { value: "height", label: "Вся висота" },
  { value: "page", label: "Вся діаграма" },
];

const MARGIN_OPTIONS = [
  { value: "5", label: "5 mm" },
  { value: "8", label: "8 mm" },
  { value: "12", label: "12 mm" },
];

const QUALITY_OPTIONS = [
  { value: "1", label: "Стандартна" },
  { value: "1.5", label: "Вища" },
  { value: "2", label: "Максимальна" },
];

function PrintSelect({
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
    <label className="print-setting">
      <span>{label}</span>
      <select id={id} defaultValue={value}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PrintDialogModal() {
  const [snapshot, setSnapshot] = useState<PrintDialogSnapshot>(() => readPrintDialogSnapshot());

  useEffect(() => {
    const sync = () => setSnapshot(readPrintDialogSnapshot());
    sync();
    return subscribePrintDialogSync(sync);
  }, []);

  useEffect(() => {
    window.lucide?.createIcons({
      nodes: Array.from(document.querySelectorAll("[data-print-dialog-root] [data-lucide]")),
    });
  }, [snapshot.capturedAt]);

  useEffect(() => {
    const modalRoot = document.getElementById("print-modal");
    if (!modalRoot) return;

    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target === modalRoot) closePrintDialog();
    };

    const handlePreviewSchedule = () => {
      schedulePrintPreview();
    };

    modalRoot.addEventListener("click", handleBackdropClick);
    modalRoot.addEventListener("change", handlePreviewSchedule);
    modalRoot.addEventListener("input", handlePreviewSchedule);
    return () => {
      modalRoot.removeEventListener("click", handleBackdropClick);
      modalRoot.removeEventListener("change", handlePreviewSchedule);
      modalRoot.removeEventListener("input", handlePreviewSchedule);
    };
  }, []);

  return (
    <div className="print-modal-layout">
      <div className="print-preview-panel">
        <div className="print-preview-head">
          <button
            className="btn btn-sm btn-icon"
            id="print-prev-page"
            onClick={() => changePrintPreviewPage(-1)}
            title={snapshot.labels.prevTitle}
            disabled={snapshot.navigation.prevDisabled}
            type="button"
          >
            &lsaquo;
          </button>
          <span id="print-preview-meta" className="print-preview-meta">
            {snapshot.previewMeta}
          </span>
          <button
            className="btn btn-sm btn-icon"
            id="print-next-page"
            onClick={() => changePrintPreviewPage(1)}
            title={snapshot.labels.nextTitle}
            disabled={snapshot.navigation.nextDisabled}
            type="button"
          >
            &rsaquo;
          </button>
        </div>
        <div className="print-preview-shell">
          <div
            id="print-preview"
            className="print-preview"
            dangerouslySetInnerHTML={{ __html: snapshot.previewHtml }}
          />
        </div>
      </div>
      <div className="print-options-panel">
        <h3><i data-lucide="printer"></i> {snapshot.labels.title}</h3>
        <div className="settings-section-title">{snapshot.labels.includeSectionTitle}</div>
        <div className="print-section-grid">
          <div className="print-section-card">
            <label>
              <input type="checkbox" id="print-gantt" defaultChecked={snapshot.controls.gantt} />
              {" "}
              <i data-lucide="gantt-chart"></i> {snapshot.labels.ganttLabel}
            </label>
            <div className="ps-desc">{snapshot.labels.ganttHint}</div>
          </div>
          <div className="print-section-card">
            <label>
              <input type="checkbox" id="print-finance" defaultChecked={snapshot.controls.finance} />
              {" "}
              <i data-lucide="wallet"></i> {snapshot.labels.financeLabel}
            </label>
            <div className="ps-desc">{snapshot.labels.financeHint}</div>
          </div>
          <div className="print-section-card full-col">
            <label>
              <input
                type="checkbox"
                id="print-charts"
                defaultChecked={snapshot.controls.charts}
              />
              {" "}
              <i data-lucide="bar-chart-2"></i> {snapshot.labels.chartsLabel}
            </label>
            <div className="ps-desc">{snapshot.labels.chartsHint}</div>
          </div>
        </div>
        <div id="print-chart-picker" style={{ display: snapshot.chartPickerVisible ? "block" : "none" }}>
          <div className="print-chart-picker-label">{snapshot.labels.chartPickerLabel}</div>
          <div
            className="print-chart-scroll"
            id="print-chart-list"
            dangerouslySetInnerHTML={{ __html: snapshot.chartListHtml }}
          />
        </div>
        <div className="settings-section-title">{snapshot.labels.settingsSectionTitle}</div>
        <div className="print-settings-grid">
          <PrintSelect
            id="print-paper"
            label={snapshot.labels.formatLabel}
            value={snapshot.controls.paper}
            options={PAPER_OPTIONS}
          />
          <PrintSelect
            id="print-orientation"
            label={snapshot.labels.orientationLabel}
            value={snapshot.controls.orientation}
            options={ORIENTATION_OPTIONS}
          />
          <PrintSelect
            id="print-scale"
            label={snapshot.labels.scaleLabel}
            value={snapshot.controls.scale}
            options={SCALE_OPTIONS}
          />
          <PrintSelect
            id="print-fit"
            label={snapshot.labels.fitLabel}
            value={snapshot.controls.fit}
            options={FIT_OPTIONS}
          />
          <PrintSelect
            id="print-margin"
            label={snapshot.labels.marginLabel}
            value={snapshot.controls.margin}
            options={MARGIN_OPTIONS}
          />
          <PrintSelect
            id="print-quality"
            label={snapshot.labels.qualityLabel}
            value={snapshot.controls.quality}
            options={QUALITY_OPTIONS}
          />
        </div>
        <input type="hidden" id="print-range" defaultValue={snapshot.controls.range} />
        <div className="print-actions">
          <button className="btn" onClick={closePrintDialog} type="button">{snapshot.labels.cancelButton}</button>
          <button className="btn" onClick={() => void doPrint()} type="button"><i data-lucide="printer"></i> {snapshot.labels.printButton}</button>
          <button className="btn btn-acc" onClick={() => void doExportPDF()} type="button">
            <i data-lucide="file-text"></i> {snapshot.labels.exportButton}
          </button>
        </div>
      </div>
    </div>
  );
}
