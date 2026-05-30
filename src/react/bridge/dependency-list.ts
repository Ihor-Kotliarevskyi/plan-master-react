import { z } from "zod";
import type { DependencyListSnapshot } from "../types";

const snapshotSchema: z.ZodType<DependencyListSnapshot> = z.object({
  visible: z.boolean(),
  filter: z.string(),
  countText: z.string(),
  bodyHtml: z.string(),
  labels: z.object({
    title: z.string(),
    closeButton: z.string(),
    allFilter: z.string(),
    fsFilter: z.string(),
    ssFilter: z.string(),
    ffFilter: z.string(),
  }),
  capturedAt: z.string(),
});

type DependencyListWindow = Window & {
  getDependencyListBridgeSnapshot?: () => unknown;
  closeDepList?: () => void;
  setDepListFilter?: (filter: string) => void;
  depListGo?: (taskIndex: number) => void;
};

function getDependencyListWindow(): DependencyListWindow {
  return window as DependencyListWindow;
}

function buildFallbackSnapshot(): DependencyListSnapshot {
  return {
    visible: false,
    filter: "all",
    countText: "",
    bodyHtml: "",
    labels: {
      title: "Залежності проєкту",
      closeButton: "Закрити",
      allFilter: "Всі",
      fsFilter: "FS",
      ssFilter: "SS",
      ffFilter: "FF",
    },
    capturedAt: new Date().toISOString(),
  };
}

export function readDependencyListSnapshot(): DependencyListSnapshot {
  const parsed = snapshotSchema.safeParse(getDependencyListWindow().getDependencyListBridgeSnapshot?.());
  return parsed.success ? parsed.data : buildFallbackSnapshot();
}

export function subscribeDependencyListSync(onSync: () => void): () => void {
  const handler = () => onSync();
  document.addEventListener("plan-master:dependency-list-sync", handler);
  return () => document.removeEventListener("plan-master:dependency-list-sync", handler);
}

export function closeDependencyList(): void {
  getDependencyListWindow().closeDepList?.();
}

export function setDependencyListFilter(filter: string): void {
  getDependencyListWindow().setDepListFilter?.(filter);
}

export function goToDependencyTask(taskIndex: number): void {
  getDependencyListWindow().depListGo?.(taskIndex);
}
