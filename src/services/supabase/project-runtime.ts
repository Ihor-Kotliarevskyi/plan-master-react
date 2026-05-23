import { normalizeProjectRole } from "../../domain/permissions";
import type { ProjectRole, ProjectSnapshot } from "../../domain/types";
import { buildProjectInsertPayload, buildProjectMutationPayload, buildUpsertTasksPayload } from "./payloads";

export interface ProjectTasksRpcRequest {
  p_project_id: string;
  p_tasks: ReturnType<typeof buildUpsertTasksPayload>;
}

export interface ProjectSyncMutationRequest {
  projectId: string;
  updatePayload: ReturnType<typeof buildProjectMutationPayload> & {
    updated_at: string;
  };
  tasksRpc: ProjectTasksRpcRequest;
  expectedTaskCount: number;
}

export interface ProjectCreateMutationRequest {
  insertPayload: ReturnType<typeof buildProjectInsertPayload>;
  tasksRpc: ProjectTasksRpcRequest | null;
  expectedTaskCount: number;
}

export interface ProjectDeleteRequest {
  projectId: string;
}

export function resolveLoadedProjectRole(
  ownerId: string | null | undefined,
  authUserId: string,
  shareRole?: string | null,
): ProjectRole {
  if (ownerId && ownerId === authUserId) return "owner";
  return normalizeProjectRole(shareRole || "viewer");
}

export function buildProjectTasksRpcRequest(projectId: string, tasks: ProjectSnapshot["tasks"]): ProjectTasksRpcRequest {
  return {
    p_project_id: projectId,
    p_tasks: buildUpsertTasksPayload(tasks || []),
  };
}

export function buildProjectSyncMutationRequest(
  projectId: string,
  snapshot: ProjectSnapshot,
  updatedAt = new Date().toISOString(),
): ProjectSyncMutationRequest {
  return {
    projectId,
    updatePayload: {
      ...buildProjectMutationPayload(snapshot),
      updated_at: updatedAt,
    },
    tasksRpc: buildProjectTasksRpcRequest(projectId, snapshot.tasks || []),
    expectedTaskCount: (snapshot.tasks || []).length,
  };
}

export function buildProjectCreateMutationRequest(
  snapshot: ProjectSnapshot,
  ownerId: string,
): ProjectCreateMutationRequest {
  const expectedTaskCount = (snapshot.tasks || []).length;
  return {
    insertPayload: buildProjectInsertPayload(snapshot, ownerId),
    tasksRpc: expectedTaskCount > 0 ? buildProjectTasksRpcRequest("__PROJECT_ID__", snapshot.tasks || []) : null,
    expectedTaskCount,
  };
}

export function bindProjectCreateTasksRpcRequest(
  request: ProjectCreateMutationRequest,
  projectId: string,
): ProjectTasksRpcRequest | null {
  if (!request.tasksRpc) return null;
  return {
    ...request.tasksRpc,
    p_project_id: projectId,
  };
}

export function buildProjectDeleteRequest(projectId: string): ProjectDeleteRequest {
  return { projectId };
}
