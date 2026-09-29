"use client";

import { useState, useTransition } from "react";
import { addAdminAction, removeAdminAction, type AdminUser } from "@/app/admin/actions";

export function AdminUsers({ items, pendingPhones }: { items: AdminUser[]; pendingPhones: string[] }) {
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      <div className="divide-y divide-slate-100 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        {items.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{[a.firstName, a.lastName].filter(Boolean).join(" ") || a.phone}</p>
              <p className="truncate text-sm text-muted">{a.phone}{a.email ? ` · ${a.email}` : ""}</p>
            </div>
            {a.fixed ? (
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600" title="Défini par le serveur (SITE_ADMIN_PHONES)">Principal</span>
            ) : (
              <button type="button" disabled={pending}
                onClick={() => window.confirm("Retirer l’accès au back-office ?") && start(async () => {
                  const r = await removeAdminAction(a.id);
                  setMsg(r.ok ? { ok: true, text: "Accès retiré." } : { ok: false, text: r.error ?? "Retrait impossible." });
                })}
                className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50">Retirer</button>
            )}
          </div>
        ))}
        {pendingPhones.map((p) => (
          <div key={p} className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-muted">
            <span>{p} — pas encore connecté au site</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">Principal</span>
          </div>
        ))}
      </div>

      <form className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await addAdminAction(phone);
            setMsg(r.ok ? { ok: true, text: "Administrateur ajouté." } : { ok: false, text: r.error ?? "Ajout impossible." });
            if (r.ok) setPhone("");
          });
        }}>
        <p className="font-semibold text-ink">Ajouter un administrateur</p>
        <p className="mt-0.5 text-sm text-muted">La personne doit s’être connectée au moins une fois au site avec ce numéro.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input className="input max-w-xs flex-1" type="tel" inputMode="tel" placeholder="07 07 12 34 56" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <button type="submit" disabled={pending} className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">Ajouter</button>
        </div>
        {msg ? <p className={"mt-2 text-sm font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
      </form>
    </div>
  );
}
