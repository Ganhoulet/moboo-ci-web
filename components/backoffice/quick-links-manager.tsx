"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createQuickLinkAction, quickLinkAccountsAction, updateQuickLinkAction } from "@/app/admin/comptes/studio/actions";

type QLink = { id: string; slug: string; title: string; manager: string; mine: boolean; active: boolean; clicks: number; url: string; listings: number; accounts: number; views: number; contacts: number };
type Acc = { id: string; name: string; phone: string; whatsapp: string | null; type: string; createdAt: string; listings: number };

const TYPE: Record<string, string> = { agent: "Agent", entreprise: "Agence", proprietaire: "Propriétaire" };
const SHARE = (url: string) => `Publiez gratuitement vos biens sur Moboo.ci en 1 minute, les clients vous appellent directement : ${url}`;

/** Créer, partager, couper un lien ; voir les comptes et annonces qu'il a rapportés. */
export function QuickLinksManager({ links }: { links: QLink[] }) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [open, setOpen] = useState<{ id: string; rows: Acc[] } | null>(null);
  const [pending, start] = useTransition();

  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); setMsg({ ok: true, text: "Copié." }); } catch { /* presse-papiers indisponible */ } };

  return (
    <div className="space-y-4">
      <form className="flex flex-wrap items-end gap-2 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200"
        onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await createQuickLinkAction({ title, slug: slug || undefined }); setMsg(r.ok ? { ok: true, text: `Lien créé : ${r.data.url}` } : { ok: false, text: r.error! }); if (r.ok) { setTitle(""); setSlug(""); } }); }}>
        <label className="text-sm">Nom du lien<br /><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Groupe Agents Cocody" className="mt-1 w-64 rounded-md border border-slate-300 px-3 py-1.5" /></label>
        <label className="text-sm">Adresse (facultatif)<br /><span className="text-xs text-muted">/p/</span><input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="cocody" className="mt-1 w-40 rounded-md border border-slate-300 px-3 py-1.5" /></label>
        <button disabled={pending || !title.trim()} className="rounded-md bg-accent-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Créer le lien</button>
      </form>
      {msg ? <p className={"rounded-lg p-3 text-sm " + (msg.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-800")}>{msg.text}</p> : null}

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-muted">
            <tr><th className="p-3">Lien</th><th className="p-3">Ouvertures</th><th className="p-3">Comptes</th><th className="p-3">Annonces</th><th className="p-3">Vues · contacts</th><th className="p-3">Partager</th><th className="p-3">État</th></tr>
          </thead>
          <tbody>
            {links.map((l) => (
              <tr key={l.id} className="border-t border-slate-100 align-top">
                <td className="p-3"><span className="font-semibold text-ink">{l.title}</span><br /><a href={l.url} target="_blank" rel="noreferrer" className="text-xs text-brand-800 underline">{l.url.replace(/^https?:\/\//, "")}</a><br /><span className="text-xs text-muted">{l.manager}</span></td>
                <td className="p-3">{l.clicks}</td>
                <td className="p-3"><button type="button" className="font-semibold text-brand-800 underline" onClick={() => start(async () => { const r = await quickLinkAccountsAction(l.id); if (r.ok) setOpen({ id: l.id, rows: r.data }); })}>{l.accounts}</button></td>
                <td className="p-3">{l.listings}</td>
                <td className="p-3 text-xs">{l.views} vues · <b>{l.contacts}</b> contacts</td>
                <td className="p-3">
                  <span className="flex flex-wrap gap-1">
                    <a href={`https://wa.me/?text=${encodeURIComponent(SHARE(l.url))}`} target="_blank" rel="noreferrer" className="rounded bg-[#25D366] px-2 py-1 text-xs font-semibold text-white">WhatsApp</a>
                    <button type="button" onClick={() => copy(SHARE(l.url))} className="rounded bg-white px-2 py-1 text-xs font-semibold ring-1 ring-slate-300">Copier le message</button>
                  </span>
                </td>
                <td className="p-3">
                  <button type="button" disabled={pending} onClick={() => start(async () => { const r = await updateQuickLinkAction(l.id, { active: !l.active }); if (!r.ok) setMsg({ ok: false, text: r.error! }); })}
                    className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (l.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600")}>
                    {l.active ? "Actif" : "Coupé"}
                  </button>
                </td>
              </tr>
            ))}
            {!links.length ? <tr><td colSpan={7} className="p-6 text-center text-sm text-muted">Aucun lien : créez-en un pour votre premier groupe WhatsApp.</td></tr> : null}
          </tbody>
        </table>
      </div>

      {open ? (
        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="mb-2 flex items-center justify-between"><p className="font-bold text-ink">Comptes arrivés par ce lien</p><button type="button" onClick={() => setOpen(null)} className="text-sm text-muted">Fermer</button></div>
          <ul className="divide-y divide-slate-100 text-sm">
            {open.rows.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-2">
                <Link href={`/admin/comptes/site/${a.id}`} className="font-semibold text-brand-800 hover:underline">{a.name || a.phone}</Link>
                <span className="text-xs text-muted">{TYPE[a.type] ?? a.type} · {a.listings} annonce(s) · inscrit le {new Date(a.createdAt).toLocaleDateString("fr-FR")}</span>
                <a href={`https://wa.me/${(a.whatsapp || a.phone).replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="ml-auto rounded bg-[#25D366] px-2 py-0.5 text-xs font-semibold text-white">WhatsApp</a>
                <Link href={`/admin/comptes/studio?agent=${a.id}`} className="rounded bg-white px-2 py-0.5 text-xs font-semibold ring-1 ring-slate-300">Studio</Link>
              </li>
            ))}
            {!open.rows.length ? <li className="py-2 text-muted">Aucun compte pour le moment.</li> : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
