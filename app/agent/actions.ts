"use server";

import { redirect } from "next/navigation";
import { clearAgentSession } from "@/lib/agent";

export async function agentLogoutAction() {
  clearAgentSession();
  redirect("/compte?mode=identifiant");
}
