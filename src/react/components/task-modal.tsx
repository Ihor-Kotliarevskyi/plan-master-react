import { useEffect, useState } from "react";
import {
  addTaskModalCostItem,
  addTaskModalDependency,
  addTaskModalPhase,
  adjustTaskModalDependencyThreshold,
  adjustTaskModalNumber,
  closeTaskModal,
  editTaskModalDependency,
  filterTaskModalDependencies,
  notifyTaskModalPhaseChange,
  notifyTaskModalProgressChange,
  pickTaskModalCategory,
  readTaskModalSnapshot,
  removeTaskModalDependency,
  removeTaskModalPhase,
  saveTaskModal,
  setTaskModalDependencyThreshold,
  setTaskModalDependencyType,
  showTaskModalDependencyDropdown,
  subscribeTaskModalSync,
  switchTaskModalTab,
  updateTaskModalCalc,
} from "../bridge/task-modal";
import type { TaskModalSnapshot } from "../types";

export function TaskModal() {
  const [snapshot, setSnapshot] = useState<TaskModalSnapshot>(() => readTaskModalSnapshot());

  useEffect(() => {
    const sync = () => setSnapshot(readTaskModalSnapshot());
    sync();
    return subscribeTaskModalSync(sync);
  }, []);

  useEffect(() => {
    window.lucide?.createIcons({
      nodes: Array.from(document.querySelectorAll("[data-task-modal-root] [data-lucide]")),
    });
  }, [snapshot.capturedAt]);

  useEffect(() => {
    const modalRoot = document.getElementById("modal");
    if (!modalRoot) return;

    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target === modalRoot) closeTaskModal();
    };

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".dep-tag-panel")) return;
      const dropdown = document.getElementById("dep-dropdown");
      if (dropdown) dropdown.style.display = "none";
    };

    modalRoot.addEventListener("click", handleBackdropClick);
    document.addEventListener("click", handleDocumentClick);
    return () => {
      modalRoot.removeEventListener("click", handleBackdropClick);
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  async function handleTaskAction(event: React.MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    const actionElement = target.closest<HTMLElement>("[data-task-modal-action]");
    if (!actionElement) return;

    const action = actionElement.dataset.taskModalAction || "";
    if (action === "remove-dependency") {
      event.stopPropagation();
    }

    switch (action) {
      case "close-modal":
        closeTaskModal();
        return;
      case "save-task":
        await saveTaskModal();
        return;
      case "switch-tab":
        switchTaskModalTab(actionElement.dataset.taskTab || "general");
        return;
      case "add-phase":
        addTaskModalPhase();
        return;
      case "remove-phase":
        removeTaskModalPhase(Number(actionElement.dataset.phaseIndex || -1));
        return;
      case "num-step":
        adjustTaskModalNumber(actionElement.dataset.targetId || "", Number(actionElement.dataset.delta || 0));
        return;
      case "add-cost-item":
        addTaskModalCostItem(actionElement.dataset.costType || "material");
        return;
      case "add-dependency":
        addTaskModalDependency(actionElement.dataset.dependencyId || "");
        return;
      case "remove-dependency":
        removeTaskModalDependency(actionElement.dataset.dependencyId || "");
        return;
      case "edit-dependency":
        editTaskModalDependency(actionElement.dataset.dependencyId || "");
        return;
      case "set-dependency-type":
        setTaskModalDependencyType(
          actionElement.dataset.dependencyId || "",
          actionElement.dataset.dependencyType || "FS",
        );
        return;
      case "adjust-dependency-threshold":
        adjustTaskModalDependencyThreshold(
          actionElement.dataset.dependencyId || "",
          Number(actionElement.dataset.delta || 0),
        );
        return;
      case "pick-category":
        pickTaskModalCategory(Number(actionElement.dataset.categoryIndex || -1));
        return;
      default:
        return;
    }
  }

  function handleTaskChange(event: React.FormEvent<HTMLElement>) {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const inputElement = target.closest<HTMLElement>("[data-task-modal-input]");
    if (!inputElement) return;

    const inputType = inputElement.dataset.taskModalInput || "";
    if (inputType === "phase-date") {
      notifyTaskModalPhaseChange();
      return;
    }

    if (inputType === "contracts-override-budget") {
      updateTaskModalCalc();
      return;
    }

    if (inputType === "dependency-threshold") {
      const input = inputElement as HTMLInputElement;
      setTaskModalDependencyThreshold(input.dataset.dependencyId || "", input.value);
    }
  }

  function handleTaskInput(event: React.FormEvent<HTMLElement>) {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const inputElement = target.closest<HTMLElement>("[data-task-modal-input]");
    if (inputElement) {
      const inputType = inputElement.dataset.taskModalInput || "";
      if (inputType === "phase-progress") {
        const input = inputElement as HTMLInputElement;
        notifyTaskModalProgressChange(Number(input.dataset.phaseIndex || -1), input.value);
        return;
      }

      if (inputType === "budget" || inputType === "spent") {
        updateTaskModalCalc();
      }
    }

    const input = target as HTMLInputElement | null;
    if (input?.id === "dep-search") {
      filterTaskModalDependencies(input.value);
    }
  }

  return (
    <div
      onClick={(event) => void handleTaskAction(event)}
      onChange={handleTaskChange}
      onInput={handleTaskInput}
    >
      <div className="task-modal-header" aria-hidden={!snapshot.visible} onClick={(event) => void handleTaskAction(event)}>
        <h3 id="m-title">{snapshot.title}</h3>
        <div className="task-tabs">
          <div
            className={`task-tab${snapshot.activeTab === "general" ? " active" : ""}`}
            id="ttab-general"
            data-task-modal-action="switch-tab"
            data-task-tab="general"
          >
            <i data-lucide="clipboard-list"></i> {snapshot.labels.generalTab}
          </div>
          <div
            className={`task-tab${snapshot.activeTab === "costs" ? " active" : ""}`}
            id="ttab-costs"
            data-task-modal-action="switch-tab"
            data-task-tab="costs"
          >
            <i data-lucide="wallet"></i> {snapshot.labels.costsTab}
          </div>
        </div>
      </div>

      <div
        id="task-pane-general"
        className="task-pane"
        style={{ display: snapshot.activeTab === "general" ? "block" : "none" }}
      >
        <div className="task-modal-cols">
          <div className="task-modal-col">
            <div className="fg">
              <label>{snapshot.labels.nameLabel}</label>
              <input
                key={`name-${snapshot.capturedAt}`}
                id="f-name"
                defaultValue={snapshot.form.name}
                disabled={!snapshot.canEdit}
                placeholder={snapshot.labels.namePlaceholder}
              />
            </div>
            <div className="fg">
              <label>{snapshot.labels.categoryLabel}</label>
              <div dangerouslySetInnerHTML={{ __html: snapshot.sections.categoryHtml }} className="cat-chips" id="cat-chips" />
            </div>
            <div className="fg">
              <div className="modal-section-header">
                <label>{snapshot.labels.phasesLabel}</label>
                <button
                  className="btn btn-sm"
                  data-task-modal-action="add-phase"
                  disabled={!snapshot.canEdit}
                  type="button"
                >
                  {snapshot.labels.addPhaseButton}
                </button>
              </div>
              <div dangerouslySetInnerHTML={{ __html: snapshot.sections.phasesHtml }} id="modal-phases" />
            </div>
          </div>

          <div className="task-modal-col">
            <div className="fg">
              <label>{snapshot.labels.dependenciesLabel}</label>
              <div className="dep-tag-panel" id="dep-tag-panel">
                <div dangerouslySetInnerHTML={{ __html: snapshot.sections.dependencyTagsHtml }} className="dep-tags" id="dep-tags" />
                <div className="dep-search-row">
                  <div className="dep-search-wrap">
                    <i data-lucide="search" className="dep-search-icon"></i>
                    <input id="dep-search" autoComplete="off" disabled={!snapshot.canEdit} onFocus={showTaskModalDependencyDropdown} type="text" />
                  </div>
                </div>
                <div
                  dangerouslySetInnerHTML={{ __html: snapshot.sections.dependencyDropdownHtml }}
                  className="dep-dropdown"
                  id="dep-dropdown"
                  style={{ display: snapshot.sections.dependencyDropdownVisible ? "block" : "none" }}
                />
              </div>
              <div
                dangerouslySetInnerHTML={{ __html: snapshot.sections.dependencyEditorHtml }}
                className="dep-type-editor"
                id="dep-type-editor"
                style={{ display: snapshot.sections.dependencyEditorVisible ? "" : "none" }}
              />
            </div>
            <div
              dangerouslySetInnerHTML={{ __html: snapshot.sections.dependencyWarningHtml }}
              className={`warn-box${snapshot.sections.dependencyWarningVisible ? " show" : ""}`}
              id="dep-warn"
            />
            <div className="row2">
              <div className="fg">
                <label>
                  {snapshot.labels.budgetLabel}
                  <span
                    className="auto-badge"
                    id="budget-auto-badge"
                    style={{ display: snapshot.autoBadges.budget ? "inline" : "none" }}
                  >
                    {snapshot.labels.budgetAutoLabel}
                  </span>
                </label>
                <div className="num-wrap">
                  <button className="num-btn" data-task-modal-action="num-step" data-target-id="f-budget" data-delta="-1000" type="button">−</button>
                  <input
                    key={`budget-${snapshot.capturedAt}`}
                    id="f-budget"
                    data-task-modal-input="budget"
                    defaultValue={snapshot.form.budget}
                    disabled={!snapshot.canEdit}
                    min="0"
                    placeholder="0"
                    type="number"
                  />
                  <button className="num-btn" data-task-modal-action="num-step" data-target-id="f-budget" data-delta="1000" type="button">+</button>
                </div>
                <label className="calc-toggle">
                  <input
                    key={`override-${snapshot.capturedAt}`}
                    defaultChecked={snapshot.form.contractsOverrideBudget}
                    disabled={!snapshot.canEdit}
                    id="f-contracts-override-budget"
                    data-task-modal-input="contracts-override-budget"
                    type="checkbox"
                  />
                  {snapshot.labels.contractsOverrideBudgetLabel}
                </label>
              </div>
              <div className="fg">
                <label>
                  {snapshot.labels.spentLabel}
                  <span
                    className="auto-badge"
                    id="spent-auto-badge"
                    style={{ display: snapshot.autoBadges.spent ? "inline" : "none" }}
                  >
                    {snapshot.labels.spentAutoLabel}
                  </span>
                </label>
                <div className="num-wrap">
                  <button className="num-btn" data-task-modal-action="num-step" data-target-id="f-spent" data-delta="-1000" type="button">−</button>
                  <input
                    key={`spent-${snapshot.capturedAt}`}
                    id="f-spent"
                    data-task-modal-input="spent"
                    defaultValue={snapshot.form.spent}
                    disabled={!snapshot.canEdit}
                    min="0"
                    placeholder="0"
                    type="number"
                  />
                  <button className="num-btn" data-task-modal-action="num-step" data-target-id="f-spent" data-delta="1000" type="button">+</button>
                </div>
              </div>
            </div>
            <div dangerouslySetInnerHTML={{ __html: snapshot.sections.calcInfoHtml }} className="calc-row" id="calc-info" />
          </div>
        </div>

        <div id="modal-net-section" style={{ display: snapshot.sections.networkVisible ? "block" : "none" }}>
          <div className="modal-net-header">
            <label>{snapshot.labels.networkLabel}</label>
            <span className="modal-net-legend">
              <span className="mln-item"><span className="mln-dot" style={{ background: "#2563eb" }}></span>FS</span>
              <span className="mln-item"><span className="mln-dot" style={{ background: "#d97706" }}></span>SS</span>
              <span className="mln-item"><span className="mln-dot" style={{ background: "#6b7280" }}></span>FF</span>
            </span>
          </div>
          <div dangerouslySetInnerHTML={{ __html: snapshot.sections.networkHtml }} className="modal-net-graph" id="modal-net-graph" />
        </div>
      </div>

      <div
        id="task-pane-costs"
        className="task-pane"
        style={{ display: snapshot.activeTab === "costs" ? "flex" : "none" }}
      >
        <div className="cost-toolbar" onClick={(event) => void handleTaskAction(event)}>
          <button className="btn btn-sm" data-task-modal-action="add-cost-item" data-cost-type="material" disabled={!snapshot.canEdit}>
            <i data-lucide="layers"></i> {snapshot.labels.costTypeMaterial}
          </button>
          <button className="btn btn-sm" data-task-modal-action="add-cost-item" data-cost-type="work" disabled={!snapshot.canEdit}>
            <i data-lucide="hard-hat"></i> {snapshot.labels.costTypeWork}
          </button>
          <button className="btn btn-sm" data-task-modal-action="add-cost-item" data-cost-type="equipment" disabled={!snapshot.canEdit}>
            <i data-lucide="wrench"></i> {snapshot.labels.costTypeEquipment}
          </button>
          <button className="btn btn-sm" data-task-modal-action="add-cost-item" data-cost-type="service" disabled={!snapshot.canEdit}>
            <i data-lucide="handshake"></i> {snapshot.labels.costTypeService}
          </button>
          <button className="btn btn-sm" data-task-modal-action="add-cost-item" data-cost-type="other" disabled={!snapshot.canEdit}>
            <i data-lucide="box"></i> {snapshot.labels.costTypeOther}
          </button>
        </div>
        <div className="cost-table-wrap">
          <table className="cost-tbl">
            <colgroup>
              <col className="col-type" />
              <col className="col-name" />
              <col className="col-sup" />
              <col className="col-price" />
              <col className="col-note" />
              <col className="col-total" />
            </colgroup>
            <thead>
              <tr>
                <th>{snapshot.labels.tableTypeHeader}</th>
                <th>{snapshot.labels.tableContractHeader}</th>
                <th>{snapshot.labels.tableSupplierHeader}</th>
                <th className="th-r">{snapshot.labels.tableBudgetHeader}</th>
                <th>{snapshot.labels.tableNoteHeader}</th>
                <th className="th-r">{snapshot.labels.tableTotalHeader}</th>
              </tr>
            </thead>
            <tbody dangerouslySetInnerHTML={{ __html: snapshot.sections.costTableHtml }} id="cost-tbody" />
          </table>
        </div>
        <div dangerouslySetInnerHTML={{ __html: snapshot.sections.costFooterHtml }} className="cost-footer" id="cost-footer" />
      </div>

      <div className="m-btns m-btns-sep" onClick={(event) => void handleTaskAction(event)}>
        <button className="btn" data-task-modal-action="close-modal" type="button">
          {snapshot.labels.cancelButton}
        </button>
        <button className="btn btn-acc" data-task-modal-action="save-task" disabled={!snapshot.canEdit} type="button">
          {snapshot.labels.saveButton}
        </button>
      </div>
    </div>
  );
}
