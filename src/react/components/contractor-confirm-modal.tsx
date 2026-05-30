import { useEffect, useState } from "react";
import {
  closeContractorConfirm,
  readContractorConfirmSnapshot,
  submitContractorConfirm,
  subscribeContractorConfirmSync,
} from "../bridge/contractor-confirm";
import type { ContractorConfirmSnapshot } from "../types";

export function ContractorConfirmModal() {
  const [snapshot, setSnapshot] = useState<ContractorConfirmSnapshot>(() => readContractorConfirmSnapshot());
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const sync = () => {
      const next = readContractorConfirmSnapshot();
      setSnapshot(next);
      setInputValue(next.inputValue);
      setError("");
    };
    sync();
    return subscribeContractorConfirmSync(sync);
  }, []);

  if (!snapshot.visible) return null;

  return (
    <div className="react-share-overlay" onClick={closeContractorConfirm} role="presentation">
      <div className="react-share-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="react-share-modal__header">
          <h3>{snapshot.title}</h3>
          <button className="btn btn-sm" onClick={closeContractorConfirm} type="button">x</button>
        </div>
        {snapshot.messageHtml ? <div dangerouslySetInnerHTML={{ __html: snapshot.messageHtml }} /> : null}
        {snapshot.inputLabel ? (
          <div className="fg">
            <label>{snapshot.inputLabel}</label>
            <input onChange={(event) => setInputValue(event.target.value)} value={inputValue} />
          </div>
        ) : null}
        {error ? <div className="react-share-modal__error">{error}</div> : null}
        <div className="m-btns m-btns-sep">
          <button className="btn" onClick={closeContractorConfirm} type="button">{snapshot.cancelButtonText}</button>
          <button
            className="btn btn-acc"
            onClick={() => {
              const result = submitContractorConfirm(inputValue);
              if (!result?.ok) setError(result?.error || snapshot.errorText);
            }}
            type="button"
          >
            {snapshot.confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
