"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { addMember, removeMember, reorderTeam, updateMember } from "@/app/mon-espace/equipe/actions";
import { uploadImageAction } from "@/app/mon-espace/actions";

interface Member { id: string; linked: boolean; username: string | null; role: string; name: string; phone: string; email: string; photoUrl: string; verified: boolean }

const input = "w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-ink focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink";
const ROLES = ["Agent immobilier", "Agent commercial", "Directeur d’agence", "Négociateur", "Gestionnaire locatif", "Assistant(e)"];

async function square(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const im = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const side = Math.min(im.width, im.height);
    const c = document.createElement("canvas"); c.width = c.height = Math.min(480, side);
    c.getContext("2d")!.drawImage(im, (im.width - side) / 2, (im.height - side) / 2, side, side, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  } finally { URL.revokeObjectURL(url); }
}

function Avatar({ m, size = "h-14 w-14" }: { m: { name: string; photoUrl: string }; size?: string }) {
  return m.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={m.photoUrl} alt="" className={size + " shrink-0 rounded-full object-cover"} />
  ) : <span className={size + " grid shrink-0 place-items-center rounded-full bg-brand-100 font-display text-lg font-bold text-brand-800"}>{(m.name || "?").charAt(0).toUpperCase()}</span>;
}

/** Gestion de l'équipe d'une agence (ajout par numéro, membres sans compte, rôles, ordre). */
export function TeamManager({ initial }: { initial: Member[] }) {
  const [members, setMembers] = useState<Member[]>(initial);
  const [mode, setMode] = useState<"account" | "free">("account");
  const [f, setF] = useState({ ref: "", role: ROLES[0], name: "", phone: "", email: "", photoUrl: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const photo = useRef<HTMLInputElement>(null);

  const apply = (r: { ok: boolean; data?: any; error?: string }, text: string) => {
    if (r.ok) setMembers(r.data.members);
    setMsg(r.ok ? { ok: true, text } : { ok: false, text: r.error ?? "Erreur" });
  };
  const add = () => start(async () => {
    const r = await addMember(mode === "account" ? { ref: f.ref, role: f.role } : { name: f.name, role: f.role, phone: f.phone, email: f.email, photoUrl: f.photoUrl });
    apply(r, "Membre ajouté : il apparaît sur votre page.");
    if (r.ok) setF({ ref: "", role: ROLES[0], name: "", phone: "", email: "", photoUrl: "" });
  });
  const move = (i: number, d: -1 | 1) => start(async () => {
    const ids = members.map((m) => m.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    apply(await reorderTeam(ids), "Ordre enregistré.");
  });

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
        <h2 className="font-display text-lg font-bold text-ink">Ajouter un membre</h2>
        <div className="mt-3 inline-flex rounded-full bg-slate-100 p-1 text-sm font-semibold">
          <button type="button" onClick={() => setMode("account")} className={"rounded-full px-4 py-1.5 " + (mode === "account" ? "bg-white text-ink shadow" : "text-muted")}>Agent avec un compte Moboo</button>
          <button type="button" onClick={() => setMode("free")} className={"rounded-full px-4 py-1.5 " + (mode === "free" ? "bg-white text-ink shadow" : "text-muted")}>Sans compte</button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {mode === "account" ? (
            <label className="text-sm sm:col-span-2"><span className="font-semibold text-ink">Numéro de téléphone ou identifiant de l’agent</span>
              <input className={input + " mt-1"} value={f.ref} placeholder="+225 07 00 00 00 00 ou awa.traore" onChange={(e) => setF({ ...f, ref: e.target.value })} />
              <span className="mt-1 block text-xs text-muted">L’agent doit avoir un compte « Agent immobilier ». Il est prévenu par e-mail et sa page affichera « Membre de » votre agence.</span>
            </label>
          ) : (
            <>
              <label className="text-sm"><span className="font-semibold text-ink">Nom complet</span><input className={input + " mt-1"} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
              <label className="text-sm"><span className="font-semibold text-ink">Téléphone</span><input className={input + " mt-1"} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
              <label className="text-sm"><span className="font-semibold text-ink">E-mail (facultatif)</span><input className={input + " mt-1"} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
              <div className="text-sm"><span className="font-semibold text-ink">Photo</span>
                <div className="mt-1 flex items-center gap-3">
                  <Avatar m={{ name: f.name, photoUrl: f.photoUrl }} size="h-11 w-11" />
                  <button type="button" onClick={() => photo.current?.click()} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold">Choisir</button>
                  <input ref={photo} type="file" accept="image/*" hidden onChange={async (e) => { const x = e.target.files?.[0]; e.target.value = ""; if (!x) return; const r = await uploadImageAction(await square(x), "avatar"); if (r.ok && r.url) setF((v) => ({ ...v, photoUrl: r.url! })); else setMsg({ ok: false, text: r.error ?? "Envoi impossible." }); }} />
                </div>
              </div>
            </>
          )}
          <label className="text-sm"><span className="font-semibold text-ink">Rôle dans l’agence</span>
            <input className={input + " mt-1"} list="team-roles" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} />
            <datalist id="team-roles">{ROLES.map((r) => <option key={r} value={r} />)}</datalist>
          </label>
        </div>
        <button type="button" disabled={pending || (mode === "account" ? !f.ref.trim() : !f.name.trim())} onClick={add} className="mt-4 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">Ajouter à l’équipe</button>
        {msg ? <p className={"mt-2 text-sm " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
        <h2 className="font-display text-lg font-bold text-ink">L’équipe ({members.length})</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {members.map((m, i) => (
            <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
              <Avatar m={m} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{m.name}{m.verified ? <span className="ml-1 text-xs text-emerald-700">✓ vérifié</span> : null}</p>
                <input defaultValue={m.role} onBlur={(e) => e.target.value !== m.role && start(async () => apply(await updateMember(m.id, { role: e.target.value }), "Rôle enregistré."))} className="mt-0.5 w-full max-w-[240px] rounded-lg border border-transparent px-1 text-sm text-muted hover:border-slate-200 focus:border-slate-300 focus:outline-none" />
                <p className="text-xs text-muted">{m.linked ? <>Compte Moboo{m.username ? <> · <Link href={`/pro/${m.username}`} className="underline">voir sa page</Link></> : null}</> : "Sans compte"}{m.phone ? ` · ${m.phone}` : ""}</p>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <button type="button" disabled={pending || i === 0} onClick={() => move(i, -1)} className="rounded bg-slate-100 px-2 py-1 disabled:opacity-40" aria-label="Monter">↑</button>
                <button type="button" disabled={pending || i === members.length - 1} onClick={() => move(i, 1)} className="rounded bg-slate-100 px-2 py-1 disabled:opacity-40" aria-label="Descendre">↓</button>
                <button type="button" disabled={pending} onClick={() => { if (confirm(`Retirer ${m.name} de l’équipe ?`)) start(async () => apply(await removeMember(m.id), "Membre retiré.")); }} className="ml-2 font-semibold text-red-600 hover:underline">Retirer</button>
              </div>
            </li>
          ))}
          {!members.length ? <li className="py-6 text-center text-sm text-muted">Aucun membre pour l’instant.</li> : null}
        </ul>
      </section>
    </div>
  );
}
