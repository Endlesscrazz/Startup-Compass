import { NextResponse } from "next/server";
import { getStatuses, listAgentDefinitions } from "@/lib/agents/runner";

export async function GET() {
  const definitions = listAgentDefinitions();
  const statuses = getStatuses();
  return NextResponse.json({
    success: true,
    data: {
      agents: definitions.map((agent) => ({
        ...agent,
        ...(statuses.find((s) => s.name === agent.name) ?? {}),
      })),
    },
    demo: statuses.some((s) => s.demo),
  });
}
