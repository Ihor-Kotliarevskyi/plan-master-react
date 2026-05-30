import { z } from "zod";
import type { ReactHostSnapshot } from "../types";

const projectListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  serverId: z.string().nullable(),
  isCurrent: z.boolean(),
});

const currentProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  taskCount: z.number(),
  categoryCount: z.number(),
  hasServerCopy: z.boolean(),
  updatedAt: z.string().nullable(),
});

const snapshotSchema = z.object({
  session: z.object({
    isAuthenticated: z.boolean(),
    authLabel: z.string(),
    userLabel: z.string(),
    syncLabel: z.string(),
  }),
  projectCollection: z.object({
    currentId: z.string().nullable(),
    items: z.array(projectListItemSchema),
  }),
  currentProject: currentProjectSchema.nullable(),
  ui: z.object({
    activeTab: z.string().nullable(),
  }),
  capturedAt: z.string(),
});

type LegacyBridgeWindow = Window & {
  getLegacyAppBridgeSnapshot?: () => unknown;
  switchProject?: (id: string) => void;
};

function getLegacyBridgeWindow(): LegacyBridgeWindow {
  return window as LegacyBridgeWindow;
}

export function shouldMountReactHost(): boolean {
  if (import.meta.env.DEV) return true;
  const params = new URLSearchParams(window.location.search);
  return params.get("react-host") === "1";
}

export function readLegacyAppSnapshot(): ReactHostSnapshot {
  const snapshot = getLegacyBridgeWindow().getLegacyAppBridgeSnapshot?.();
  const parsed = snapshotSchema.safeParse(snapshot);
  if (parsed.success) return parsed.data;

  return {
    session: {
      isAuthenticated: false,
      authLabel: "",
      userLabel: "",
      syncLabel: "",
    },
    projectCollection: {
      currentId: null,
      items: [],
    },
    currentProject: null,
    ui: {
      activeTab: null,
    },
    capturedAt: new Date().toISOString(),
  };
}

export function openLegacyAuthFlow(): void {
  document.getElementById("auth-status-btn")?.click();
}

export function openLegacyUserCabinet(): void {
  document.getElementById("user-btn")?.click();
}

export function switchLegacyProject(projectId: string): void {
  getLegacyBridgeWindow().switchProject?.(projectId);
}
