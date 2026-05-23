export interface SupabaseRegisterRequest {
  email: string;
  password: string;
  options: {
    data: {
      name: string;
    };
    emailRedirectTo: string;
  };
}

export interface SupabaseLoginRequest {
  email: string;
  password: string;
}

export interface SupabaseProfileSelectRequest {
  userId: string;
}

export interface SupabaseProfileUpdatePayload {
  name?: string;
  avatar?: string;
  theme?: string;
  default_sm?: number;
  default_sy?: number;
  default_nm?: number;
}

export function buildAuthRedirectUrl(origin: string, pathname: string): string {
  return `${origin}${pathname}`;
}

export function buildSupabaseRegisterRequest(
  name: string,
  email: string,
  password: string,
  redirectUrl: string,
): SupabaseRegisterRequest {
  return {
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: redirectUrl,
    },
  };
}

export function buildSupabaseLoginRequest(email: string, password: string): SupabaseLoginRequest {
  return {
    email,
    password,
  };
}

export function buildSupabaseProfileSelectRequest(userId: string): SupabaseProfileSelectRequest {
  return {
    userId,
  };
}

export function buildSupabaseProfileUpdatePayload(updates: {
  name?: string;
  avatar?: string;
  theme?: string;
  defaults?: {
    sm?: number;
    sy?: number;
    nm?: number;
  };
}): SupabaseProfileUpdatePayload {
  const dbUpdates: SupabaseProfileUpdatePayload = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
  if (updates.theme !== undefined) dbUpdates.theme = updates.theme;
  if (updates.defaults) {
    if (updates.defaults.sm !== undefined) dbUpdates.default_sm = updates.defaults.sm;
    if (updates.defaults.sy !== undefined) dbUpdates.default_sy = updates.defaults.sy;
    if (updates.defaults.nm !== undefined) dbUpdates.default_nm = updates.defaults.nm;
  }
  return dbUpdates;
}
