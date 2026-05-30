import { useEffect, useState } from "react";
import {
  closeContractorImportMapping,
  readContractorImportMappingSnapshot,
  submitContractorImportMapping,
  subscribeContractorImportMappingSync,
} from "../bridge/contractor-import-mapping";
import type {
  ContractorImportMappingSnapshot,
  ContractorImportMappingSubmitPayload,
} from "../types";

type ContractorImportRow = { row?: Record<string, unknown> };

declare global {
  interface Window {
    _ctColumnExamples?: (rows: ContractorImportRow[], column: string) => string[];
  }
}

function buildInitialState(snapshot: ContractorImportMappingSnapshot): ContractorImportMappingSubmitPayload {
  return {
    defaultTaskId: snapshot.defaultTaskId,
    fields: snapshot.fields.map((field) => ({
      field: field.field,
      column: field.column,
    })),
  };
}

export function ContractorImportMappingModal() {
  const [snapshot, setSnapshot] = useState<ContractorImportMappingSnapshot>(() => readContractorImportMappingSnapshot());
  const [form, setForm] = useState<ContractorImportMappingSubmitPayload>(() => buildInitialState(readContractorImportMappingSnapshot()));
  const [rows, setRows] = useState<ContractorImportRow[]>([]);

  useEffect(() => {
    const sync = () => {
      const next = readContractorImportMappingSnapshot();
      setSnapshot(next);
      setForm(buildInitialState(next));
    };
    sync();
    return subscribeContractorImportMappingSync(sync);
  }, []);

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const customEvent = event as CustomEvent<{ rows?: ContractorImportRow[] }>;
      setRows(Array.isArray(customEvent.detail?.rows) ? customEvent.detail.rows : []);
    };

    const handleClose = () => {
      setRows([]);
    };

    document.addEventListener("contractor-import-mapping-open", handleOpen);
    document.addEventListener("contractor-import-mapping-close", handleClose);
    return () => {
      document.removeEventListener("contractor-import-mapping-open", handleOpen);
      document.removeEventListener("contractor-import-mapping-close", handleClose);
    };
  }, []);

  function getExamplesHtml(fieldName: string, selectedColumn: string, fallbackHtml: string): string {
    const examples = selectedColumn && window._ctColumnExamples ? window._ctColumnExamples(rows, selectedColumn) : [];
    if (!selectedColumn) return fallbackHtml;
    if (!examples.length) return "<span class=\"muted\">-</span>";
    return examples.join(" | ");
  }

  if (!snapshot.visible) return null;

  return (
    <div className="react-share-overlay" onClick={closeContractorImportMapping} role="presentation">
      <div className="react-share-modal contractor-import-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="react-share-modal__header">
          <h3>{snapshot.labels.title}</h3>
          <button className="btn btn-sm" onClick={closeContractorImportMapping} type="button">x</button>
        </div>
        <div className="contractor-import-mapping">
          <p><span>{snapshot.labels.defaultTaskLabel}</span></p>
          <label className="contractor-import-default-task">
            <select
              id="contractor-import-default-task"
              onChange={(event) => setForm((current) => ({ ...current, defaultTaskId: event.target.value }))}
              value={form.defaultTaskId}
            >
              {snapshot.defaultTaskOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <table>
            <thead>
              <tr>
                <th>{snapshot.labels.projectFieldHeader}</th>
                <th>{snapshot.labels.fileColumnHeader}</th>
                <th>{snapshot.labels.examplesHeader}</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.fields.map((field, index) => {
                const selectedColumn = form.fields[index]?.column || "";
                return (
                  <tr key={field.field}>
                    <th>{field.label}</th>
                    <td>
                      <select
                        className="contractor-import-map-select"
                        data-field={field.field}
                        onChange={(event) => {
                          const value = event.target.value;
                          setForm((current) => ({
                            ...current,
                            fields: current.fields.map((item, itemIndex) => (
                              itemIndex === index ? { ...item, column: value } : item
                            )),
                          }));
                        }}
                        value={selectedColumn}
                      >
                        <option value="">{snapshot.labels.noImportOption}</option>
                        {snapshot.columns.map((column) => (
                          <option key={column} value={column}>{column}</option>
                        ))}
                      </select>
                    </td>
                    <td
                      className="contractor-import-map-examples"
                      dangerouslySetInnerHTML={{ __html: getExamplesHtml(field.field, selectedColumn, field.examplesHtml) }}
                      data-field={field.field}
                    />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="m-btns m-btns-sep">
          <button className="btn" onClick={closeContractorImportMapping} type="button">{snapshot.labels.cancelButton}</button>
          <button className="btn btn-acc" onClick={() => submitContractorImportMapping(form)} type="button">{snapshot.labels.continueButton}</button>
        </div>
      </div>
    </div>
  );
}
