import { z } from "zod";
import type { AppShellSnapshot } from "../types";

const snapshotSchema: z.ZodType<AppShellSnapshot> = z.object({
  activeTab: z.string(),
  tabs: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      icon: z.string(),
      isActive: z.boolean(),
    }),
  ),
  projectSelect: z.object({
    labels: z.object({
      ownGroupLabel: z.string(),
      sharedGroupLabel: z.string(),
      sharedRoleSeparator: z.string(),
    }),
    state: z.object({
      own: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          selected: z.boolean(),
          roleLabelSuffix: z.string(),
        }),
      ),
      shared: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          selected: z.boolean(),
          roleLabelSuffix: z.string(),
        }),
      ),
    }),
  }),
  projectDates: z.string(),
  identity: z.object({
    displayName: z.string(),
    emailText: z.string(),
    initial: z.string(),
    avatarUrl: z.string().nullable(),
    themeToggle: z.object({
      theme: z.union([z.literal("light"), z.literal("dark")]),
      icon: z.union([z.literal("moon"), z.literal("sun")]),
      label: z.string(),
    }),
  }),
  syncBadge: z.object({
    status: z.string(),
    label: z.string(),
  }),
  shareVisible: z.boolean(),
  accessBanner: z.object({
    shouldShow: z.boolean(),
    roleLabel: z.string(),
    roleHint: z.string(),
    sharedMetaText: z.string(),
  }),
  capturedAt: z.string(),
});

type AppShellWindow = Window & {
  getAppShellBridgeSnapshot?: () => unknown;
  switchTab?: (id: string) => void;
  switchProject?: (id: string) => void;
  toggleTheme?: () => void;
  openProjManager?: () => void;
  openProj?: () => void;
  openUserModal?: () => void;
  openShareModal?: () => Promise<void> | void;
  openPrintDialog?: () => void;
  exportXLSX?: () => void;
  exportJSON?: () => void;
  importJSON?: (event: Event) => void;
};

function getAppShellWindow(): AppShellWindow {
  return window as AppShellWindow;
}

function buildFallbackSnapshot(): AppShellSnapshot {
  return {
    activeTab: "gantt",
    tabs: [],
    projectSelect: {
      labels: {
        ownGroupLabel: "Мої проєкти",
        sharedGroupLabel: "Розшарені",
        sharedRoleSeparator: " В· ",
      },
      state: { own: [], shared: [] },
    },
    projectDates: "",
    identity: {
      displayName: "Профіль",
      emailText: "",
      initial: "П",
      avatarUrl: null,
      themeToggle: { theme: "light", icon: "moon", label: "Темна" },
    },
    syncBadge: { status: "offline", label: "" },
    shareVisible: false,
    accessBanner: {
      shouldShow: false,
      roleLabel: "",
      roleHint: "",
      sharedMetaText: "",
    },
    capturedAt: new Date().toISOString(),
  };
}

export function readAppShellSnapshot(): AppShellSnapshot {
  const parsed = snapshotSchema.safeParse(getAppShellWindow().getAppShellBridgeSnapshot?.());
  return parsed.success ? parsed.data : buildFallbackSnapshot();
}

export function subscribeAppShellSync(onSync: () => void): () => void {
  const handler = () => onSync();
  document.addEventListener("plan-master:app-shell-sync", handler);
  return () => document.removeEventListener("plan-master:app-shell-sync", handler);
}

export function switchAppTab(id: string): void {
  getAppShellWindow().switchTab?.(id);
}

export function switchAppProject(id: string): void {
  getAppShellWindow().switchProject?.(id);
}

export function toggleAppTheme(): void {
  getAppShellWindow().toggleTheme?.();
}

export function openAppProjectManager(): void {
  getAppShellWindow().openProjManager?.();
}

export function openAppProjectSettings(): void {
  getAppShellWindow().openProj?.();
}

export function openAppUserCabinet(): void {
  getAppShellWindow().openUserModal?.();
}

export async function openAppShareModal(): Promise<void> {
  await getAppShellWindow().openShareModal?.();
}

export function openAppPrintDialog(): void {
  getAppShellWindow().openPrintDialog?.();
}

export function exportAppXlsx(): void {
  getAppShellWindow().exportXLSX?.();
}

export function exportAppJson(): void {
  getAppShellWindow().exportJSON?.();
}

export function importAppJson(event: Event): void {
  getAppShellWindow().importJSON?.(event);
}
