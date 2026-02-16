export type Workspace = {
  id: string;
  name: string;
  client: string;
  driveRootStatus: "connected" | "not_connected";
};

export type Project = {
  id: string;
  workspaceId: string;
  name: string;
  updatedAt: string;
};

export type Deliverable = {
  id: string;
  workspaceId?: string;
  projectId: string;
  title: string;
  type: "Reel" | "Long-form" | "Film";
  duration: string;
  stage: "Review Queue" | "In Production" | "Ready to Publish";
  approvalsNeeded: boolean;
};

export type StudioDataSource = "seed" | "supabase";
