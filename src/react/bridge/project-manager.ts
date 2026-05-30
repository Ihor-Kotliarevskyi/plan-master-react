import { z } from "zod";
import type { ProjectManagerSnapshot } from "../types";

const rowSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  roleLabel: z.string(),
  tasksCount: z.number(),
  sharedMetaLine: z.string(),
  canManageProject: z.boolean(),
  isActive: z.boolean(),
});

const snapshotSchema: z.ZodType<ProjectManagerSnapshot> = z.object({
  visible: z.boolean(),
  labels: z.object({
    title: z.string(),
    createButton: z.string(),
    loadDemoButton: z.string(),
    closeButton: z.string(),
    ownGroupTitle: z.string(),
    sharedGroupTitle: z.string(),
    ownProjectMeta: z.string(),
    deleteTitle: z.string(),
    createDialog: z.object({
      title: z.string(),
      inputLabel: z.string(),
      inputValue: z.string(),
      confirmButtonText: z.string(),
      cancelButtonText: z.string(),
      inputRequiredMessage: z.string(),
    }),
    demoDialog: z.object({
      title: z.string(),
      html: z.string(),
      confirmButtonText: z.string(),
      cancelButtonText: z.string(),
      loadedToastTitle: z.string(),
    }),
    cannotDelete: z.object({
      title: z.string(),
      text: z.string(),
    }),
  }),
  groups: z.object({
    own: z.array(rowSchema),
    shared: z.array(rowSchema),
  }),
  canDeleteMultipleProjects: z.boolean(),
  capturedAt: z.string(),
});

type ProjectManagerWindow = Window & {
  getProjectManagerBridgeSnapshot?: () => unknown;
  closeReactProjectManager?: () => void;
  createProjectFromReact?: (name: string) => Promise<{ ok: boolean; error?: string }>;
  loadDemoProjectFromReact?: () => Promise<unknown>;
  deleteProjectFromReact?: (id: string) => Promise<{ ok: boolean; error?: string; cancelled?: boolean }>;
  renameProjectFromManager?: (id: string, name: string) => string;
  switchProject?: (id: string) => void;
};

function getProjectManagerWindow(): ProjectManagerWindow {
  return window as ProjectManagerWindow;
}

function buildFallbackSnapshot(): ProjectManagerSnapshot {
  return {
    visible: false,
    labels: {
      title: "Управління проєктами",
      createButton: "+ Новий проєкт",
      loadDemoButton: "Завантажити демо-проєкт",
      closeButton: "Закрити",
      ownGroupTitle: "Мої проєкти",
      sharedGroupTitle: "Розшарені проєкти",
      ownProjectMeta: "Власний проєкт",
      deleteTitle: "Видалити",
      createDialog: {
        title: "Новий проєкт",
        inputLabel: "Назва проєкту",
        inputValue: "Новий проєкт",
        confirmButtonText: "Створити",
        cancelButtonText: "Скасувати",
        inputRequiredMessage: "Введіть назву",
      },
      demoDialog: {
        title: "Завантажити демо-проєкт?",
        html: "",
        confirmButtonText: "Завантажити",
        cancelButtonText: "Скасувати",
        loadedToastTitle: "Демо-проєкт завантажено",
      },
      cannotDelete: {
        title: "Неможливо видалити",
        text: "Має залишатися хоча б один проєкт.",
      },
    },
    groups: { own: [], shared: [] },
    canDeleteMultipleProjects: true,
    capturedAt: new Date().toISOString(),
  };
}

export function readProjectManagerSnapshot(): ProjectManagerSnapshot {
  const parsed = snapshotSchema.safeParse(getProjectManagerWindow().getProjectManagerBridgeSnapshot?.());
  return parsed.success ? parsed.data : buildFallbackSnapshot();
}

export function subscribeProjectManagerSync(onSync: () => void): () => void {
  const handler = () => onSync();
  document.addEventListener("plan-master:project-manager-sync", handler);
  return () => document.removeEventListener("plan-master:project-manager-sync", handler);
}

export function closeProjectManager(): void {
  getProjectManagerWindow().closeReactProjectManager?.();
}

export async function createProjectFromReact(name: string) {
  return getProjectManagerWindow().createProjectFromReact?.(name);
}

export async function loadDemoProjectFromReact() {
  return getProjectManagerWindow().loadDemoProjectFromReact?.();
}

export async function deleteProjectFromReact(id: string) {
  return getProjectManagerWindow().deleteProjectFromReact?.(id);
}

export function renameProjectFromReact(id: string, name: string): string {
  return getProjectManagerWindow().renameProjectFromManager?.(id, name) || name;
}

export function switchProjectFromReact(id: string): void {
  getProjectManagerWindow().switchProject?.(id);
}
