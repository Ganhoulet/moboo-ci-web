"use client";

import { useTransition } from "react";
import { contactHandledAction } from "@/app/admin/application/actions";

export function ContactHandled({ id, handled }: { id: string; handled: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => start(async () => { await contactHandledAction(id, !handled); })}
      className={"rounded-full px-2.5 py-1 text-xs font-semibold " + (handled ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700 hover:bg-slate-200")}>
      {handled ? "✓ Traité" : "Marquer traité"}
    </button>
  );
}
