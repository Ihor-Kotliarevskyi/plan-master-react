import { useEffect, useState } from "react";
import { readGanttSurfaceSnapshot, subscribeGanttSurfaceSync } from "../bridge/gantt-surface";
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

  return <div dangerouslySetInnerHTML={{ __html: snapshot.legendHtml }} />;
}

export function GanttToolbar() {
  const snapshot = useGanttSurfaceSnapshot();

  useEffect(() => {
    window.lucide?.createIcons({
      nodes: Array.from(document.querySelectorAll("#gantt-toolbar [data-lucide]")),
    });
  }, [snapshot.capturedAt]);

  return <div dangerouslySetInnerHTML={{ __html: snapshot.toolbarHtml }} />;
}

export function GanttTable() {
  const snapshot = useGanttSurfaceSnapshot();

  useEffect(() => {
    window.lucide?.createIcons({
      nodes: Array.from(document.querySelectorAll("#gtbl-wrap [data-lucide]")),
    });
  }, [snapshot.capturedAt]);

  return <div dangerouslySetInnerHTML={{ __html: snapshot.tableHtml }} />;
}
