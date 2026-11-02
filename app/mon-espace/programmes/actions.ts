"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

export async function setProgramLeadStatusAction(id: string, status: string) {
  const { ok } = await authedFetch(`/site/me/programs/leads/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
  revalidatePath("/mon-espace/programmes");
  return { ok };
}
