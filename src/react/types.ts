export type ReactHostRoute = "overview" | "auth" | "audit" | "share" | "projects" | "settings";

export interface ReactHostSessionState {
  isAuthenticated: boolean;
  authLabel: string;
  userLabel: string;
  syncLabel: string;
}

export interface ReactHostProjectListItem {
  id: string;
  name: string;
  role: string;
  serverId: string | null;
  isCurrent: boolean;
}

export interface ReactHostProjectCollectionState {
  currentId: string | null;
  items: ReactHostProjectListItem[];
}

export interface ReactHostCurrentProjectState {
  id: string;
  name: string;
  role: string;
  taskCount: number;
  categoryCount: number;
  hasServerCopy: boolean;
  updatedAt: string | null;
}

export interface ReactHostUiState {
  activeTab: string | null;
}

export interface ReactHostSnapshot {
  session: ReactHostSessionState;
  projectCollection: ReactHostProjectCollectionState;
  currentProject: ReactHostCurrentProjectState | null;
  ui: ReactHostUiState;
  capturedAt: string;
}
