import { useEffect, useState } from "react";
import {
  clearGanttTaskSearch,
  copyGanttTask,
  deleteGanttTask,
  handleGanttBarClick,
  onGanttTaskSearch,
  openGanttAddTask,
  openGanttDependencyList,
  openGanttEditTask,
  openGanttNotesModal,
  readGanttSurfaceSnapshot,
  reopenGanttOverdue,
  resetGanttCategoryFilter,
  resetGanttFilters,
  setGanttMonoColor,
  subscribeGanttSurfaceSync,
  toggleGanttCategory,
  toggleGanttCriticalPath,
  toggleGanttDependencyArrows,
  toggleGanttGroup,
  toggleGanttGroupBy,
  toggleGanttHidePast,
  toggleGanttMonoBar,
  zoomGanttIn,
  zoomGanttOut,
} from "../bridge/gantt-surface";
import type { GanttSurfaceSnapshot } from "../types";

declare global {
  interface Window {
    lucide?: {
      createIcons: (options?: { nodes?: Array<Element | null | undefined> }) => void;
    };
  }
}

function useGanttSurfaceSnapshot() {
  const [snapshot, setSnapshot] = useState<GanttSurfaceSnapshot>(() => readGanttSurfaceSnapshot());

  useEffect(() => {
    const sync = () => setSnapshot(readGanttSurfaceSnapshot());
    sync();
    return subscribeGanttSurfaceSync(sync);
  }, []);

  return snapshot;
}

export function GanttLegend() {
  const snapshot = useGanttSurfaceSnapshot();

  useEffect(() => {
    window.lucide?.createIcons({
      nodes: Array.from(document.querySelectorAll(".legend-bar [data-lucide]")),
    });
  }, [snapshot.capturedAt]);

  function handleLegendClick(event: React.MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    const actionElement = target.closest<HTMLElement>("[data-gantt-action]");
    if (!actionElement) return;
    const action = actionElement.dataset.ganttAction || "";

    if (action === "toggle-category") {
      toggleGanttCategory(Number(actionElement.dataset.categoryIndex || -1), event.nativeEvent);
      return;
    }
    if (action === "reset-category-filter") {
      resetGanttCategoryFilter();
    }
  }

  return <div dangerouslySetInnerHTML={{ __html: snapshot.legendHtml }} onClick={handleLegendClick} />;
}

export function GanttToolbar() {
  const snapshot = useGanttSurfaceSnapshot();

  useEffect(() => {
    window.lucide?.createIcons({
      nodes: Array.from(document.querySelectorAll("#gantt-toolbar [data-lucide]")),
    });
  }, [snapshot.capturedAt]);

  async function handleToolbarClick(event: React.MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    const actionElement = target.closest<HTMLElement>("[data-gantt-action]");
    if (!actionElement) return;
    const action = actionElement.dataset.ganttAction || "";

    switch (action) {
      case "clear-task-search":
        clearGanttTaskSearch();
        return;
      case "reset-gantt-filters":
        resetGanttFilters();
        return;
      case "toggle-critical-path":
        toggleGanttCriticalPath();
        return;
      case "toggle-dependency-arrows":
        toggleGanttDependencyArrows();
        return;
      case "open-dependency-list":
        openGanttDependencyList();
        return;
      case "toggle-group-by":
        toggleGanttGroupBy();
        return;
      case "reopen-overdue":
        reopenGanttOverdue();
        return;
      case "zoom-out":
        zoomGanttOut();
        return;
      case "zoom-in":
        zoomGanttIn();
        return;
      case "toggle-mono-bar":
        toggleGanttMonoBar();
        return;
      case "open-add-task":
        openGanttAddTask();
        return;
      case "toggle-hide-past":
        toggleGanttHidePast();
        return;
      default:
        return;
    }
  }

  function handleToolbarInput(event: React.FormEvent<HTMLElement>) {
    const target = event.target as HTMLInputElement | null;
    const inputElement = target?.closest<HTMLElement>("[data-gantt-input]");
    if (!inputElement || !target) return;
    const inputType = inputElement.dataset.ganttInput || "";

    if (inputType === "task-search") {
      onGanttTaskSearch(target.value);
      return;
    }

    if (inputType === "mono-bar-color") {
      setGanttMonoColor(target.value);
    }
  }

  function handleToolbarKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    const target = event.target as HTMLInputElement | null;
    const inputElement = target?.closest<HTMLElement>("[data-gantt-input='task-search']");
    if (!inputElement || !target) return;
    if (event.key !== "Escape") return;
    target.value = "";
    onGanttTaskSearch("");
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: snapshot.toolbarHtml }}
      onClick={(event) => void handleToolbarClick(event)}
      onInput={handleToolbarInput}
      onKeyDown={handleToolbarKeyDown}
    />
  );
}

export function GanttTable() {
  const snapshot = useGanttSurfaceSnapshot();

  useEffect(() => {
    window.lucide?.createIcons({
      nodes: Array.from(document.querySelectorAll("#gtbl-wrap [data-lucide]")),
    });
  }, [snapshot.capturedAt]);

  async function handleTableClick(event: React.MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    const actionElement = target.closest<HTMLElement>("[data-gantt-action]");
    if (!actionElement) return;

    const action = actionElement.dataset.ganttAction || "";
    switch (action) {
      case "toggle-group":
        toggleGanttGroup(Number(actionElement.dataset.categoryIndex || -1));
        return;
      case "open-edit-task":
        openGanttEditTask(Number(actionElement.dataset.taskIndex || -1));
        return;
      case "copy-task":
        event.stopPropagation();
        copyGanttTask(Number(actionElement.dataset.taskIndex || -1));
        return;
      case "delete-task":
        event.stopPropagation();
        await deleteGanttTask(Number(actionElement.dataset.taskIndex || -1));
        return;
      case "open-notes-modal":
        event.stopPropagation();
        openGanttNotesModal(Number(actionElement.dataset.taskIndex || -1));
        return;
      case "handle-bar-click":
        handleGanttBarClick(event.nativeEvent, Number(actionElement.dataset.taskIndex || -1));
        return;
      default:
        return;
    }
  }

  return <div dangerouslySetInnerHTML={{ __html: snapshot.tableHtml }} onClick={(event) => void handleTableClick(event)} />;
}
