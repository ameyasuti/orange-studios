"use client";

import { useMemo, useState } from "react";
import styles from "./orange.module.css";
import { Deliverable } from "../lib/studio/types";
import { useStudioData } from "../lib/studio/useStudioData";

const stages: Deliverable["stage"][] = ["Review Queue", "In Production", "Ready to Publish"];

function countByStage(items: Deliverable[]) {
  return items.reduce(
    (acc, d) => {
      acc[d.stage] = (acc[d.stage] ?? 0) + 1;
      return acc;
    },
    {} as Record<Deliverable["stage"], number>
  );
}

export default function Home() {
  const { workspaces, projects, deliverables, source, loading, error } = useStudioData();

  const [workspaceId, setWorkspaceId] = useState<string | undefined>();
  const [projectId, setProjectId] = useState<string | undefined>();

  const resolvedWorkspaceId = useMemo(() => {
    if (workspaceId && workspaces.some((w) => w.id === workspaceId)) {
      return workspaceId;
    }
    return workspaces[0]?.id;
  }, [workspaceId, workspaces]);

  const workspaceProjects = useMemo(() => projects.filter((p) => p.workspaceId === resolvedWorkspaceId), [projects, resolvedWorkspaceId]);

  const resolvedProjectId = useMemo(() => {
    if (projectId && workspaceProjects.some((p) => p.id === projectId)) {
      return projectId;
    }
    return workspaceProjects[0]?.id;
  }, [projectId, workspaceProjects]);

  const projectDeliverables = useMemo(
    () => deliverables.filter((d) => d.projectId === resolvedProjectId),
    [deliverables, resolvedProjectId]
  );
  const byStage = useMemo(() => countByStage(projectDeliverables), [projectDeliverables]);

  const ws = workspaces.find((w) => w.id === resolvedWorkspaceId);
  const prj = projects.find((p) => p.id === resolvedProjectId);

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <div className={styles.brand}>
            <div>Orange Studios</div>
            <div className={styles.badge}>{source === "supabase" ? "Live Supabase" : "MVP shell (stub data)"}</div>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statLabel}>Workspace</div>
              <div className={styles.statValue}>{loading ? "…" : ws?.name ?? "—"}</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statLabel}>Project</div>
              <div className={styles.statValue}>{loading ? "…" : prj?.name ?? "—"}</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statLabel}>Review queue</div>
              <div className={styles.statValue}>{loading ? "…" : byStage["Review Queue"] ?? 0}</div>
            </div>
          </div>
        </header>

        {error && (
          <div className={styles.small} style={{ color: "#f97316", margin: "4px 24px" }}>
            {error}
          </div>
        )}

        <main className={styles.main}>
          {/* LEFT: Workspaces + Projects */}
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <div className={styles.panelTitle}>Workspaces</div>
                <div className={styles.panelSub}>Client/brand containers</div>
              </div>
              <div className={styles.badge}>Producer/Operator/Reviewer</div>
            </div>
            <div className={styles.panelBody}>
              <select
                className={styles.select}
                value={resolvedWorkspaceId ?? ""}
                onChange={(e) => {
                  const nextWs = e.target.value;
                  setWorkspaceId(nextWs);
                  const firstProject = projects.find((p) => p.workspaceId === nextWs);
                  setProjectId(firstProject?.id);
                }}
                disabled={!workspaces.length}
              >
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>

              <div className={styles.list}>
                {workspaceProjects.map((p) => (
                  <div
                    key={p.id}
                    className={[styles.item, p.id === resolvedProjectId ? styles.itemActive : ""].join(" ")}
                    onClick={() => setProjectId(p.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className={styles.itemTitle}>{p.name}</div>
                    <div className={styles.itemMeta}>Updated: {p.updatedAt}</div>
                  </div>
                ))}
                {!workspaceProjects.length && <div className={styles.small}>No projects yet for this workspace.</div>}
              </div>

              <div className={styles.kpi}>
                <div className={styles.inspectorRow}>
                  <span>Drive root</span>
                  <span>{ws?.driveRootStatus === "connected" ? "Connected" : "Not connected"}</span>
                </div>
                <div className={styles.small}>
                  Drive is the primary storage. We’ll create a folder per workspace + project + deliverable and store metadata in Supabase.
                </div>
              </div>
            </div>
          </section>

          {/* CENTER: Deliverables board */}
          <section className={styles.panel}>
            <div className={styles.centerHeader}>
              <div>
                <div className={styles.h1}>Deliverables</div>
                <div className={styles.panelSub}>Board view (Frame.io-style review-first)</div>
              </div>
              <div className={styles.tabs}>
                <button className={[styles.tab, styles.tabActive].join(" ")}>Board</button>
                <button className={styles.tab} disabled title="Coming next">
                  Review Queue
                </button>
                <button className={styles.tab} disabled title="Coming next">
                  Timeline
                </button>
              </div>
            </div>

            <div className={styles.columns}>
              {stages.map((stage) => {
                const items = projectDeliverables.filter((d) => d.stage === stage);
                return (
                  <div key={stage} className={styles.col}>
                    <div className={styles.colHead}>
                      <div className={styles.colTitle}>{stage}</div>
                      <div className={styles.colCount}>{items.length}</div>
                    </div>
                    {items.map((d) => (
                      <div key={d.id} className={styles.card}>
                        <div className={styles.cardTitle}>{d.title}</div>
                        <div className={styles.cardMeta}>
                          <span className={styles.tag}>{d.type}</span>
                          <span className={styles.tag}>{d.duration}</span>
                          {d.approvalsNeeded ? <span className={styles.tag}>Needs review</span> : <span className={styles.tag}>No gate</span>}
                        </div>
                      </div>
                    ))}
                    {!items.length && (
                      <div className={styles.small} style={{ padding: 10 }}>
                        Nothing here yet.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* RIGHT: Inspector (stub) */}
          <aside className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <div className={styles.panelTitle}>Inspector</div>
                <div className={styles.panelSub}>Selected object details</div>
              </div>
              <div className={styles.badge}>stub</div>
            </div>
            <div className={styles.panelBody}>
              <div className={styles.inspectorRow}>
                <span>Workspace</span>
                <span>{ws?.name ?? "—"}</span>
              </div>
              <div className={styles.inspectorRow}>
                <span>Project</span>
                <span>{prj?.name ?? "—"}</span>
              </div>
              <div className={styles.inspectorRow}>
                <span>Deliverables</span>
                <span>{projectDeliverables.length}</span>
              </div>

              <div className={styles.kpi}>
                <div className={styles.panelTitle} style={{ marginBottom: 6 }}>
                  What’s next
                </div>
                <ul className={styles.small} style={{ margin: 0, paddingLeft: 16 }}>
                  <li>Replace stub data with Supabase-backed CRUD (workspaces/projects/deliverables)</li>
                  <li>Add auth + role gating (Producer / Operator / Reviewer)</li>
                  <li>Drive integration stub: connect + folder mapping per workspace/project/deliverable</li>
                </ul>
              </div>

              <div className={styles.small} style={{ marginTop: 10 }}>
                Note: This is a UI shell commit to unblock momentum; no persistence yet.
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
