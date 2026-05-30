import { useEffect, useRef, useState } from "react";
import {
  exportAppJson,
  exportAppXlsx,
  importAppJson,
  openAppPrintDialog,
  openAppProjectManager,
  openAppProjectSettings,
  openAppShareModal,
  openAppUserCabinet,
  readAppShellSnapshot,
  subscribeAppShellSync,
  switchAppProject,
  switchAppTab,
  toggleAppTheme,
} from "../bridge/app-shell";
import type { AppShellSnapshot } from "../types";

declare global {
  interface Window {
    lucide?: {
      createIcons: (options?: { nodes?: Array<Element | null | undefined> }) => void;
    };
  }
}

function useAppShellSnapshot() {
  const [snapshot, setSnapshot] = useState<AppShellSnapshot>(() => readAppShellSnapshot());

  useEffect(() => {
    const sync = () => setSnapshot(readAppShellSnapshot());
    sync();
    return subscribeAppShellSync(sync);
  }, []);

  return snapshot;
}

export function AppShellHeader() {
  const snapshot = useAppShellSnapshot();
  const [toolsOpen, setToolsOpen] = useState(false);
  const importRef = useRef<HTMLInputElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    window.lucide?.createIcons({ nodes: [rootRef.current] });
  }, [snapshot.capturedAt, toolsOpen]);

  return (
    <div ref={rootRef} className="react-app-shell-header">
      <div className="proj-block">
        <select
          className="proj-sel"
          id="proj-sel"
          value={snapshot.projectSelect.state.own.find((item) => item.selected)?.id || snapshot.projectSelect.state.shared.find((item) => item.selected)?.id || ""}
          onChange={(event) => switchAppProject(event.target.value)}
        >
          {snapshot.projectSelect.state.own.length ? (
            <optgroup label={snapshot.projectSelect.labels.ownGroupLabel}>
              {snapshot.projectSelect.state.own.map((item) => (
                <option key={item.id} value={item.id}>{item.name}{item.roleLabelSuffix}</option>
              ))}
            </optgroup>
          ) : null}
          {snapshot.projectSelect.state.shared.length ? (
            <optgroup label={snapshot.projectSelect.labels.sharedGroupLabel}>
              {snapshot.projectSelect.state.shared.map((item) => (
                <option key={item.id} value={item.id}>{item.name}{item.roleLabelSuffix}</option>
              ))}
            </optgroup>
          ) : null}
        </select>
        <button className="btn btn-icon" onClick={openAppProjectManager} title="Управління проєктами" type="button">
          <i data-lucide="folder" />
        </button>
        <button className="btn btn-icon" onClick={openAppProjectSettings} title="Налаштування проєкту" type="button">
          <i data-lucide="settings" />
        </button>
        <span className="proj-dates" id="head-dates">{snapshot.projectDates}</span>
      </div>

      <button id="theme-toggle" className="theme-toggle" onClick={toggleAppTheme} title="Змінити тему" type="button">
        <span className="theme-icon"><i data-lucide={snapshot.identity.themeToggle.icon} /></span>
        <span className="theme-label">{snapshot.identity.themeToggle.label}</span>
      </button>

      <div className="tools-menu" id="tools-menu">
        <button className="btn btn-icon tools-trigger" onClick={() => setToolsOpen((value) => !value)} title="Друк та експорт" type="button">
          <i data-lucide="more-horizontal" />
        </button>
        <div className={`tools-dropdown${toolsOpen ? " open" : ""}`} id="tools-dropdown">
          <button className="tools-item" onClick={() => { openAppPrintDialog(); setToolsOpen(false); }} type="button">
            <i data-lucide="printer" /> Друк / PDF
          </button>
          <div className="tools-sep" />
          <button className="tools-item" onClick={() => { exportAppXlsx(); setToolsOpen(false); }} type="button">
            <i data-lucide="table-2" /> Експорт Excel
          </button>
          <button className="tools-item" onClick={() => { exportAppJson(); setToolsOpen(false); }} type="button">
            <i data-lucide="file-json" /> Експорт JSON
          </button>
          <button className="tools-item" onClick={() => importRef.current?.click()} type="button">
            <i data-lucide="file-input" /> Імпорт JSON
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={(event) => {
              importAppJson(event.nativeEvent);
              setToolsOpen(false);
            }}
          />
        </div>
      </div>

      <button
        id="user-btn"
        className={`user-btn status-${snapshot.syncBadge.status}${snapshot.syncBadge.status === "syncing" ? " syncing" : ""}`}
        onClick={openAppUserCabinet}
        title="Кабінет користувача"
        type="button"
      >
        <div className="user-avatar-wrap">
          <div className="user-avatar">
            {snapshot.identity.avatarUrl ? (
              <img src={snapshot.identity.avatarUrl} alt="avatar" className="user-avatar-img" />
            ) : (
              snapshot.identity.initial
            )}
          </div>
        </div>
        <span>{snapshot.identity.displayName}</span>
      </button>

      {snapshot.shareVisible ? (
        <button id="share-btn" className="btn btn-sm" onClick={() => void openAppShareModal()} title="Керувати доступом до проєкту" type="button">
          <i data-lucide="users" /> Доступ
        </button>
      ) : null}
    </div>
  );
}

export function AppShellTabs() {
  const snapshot = useAppShellSnapshot();
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    window.lucide?.createIcons({ nodes: [rootRef.current] });
  }, [snapshot.capturedAt]);

  return (
    <div ref={rootRef} className="react-app-shell-tabs">
      {snapshot.tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab${tab.isActive ? " active" : ""}`}
          onClick={() => switchAppTab(tab.id)}
          type="button"
        >
          <i data-lucide={tab.icon} /> {tab.label}
        </button>
      ))}
    </div>
  );
}

export function AppShellAccessBanner() {
  const snapshot = useAppShellSnapshot();

  return snapshot.accessBanner.shouldShow ? (
    <>
      <span className="project-access-pill">{snapshot.accessBanner.roleLabel}</span>
      <span className="project-access-text">
        {snapshot.accessBanner.roleHint}
        {snapshot.accessBanner.sharedMetaText ? ` ${snapshot.accessBanner.sharedMetaText}` : ""}
      </span>
    </>
  ) : null;
}
