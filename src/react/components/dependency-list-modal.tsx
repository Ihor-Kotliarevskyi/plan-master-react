import { useEffect, useState } from "react";
import { readDependencyListSnapshot, subscribeDependencyListSync } from "../bridge/dependency-list";
import type { DependencyListSnapshot } from "../types";

export function DependencyListModal() {
  const [snapshot, setSnapshot] = useState<DependencyListSnapshot>(() => readDependencyListSnapshot());

  useEffect(() => {
    const sync = () => setSnapshot(readDependencyListSnapshot());
    sync();
    return subscribeDependencyListSync(sync);
  }, []);

  useEffect(() => {
    window.lucide?.createIcons({
      nodes: Array.from(document.querySelectorAll("[data-dep-list-root] [data-lucide]")),
    });
  }, [snapshot.capturedAt]);

  return (
    <>
      <div className="modal-header">
        <div className="dl-modal-title">
          <h3>{snapshot.labels.title}</h3>
          <span className="dl-count-badge" id="dl-count">{snapshot.countText}</span>
        </div>
        <div className="dl-filters">
          <button className={`dl-filter-btn${snapshot.filter === "all" ? " on" : ""}`} data-f="all" data-dep-action="set-filter">
            {snapshot.labels.allFilter}
          </button>
          <button className={`dl-filter-btn${snapshot.filter === "FS" ? " on" : ""}`} data-f="FS" data-dep-action="set-filter">
            {snapshot.labels.fsFilter}
          </button>
          <button className={`dl-filter-btn${snapshot.filter === "SS" ? " on" : ""}`} data-f="SS" data-dep-action="set-filter">
            {snapshot.labels.ssFilter}
          </button>
          <button className={`dl-filter-btn${snapshot.filter === "FF" ? " on" : ""}`} data-f="FF" data-dep-action="set-filter">
            {snapshot.labels.ffFilter}
          </button>
        </div>
      </div>
      <div dangerouslySetInnerHTML={{ __html: snapshot.bodyHtml }} className="dl-wrap" id="dl-body" />
      <div className="m-btns m-btns-sep">
        <button className="btn" data-dep-action="close-modal">
          {snapshot.labels.closeButton}
        </button>
      </div>
    </>
  );
}
