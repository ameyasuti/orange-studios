"use client";

import { useMemo, useState } from "react";
import styles from "./orange.module.css";

type Workspace = {
  id: string;
  name: string;
  client: string;
  driveRootStatus: "connected" | "not_connected";
};

type Project = {
  id: string;
  workspaceId: string;
  name: string;
  updatedAt: string;
};

type Deliverable = {
  id: string;
  projectId: string;
  title: string;
  type: "Reel" | "Long-form" | "Film";
  duration: string;
  stage: "Review Queue" | "In Production" | "Ready to Publish";
  approvalsNeeded: boolean;
};

const seed = {
  workspaces: [
    { id: "ws_ov", name: "Orange Videos", client: "Orange", driveRootStatus: "not_connected" },
    { id: "ws_acme", name: "ACME Beverages", client: "ACME", driveRootStatus: "connected" },
  ] satisfies Workspace[],
  projects: [
    { id: "p1", workspaceId: "ws_ov", name: "Feb Reels Sprint", updatedAt: "Today" },
    { id: "p2", workspaceId: "ws_ov", name: "Brand Film — Concept", updatedAt: "Yesterday" },
    { id: "p3", workspaceId: "ws_acme", name: "Launch Campaign", updatedAt: "Today" },
  ] satisfies Project[],
  deliverables: [
    {
      id: "d1",
      projectId: "p1",
      title: "Reel 01 — Hook Variants",
      type: "Reel",
      duration: "15s",
      stage: "Review Queue",
      approvalsNeeded: true,
    },
    {
      id: "d2",
      projectId: "p1",
      title: "Reel 02 — Founder Story",
      type: "Reel",
      duration: "30s",
      stage: "In Production",
      approvalsNeeded: false,
    },
    {
      id: "d3",
      projectId: "p1",
      title: "Reel 03 — Offer + CTA",
      type: "Reel",
      duration: "20s",
      stage: "Ready to Publish",
      approvalsNeeded: true,
    },
    {
      id: "d4",
      projectId: "p3",
      title: "Launch Teaser — V1",
      type: "Reel",
      duration: "15s",
      stage: "Review Queue",
      approvalsNeeded: true,
    },
  ] satisfies Deliverable[],
};

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
  const [workspaceId, setWorkspaceId] = useState(seed.workspaces[0]?.id ?? "");
  const projects = useMemo(() => seed.projects.filter((p) => p.workspaceId === workspaceId), [workspaceId]);
  const [projectId, setProjectId] = useState(() => {
    const initialWs = seed.workspaces[0]?.id;
    const firstProject = seed.projects.find((p) => p.workspaceId === initialWs);
    return firstProject?.id ?? "";
  });

  const deliverables = useMemo(() => seed.deliverables.filter((d) => d.projectId === projectId), [projectId]);
  const byStage = useMemo(() => countByStage(deliverables), [deliverables]);

  const ws = seed.workspaces.find((w) => w.id === workspaceId);
  const prj = seed.projects.find((p) => p.id === projectId);

  const stages: Deliverable["stage"][] = ["Review Queue", "In Production", "Ready to Publish"];

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <div className={styles.brand}>
            <div>Orange Studios</div>
            <div className={styles.badge}>MVP shell (stub data)</div>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statLabel}>Workspace</div>
              <div className={styles.statValue}>{ws?.name ?? "—"}</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statLabel}>Project</div>
              <div className={styles.statValue}>{prj?.name ?? "—"}</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statLabel}>Review queue</div>
              <div className={styles.statValue}>{byStage["Review Queue"] ?? 0}</div>
            </div>
          </div>
        </header>

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
                value={workspaceId}
                onChange={(e) => {
                  const nextWs = e.target.value;
                  setWorkspaceId(nextWs);
                  const firstProject = seed.projects.find((p) => p.workspaceId === nextWs);
                  setProjectId(firstProject?.id ?? "");
                }}
              >
                {seed.workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>

              <div className={styles.list}>
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className={[styles.item, p.id === projectId ? styles.itemActive : ""].join(" ")}
                    onClick={() => setProjectId(p.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className={styles.itemTitle}>{p.name}</div>
                    <div className={styles.itemMeta}>Updated: {p.updatedAt}</div>
                  </div>
                ))}
                {!projects.length && <div className={styles.small}>No projects yet for this workspace.</div>}
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
                const items = deliverables.filter((d) => d.stage === stage);
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
                    {!items.length && <div className={styles.small} style={{ padding: 10 }}>
                      Nothing here yet.
                    </div>}
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
                <span>{deliverables.length}</span>
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
