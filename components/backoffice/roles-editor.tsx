"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRoleAction, deleteRoleAction, updateRoleAction, type PermissionDef, type RoleRow } from "@/app/admin/backoffice-actions";

/** Rôles (intégrés en lecture seule, personnalisés modifiables) × permissions. */
export function RolesEditor({ roles, permissions }: { roles: RoleRow[]; permissions: PermissionDef[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [edit, setEdit] = useState<{ key: string | null; name: string; description: string; permissions: string[] } | null>(null);
  const groups = useMemo(() => {
    const m = new Map<string, PermissionDef[]>();
    for (const p of permissions) m.set(p.group, [...(m.get(p.group) ?? []), p]);
    return [...m.entries()];
  }, [permissions]);

  const save = () => edit && start(async () => {
    const input = { name: edit.name, description: edit.description, permissions: edit.permissions };
    const r = edit.key ? await updateRoleAction(edit.key, input) : await createRoleAction(input);
    setMsg(r.ok ? { ok: true, text: edit.key ? "Rôle enregistré." : "Rôle créé : attribuez-le depuis « Administrateurs »." } : { ok: false, text: r.error ?? "Enregistrement impossible." });
    if (r.ok) { setEdit(null); router.refresh(); }
  });

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[48rem] text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs text-slate-500">
              <th className="sticky left-0 z-10 bg-slate-50 px-4 py-2.5 font-semibold uppercase tracking-wide">Permission</th>
              {roles.map((r) => (
                <th key={r.key} className="px-2 py-2.5 text-center align-bottom font-semibold">
                  <span className="block text-ink">{r.name}</span>
                  <span className="block font-normal">{r.members} membre(s){r.builtin ? " · intégré" : ""}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {groups.map(([g, list]) => (
              <Fragment key={g}>
                <tr className="bg-slate-50/60"><td colSpan={roles.length + 1} className="px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">{g}</td></tr>
                {list.map((p) => (
                  <tr key={p.key}>
                    <td className="sticky left-0 bg-white px-4 py-2 text-slate-700">{p.label}</td>
                    {roles.map((r) => (
                      <td key={r.key} className="px-2 py-2 text-center">
                        {r.permissions.includes(p.key) ? <span className="font-bold text-emerald-600">✓</span> : <span className="text-slate-300">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
            <tr>
              <td className="sticky left-0 bg-white px-4 py-2" />
              {roles.map((r) => (
                <td key={r.key} className="px-2 py-2 text-center">
                  <button type="button" className="text-xs font-semibold text-brand-800 hover:underline"
                    onClick={() => setEdit({ key: r.builtin ? null : r.key, name: r.builtin ? `${r.name} (copie)` : r.name, description: r.description, permissions: [...r.permissions] })}>
                    {r.builtin ? "Dupliquer" : "Modifier"}
                  </button>
                  {!r.builtin ? (
                    <button type="button" disabled={pending} className="ml-2 text-xs font-semibold text-red-600 hover:underline"
                      onClick={() => window.confirm(`Supprimer le rôle « ${r.name} » ?`) && start(async () => {
                        const x = await deleteRoleAction(r.key);
                        setMsg(x.ok ? { ok: true, text: "Rôle supprimé." } : { ok: false, text: x.error ?? "Suppression impossible." });
                        if (x.ok) router.refresh();
                      })}>Supprimer</button>
                  ) : null}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {!edit ? (
        <button type="button" className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          onClick={() => setEdit({ key: null, name: "", description: "", permissions: ["users.view"] })}>+ Nouveau rôle</button>
      ) : (
        <form className="space-y-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <p className="font-semibold text-ink">{edit.key ? "Modifier le rôle" : "Nouveau rôle"}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">Nom
              <input required value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className="input mt-1 font-normal" placeholder="Ex. Chargé de clientèle" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">Description
              <input value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} className="input mt-1 font-normal" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map(([g, list]) => (
              <fieldset key={g}>
                <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">{g}</legend>
                {list.map((p) => (
                  <label key={p.key} className="flex items-start gap-2 py-0.5 text-sm">
                    <input type="checkbox" className="mt-0.5" checked={edit.permissions.includes(p.key)}
                      onChange={(e) => setEdit({ ...edit, permissions: e.target.checked ? [...edit.permissions, p.key] : edit.permissions.filter((x) => x !== p.key) })} />
                    {p.label}
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
          <div className="flex gap-2">
            <button disabled={pending} className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">Enregistrer</button>
            <button type="button" className="rounded-md px-4 py-2 text-sm text-slate-600 hover:bg-slate-100" onClick={() => setEdit(null)}>Annuler</button>
          </div>
        </form>
      )}
      {msg ? <p className={"text-sm font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
    </div>
  );
}
