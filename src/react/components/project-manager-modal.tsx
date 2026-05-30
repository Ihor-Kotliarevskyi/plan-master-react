import { useEffect, useState } from "react";
import {
  closeProjectManager,
  createProjectFromReact,
  deleteProjectFromReact,
  loadDemoProjectFromReact,
  readProjectManagerSnapshot,
  renameProjectFromReact,
  subscribeProjectManagerSync,
  switchProjectFromReact,
} from "../bridge/project-manager";
import type { ProjectManagerRow, ProjectManagerSnapshot } from "../types";

function ProjectGroup({
  title,
  rows,
  deleteTitle,
  onRename,
  onDelete,
}: {
  title: string;
  rows: ProjectManagerRow[];
  deleteTitle: string;
  onRename: (id: string, value: string) => void;
  onDelete: (id: string) => void;
}) {
  if (!rows.length) return null;

  return (
    <div className="proj-group">
      <div className="proj-group-title">{title}</div>
      {rows.map((row) => (
        <div
          key={row.id}
          className={`pj-row${row.isActive ? " active" : ""}`}
          onClick={() => switchProjectFromReact(row.id)}
          role="button"
        >
          <div className="pj-main">
            <input
              className="pj-name-inp"
              defaultValue={row.name}
              disabled={!row.canManageProject}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => {
                const nextName = renameProjectFromReact(row.id, event.target.value);
                if (nextName !== event.target.value) event.target.value = nextName;
                onRename(row.id, nextName);
              }}
            />
            <span className={`pj-role-chip pj-role-${row.role}`}>{row.roleLabel}</span>
          </div>
          <div className="pj-sub">
            <span className="pj-tasks-count">{row.tasksCount} робіт</span>
            <div className="pj-meta">{row.sharedMetaLine}</div>
          </div>
          {row.canManageProject ? (
            <button
              className="pj-del"
              title={deleteTitle}
              onClick={(event) => {
                event.stopPropagation();
                onDelete(row.id);
              }}
              type="button"
            >
              ×
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function ProjectManagerModal() {
  const [snapshot, setSnapshot] = useState<ProjectManagerSnapshot>(() => readProjectManagerSnapshot());
  const [createName, setCreateName] = useState("");
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDemo, setConfirmDemo] = useState(false);

  useEffect(() => {
    const sync = () => setSnapshot(readProjectManagerSnapshot());
    sync();
    return subscribeProjectManagerSync(sync);
  }, []);

  useEffect(() => {
    setCreateName(snapshot.labels.createDialog.inputValue);
  }, [snapshot.labels.createDialog.inputValue]);

  const deleteRow = [...snapshot.groups.own, ...snapshot.groups.shared].find((row) => row.id === confirmDeleteId) || null;

  return snapshot.visible ? (
      <div className="react-project-manager-modal" role="dialog" aria-modal="true">
        <h3>{snapshot.labels.title}</h3>

        <div className="react-project-manager-create">
          <label>{snapshot.labels.createDialog.inputLabel}</label>
          <div className="react-project-manager-create__row">
            <input
              value={createName}
              maxLength={80}
              onChange={(event) => setCreateName(event.target.value)}
              placeholder={snapshot.labels.createDialog.inputValue}
            />
            <button
              className="btn btn-acc"
              onClick={async () => {
                const result = await createProjectFromReact(createName);
                if (result?.ok) {
                  setError("");
                  return;
                }
                setError(result?.error || snapshot.labels.createDialog.inputRequiredMessage);
              }}
              type="button"
            >
              {snapshot.labels.createDialog.confirmButtonText}
            </button>
          </div>
        </div>

        {error ? <div className="react-project-manager-error">{error}</div> : null}

        <div className="proj-list react-project-manager-list">
          <ProjectGroup
            title={snapshot.labels.ownGroupTitle}
            rows={snapshot.groups.own}
            deleteTitle={snapshot.labels.deleteTitle}
            onRename={() => setSnapshot(readProjectManagerSnapshot())}
            onDelete={(id) => setConfirmDeleteId(id)}
          />
          <ProjectGroup
            title={snapshot.labels.sharedGroupTitle}
            rows={snapshot.groups.shared}
            deleteTitle={snapshot.labels.deleteTitle}
            onRename={() => setSnapshot(readProjectManagerSnapshot())}
            onDelete={(id) => setConfirmDeleteId(id)}
          />
        </div>

        <button className="btn btn-full" onClick={() => setConfirmDemo(true)} type="button">
          {snapshot.labels.loadDemoButton}
        </button>
        <div className="m-btns">
          <button className="btn btn-acc" onClick={closeProjectManager} type="button">
            {snapshot.labels.closeButton}
          </button>
        </div>

        {confirmDemo ? (
          <div className="react-project-manager-confirm">
            <p>{snapshot.labels.demoDialog.title}</p>
            <div className="react-project-manager-confirm__actions">
              <button className="btn" onClick={() => setConfirmDemo(false)} type="button">
                {snapshot.labels.demoDialog.cancelButtonText}
              </button>
              <button
                className="btn btn-acc"
                onClick={async () => {
                  await loadDemoProjectFromReact();
                  setConfirmDemo(false);
                }}
                type="button"
              >
                {snapshot.labels.demoDialog.confirmButtonText}
              </button>
            </div>
          </div>
        ) : null}

        {confirmDeleteId && deleteRow ? (
          <div className="react-project-manager-confirm">
            <p>{snapshot.canDeleteMultipleProjects ? `Видалити «${deleteRow.name}»?` : snapshot.labels.cannotDelete.text}</p>
            <div className="react-project-manager-confirm__actions">
              <button className="btn" onClick={() => setConfirmDeleteId(null)} type="button">
                {snapshot.labels.createDialog.cancelButtonText}
              </button>
              {snapshot.canDeleteMultipleProjects ? (
                <button
                  className="btn btn-danger"
                  onClick={async () => {
                    await deleteProjectFromReact(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }}
                  type="button"
                >
                  {snapshot.labels.deleteTitle}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
  ) : null;
}
