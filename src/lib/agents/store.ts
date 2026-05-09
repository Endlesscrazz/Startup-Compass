/**
 * Re-exports from agentState for backward compatibility.
 * All state now lives in agentState.ts.
 */
export {
  getSavedSearches,
  createSavedSearch,
  addNotification,
  listUnreadNotifications,
  markNotificationRead,
  setAgentRunning,
  finalizeAgentRun,
  getAgentStatuses,
  getAgentResult,
} from "@/lib/agents/agentState";
