import { useEffect, useState } from "react";
import {
  closeAuditViewerModal,
  readAuditViewerSnapshot,
  reloadAuditViewerModal,
  subscribeAuditViewerSync,
} from "../bridge/audit-viewer";
import type { AuditViewerSnapshot } from "../types";

export function AuditViewerModal() {
  const [snapshot, setSnapshot] = useState<AuditViewerSnapshot>(() => readAuditViewerSnapshot());

  useEffect(() => {
    const sync = () => setSnapshot(readAuditViewerSnapshot());
    sync();
    return subscribeAuditViewerSync(sync);
  }, []);

  if (!snapshot.visible) return null;

  return (
    <div className="react-audit-overlay" onClick={closeAuditViewerModal} role="presentation">
      <div
        className="react-audit-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={snapshot.labels.modalTitle}
      >
        <div className="react-audit-modal__header">
          <h3>{snapshot.labels.modalTitle}</h3>
          <button className="btn btn-sm" onClick={closeAuditViewerModal} type="button">
            {snapshot.labels.closeButtonLabel}
          </button>
        </div>

        {snapshot.loading ? <p className="react-audit-modal__status">Loading…</p> : null}

        {!snapshot.loading && snapshot.error ? (
          <div className="react-audit-modal__error">
            <p>{snapshot.error}</p>
            <button className="btn btn-sm" onClick={reloadAuditViewerModal} type="button">
              Retry
            </button>
          </div>
        ) : null}

        {!snapshot.loading && !snapshot.error && snapshot.entries.length === 0 ? (
          <p className="react-audit-modal__status">{snapshot.labels.emptyHint}</p>
        ) : null}

        {!snapshot.loading && !snapshot.error && snapshot.entries.length > 0 ? (
          <div className="react-audit-list">
            {snapshot.entries.map((entry) => (
              <div key={entry.id} className="audit-row">
                <div className="audit-row-head">
                  <span className="audit-event">{entry.eventLabel}</span>
                  <span className="audit-time">{new Date(entry.createdAt).toLocaleString("uk-UA")}</span>
                </div>
                <div className="audit-row-meta">
                  <span><b>{snapshot.labels.actorCaption}:</b> {entry.actorLabel}</span>
                  <span><b>{snapshot.labels.subjectCaption}:</b> {entry.subjectLabel}</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
