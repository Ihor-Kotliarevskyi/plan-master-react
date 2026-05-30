import { useEffect, useState } from "react";
import { openContractorEntryModal } from "../bridge/contractor-entry";
import {
  clearContractorSearch,
  clearContractorSelection,
  deleteContractor,
  deleteContractorAct,
  deleteContractorPayment,
  deletePaymentRegister,
  deleteSelectedContractorsFromSurface,
  editContractor,
  editContractorAct,
  editContractorPayment,
  exportPaymentRegister,
  onContractorSearch,
  openContractorActModal,
  openContractorPaymentModal,
  openContractorTask,
  printPaymentRegister,
  readContractorSurfaceSnapshot,
  resetContractorFilters,
  sortContractorDetails,
  sortContractors,
  startContractorColResize,
  startContractorDetailColResize,
  subscribeContractorSurfaceSync,
  toggleAllVisibleContractors,
  toggleContractorDetails,
  toggleContractorSelection,
  toggleContractorSelectionMode,
} from "../bridge/contractor-surface";
import { openPaymentRegisterModal } from "../bridge/payment-register";
import {
  closeContractorToolsMenu,
  deleteSelectedContractors,
  deleteVisibleContractors,
  exportContractorImportTemplate,
  importContractorTable,
  toggleContractorToolsMenu,
} from "../bridge/contractor-tools";
import { openReactMultiFilter, resetReactMultiFilter, setReactMultiFilter } from "../bridge/multi-filter";
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

  async function handleSurfaceAction(event: React.MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    const multiFilterAction = target.closest<HTMLElement>("[data-multi-filter-action]");
    if (multiFilterAction) {
      event.stopPropagation();
      const action = multiFilterAction.dataset.multiFilterAction || "";
      const path = multiFilterAction.dataset.filterPath || "";
      if (action === "toggle") {
        openReactMultiFilter(path, multiFilterAction, event.nativeEvent);
        return;
      }
      if (action === "reset") {
        resetReactMultiFilter(path, multiFilterAction.dataset.renderFn || "");
        return;
      }
    }

    if (target.closest("[data-multi-filter-root]")) {
      event.stopPropagation();
    }

    const actionElement = target.closest<HTMLElement>("[data-contractor-surface-action]");
    if (!actionElement) return;

    const action = actionElement.dataset.contractorSurfaceAction || "";
    switch (action) {
      case "clear-search":
        clearContractorSearch();
        return;
      case "reset-filters":
        resetContractorFilters();
        return;
      case "toggle-selection-mode":
        toggleContractorSelectionMode();
        return;
      case "clear-selection":
        clearContractorSelection();
        return;
      case "delete-selected":
        await deleteSelectedContractorsFromSurface();
        return;
      case "sort-main-col":
        sortContractors(actionElement.dataset.colKey || "");
        return;
      case "sort-detail-col":
        sortContractorDetails(actionElement.dataset.detailGroup || "", actionElement.dataset.colKey || "");
        return;
      case "toggle-details":
        toggleContractorDetails(actionElement.dataset.rowKey || "");
        return;
      case "open-task":
        openContractorTask(Number(actionElement.dataset.taskIndex || -1));
        return;
      case "edit-contractor":
        await editContractor(actionElement.dataset.rowKey || "");
        return;
      case "delete-contractor":
        await deleteContractor(actionElement.dataset.rowKey || "");
        return;
      case "open-act-modal":
        await openContractorActModal("", actionElement.dataset.contractPath || "");
        return;
      case "open-payment-modal":
        await openContractorPaymentModal(actionElement.dataset.contractPath || "", actionElement.dataset.actPath || "");
        return;
      case "edit-act":
        await editContractorAct(actionElement.dataset.actPath || "");
        return;
      case "delete-act":
        await deleteContractorAct(actionElement.dataset.actPath || "");
        return;
      case "edit-payment":
        await editContractorPayment(actionElement.dataset.paymentPath || "");
        return;
      case "delete-payment":
        await deleteContractorPayment(actionElement.dataset.paymentPath || "");
        return;
      case "print-register":
        printPaymentRegister(actionElement.dataset.registerId || "");
        return;
      case "export-register":
        exportPaymentRegister(actionElement.dataset.registerId || "", actionElement.dataset.exportType || "xlsx");
        return;
      case "delete-register":
        await deletePaymentRegister(actionElement.dataset.registerId || "");
        return;
      default:
        return;
    }
  }

  function handleSurfaceInput(event: React.FormEvent<HTMLElement>) {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    if (target.dataset.contractorSurfaceInput === "search") {
      onContractorSearch(target.value);
    }
  }

  function handleSurfaceChange(event: React.FormEvent<HTMLElement>) {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    if (target.dataset.multiFilterAction === "set-option") {
      setReactMultiFilter(
        target.dataset.filterPath || "",
        target.dataset.filterOption || "",
        target.checked,
        target.dataset.renderFn || "",
      );
      return;
    }
    const inputType = target.dataset.contractorSurfaceInput || "";
    if (inputType === "toggle-select-all") {
      toggleAllVisibleContractors(!!target.checked);
      return;
    }
    if (inputType === "toggle-selection") {
      toggleContractorSelection(target.dataset.rowKey || "", !!target.checked);
    }
  }

  function handleSurfaceKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    const target = event.target as HTMLInputElement | null;
    if (!target || target.dataset.contractorSurfaceInput !== "search") return;
    if (event.key !== "Escape") return;
    clearContractorSearch();
  }

  function handleSurfaceMouseDown(event: React.MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement | null;
    const handle = target?.closest<HTMLElement>("[data-contractor-surface-mousedown]");
    if (!handle) return;
    const action = handle.dataset.contractorSurfaceMousedown || "";
    if (action === "resize-main-col") {
      startContractorColResize(event.nativeEvent, handle.dataset.col || "");
      return;
    }
    if (action === "resize-detail-col") {
      startContractorDetailColResize(
        event.nativeEvent,
        handle.dataset.detailGroup || "",
        handle.dataset.col || "",
      );
    }
  }

  return (
    <>
      <div className="contractor-toolbar" onClick={(event) => void handleSurfaceAction(event)}>
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
      <div
        dangerouslySetInnerHTML={{ __html: snapshot.summaryHtml }}
        className="contractor-summary"
        id="contractor-summary"
        onClick={(event) => void handleSurfaceAction(event)}
        onMouseDown={handleSurfaceMouseDown}
      />
      <div className="contractor-table-wrap">
        <table
          dangerouslySetInnerHTML={{ __html: snapshot.tableHtml }}
          className="contractor-tbl"
          id="contractor-tbl"
          onClick={(event) => void handleSurfaceAction(event)}
          onInput={handleSurfaceInput}
          onChange={handleSurfaceChange}
          onKeyDown={handleSurfaceKeyDown}
          onMouseDown={handleSurfaceMouseDown}
        />
      </div>
    </>
  );
}
