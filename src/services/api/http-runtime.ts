export interface FallbackHttpRequestOptions {
  headers: Record<string, string>;
}

export interface FallbackHttpOutcome {
  kind: "ok" | "session_expired" | "error";
  message?: string;
}

export function buildFallbackHttpRequestOptions(authToken: string | null): FallbackHttpRequestOptions {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  return { headers };
}

export function resolveFallbackHttpOutcome(status: number, data: Record<string, unknown>): FallbackHttpOutcome {
  if (status === 401 && data?.expired) {
    return { kind: "session_expired" };
  }
  if (status >= 200 && status < 300) {
    return { kind: "ok" };
  }
  return {
    kind: "error",
    message: typeof data?.error === "string" && data.error ? data.error : `HTTP ${status}`,
  };
}
