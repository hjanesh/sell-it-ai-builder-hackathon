import "server-only";
import { logAgentRun } from "./store";

// AgenticOrg by Pine Labs: our "team" of agents runs there; we call them by UUID and log every run
// (timestamped) for proof of life. Status "hitl_triggered" means a human must approve in AgenticOrg's UI.

const BASE = process.env.AGENTICORG_BASE_URL ?? "https://agenticorg.hackathon.pinelabs.com";

export type AgentStatus = "completed" | "failed" | "hitl_triggered" | "budget_exceeded";
export type AgentResult = { status: AgentStatus | "error"; confidence: number | null; output: unknown; raw: unknown };

export const agenticOrgEnabled = () => Boolean(process.env.PINELABS_AGENTIC_ORG_KEY);

/** Runs one AgenticOrg agent and logs the run. Never throws: failures come back as status "error". */
export async function runAgent(
  agent: { name: string; id: string | undefined },
  inputs: Record<string, unknown>,
  listingSlug: string | null = null,
): Promise<AgentResult> {
  const key = process.env.PINELABS_AGENTIC_ORG_KEY;
  let result: AgentResult;
  if (!key || !agent.id) {
    result = { status: "error", confidence: null, output: "AgenticOrg key or agent id not configured", raw: null };
  } else {
    try {
      const res = await fetch(`${BASE}/api/v1/agents/${agent.id}/run`, {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({ action: "process", inputs, context: {} }),
        signal: AbortSignal.timeout(110_000),
      });
      const json = await res.json().catch(() => ({}));
      result = res.ok
        ? { status: json.status, confidence: json.confidence ?? null, output: json.output ?? null, raw: json }
        : { status: "error", confidence: null, output: json?.error?.message ?? `HTTP ${res.status}`, raw: json };
    } catch (e) {
      result = { status: "error", confidence: null, output: (e as Error).message, raw: null };
    }
  }
  await logAgentRun({ agent: agent.name, agent_id: agent.id ?? null, listing_slug: listingSlug, inputs, ...result }).catch((e) =>
    console.error("agent log failed", e),
  );
  return result;
}
