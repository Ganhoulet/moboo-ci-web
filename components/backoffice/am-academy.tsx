"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addActivityAction, deleteTemplateAction, saveTemplateAction } from "@/app/admin/comptes/actions";

export interface Template { id: string; situation: string; audience: string; channel: "whatsapp" | "sms" | "email"; title: string; subject: string | null; body: string; active: boolean }
export interface AcademyData { situations: Record<string, string>; audiences: Record<string, string>; channels: string[]; items: Template[] }
interface Client { kind: string; id: string; name: string; phone: string | null; email: string | null }

const CH: Record<string, [string, string]> = { whatsapp: ["WhatsApp", "bg-emerald-50 text-emerald-800"], sms: ["SMS", "bg-sky-50 text-sky-800"], email: ["E-mail", "bg-violet-50 text-violet-800"] };
const input = "w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm";
const digits = (s?: string | null) => String(s ?? "").replace(/\D/g, "");
const VARS: [string, string][] = [["client", "Client"], ["annonce", "Annonce / logement"], ["date", "Date(s)"], ["lien", "Lien"], ["montant", "Montant"]];
const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (m, k) => (v[k] ? v[k] : m));

/** Académie : parcourir, compléter et envoyer un message ; le responsable peut les modifier. */
export function AcademyBrowser({ data, canEdit, me, client }: { data: AcademyData; canEdit: boolean; me: string; client: Client | null }) {
  const [situation, setSituation] = useState("");
  const [audience, setAudience] = useState("");
  const [channel, setChannel] = useState("");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Template | null>(null);
  const [edit, setEdit] = useState<Partial<Template> | null>(null);
  const list = useMemo(() => data.items.filter((t) =>
    (!situation || t.situation === situation) && (!audience || t.audience === audience || t.audience === "tous") && (!channel || t.channel === channel)
    && (!q || (t.title + " " + t.body).toLowerCase().includes(q.toLowerCase()))), [data.items, situation, audience, channel, q]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5 text-sm">
          <button type="button" onClick={() => setSituation("")} className={"rounded-full px-3 py-1 font-semibold " + (!situation ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>Toutes</button>
          {Object.entries(data.situations).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setSituation(k)} className={"rounded-full px-3 py-1 font-semibold " + (situation === k ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{l}</button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <select className={input} value={audience} onChange={(e) => setAudience(e.target.value)} aria-label="Type de client">
            <option value="">Tous les clients</option>
            {Object.entries(data.audiences).filter(([k]) => k !== "tous").map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <select className={input} value={channel} onChange={(e) => setChannel(e.target.value)} aria-label="Canal">
            <option value="">Tous les canaux</option>
            {data.channels.map((c) => <option key={c} value={c}>{CH[c]?.[0] ?? c}</option>)}
          </select>
          <input className={input} placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher" />
        </div>
        {canEdit ? <button type="button" onClick={() => { setSel(null); setEdit({ situation: situation || "accueil", audience: "tous", channel: "whatsapp", title: "", body: "", active: true }); }} className="rounded-md bg-ink px-3 py-1.5 text-sm font-semibold text-white">+ Nouveau message</button> : null}
        <ul className="space-y-2">
          {list.map((t) => (
            <li key={t.id}>
              <button type="button" onClick={() => { setSel(t); setEdit(null); }} className={"w-full rounded-lg bg-white p-3 text-left ring-1 hover:ring-brand-400 " + (sel?.id === t.id ? "ring-2 ring-brand-700" : "ring-slate-200") + (t.active ? "" : " opacity-50")}>
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className={"rounded-full px-2 py-0.5 text-[11px] font-semibold " + (CH[t.channel]?.[1] ?? "")}>{CH[t.channel]?.[0]}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{data.audiences[t.audience] ?? t.audience}</span>
                  {!t.active ? <span className="text-[11px] text-muted">masqué</span> : null}
                </span>
                <span className="mt-1 block font-semibold text-ink">{t.title}</span>
                <span className="line-clamp-2 block text-xs text-muted">{t.body}</span>
              </button>
            </li>
          ))}
          {!list.length ? <li className="rounded-lg bg-white p-4 text-sm text-muted ring-1 ring-slate-200">Aucun message pour ce choix.</li> : null}
        </ul>
      </div>
      <div className="lg:sticky lg:top-4 lg:self-start">
        {edit ? <TemplateEditor data={data} t={edit} onDone={() => setEdit(null)} />
          : sel ? <Composer t={sel} me={me} client={client} canEdit={canEdit} onEdit={() => setEdit(sel)} />
          : <div className="rounded-lg bg-white p-6 text-sm text-muted ring-1 ring-slate-200">Choisissez un message à gauche{client ? ` pour ${client.name}` : ""}.</div>}
      </div>
    </div>
  );
}

/** Compléter les variables et envoyer. */
function Composer({ t, me, client, canEdit, onEdit }: { t: Template; me: string; client: Client | null; canEdit: boolean; onEdit: () => void }) {
  const [v, setV] = useState<Record<string, string>>({ client: client?.name ?? "", conseiller: me });
  const [to, setTo] = useState(t.channel === "email" ? client?.email ?? "" : client?.phone ?? "");
  const [text, setText] = useState<string | null>(null);
  const [logged, setLogged] = useState(false);
  const [pending, start] = useTransition();
  const body = text ?? fill(t.body, v);
  const subject = fill(t.subject ?? "", v);
  const used = VARS.filter(([k]) => t.body.includes(`{${k}}`) || (t.subject ?? "").includes(`{${k}}`));
  const href = t.channel === "whatsapp" ? `https://wa.me/${digits(to)}?text=${encodeURIComponent(body)}`
    : t.channel === "sms" ? `sms:${to.replace(/\s/g, "")}?body=${encodeURIComponent(body)}`
    : `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const log = () => client && start(async () => {
    const r = await addActivityAction(client.kind, client.id, { type: t.channel === "email" ? "email" : "whatsapp", body: `Message de l’Académie envoyé : « ${t.title} ».` });
    setLogged(r.ok);
  });
  return (
    <div className="space-y-3 rounded-lg bg-white p-4 ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-ink">{t.title}</h2>
        {canEdit ? <button type="button" onClick={onEdit} className="text-xs font-semibold text-brand-800">Modifier le modèle</button> : null}
      </div>
      {used.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {used.map(([k, l]) => <label key={k} className="text-xs font-semibold text-slate-600">{l}<input className={input + " mt-0.5 font-normal"} value={v[k] ?? ""} onChange={(e) => { setText(null); setV({ ...v, [k]: e.target.value }); }} /></label>)}
        </div>
      ) : null}
      {t.channel === "email" ? <p className="text-sm"><span className="text-muted">Objet : </span><b>{subject}</b></p> : null}
      <textarea className={input + " min-h-[12rem] font-normal"} value={body} onChange={(e) => setText(e.target.value)} aria-label="Message" />
      <label className="block text-xs font-semibold text-slate-600">{t.channel === "email" ? "E-mail du client" : "Numéro du client"}
        <input className={input + " mt-0.5 font-normal"} value={to} onChange={(e) => setTo(e.target.value)} placeholder={t.channel === "email" ? "client@exemple.com" : "+225 07 …"} />
      </label>
      <div className="flex flex-wrap gap-2">
        <a href={href} target="_blank" rel="noreferrer" onClick={log} className={"rounded-md px-3 py-1.5 text-sm font-semibold text-white " + (t.channel === "whatsapp" ? "bg-emerald-600" : t.channel === "sms" ? "bg-sky-700" : "bg-violet-700")}>
          Envoyer par {CH[t.channel]?.[0]}
        </a>
        <button type="button" onClick={() => navigator.clipboard?.writeText(t.channel === "email" ? `${subject}\n\n${body}` : body)} className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-slate-300">Copier</button>
        {logged ? <span className="self-center text-xs text-emerald-700">✓ Noté dans le suivi du client</span> : pending ? <span className="self-center text-xs text-muted">…</span> : null}
      </div>
      <p className="text-xs text-muted">Relisez avant d’envoyer : remplacez les « … » et les éléments entre accolades. {client ? "L’envoi est noté dans le suivi du client." : "Ouvrez l’Académie depuis la fiche d’un client pour remplir son nom et son numéro automatiquement."}</p>
    </div>
  );
}

/** Responsable / réglages : modifier, masquer, supprimer ou créer un message. */
function TemplateEditor({ data, t, onDone }: { data: AcademyData; t: Partial<Template>; onDone: () => void }) {
  const router = useRouter();
  const [f, setF] = useState({ situation: t.situation ?? "accueil", audience: t.audience ?? "tous", channel: t.channel ?? "whatsapp", title: t.title ?? "", subject: t.subject ?? "", body: t.body ?? "", active: t.active !== false });
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const save = () => start(async () => {
    const r = await saveTemplateAction(t.id ?? null, f);
    if (r.ok) { onDone(); router.refresh(); } else setErr(r.error ?? "Erreur.");
  });
  return (
    <div className="space-y-2 rounded-lg bg-white p-4 ring-2 ring-amber-300">
      <h2 className="font-display text-lg font-bold text-ink">{t.id ? "Modifier le message" : "Nouveau message"}</h2>
      <div className="grid gap-2 sm:grid-cols-3">
        <select className={input} value={f.situation} onChange={(e) => setF({ ...f, situation: e.target.value })} aria-label="Situation">{Object.entries(data.situations).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <select className={input} value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value })} aria-label="Public">{Object.entries(data.audiences).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <select className={input} value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value as Template["channel"] })} aria-label="Canal">{data.channels.map((c) => <option key={c} value={c}>{CH[c]?.[0] ?? c}</option>)}</select>
      </div>
      <input className={input} placeholder="Titre (ex. Relance après un appel manqué)" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} aria-label="Titre" />
      {f.channel === "email" ? <input className={input} placeholder="Objet de l’e-mail" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} aria-label="Objet" /> : null}
      <textarea className={input + " min-h-[12rem]"} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} aria-label="Texte" />
      <p className="text-xs text-muted">Variables : {"{client} {conseiller} {annonce} {date} {lien} {montant}"}</p>
      <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" className="h-4 w-4" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />Visible par les account managers</label>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={save} className="rounded-md bg-ink px-3 py-1.5 text-sm font-semibold text-white">Enregistrer</button>
        <button type="button" onClick={onDone} className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-slate-300">Annuler</button>
        {t.id ? <button type="button" disabled={pending} onClick={() => { if (confirm("Supprimer ce message de l’Académie ?")) start(async () => { const r = await deleteTemplateAction(t.id!); if (r.ok) { onDone(); router.refresh(); } else setErr(r.error ?? "Erreur."); }); }} className="ml-auto text-sm font-semibold text-red-700">Supprimer</button> : null}
      </div>
      {err ? <p className="text-xs text-red-600">{err}</p> : null}
    </div>
  );
}
