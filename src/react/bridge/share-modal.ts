import { z } from "zod";
import type { ShareModalSnapshot } from "../types";

const shareModalSnapshotSchema: z.ZodType<ShareModalSnapshot> = z.object({
  visible: z.boolean(),
  loading: z.boolean(),
  error: z.string(),
  projectName: z.string(),
  items: z.array(
    z.object({
      id: z.string(),
      displayLabel: z.string(),
      normalizedRole: z.string(),
      roleLabel: z.string(),
    }),
  ),
  labels: z.object({
    accessDeniedTitle: z.string(),
    emptyText: z.string(),
    modalTitle: z.string(),
    projectLabel: z.string(),
    grantSectionTitle: z.string(),
    emailPlaceholder: z.string(),
    confirmButtonText: z.string(),
    cancelButtonText: z.string(),
    emailRequiredMessage: z.string(),
    roleGuideItems: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
      }),
    ),
  }),
  roleOptions: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
    }),
  ),
  capturedAt: z.string(),
});

type ShareModalWindow = Window & {
  getShareBridgeSnapshot?: () => unknown;
  closeReactShareModal?: () => void;
  reloadReactShareModal?: () => Promise<void>;
  grantShareFromReact?: (email: string, role: string) => Promise<{ ok: boolean; error?: string }>;
  handleShareRoleChange?: (shareId: string, role: string) => Promise<void>;
  handleShareRemoval?: (shareId: string) => Promise<void>;
};

function getShareModalWindow(): ShareModalWindow {
  return window as ShareModalWindow;
}

function buildFallbackSnapshot(): ShareModalSnapshot {
  return {
    visible: false,
    loading: false,
    error: "",
    projectName: "",
    items: [],
    labels: {
      accessDeniedTitle: "",
      emptyText: "",
      modalTitle: "Shared Access",
      projectLabel: "Project",
      grantSectionTitle: "Grant access:",
      emailPlaceholder: "email@example.com",
      confirmButtonText: "Grant access",
      cancelButtonText: "Close",
      emailRequiredMessage: "Enter email",
      roleGuideItems: [],
    },
    roleOptions: [],
    capturedAt: new Date().toISOString(),
  };
}

export function readShareModalSnapshot(): ShareModalSnapshot {
  const snapshot = getShareModalWindow().getShareBridgeSnapshot?.();
  const parsed = shareModalSnapshotSchema.safeParse(snapshot);
  return parsed.success ? parsed.data : buildFallbackSnapshot();
}

export function subscribeShareModalSync(onSync: () => void): () => void {
  const handler = () => onSync();
  document.addEventListener("plan-master:share-modal-sync", handler);
  return () => {
    document.removeEventListener("plan-master:share-modal-sync", handler);
  };
}

export function closeShareModal(): void {
  getShareModalWindow().closeReactShareModal?.();
}

export async function reloadShareModal(): Promise<void> {
  await getShareModalWindow().reloadReactShareModal?.();
}

export async function grantShare(email: string, role: string) {
  return getShareModalWindow().grantShareFromReact?.(email, role);
}

export async function updateShareRole(shareId: string, role: string): Promise<void> {
  await getShareModalWindow().handleShareRoleChange?.(shareId, role);
}

export async function removeShare(shareId: string): Promise<void> {
  await getShareModalWindow().handleShareRemoval?.(shareId);
}
