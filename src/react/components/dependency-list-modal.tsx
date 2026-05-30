import { useEffect, useState } from "react";
import {
  closeDependencyList,
  goToDependencyTask,
  readDependencyListSnapshot,
  setDependencyListFilter,
  subscribeDependencyListSync,
} from "../bridge/dependency-list";
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

  useEffect(() => {
    const modalRoot = document.getElementById("dep-list-modal");
    if (!modalRoot) return;

    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target === modalRoot) closeDependencyList();
    };

    modalRoot.addEventListener("click", handleBackdropClick);
    return () => {
      modalRoot.removeEventListener("click", handleBackdropClick);
    };
  }, []);

  function handleBodyClick(event: React.MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    const row = target.closest<HTMLElement>("[data-dep-action='go-to-task']");
    if (!row) return;
    goToDependencyTask(Number(row.dataset.taskIndex || -1));
  }

  return (
    <>
      <div className="modal-header">
        <div className="dl-modal-title">
          <h3>{snapshot.labels.title}</h3>
          <span className="dl-count-badge" id="dl-count">{snapshot.countText}</span>
        </div>
        <div className="dl-filters">
          <button className={`dl-filter-btn${snapshot.filter === "all" ? " on" : ""}`} onClick={() => setDependencyListFilter("all")} type="button">
            {snapshot.labels.allFilter}
          </button>
          <button className={`dl-filter-btn${snapshot.filter === "FS" ? " on" : ""}`} onClick={() => setDependencyListFilter("FS")} type="button">
            {snapshot.labels.fsFilter}
          </button>
          <button className={`dl-filter-btn${snapshot.filter === "SS" ? " on" : ""}`} onClick={() => setDependencyListFilter("SS")} type="button">
            {snapshot.labels.ssFilter}
          </button>
          <button className={`dl-filter-btn${snapshot.filter === "FF" ? " on" : ""}`} onClick={() => setDependencyListFilter("FF")} type="button">
            {snapshot.labels.ffFilter}
          </button>
        </div>
      </div>
      <div dangerouslySetInnerHTML={{ __html: snapshot.bodyHtml }} className="dl-wrap" id="dl-body" onClick={handleBodyClick} />
      <div className="m-btns m-btns-sep">
        <button className="btn" onClick={closeDependencyList} type="button">
          {snapshot.labels.closeButton}
        </button>
      </div>
    </>
  );
}
