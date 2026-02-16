import { Deliverable, Project, Workspace } from "./types";

export const studioSeed = {
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
