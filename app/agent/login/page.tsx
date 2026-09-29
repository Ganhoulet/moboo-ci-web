import { redirect } from "next/navigation";
import { getAgent } from "@/lib/agent";

export const dynamic = "force-dynamic";

/** Ancienne page de connexion agent : la connexion est unifiée sur /compte. */
export default function AgentLoginPage() {
  redirect(getAgent() ? "/agent" : "/compte?mode=identifiant");
}
