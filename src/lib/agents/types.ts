export type AgentStatus = "idle" | "queued" | "running" | "success" | "failed";

export type AgentOutputType =
  | "match"
  | "briefing"
  | "plan"
  | "campaign"
  | "score"
  | "notification"
  | "alert";

export type AgentOutput = {
  type: AgentOutputType;
  title: string;
  subtitle?: string;
  body: string;
  score?: number;
  metadata?: Record<string, unknown>;
  actionLabel?: string;
  actionUrl?: string;
};

export type AgentRunResult = {
  success: boolean;
  agentName: string;
  outputCount: number;
  summary: string;
  outputs: AgentOutput[];
  errors?: string[];
  durationMs: number;
  demo: boolean;
};

export type AgentContext = {
  userId?: string;
  mode: "demo" | "production";
  dryRun?: boolean;
  personaId?: string;
};

export interface Agent {
  name: string;
  description: string;
  icon: string;
  run(context: AgentContext): Promise<AgentRunResult>;
}

export type AgentRunLog = {
  id: string;
  agentName: string;
  status: AgentStatus;
  inputCount: number;
  outputCount: number;
  summary: string;
  startedAt: string;
  finishedAt?: string;
  error?: string;
  demo: boolean;
};

export type SavedSearch = {
  id: string;
  userId?: string;
  name: string;
  audienceType: string;
  criteria: Record<string, unknown>;
  frequency: "daily" | "weekly";
  lastCheckedAt?: string;
  enabled: boolean;
  createdAt: string;
};

export type NotificationItem = {
  id: string;
  userId?: string;
  type: string;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  readAt?: string;
  createdAt: string;
};

export type FounderPersona = {
  id: string;
  name: string;
  stage: string;
  location: string;
  profile: string;
};
