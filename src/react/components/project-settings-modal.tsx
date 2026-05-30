import { useEffect, useState } from "react";
import {
  closeProjectSettings,
  openCategoriesEditor,
  readProjectSettingsSnapshot,
  saveProjectSettings,
  subscribeProjectSettingsSync,
} from "../bridge/project-settings";
import type { ProjectSettingsSnapshot } from "../types";

export function ProjectSettingsModal() {
  const [snapshot, setSnapshot] = useState<ProjectSettingsSnapshot>(() => readProjectSettingsSnapshot());
  const [formState, setFormState] = useState(snapshot.formState);

  useEffect(() => {
    const sync = () => setSnapshot(readProjectSettingsSnapshot());
    sync();
    return subscribeProjectSettingsSync(sync);
  }, []);

  useEffect(() => {
    setFormState(snapshot.formState);
  }, [snapshot.capturedAt, snapshot.formState]);

  return snapshot.visible ? (
    <div className="react-project-settings-modal" role="dialog" aria-modal="true">
      <h3>{snapshot.labels.title}</h3>
      <div className="fg">
        <label>{snapshot.labels.nameLabel}</label>
        <input
          value={formState.name}
          disabled={!snapshot.formState.canManage}
          onChange={(event) => setFormState((state) => ({ ...state, name: event.target.value }))}
        />
      </div>
      <div className="row3">
        <div className="fg">
          <label>{snapshot.labels.startMonthLabel}</label>
          <select
            value={formState.sm}
            disabled={!snapshot.formState.canManage}
            onChange={(event) => setFormState((state) => ({ ...state, sm: Number(event.target.value) }))}
          >
            {snapshot.monthOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="fg">
          <label>{snapshot.labels.yearLabel}</label>
          <input
            type="number"
            min={2020}
            max={2035}
            disabled={!snapshot.formState.canManage}
            value={formState.sy}
            onChange={(event) => setFormState((state) => ({ ...state, sy: Number(event.target.value) }))}
          />
        </div>
        <div className="fg">
          <label>{snapshot.labels.durationLabel}</label>
          <input
            type="number"
            min={3}
            max={120}
            disabled={!snapshot.formState.canManage}
            value={formState.nm}
            onChange={(event) => setFormState((state) => ({ ...state, nm: Number(event.target.value) }))}
          />
        </div>
      </div>
      <div className="proj-modal-cats">
        <button className="btn btn-full" disabled={!snapshot.formState.canManage} onClick={openCategoriesEditor} type="button">
          {snapshot.labels.categoriesButton}
        </button>
      </div>
      <div className="m-btns">
        <button className="btn" onClick={closeProjectSettings} type="button">
          {snapshot.labels.cancelButton}
        </button>
        <button
          className="btn btn-acc"
          disabled={!snapshot.formState.canManage}
          onClick={() => void saveProjectSettings(formState)}
          type="button"
        >
          {snapshot.labels.saveButton}
        </button>
      </div>
    </div>
  ) : null;
}
