import assert from "node:assert/strict";

import type {
  AccessibleProjectRow,
  ActivityLogRow,
  ProjectRow,
  ProjectShareRow,
  TaskRow,
} from "../src/services/supabase/contracts";
import {
  mapAccessibleProjectToSnapshotShell,
  mapActivityLogRow,
  mapProjectRowToSnapshot,
  mapProjectShareRow,
  mapTaskRowToTask,
} from "../src/services/supabase/mappers";
import {
  analyzeBufferedProjects,
  mergeAccessibleProjectsIntoLocalMap,
} from "../src/services/supabase/project-list";
import {
  buildProjectInsertPayload,
  buildProjectMutationPayload,
  buildUpsertTasksPayload,
} from "../src/services/supabase/payloads";

const accessibleRow: AccessibleProjectRow = {
  project_id: "project-1",
  name: "Shared Project",
  sm: 5,
  sy: 2026,
  nm: 12,
  is_archived: false,
  updated_at: "2026-05-19T10:00:00.000Z",
  role: "editor",
  source: "shared",
  owner_id: "owner-1",
  owner_name: "Owner Name",
  owner_email: "owner@example.com",
  invited_by: "manager-1",
  invited_by_name: "Manager Name",
  invited_by_email: "manager@example.com",
};

const taskRow: TaskRow = {
  id: "task-1",
  n: 7,
  order: 0,
  name: "Concrete works",
  cat: 2,
  ms: 1,
  ws: 1,
  me: 3,
  we: 3,
  prog: 75,
  budget: "1250.5",
  spent: 800,
  deps: [{ id: "task-0", type: "FS" }],
  phases: [{ name: "Phase A", ms: 1, me: 2 }],
  cost_items: [{ name: "Cement", budget: 500 }],
  notes: [{ text: "Important" }],
};

const projectRow: ProjectRow = {
  id: "project-1",
  owner_id: "owner-1",
  name: "Shared Project",
  sm: 5,
  sy: 2026,
  nm: 12,
  cats: [{ name: "General", color: "#2563eb" }],
  next_n: 11,
  baseline: { saved: true },
  baseline_date: "2026-05-01",
};

const shareRow: ProjectShareRow = {
  id: "share-1",
  role: "manager",
  user_id: "user-2",
  user_name: "Shared User",
  user_email: "user2@example.com",
  invited_by: "owner-1",
  invited_by_name: "Owner Name",
  invited_by_email: "owner@example.com",
  created_at: "2026-05-19T10:15:00.000Z",
};

const activityRow: ActivityLogRow = {
  id: "activity-1",
  project_id: "project-1",
  actor_id: "owner-1",
  actor_name: "Owner Name",
  actor_email: "owner@example.com",
  event_type: "task.updated",
  entity_type: "task",
  entity_id: "task-1",
  payload: { field: "name" },
  created_at: "2026-05-19T10:30:00.000Z",
};

const shell = mapAccessibleProjectToSnapshotShell(accessibleRow, {
  localVersion: 3,
  serverVersion: 2,
});
assert.equal(shell._serverId, "project-1");
assert.equal(shell._role, "editor");
assert.equal(shell._access?.ownerEmail, "owner@example.com");

const mappedTask = mapTaskRowToTask(taskRow);
assert.equal(mappedTask.budget, 1250.5);
assert.equal(mappedTask.spent, 800);
assert.equal(mappedTask.costItems?.[0]?.name, "Cement");

const snapshot = mapProjectRowToSnapshot(projectRow, [taskRow], "manager", {
  _access: shell._access,
  _localVersion: 4,
  _serverVersion: 4,
});
assert.equal(snapshot.proj.name, "Shared Project");
assert.equal(snapshot.tasks.length, 1);
assert.equal(snapshot._role, "manager");
assert.equal(snapshot._access?.invitedByEmail, "manager@example.com");

const taskPayload = buildUpsertTasksPayload(snapshot.tasks);
assert.equal(taskPayload.length, 1);
assert.equal(taskPayload[0]?.order, 0);
assert.equal(taskPayload[0]?.budget, 1250.5);

const projectMutation = buildProjectMutationPayload(snapshot);
assert.equal(projectMutation.next_n, 11);
assert.equal(projectMutation.name, "Shared Project");

const projectInsert = buildProjectInsertPayload(snapshot, "owner-1");
assert.equal(projectInsert.owner_id, "owner-1");

const shareView = mapProjectShareRow(shareRow);
assert.equal(shareView.role, "manager");
assert.equal(shareView.user.email, "user2@example.com");

const auditEntry = mapActivityLogRow(activityRow);
assert.equal(auditEntry.eventType, "task.updated");
assert.equal(auditEntry.payload.field, "name");

const buffered = {
  localOnly: {
    proj: { name: "Offline", sm: 1, sy: 2026, nm: 12 },
    cats: [],
    tasks: [],
    nextN: 1,
  },
  synced: {
    ...shell,
    _serverId: "project-1",
  },
};

const analysis = analyzeBufferedProjects(buffered, "user-1", "user-1");
assert.ok(analysis.offlineNew.localOnly);
assert.ok(analysis.localSynced.synced);

const merged = mergeAccessibleProjectsIntoLocalMap(analysis.offlineNew, [accessibleRow]);
assert.ok(merged.localOnly);
assert.ok(merged["project-1"]);
assert.equal(merged["project-1"]?._role, "editor");

console.log("Supabase helper verification passed.");
