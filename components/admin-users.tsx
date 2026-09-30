"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { addAdminAction, removeAdminAction, resetTwoFactorAction, type AdminUser } from "@/app/admin/actions";
import { setAdminRoleAction } from "@/app/admin/backoffice-actions";

export function AdminUsers({ items, pendingPhones, roles = [] }: { items: AdminUser[]; pendingPhones: string[]; roles?: { key: string; name: string }[] }) {
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState(roles.find((r) => r.key === "moderateur")?.key ?? roles[0]?.key ?? "super_admin");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      <div className="divide-y divide-slate-100 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        {items.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <Link href={`/admin/utilisateurs/${a.id}`} className="block truncate font-semibold text-ink hover:underline">{[a.firstName, a.lastName].filter(Boolean).join(" ") || a.phone}</Link>
              <p className="truncate text-sm text-muted">{a.phone}{a.email ? ` · ${a.email}` : ""}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                {a.twoFactor?.length
                  ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">2FA : {a.twoFactor.join(" + ")}</span>
                  : <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-800">2FA non activée</span>}
                {a.twoFactor?.length ? (
                  <button type="button" disabled={pending} className="font-semibold text-slate-500 hover:text-red-600"
                    onClick={() => window.confirm("Réinitialiser la double authentification de cet administrateur ? (téléphone perdu) Il devra la reconfigurer à sa prochaine connexion.") && start(async () => {
                      const r = await resetTwoFactorAction(a.id);
                      setMsg(r.ok ? { ok: true, text: "Double authentification réinitialisée." } : { ok: false, text: r.error ?? "Impossible." });
                    })}>Réinitialiser</button>
                ) : null}
              </p>
            </div>
            {a.fixed ? (
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600" title="Défini par le serveur (SITE_ADMIN_PHONES)">Principal · {a.roleName ?? "Super administrateur"}</span>
            ) : (
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <select aria-label="Rôle" disabled={pending} defaultValue={a.role ?? ""}
                className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm"
                onChange={(e) => {
                  const v = e.target.value;
                  start(async () => {
                    const r = await setAdminRoleAction(a.id, v);
                    setMsg(r.ok ? { ok: true, text: "Rôle modifié." } : { ok: false, text: r.error ?? "Changement impossible." });
                  });
                }}>
                {roles.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
              </select>
              <button type="button" disabled={pending}
                onClick={() => window.confirm("Retirer l’accès au back-office ?") && start(async () => {
                  const r = await removeAdminAction(a.id);
                  setMsg(r.ok ? { ok: true, text: "Accès retiré." } : { ok: false, text: r.error ?? "Retrait impossible." });
                })}
                className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50">Retirer</button>
              </div>
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
            const r = await addAdminAction(phone, role);
            setMsg(r.ok ? { ok: true, text: "Administrateur ajouté." } : { ok: false, text: r.error ?? "Ajout impossible." });
            if (r.ok) setPhone("");
          });
        }}>
        <p className="font-semibold text-ink">Ajouter un administrateur</p>
        <p className="mt-0.5 text-sm text-muted">La personne doit s’être connectée au moins une fois au site avec ce numéro.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input className="input max-w-xs flex-1" type="tel" inputMode="tel" placeholder="07 07 12 34 56" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          {roles.length ? (
            <select aria-label="Rôle du nouvel administrateur" className="input w-auto" value={role} onChange={(e) => setRole(e.target.value)}>
              {roles.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
            </select>
          ) : null}
          <button type="submit" disabled={pending} className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">Ajouter</button>
        </div>
        {msg ? <p className={"mt-2 text-sm font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
      </form>
    </div>
  );
}
