import { getProjectRoleLabel } from "./access-ui";
import type { ProjectRole, ProjectSyncState } from "./types";

export interface AccountSyncPanelModel {
  roleLabel: string;
  projectName: string;
  hasServerCopyText: string;
  localVersionText: string;
  serverVersionText: string;
  updatedAtText: string;
}

export function buildAccountSyncPanelModel(
  projectSyncState: Pick<
    ProjectSyncState<any>,
    "snap" | "hasServerCopy" | "localVersion" | "serverVersion" | "updatedAt"
  >,
  currentRole: string | null | undefined,
  fallbackProjectName = "-",
): AccountSyncPanelModel {
  const projectName =
    projectSyncState.snap?.proj?.name ||
    fallbackProjectName ||
    "-";

  return {
    roleLabel: getProjectRoleLabel(currentRole as ProjectRole),
    projectName,
    hasServerCopyText: projectSyncState.hasServerCopy ? "yes" : "no",
    localVersionText: String(projectSyncState.localVersion ?? 0),
    serverVersionText: String(projectSyncState.serverVersion ?? 0),
    updatedAtText: projectSyncState.updatedAt || "",
  };
}
