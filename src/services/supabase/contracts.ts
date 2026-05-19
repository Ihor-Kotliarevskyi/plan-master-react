import type { AuditEventType, ProjectRole, TaskCostItem, TaskPhase } from "../../domain/types";

export interface ProjectRow {
  id: string;
  owner_id: string;
  name: string;
  sm: number;
  sy: number;
  nm: number;
  cats: unknown[] | null;
  next_n: number | null;
  baseline: unknown;
  baseline_date: string | null;
  is_archived?: boolean;
  updated_at?: string;
}

export interface TaskRow {
  id: string;
  n: number;
  order: number;
  name: string;
  cat: number;
  ms: number;
  ws: number;
  me: number;
  we: number;
  prog: number;
  budget: number | string | null;
  spent: number | string | null;
  deps: unknown[] | null;
  phases: TaskPhase[] | null;
  cost_items: TaskCostItem[] | null;
  notes: unknown[] | null;
}

export interface AccessibleProjectRow {
  project_id: string;
  name: string;
  sm: number;
  sy: number;
  nm: number;
  is_archived: boolean;
  updated_at: string;
  role: ProjectRole;
  source: "own" | "shared";
  owner_id: string | null;
  owner_name: string | null;
  owner_email: string | null;
  invited_by: string | null;
  invited_by_name: string | null;
  invited_by_email: string | null;
}

export interface ProjectShareRow {
  id: string;
  role: ProjectRole;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  invited_by: string | null;
  invited_by_name: string | null;
  invited_by_email: string | null;
  created_at: string;
}

export interface ActivityLogRow {
  id: string;
  project_id: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  event_type: AuditEventType;
  entity_type: "task" | "project" | "share";
  entity_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}
