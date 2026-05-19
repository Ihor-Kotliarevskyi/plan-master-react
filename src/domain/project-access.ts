import { normalizeProjectRole } from "./permissions";
import type { ProjectAccessMeta, ProjectRole } from "./types";

export interface ProjectListLikeSnapshot {
  proj?: {
    name?: string;
  };
  tasks?: unknown[];
  _role?: ProjectRole | string;
  _access?: ProjectAccessMeta;
}

export type ProjectEntryTuple = [string, ProjectListLikeSnapshot];

export interface GroupedProjectEntries {
  own: ProjectEntryTuple[];
  shared: ProjectEntryTuple[];
}

export interface SharedProjectLabels {
  isShared: boolean;
  ownerLabel: string;
  invitedByLabel: string;
}

export function isSharedProjectEntry(projectSnapshot?: ProjectListLikeSnapshot | null): boolean {
  if (!projectSnapshot) return false;
  return projectSnapshot._access?.source === "shared"
    || normalizeProjectRole(projectSnapshot._role || "owner") !== "owner";
}

export function groupProjectEntriesByAccess(entries: ProjectEntryTuple[]): GroupedProjectEntries {
  const own: ProjectEntryTuple[] = [];
  const shared: ProjectEntryTuple[] = [];

  for (const entry of entries || []) {
    const [, projectSnapshot] = entry;
    (isSharedProjectEntry(projectSnapshot) ? shared : own).push(entry);
  }

  return { own, shared };
}

export function getSharedProjectLabels(accessMeta?: ProjectAccessMeta | null): SharedProjectLabels {
  return {
    isShared: accessMeta?.source === "shared",
    ownerLabel: accessMeta?.ownerName || accessMeta?.ownerEmail || "",
    invitedByLabel: accessMeta?.invitedByName || accessMeta?.invitedByEmail || "",
  };
}
