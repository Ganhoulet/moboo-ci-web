"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { leadSetStatus } from "@/app/admin/services/actions";

export function LeadStatusButton({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const next = status === "new" ? "handled" : "new";
  return (
    <button type="button" disabled={pending} onClick={() => start(async () => { await leadSetStatus(id, next); router.refresh(); })}
      className={"rounded-md px-2 py-1 text-xs font-semibold ring-1 disabled:opacity-50 " + (status === "new" ? "bg-ink text-white ring-ink" : "ring-slate-300")}>
      {status === "new" ? "Marquer traitée" : "Remettre à traiter"}
    </button>
  );
}
