export interface AccountSectionModel {
  sectionTitle: string;
  emailLabel: string;
  logoutLabel: string;
  auditLogLabel: string;
  projectLabel: string;
  roleLabel: string;
  cloudCopyLabel: string;
  localVersionLabel: string;
  serverVersionLabel: string;
  lastLocalChangeLabel: string;
}

export function buildAccountSectionModel(): AccountSectionModel {
  return {
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
  };
}
