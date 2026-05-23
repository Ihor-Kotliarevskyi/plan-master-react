export interface FallbackAuthState<TUser = unknown> {
  token: string | null;
  user: TUser | null;
  projectRole: string | null;
}

export interface FallbackRegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface FallbackLoginRequest {
  email: string;
  password: string;
}

export interface FallbackProfileUpdateRequest {
  body: Record<string, unknown>;
}

export interface FallbackSyncIndicatorPlan {
  status: "syncing";
  timeoutMs: number;
}

export function resetFallbackAuthState<TUser = unknown>(): FallbackAuthState<TUser> {
  return {
    token: null,
    user: null,
    projectRole: null,
  };
}

export function buildFallbackRegisterRequest(name: string, email: string, password: string): FallbackRegisterRequest {
  return {
    name,
    email,
    password,
  };
}

export function buildFallbackLoginRequest(email: string, password: string): FallbackLoginRequest {
  return {
    email,
    password,
  };
}

export function buildFallbackProfileUpdateRequest(updates: Record<string, unknown>): FallbackProfileUpdateRequest {
  return {
    body: { ...(updates || {}) },
  };
}

export function buildFallbackAuthHydratedState<TUser = unknown>(token: string, user: TUser): FallbackAuthState<TUser> {
  return {
    token,
    user,
    projectRole: null,
  };
}

export function buildFallbackSyncIndicatorPlan(timeoutMs = 1800): FallbackSyncIndicatorPlan {
  return {
    status: "syncing",
    timeoutMs,
  };
}
