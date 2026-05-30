import { z } from "zod";
import type { UserCabinetSnapshot } from "../types";

const userCabinetSnapshotSchema: z.ZodType<UserCabinetSnapshot> = z.object({
  visible: z.boolean(),
  loggedIn: z.boolean(),
  activeAuthTab: z.union([z.literal("login"), z.literal("register")]),
  profile: z.object({
    name: z.string(),
    email: z.string(),
    avatar: z.string().nullable(),
    theme: z.string().nullable(),
    defaults: z.object({
      sm: z.number(),
      sy: z.number(),
      nm: z.number(),
    }),
  }),
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
  defaultsPanel: z.object({
    sectionTitle: z.string(),
    startMonthLabel: z.string().optional(),
    startYearLabel: z.string().optional(),
    durationLabel: z.string().optional(),
  }),
  themePanel: z.object({
    sectionTitle: z.string(),
    themeLabel: z.string().optional(),
  }),
  baselinePanel: z.object({
    sectionTitle: z.string(),
    hasBaseline: z.boolean().optional(),
    savedLabel: z.string().optional(),
    toggleLabel: z.string().optional(),
    saveActionLabel: z.string().optional(),
    deleteActionLabel: z.string().optional(),
    emptyHint: z.string().optional(),
    showBaseline: z.boolean().optional(),
  }),
  syncBadge: z.object({
    status: z.string(),
    label: z.string(),
  }),
  syncPanel: z.object({
    roleLabel: z.string(),
    projectName: z.string(),
    hasServerCopyText: z.string(),
    localVersionText: z.string(),
    serverVersionText: z.string(),
    updatedAtText: z.string(),
  }),
  accountSection: z.object({
    sectionTitle: z.string(),
    emailLabel: z.string().optional(),
    logoutLabel: z.string().optional(),
    auditLogLabel: z.string().optional(),
    projectLabel: z.string().optional(),
    roleLabel: z.string().optional(),
    cloudCopyLabel: z.string().optional(),
    localVersionLabel: z.string().optional(),
    serverVersionLabel: z.string().optional(),
    lastLocalChangeLabel: z.string().optional(),
  }),
  authFormModel: z.object({
    tab: z.union([z.literal("login"), z.literal("register")]),
    isLogin: z.boolean(),
    hintText: z.string(),
    loginTabLabel: z.string(),
    registerTabLabel: z.string(),
    nameLabel: z.string(),
    namePlaceholder: z.string(),
    emailLabel: z.string(),
    emailPlaceholder: z.string(),
    passwordLabel: z.string(),
    passwordPlaceholder: z.string(),
    submitLabel: z.string(),
  }),
  canViewAuditLog: z.boolean(),
  capturedAt: z.string(),
});

type UserCabinetWindow = Window & {
  getUserCabinetBridgeSnapshot?: () => unknown;
  setUserCabinetAuthTab?: (tab: "login" | "register") => unknown;
  submitUserCabinetAuth?: (state: {
    tab: "login" | "register";
    email: string;
    password: string;
    name?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  saveUserCabinetProfile?: (state: {
    name: string;
    defaults: { sm: number; sy: number; nm: number };
  }) => Promise<{ ok: boolean; error?: string }>;
  uploadUserAvatarFile?: (file: File | null) => { ok: boolean; error?: string } | void;
  clearAvatar?: () => void;
  toggleTheme?: () => void;
  toggleBaseline?: () => void;
  saveBaseline?: () => void;
  clearBaseline?: () => void;
  logoutUserCabinet?: () => Promise<void>;
  openUserCabinetAuditLog?: () => Promise<void>;
  closeUserModal?: () => void;
};

function getUserCabinetWindow(): UserCabinetWindow {
  return window as UserCabinetWindow;
}

function buildFallbackSnapshot(): UserCabinetSnapshot {
  return {
    visible: false,
    loggedIn: false,
    activeAuthTab: "login",
    profile: {
      name: "",
      email: "",
      avatar: null,
      theme: "light",
      defaults: { sm: 0, sy: new Date().getFullYear(), nm: 12 },
    },
    identity: {
      displayName: "Profile",
      emailText: "",
      initial: "P",
      avatarUrl: null,
      themeToggle: { theme: "light", icon: "moon", label: "Dark" },
    },
    defaultsPanel: { sectionTitle: "Project defaults", startMonthLabel: "Start month", startYearLabel: "Start year", durationLabel: "Duration (months)" },
    themePanel: { sectionTitle: "Appearance", themeLabel: "Theme" },
    baselinePanel: { sectionTitle: "Baseline", hasBaseline: false, savedLabel: "", toggleLabel: "Show", saveActionLabel: "Save baseline", deleteActionLabel: "Delete", emptyHint: "", showBaseline: false },
    syncBadge: { status: "offline", label: "" },
    syncPanel: { roleLabel: "-", projectName: "-", hasServerCopyText: "no", localVersionText: "0", serverVersionText: "0", updatedAtText: "" },
    accountSection: {
      sectionTitle: "Cloud account",
      emailLabel: "Email",
      logoutLabel: "Log out",
      auditLogLabel: "Activity log",
      projectLabel: "Project",
      roleLabel: "Role",
      cloudCopyLabel: "Cloud copy",
      localVersionLabel: "Local version",
      serverVersionLabel: "Server version",
      lastLocalChangeLabel: "Last local change",
    },
    authFormModel: {
      tab: "login",
      isLogin: true,
      hintText: "",
      loginTabLabel: "Sign in",
      registerTabLabel: "Register",
      nameLabel: "Name",
      namePlaceholder: "Your name",
      emailLabel: "Email",
      emailPlaceholder: "example@mail.com",
      passwordLabel: "Password",
      passwordPlaceholder: "Minimum 6 characters",
      submitLabel: "Sign in",
    },
    canViewAuditLog: false,
    capturedAt: new Date().toISOString(),
  };
}

export function readUserCabinetSnapshot(): UserCabinetSnapshot {
  const snapshot = getUserCabinetWindow().getUserCabinetBridgeSnapshot?.();
  const parsed = userCabinetSnapshotSchema.safeParse(snapshot);
  return parsed.success ? parsed.data : buildFallbackSnapshot();
}

export function subscribeUserCabinetSync(onSync: () => void): () => void {
  const handler = () => onSync();
  document.addEventListener("plan-master:user-cabinet-sync", handler);
  return () => {
    document.removeEventListener("plan-master:user-cabinet-sync", handler);
  };
}

export function setUserCabinetAuthTab(tab: "login" | "register"): void {
  getUserCabinetWindow().setUserCabinetAuthTab?.(tab);
}

export async function submitUserCabinetAuth(state: {
  tab: "login" | "register";
  email: string;
  password: string;
  name?: string;
}) {
  return getUserCabinetWindow().submitUserCabinetAuth?.(state);
}

export async function saveUserCabinetProfile(state: {
  name: string;
  defaults: { sm: number; sy: number; nm: number };
}) {
  return getUserCabinetWindow().saveUserCabinetProfile?.(state);
}

export function uploadUserCabinetAvatar(file: File | null) {
  return getUserCabinetWindow().uploadUserAvatarFile?.(file);
}

export function clearUserCabinetAvatar(): void {
  getUserCabinetWindow().clearAvatar?.();
}

export function toggleUserCabinetTheme(): void {
  getUserCabinetWindow().toggleTheme?.();
}

export function toggleUserCabinetBaseline(): void {
  getUserCabinetWindow().toggleBaseline?.();
}

export function saveUserCabinetBaseline(): void {
  getUserCabinetWindow().saveBaseline?.();
}

export function clearUserCabinetBaseline(): void {
  getUserCabinetWindow().clearBaseline?.();
}

export async function logoutUserCabinet(): Promise<void> {
  await getUserCabinetWindow().logoutUserCabinet?.();
}

export async function openUserCabinetAuditLog(): Promise<void> {
  await getUserCabinetWindow().openUserCabinetAuditLog?.();
}

export function closeUserCabinetModal(): void {
  getUserCabinetWindow().closeUserModal?.();
}
