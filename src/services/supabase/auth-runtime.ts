import type { ProjectSnapshot, SyncStatus } from "../../domain/types";

export interface SupabaseAuthState<TUser = unknown, TProfile = unknown> {
  user: TUser | null;
  profile: TProfile | null;
  projectRole: string | null;
}

export interface LogoutSyncDecision {
  shouldSync: boolean;
}

export interface HydratedAuthState<TUser = unknown, TProfile = unknown> {
  user: TUser;
  profile: TProfile | null;
}

export interface AuthEventPlan {
  kind: "hydrate" | "refresh" | "signed_out" | "noop";
  loadProjects: boolean;
  refreshStatus?: SyncStatus;
}

export function resetSupabaseAuthState<TUser = unknown, TProfile = unknown>(): SupabaseAuthState<TUser, TProfile> {
  return {
    user: null,
    profile: null,
    projectRole: null,
  };
}

export function buildLogoutSyncDecision(snapshot?: ProjectSnapshot | null): LogoutSyncDecision {
  return {
    shouldSync: (snapshot?._localVersion || 0) > (snapshot?._serverVersion || 0),
  };
}

export function buildHydratedAuthState<TUser = unknown, TProfile = unknown>(
  user: TUser,
  profile: TProfile | null,
): HydratedAuthState<TUser, TProfile> {
  return {
    user,
    profile,
  };
}

export function resolveSupabaseAuthEventPlan(
  event: string,
  hasSessionUser: boolean,
): AuthEventPlan {
  if ((event === "INITIAL_SESSION" || event === "SIGNED_IN") && hasSessionUser) {
    return {
      kind: "hydrate",
      loadProjects: true,
    };
  }

  if (event === "TOKEN_REFRESHED" && hasSessionUser) {
    return {
      kind: "refresh",
      loadProjects: false,
    };
  }

  if (event === "USER_UPDATED" && hasSessionUser) {
    return {
      kind: "hydrate",
      loadProjects: false,
    };
  }

  if (event === "SIGNED_OUT") {
    return {
      kind: "signed_out",
      loadProjects: false,
      refreshStatus: "offline",
    };
  }

  return {
    kind: "noop",
    loadProjects: false,
  };
}
