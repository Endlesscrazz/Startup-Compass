import { getCommandCenterAgents } from "@/lib/agents/commandCenterAgents";
import {
  finalizeAgentRun,
  getAgentResult,
  getAgentStatuses,
  listUnreadNotifications,
  markNotificationRead,
  setAgentRunning,
  getDashboardStats,
} from "@/lib/agents/agentState";
import type { AgentContext } from "@/lib/agents/types";

const agents = getCommandCenterAgents();

export function listAgentDefinitions() {
  return agents.map((a) => ({
    name: a.name,
    description: a.description,
    icon: a.icon,
  }));
}

export function getStatuses() {
  return getAgentStatuses(agents.map((a) => a.name));
}

export function getResult(name: string) {
  return getAgentResult(name);
}

export function getStats(userId?: string) {
  return getDashboardStats(userId);
}

export async function runSingleAgent(name: string, context: AgentContext) {
  const agent = agents.find((a) => a.name === name);
  if (!agent) throw new Error(`Unknown agent: ${name}`);

  const run = setAgentRunning(name);
  try {
    const result = await agent.run(context);
    finalizeAgentRun(run.id, result);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown failure";
    const failedResult = {
      success: false,
      agentName: name,
      outputCount: 0,
      summary: "Agent failed — check server logs.",
      outputs: [],
      errors: [message],
      durationMs: 0,
      demo: true,
    };
    finalizeAgentRun(run.id, failedResult, message);
    return failedResult;
  }
}

export async function runAllAgents(context: AgentContext) {
  const results = await Promise.all(agents.map((a) => runSingleAgent(a.name, context)));
  const successCount = results.filter((r) => r.success).length;
  const totalOutputs = results.reduce((acc, r) => acc + r.outputCount, 0);
  return {
    success: successCount === results.length,
    partial: successCount > 0 && successCount < results.length,
    totalOutputs,
    results,
    demo: results.some((r) => r.demo),
  };
}

export function getNotifications() {
  return listUnreadNotifications();
}

export function readNotification(id: string) {
  return markNotificationRead(id);
}
