import { useEffect, useState } from "react";
import {
  closeContractorImportReview,
  readContractorImportReviewSnapshot,
  submitContractorImportReview,
  subscribeContractorImportReviewSync,
} from "../bridge/contractor-import-review";
import type { ContractorImportReviewSnapshot } from "../types";

export function ContractorImportReviewModal() {
  const [snapshot, setSnapshot] = useState<ContractorImportReviewSnapshot>(() => readContractorImportReviewSnapshot());
  const [error, setError] = useState("");

  useEffect(() => {
    const sync = () => {
      setSnapshot(readContractorImportReviewSnapshot());
      setError("");
    };
    sync();
    return subscribeContractorImportReviewSync(sync);
  }, []);

  if (!snapshot.visible) return null;

  return (
    <div className="react-share-overlay" onClick={closeContractorImportReview} role="presentation">
      <div className="react-share-modal contractor-import-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="react-share-modal__header">
          <h3>{snapshot.labels.title}</h3>
          <button className="btn btn-sm" onClick={closeContractorImportReview} type="button">x</button>
        </div>
        <div className="contractor-import-preview">
          <div className="contractor-import-grid" dangerouslySetInnerHTML={{ __html: snapshot.filterCardsHtml }} />
          {snapshot.noteHtml ? <div dangerouslySetInnerHTML={{ __html: snapshot.noteHtml }} /> : null}
          {snapshot.tableHtml ? <div dangerouslySetInnerHTML={{ __html: snapshot.tableHtml }} /> : null}
        </div>
        {error ? <div className="react-share-modal__error">{error}</div> : null}
        <div className="m-btns m-btns-sep">
          <button className="btn" onClick={closeContractorImportReview} type="button">{snapshot.labels.cancelButton}</button>
          <button
            className="btn btn-acc"
            onClick={() => {
              const result = submitContractorImportReview();
              if (!result?.ok) setError(result?.error || snapshot.labels.noChangesValidation);
            }}
            type="button"
          >
            {snapshot.hasImportableRows ? snapshot.labels.importButton : snapshot.labels.okButton}
          </button>
        </div>
      </div>
    </div>
  );
}
