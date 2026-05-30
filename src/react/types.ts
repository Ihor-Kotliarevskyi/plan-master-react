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

export interface UserCabinetProjectDefaults {
  sm: number;
  sy: number;
  nm: number;
}

export interface UserCabinetProfileState {
  name: string;
  email: string;
  avatar: string | null;
  theme: string | null;
  defaults: UserCabinetProjectDefaults;
}

export interface UserCabinetIdentityState {
  displayName: string;
  emailText: string;
  initial: string;
  avatarUrl: string | null;
  themeToggle: {
    theme: "light" | "dark";
    icon: "moon" | "sun";
    label: string;
  };
}

export interface UserCabinetPanelLabels {
  sectionTitle: string;
  startMonthLabel?: string;
  startYearLabel?: string;
  durationLabel?: string;
  themeLabel?: string;
  hasBaseline?: boolean;
  savedLabel?: string;
  toggleLabel?: string;
  saveActionLabel?: string;
  deleteActionLabel?: string;
  emptyHint?: string;
  showBaseline?: boolean;
  emailLabel?: string;
  logoutLabel?: string;
  auditLogLabel?: string;
  projectLabel?: string;
  roleLabel?: string;
  cloudCopyLabel?: string;
  localVersionLabel?: string;
  serverVersionLabel?: string;
  lastLocalChangeLabel?: string;
}

export interface UserCabinetAuthFormModel {
  tab: "login" | "register";
  isLogin: boolean;
  hintText: string;
  loginTabLabel: string;
  registerTabLabel: string;
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  submitLabel: string;
}

export interface UserCabinetSyncPanelState {
  roleLabel: string;
  projectName: string;
  hasServerCopyText: string;
  localVersionText: string;
  serverVersionText: string;
  updatedAtText: string;
}

export interface UserCabinetSyncBadge {
  status: string;
  label: string;
}

export interface UserCabinetSnapshot {
  visible: boolean;
  loggedIn: boolean;
  activeAuthTab: "login" | "register";
  profile: UserCabinetProfileState;
  identity: UserCabinetIdentityState;
  defaultsPanel: UserCabinetPanelLabels;
  themePanel: UserCabinetPanelLabels;
  baselinePanel: UserCabinetPanelLabels;
  syncBadge: UserCabinetSyncBadge;
  syncPanel: UserCabinetSyncPanelState;
  accountSection: UserCabinetPanelLabels;
  authFormModel: UserCabinetAuthFormModel;
  canViewAuditLog: boolean;
  capturedAt: string;
}

export interface AuditViewerEntry {
  id: string;
  createdAt: string;
  eventLabel: string;
  actorLabel: string;
  subjectLabel: string;
}

export interface AuditViewerSnapshot {
  visible: boolean;
  loading: boolean;
  error: string;
  entries: AuditViewerEntry[];
  labels: {
    accessDeniedTitle: string;
    loadFailedTitle: string;
    missingMigrationHint: string;
    retryHint: string;
    actorCaption: string;
    subjectCaption: string;
    emptyHint: string;
    modalTitle: string;
    closeButtonLabel: string;
  };
  capturedAt: string;
}
