import { z } from "zod";
import type { ProjectSettingsSnapshot } from "../types";

const snapshotSchema: z.ZodType<ProjectSettingsSnapshot> = z.object({
  visible: z.boolean(),
  labels: z.object({
    title: z.string(),
    nameLabel: z.string(),
    startMonthLabel: z.string(),
    yearLabel: z.string(),
    durationLabel: z.string(),
    categoriesButton: z.string(),
    cancelButton: z.string(),
    saveButton: z.string(),
  }),
  formState: z.object({
    name: z.string(),
    sm: z.number(),
    sy: z.number(),
    nm: z.number(),
    canManage: z.boolean(),
  }),
  monthOptions: z.array(
    z.object({
      value: z.number(),
      label: z.string(),
    }),
  ),
  capturedAt: z.string(),
});

type ProjectSettingsWindow = Window & {
  getProjectSettingsBridgeSnapshot?: () => unknown;
  closeReactProjectSettings?: () => void;
  saveProjectSettingsFromReact?: (state: { name: string; sm: number; sy: number; nm: number }) => Promise<{ ok: boolean }>;
  openCatEditor?: () => void;
  closeProjModal?: () => void;
};

function getProjectSettingsWindow(): ProjectSettingsWindow {
  return window as ProjectSettingsWindow;
}

function buildFallbackSnapshot(): ProjectSettingsSnapshot {
  return {
    visible: false,
    labels: {
      title: "Налаштування проєкту",
      nameLabel: "Назва",
      startMonthLabel: "Початок місяць",
      yearLabel: "Рік",
      durationLabel: "Тривалість (міс.)",
      categoriesButton: "Редагувати категорії",
      cancelButton: "Скасувати",
      saveButton: "Зберегти",
    },
    formState: {
      name: "",
      sm: 0,
      sy: new Date().getFullYear(),
      nm: 12,
      canManage: true,
    },
    monthOptions: [],
    capturedAt: new Date().toISOString(),
  };
}

export function readProjectSettingsSnapshot(): ProjectSettingsSnapshot {
  const parsed = snapshotSchema.safeParse(getProjectSettingsWindow().getProjectSettingsBridgeSnapshot?.());
  return parsed.success ? parsed.data : buildFallbackSnapshot();
}

export function subscribeProjectSettingsSync(onSync: () => void): () => void {
  const handler = () => onSync();
  document.addEventListener("plan-master:project-settings-sync", handler);
  return () => document.removeEventListener("plan-master:project-settings-sync", handler);
}

export function closeProjectSettings(): void {
  getProjectSettingsWindow().closeReactProjectSettings?.();
}

export async function saveProjectSettings(state: { name: string; sm: number; sy: number; nm: number }) {
  return getProjectSettingsWindow().saveProjectSettingsFromReact?.(state);
}

export function openCategoriesEditor(): void {
  getProjectSettingsWindow().closeProjModal?.();
  getProjectSettingsWindow().openCatEditor?.();
}
