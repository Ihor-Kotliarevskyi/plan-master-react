import { useEffect, useState } from "react";
import { openContractorEntryModal } from "../bridge/contractor-entry";
import { readContractorSurfaceSnapshot, subscribeContractorSurfaceSync } from "../bridge/contractor-surface";
import { openPaymentRegisterModal } from "../bridge/payment-register";
import {
  closeContractorToolsMenu,
  deleteSelectedContractors,
  deleteVisibleContractors,
  exportContractorImportTemplate,
  importContractorTable,
  toggleContractorToolsMenu,
} from "../bridge/contractor-tools";
import type { ContractorSurfaceSnapshot } from "../types";

declare global {
  interface Window {
    lucide?: {
      createIcons: (options?: { nodes?: Array<Element | null | undefined> }) => void;
    };
  }
}

export function ContractorSurface() {
  const [snapshot, setSnapshot] = useState<ContractorSurfaceSnapshot>(() => readContractorSurfaceSnapshot());

  useEffect(() => {
    const sync = () => setSnapshot(readContractorSurfaceSnapshot());
    sync();
    return subscribeContractorSurfaceSync(sync);
  }, []);

  useEffect(() => {
    window.lucide?.createIcons({
      nodes: Array.from(document.querySelectorAll("#pane-contractors [data-lucide]")),
    });
  }, [snapshot.capturedAt]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("#contractor-tools-menu")) return;
      closeContractorToolsMenu();
    };

    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  return (
    <>
      <div className="contractor-toolbar">
        <div className="contractor-search-wrap">
          <i data-lucide="search"></i>
          <input
            key={`contractor-search-${snapshot.capturedAt}`}
            id="contractor-search"
            data-contractor-surface-input="search"
            defaultValue={snapshot.searchQuery}
            placeholder="Пошук контрагента, роботи, платежу..."
            type="text"
          />
          <button
            className={`contractor-search-clear${snapshot.searchQuery ? " show" : ""}`}
            data-contractor-surface-action="clear-search"
            id="contractor-search-clear"
            title="Очистити пошук"
            type="button"
          >
            <i data-lucide="x"></i>
          </button>
        </div>
        <div dangerouslySetInnerHTML={{ __html: snapshot.statusFilterHtml }} id="contractor-status-filter" />
        <div dangerouslySetInnerHTML={{ __html: snapshot.typeFilterHtml }} id="contractor-type-filter" />
        <div dangerouslySetInnerHTML={{ __html: snapshot.categoryFilterHtml }} id="contractor-cat-filter" />
        <span dangerouslySetInnerHTML={{ __html: snapshot.resetFilterHtml }} id="contractor-reset-filter" />
        <div dangerouslySetInnerHTML={{ __html: snapshot.selectionActionsHtml }} id="contractor-selection-actions" />
        <span className="contractor-toolbar-spacer"></span>
        <button className="btn btn-sm btn-acc" onClick={() => openContractorEntryModal()} type="button">
          <i data-lucide="plus"></i> Контрагент
        </button>
        <div className="tools-menu contractor-tools-menu" id="contractor-tools-menu">
          <button
            className="btn btn-icon tools-trigger"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              toggleContractorToolsMenu();
            }}
            title="Імпорт та реєстри"
            type="button"
          >
            <i data-lucide="more-horizontal"></i>
          </button>
          <div className="tools-dropdown" id="contractor-tools-dropdown">
            <button className="tools-item" onClick={exportContractorImportTemplate} type="button">
              <i data-lucide="upload"></i> Шаблон
            </button>
            <label className="tools-item contractor-import-btn">
              <i data-lucide="download"></i> Імпорт оплат
              <input
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
                type="file"
                onChange={(event) => importContractorTable(event.nativeEvent)}
              />
            </label>
            <div className="tools-sep"></div>
            <button className="tools-item" onClick={() => void deleteSelectedContractors()} type="button">
              <i data-lucide="trash-2"></i> Видалити вибраних
            </button>
            <button className="tools-item" onClick={() => void deleteVisibleContractors()} type="button">
              <i data-lucide="trash"></i> Видалити всіх за фільтром
            </button>
            <div className="tools-sep"></div>
            <button className="tools-item" onClick={openPaymentRegisterModal} type="button">
              <i data-lucide="file-spreadsheet"></i> Реєстри
            </button>
          </div>
        </div>
      </div>
      <div dangerouslySetInnerHTML={{ __html: snapshot.summaryHtml }} className="contractor-summary" id="contractor-summary" />
      <div className="contractor-table-wrap">
        <table dangerouslySetInnerHTML={{ __html: snapshot.tableHtml }} className="contractor-tbl" id="contractor-tbl" />
      </div>
    </>
  );
}
