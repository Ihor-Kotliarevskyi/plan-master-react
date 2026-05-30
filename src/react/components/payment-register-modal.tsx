import { useEffect, useState } from "react";
import {
  closePaymentRegisterModal,
  createPaymentRegisterFromFilters,
  exportCurrentPaymentRegister,
  printCurrentPaymentRegister,
  readPaymentRegisterSnapshot,
  subscribePaymentRegisterSync,
} from "../bridge/payment-register";
import type { PaymentRegisterSnapshot } from "../types";

declare global {
  interface Window {
    lucide?: {
      createIcons: (options?: { nodes?: Array<Element | null | undefined> }) => void;
    };
  }
}

export function PaymentRegisterModal() {
  const [snapshot, setSnapshot] = useState<PaymentRegisterSnapshot>(() => readPaymentRegisterSnapshot());

  useEffect(() => {
    const sync = () => setSnapshot(readPaymentRegisterSnapshot());
    sync();
    return subscribePaymentRegisterSync(sync);
  }, []);

  useEffect(() => {
    window.lucide?.createIcons({
      nodes: Array.from(document.querySelectorAll("[data-payment-register-root] [data-lucide]")),
    });
  }, [snapshot.capturedAt]);

  useEffect(() => {
    const modalRoot = document.getElementById("payment-register-modal");
    if (!modalRoot) return;

    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target === modalRoot) closePaymentRegisterModal();
    };

    modalRoot.addEventListener("click", handleBackdropClick);
    return () => {
      modalRoot.removeEventListener("click", handleBackdropClick);
    };
  }, []);

  return (
    <>
      <div className="modal-header">
        <h3><i data-lucide="file-spreadsheet"></i> {snapshot.labels.title}</h3>
        <button className="btn btn-sm" onClick={closePaymentRegisterModal} type="button"><i data-lucide="x"></i></button>
      </div>
      <div className="payment-register-actions">
        <button className="btn btn-acc" onClick={() => void createPaymentRegisterFromFilters()} type="button">
          <i data-lucide="plus"></i> {snapshot.labels.createButton}
        </button>
        <button className="btn btn-sm" onClick={() => exportCurrentPaymentRegister("xlsx")} type="button">
          <i data-lucide="file-spreadsheet"></i> {snapshot.labels.exportXlsxButton}
        </button>
        <button className="btn btn-sm" onClick={() => exportCurrentPaymentRegister("csv")} type="button">
          <i data-lucide="file-text"></i> {snapshot.labels.exportCsvButton}
        </button>
        <button className="btn btn-sm" onClick={printCurrentPaymentRegister} type="button">
          <i data-lucide="printer"></i> {snapshot.labels.printButton}
        </button>
      </div>
      <div dangerouslySetInnerHTML={{ __html: snapshot.currentHtml }} className="payment-register-current" id="payment-register-current" />
      <div dangerouslySetInnerHTML={{ __html: snapshot.listHtml }} className="payment-register-list" id="payment-register-list" />
    </>
  );
}
