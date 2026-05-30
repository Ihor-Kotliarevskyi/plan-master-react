import { useEffect, useState } from "react";
import {
  addContractorContractRow,
  closeContractorEntryModal,
  readContractorEntrySnapshot,
  saveContractorEntry,
  subscribeContractorEntrySync,
} from "../bridge/contractor-entry";
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

  useEffect(() => {
    const modalRoot = document.getElementById("contractor-entry-modal");
    if (!modalRoot) return;

    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target === modalRoot) closeContractorEntryModal();
    };

    modalRoot.addEventListener("click", handleBackdropClick);
    return () => {
      modalRoot.removeEventListener("click", handleBackdropClick);
    };
  }, []);

  return (
    <>
      <div className="modal-header">
        <h3><i data-lucide="receipt-text"></i> {snapshot.labels.title}</h3>
        <button className="btn btn-sm" onClick={closeContractorEntryModal} type="button"><i data-lucide="x"></i></button>
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
          <button type="button" className="btn btn-sm" onClick={addContractorContractRow}>
            <i data-lucide="plus"></i> {snapshot.labels.addContractButton}
          </button>
        </div>
      </div>
      <div className="m-btns m-btns-sep">
        <button className="btn" onClick={closeContractorEntryModal} type="button">{snapshot.labels.cancelButton}</button>
        <button className="btn btn-acc" onClick={() => void saveContractorEntry()} type="button">{snapshot.labels.saveButton}</button>
      </div>
    </>
  );
}
