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

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const actionElement = target?.closest<HTMLElement>("[data-contractor-dialog-action]");
      if (!actionElement) return;

      const action = actionElement.dataset.contractorDialogAction || "";
      if (action === "toggle-edit-row-delete") {
        actionElement.closest(".contractor-edit-row")?.classList.toggle("marked-delete");
      }
    };

    const handleDocumentChange = (event: Event) => {
      const target = event.target as HTMLInputElement | HTMLSelectElement | null;
      if (!target) return;
      const inputType = target.dataset.contractorDialogInput || "";

      if (inputType === "sync-act-contract-item") {
        const selectedOption = target instanceof HTMLSelectElement ? target.selectedOptions?.[0] : null;
        const nextItemName = selectedOption?.dataset.itemName || "";
        const itemNameInput = document.getElementById("act-item-name") as HTMLInputElement | null;
        if (itemNameInput && nextItemName) itemNameInput.value = nextItemName;
      }
    };

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("change", handleDocumentChange);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("change", handleDocumentChange);
    };
  }, []);

  if (!snapshot.visible) return null;

  const selectedContract = snapshot.contracts.find((contract) => contract.id === form.selectedContractId) || snapshot.contracts[0] || null;
  const actOptions = selectedContract?.acts || [];
  const isActMode = snapshot.mode === "act-add" || snapshot.mode === "act-edit";
  const isPaymentMode = snapshot.mode === "payment-add" || snapshot.mode === "payment-edit";

  const handleContractChange = (nextContractId: string) => {
    const nextContract = snapshot.contracts.find((contract) => contract.id === nextContractId) || null;
    setForm((current) => ({
      ...current,
      selectedContractId: nextContractId,
      itemName: isActMode ? (nextContract?.itemName || current.itemName) : current.itemName,
      selectedActValue:
        isPaymentMode && nextContract && !nextContract.acts.some((act) => act.value === current.selectedActValue)
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
          <h3>
            {snapshot.mode === "act-add" ? snapshot.labels.actTitle : null}
            {snapshot.mode === "act-edit" ? snapshot.labels.editActTitle : null}
            {snapshot.mode === "payment-add" ? snapshot.labels.paymentTitle : null}
            {snapshot.mode === "payment-edit" ? snapshot.labels.editPaymentTitle : null}
          </h3>
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

          {isActMode ? (
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
