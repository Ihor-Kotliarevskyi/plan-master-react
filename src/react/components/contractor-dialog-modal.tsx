import { useEffect, useState } from "react";
import {
  closeContractorDialog,
  readContractorDialogSnapshot,
  submitContractorDialog,
  subscribeContractorDialogSync,
} from "../bridge/contractor-dialog";
import type { ContractorDialogSnapshot, ContractorDialogSubmitPayload } from "../types";

function buildInitialForm(snapshot: ContractorDialogSnapshot): ContractorDialogSubmitPayload {
  return {
    selectedContractId: snapshot.selectedContractId,
    selectedActValue: snapshot.selectedActValue,
    actType: snapshot.actType,
    actName: snapshot.actName,
    date: snapshot.date,
    amount: snapshot.amount,
    itemName: snapshot.itemName,
    note: snapshot.note,
  };
}

export function ContractorDialogModal() {
  const [snapshot, setSnapshot] = useState<ContractorDialogSnapshot>(() => readContractorDialogSnapshot());
  const [form, setForm] = useState<ContractorDialogSubmitPayload>(() => buildInitialForm(readContractorDialogSnapshot()));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const sync = () => {
      const next = readContractorDialogSnapshot();
      setSnapshot(next);
      setForm(buildInitialForm(next));
      setError("");
      setSubmitting(false);
    };
    sync();
    return subscribeContractorDialogSync(sync);
  }, []);

  if (!snapshot.visible) return null;

  const selectedContract = snapshot.contracts.find((contract) => contract.id === form.selectedContractId) || snapshot.contracts[0] || null;
  const actOptions = selectedContract?.acts || [];

  const handleContractChange = (nextContractId: string) => {
    const nextContract = snapshot.contracts.find((contract) => contract.id === nextContractId) || null;
    setForm((current) => ({
      ...current,
      selectedContractId: nextContractId,
      itemName: snapshot.mode === "act-add" ? (nextContract?.itemName || "") : current.itemName,
      selectedActValue:
        snapshot.mode === "payment-add" && nextContract && !nextContract.acts.some((act) => act.value === current.selectedActValue)
          ? ""
          : current.selectedActValue,
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    const result = await submitContractorDialog(form);
    if (!result?.ok) {
      setSubmitting(false);
      setError(result?.error || "Save failed");
    }
  };

  return (
    <div className="react-share-overlay" onClick={closeContractorDialog} role="presentation">
      <div className="react-share-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="react-share-modal__header">
          <h3>{snapshot.mode === "act-add" ? snapshot.labels.actTitle : snapshot.labels.paymentTitle}</h3>
          <button className="btn btn-sm" onClick={closeContractorDialog} type="button">x</button>
        </div>
        <div className="contractor-entry-grid">
          <div className="fg contractor-entry-span">
            <label>{snapshot.labels.contractLabel}</label>
            <select
              onChange={(event) => handleContractChange(event.target.value)}
              value={form.selectedContractId}
            >
              {snapshot.contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.label}
                </option>
              ))}
            </select>
          </div>

          {snapshot.mode === "act-add" ? (
            <>
              <div className="fg">
                <label>{snapshot.labels.actTypeLabel}</label>
                <select onChange={(event) => setForm((current) => ({ ...current, actType: event.target.value }))} value={form.actType}>
                  {snapshot.actTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="fg">
                <label>{snapshot.labels.actNumberLabel}</label>
                <input onChange={(event) => setForm((current) => ({ ...current, actName: event.target.value }))} value={form.actName} />
              </div>
              <div className="fg">
                <label>{snapshot.labels.dateLabel}</label>
                <input onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} type="date" value={form.date} />
              </div>
              <div className="fg">
                <label>{snapshot.labels.amountLabel}</label>
                <input onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} min="0" step="100" type="number" value={form.amount} />
              </div>
              <div className="fg contractor-entry-span">
                <label>{snapshot.labels.itemNameLabel}</label>
                <input onChange={(event) => setForm((current) => ({ ...current, itemName: event.target.value }))} value={form.itemName} />
              </div>
            </>
          ) : (
            <>
              <div className="fg">
                <label>{snapshot.labels.paymentDateLabel}</label>
                <input onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} type="date" value={form.date} />
              </div>
              <div className="fg">
                <label>{snapshot.labels.paymentAmountLabel}</label>
                <input onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} min="0" step="100" type="number" value={form.amount} />
              </div>
              <div className="fg contractor-entry-span">
                <label>{snapshot.labels.paymentActLabel}</label>
                <select
                  onChange={(event) => setForm((current) => ({ ...current, selectedActValue: event.target.value }))}
                  value={form.selectedActValue}
                >
                  {actOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="fg contractor-entry-span">
            <label>{snapshot.labels.noteLabel}</label>
            <input onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} value={form.note} />
          </div>
        </div>
        {error ? <div className="react-share-modal__error">{error}</div> : null}
        <div className="m-btns m-btns-sep">
          <button className="btn" disabled={submitting} onClick={closeContractorDialog} type="button">{snapshot.labels.cancelButton}</button>
          <button className="btn btn-acc" disabled={submitting} onClick={handleSubmit} type="button">{snapshot.labels.saveButton}</button>
        </div>
      </div>
    </div>
  );
}
