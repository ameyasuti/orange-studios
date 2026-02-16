"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { studioSeed } from "./seed";
import { Deliverable, Project, StudioDataSource, Workspace } from "./types";

const initialState = {
  workspaces: studioSeed.workspaces,
  projects: studioSeed.projects,
  deliverables: studioSeed.deliverables,
  loading: true,
  source: "seed" as StudioDataSource,
  error: undefined as string | undefined,
};

export function useStudioData() {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [workspaceResult, projectResult, deliverableResult] = await Promise.all([
          supabase.from("workspaces").select("id,name,drive_client_folder_id,created_at").order("created_at", { ascending: true }).limit(50),
          supabase.from("projects").select("id,name,workspace_id,updated_at,created_at").order("updated_at", { ascending: false }).limit(50),
          supabase
            .from("deliverables")
            .select("id,name,project_id,workspace_id,type,duration_target_sec,status,created_at")
            .order("created_at", { ascending: false })
            .limit(100),
        ]);

        const errors = [workspaceResult.error, projectResult.error, deliverableResult.error].filter(Boolean);
        if (errors.length) {
          throw errors[0];
        }

        const workspaceRows = workspaceResult.data ?? [];
        const projectRows = projectResult.data ?? [];
        const deliverableRows = deliverableResult.data ?? [];

        const mappedWorkspaces: Workspace[] = workspaceRows.map((w) => ({
          id: w.id,
          name: w.name ?? "Untitled",
          client: w.name ?? "Untitled",
          driveRootStatus: w.drive_client_folder_id ? "connected" : "not_connected",
        }));

        const mappedProjects: Project[] = projectRows.map((p) => ({
          id: p.id,
          workspaceId: p.workspace_id,
          name: p.name ?? "Untitled project",
          updatedAt: formatRelativeDate(p.updated_at ?? p.created_at),
        }));

        const mappedDeliverables: Deliverable[] = deliverableRows.map((d) => ({
          id: d.id,
          workspaceId: d.workspace_id ?? undefined,
          projectId: d.project_id,
          title: d.name ?? "Untitled deliverable",
          type: mapDeliverableType(d.type),
          duration: d.duration_target_sec ? `${d.duration_target_sec}s` : "—",
          stage: mapStage(d.status),
          approvalsNeeded: true,
        }));

        if (!cancelled) {
          if (!mappedWorkspaces.length || !mappedProjects.length) {
            setState((prev) => ({ ...prev, loading: false, source: "seed", error: "Supabase has no studios yet; showing stub data." }));
            return;
          }

          setState({
            workspaces: mappedWorkspaces,
            projects: mappedProjects,
            deliverables: mappedDeliverables,
            loading: false,
            source: "supabase",
            error: undefined,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            loading: false,
            source: "seed",
            error: err instanceof Error ? err.message : "Failed to reach Supabase",
          }));
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

function formatRelativeDate(input?: string | null) {
  if (!input) return "—";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function mapDeliverableType(type?: string | null): Deliverable["type"] {
  if (type === "Long-form") return "Long-form";
  if (type === "Film") return "Film";
  return "Reel";
}

function mapStage(status?: string | null): Deliverable["stage"] {
  const normalized = (status ?? "").toUpperCase();
  if (normalized.includes("READY")) return "Ready to Publish";
  if (normalized.includes("PRODUCTION") || normalized.includes("ACTIVE")) return "In Production";
  return "Review Queue";
}
