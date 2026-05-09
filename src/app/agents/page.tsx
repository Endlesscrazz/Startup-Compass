import { redirect } from "next/navigation";

/** Legacy “AI Agents” dashboard removed from primary UX — use Briefs & Alerts. */
export default function AgentsRedirectPage() {
  redirect("/briefs-alerts");
}
