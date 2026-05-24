import type { SyncStatus } from "../../domain/types";

export interface SupabaseSessionHydrationResult<TUser = unknown, TProfile = unknown> {
  user: TUser;
  profile: TProfile | null;
  shouldRefreshSyncStatus: boolean;
  shouldUpdateUserButton: boolean;
  shouldLoadProjects: boolean;
}

export interface SupabaseSignedOutUiPlan {
  refreshStatus: SyncStatus;
  shouldUpdateReadOnlyUi: boolean;
}

export interface SupabaseInitialSessionPlan {
  kind: "hydrate" | "guest";
  loadProjects: boolean;
}

export function buildSupabaseSessionHydrationResult<TUser = unknown, TProfile = unknown>(
  user: TUser,
  profile: TProfile | null,
  loadProjects: boolean,
): SupabaseSessionHydrationResult<TUser, TProfile> {
  return {
    user,
    profile,
    shouldRefreshSyncStatus: true,
    shouldUpdateUserButton: true,
    shouldLoadProjects: loadProjects,
  };
}

export function buildSupabaseSignedOutUiPlan(
  refreshStatus: SyncStatus = "offline",
): SupabaseSignedOutUiPlan {
  return {
    refreshStatus,
    shouldUpdateReadOnlyUi: true,
  };
}

export function resolveSupabaseInitialSessionPlan(hasSessionUser: boolean): SupabaseInitialSessionPlan {
  return hasSessionUser
    ? { kind: "hydrate", loadProjects: false }
    : { kind: "guest", loadProjects: false };
}
