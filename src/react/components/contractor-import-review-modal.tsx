import { useEffect, useState } from "react";
import {
  closeContractorImportReview,
  readContractorImportReviewSnapshot,
  submitContractorImportReview,
  subscribeContractorImportReviewSync,
} from "../bridge/contractor-import-review";
import type { ContractorImportReviewSnapshot } from "../types";

type ContractorImportReviewEntry = Record<string, unknown>;

declare global {
  interface Window {
    _ctImportEntryMatchesFilter?: (entry: ContractorImportReviewEntry, filter: string) => boolean;
  }
}

export function ContractorImportReviewModal() {
  const [snapshot, setSnapshot] = useState<ContractorImportReviewSnapshot>(() => readContractorImportReviewSnapshot());
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [entries, setEntries] = useState<ContractorImportReviewEntry[]>([]);

  useEffect(() => {
    const sync = () => {
      setSnapshot(readContractorImportReviewSnapshot());
      setError("");
    };
    sync();
    return subscribeContractorImportReviewSync(sync);
  }, []);

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const customEvent = event as CustomEvent<{ filter?: string }>;
      setFilter(customEvent.detail?.filter || "all");
    };

    const handleState = (event: Event) => {
      const customEvent = event as CustomEvent<{ entries?: ContractorImportReviewEntry[] }>;
      setEntries(Array.isArray(customEvent.detail?.entries) ? customEvent.detail.entries : []);
    };

    const handleClose = () => {
      setEntries([]);
      setFilter("all");
    };

    document.addEventListener("contractor-import-review-open", handleOpen);
    document.addEventListener("contractor-import-review-state", handleState);
    document.addEventListener("contractor-import-review-close", handleClose);
    return () => {
      document.removeEventListener("contractor-import-review-open", handleOpen);
      document.removeEventListener("contractor-import-review-state", handleState);
      document.removeEventListener("contractor-import-review-close", handleClose);
    };
  }, []);

  useEffect(() => {
    document.querySelectorAll<HTMLElement>("[data-import-filter]").forEach((card) => {
      card.classList.toggle("is-active", card.getAttribute("data-import-filter") === filter);
    });

    document.querySelectorAll<HTMLElement>("[data-import-review-row]").forEach((row) => {
      const entryIndex = Number(row.getAttribute("data-entry-index"));
      const entry = entries[entryIndex];
      row.hidden = window._ctImportEntryMatchesFilter ? !window._ctImportEntryMatchesFilter(entry, filter) : false;
    });
  }, [entries, filter, snapshot.capturedAt]);

  function handlePreviewClick(event: React.MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    const filterCard = target.closest<HTMLElement>("[data-import-filter]");
    if (!filterCard) return;
    setFilter(filterCard.getAttribute("data-import-filter") || "all");
  }

  if (!snapshot.visible) return null;

  return (
    <div className="react-share-overlay" onClick={closeContractorImportReview} role="presentation">
      <div className="react-share-modal contractor-import-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="react-share-modal__header">
          <h3>{snapshot.labels.title}</h3>
          <button className="btn btn-sm" onClick={closeContractorImportReview} type="button">x</button>
        </div>
        <div className="contractor-import-preview" onClick={handlePreviewClick}>
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
