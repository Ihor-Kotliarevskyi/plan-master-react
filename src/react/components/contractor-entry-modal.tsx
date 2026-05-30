import { useEffect, useState } from "react";
import { readContractorEntrySnapshot, subscribeContractorEntrySync } from "../bridge/contractor-entry";
import type { ContractorEntrySnapshot } from "../types";

declare global {
  interface Window {
    lucide?: {
      createIcons: (options?: { nodes?: Array<Element | null | undefined> }) => void;
    };
  }
}

export function ContractorEntryModal() {
  const [snapshot, setSnapshot] = useState<ContractorEntrySnapshot>(() => readContractorEntrySnapshot());

  useEffect(() => {
    const sync = () => setSnapshot(readContractorEntrySnapshot());
    sync();
    return subscribeContractorEntrySync(sync);
  }, []);

  useEffect(() => {
    window.lucide?.createIcons({
      nodes: Array.from(document.querySelectorAll("[data-contractor-entry-root] [data-lucide]")),
    });
  }, [snapshot.capturedAt]);

  return (
    <>
      <div className="modal-header">
        <h3><i data-lucide="receipt-text"></i> {snapshot.labels.title}</h3>
        <button className="btn btn-sm" data-contractor-entry-action="close-modal"><i data-lucide="x"></i></button>
      </div>
      <div className="contractor-entry-grid contractor-contract-manager">
        <div className="fg contractor-entry-span">
          <label>{snapshot.labels.supplierLabel}</label>
          <input
            key={`supplier-${snapshot.capturedAt}`}
            className={snapshot.supplierLocked ? "contractor-entry-locked" : undefined}
            defaultValue={snapshot.supplier}
            id="ce-supplier"
            placeholder={snapshot.labels.supplierPlaceholder}
            readOnly={snapshot.supplierLocked}
            title={snapshot.supplierLocked ? "Контрагент заблокований для цього редагування" : ""}
          />
        </div>
        <div dangerouslySetInnerHTML={{ __html: snapshot.contractsHtml }} className="contractor-contract-list contractor-entry-span" id="ce-contract-list" />
        <div className="contractor-entry-span">
          <button type="button" className="btn btn-sm" data-contractor-entry-action="add-contract-row">
            <i data-lucide="plus"></i> {snapshot.labels.addContractButton}
          </button>
        </div>
      </div>
      <div className="m-btns m-btns-sep">
        <button className="btn" data-contractor-entry-action="close-modal">{snapshot.labels.cancelButton}</button>
        <button className="btn btn-acc" data-contractor-entry-action="save-entry">{snapshot.labels.saveButton}</button>
      </div>
    </>
  );
}
