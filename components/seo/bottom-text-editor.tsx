"use client";

import { useState, useTransition } from "react";
import { bottomMeta, bottomValues, fillTitle, paragraphs, type BottomPart } from "@/lib/seo-bottom";
import { draftBottomTextAction, saveBottomTextAction, type BottomFactsAdmin, type BottomTextAdmin } from "@/app/admin/seo/actions";

const EMPTY: BottomPart[] = [{ title: "", text: "" }, { title: "", text: "" }, { title: "", text: "" }];
const HINT = ["Le lieu : situation, caractère, qui y vit", "Les biens de cette catégorie qu’on y trouve", "Prix et annonces disponibles"];
const words = (parts: BottomPart[]) => parts.map((p) => p.text).join(" ").split(/\s+/).filter(Boolean).length;

/**
 * Texte du bas de page (3 parties, chiffres en cases) : rédaction par Claude,
 * relecture, publication. Les cases {annonces}, {prix_median}… sont remplies
 * à l'affichage avec les chiffres du jour.
 */
export function BottomTextEditor({ id, title, initial, facts }: { id: string; title: string; initial: BottomTextAdmin | null; facts: BottomFactsAdmin | null }) {
  const [parts, setParts] = useState<BottomPart[]>(initial?.parts?.length ? initial.parts : EMPTY);
  const [status, setStatus] = useState<"draft" | "published">(initial?.status ?? "draft");
  const [autoMeta, setAutoMeta] = useState(initial?.autoMeta ?? true);
  const [source, setSource] = useState<"claude" | "manual">(initial?.source ?? "manual");
  const [info, setInfo] = useState<{ warnings: string[]; similar: BottomTextAdmin["similar"] }>({ warnings: initial?.warnings ?? [], similar: initial?.similar ?? null });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [preview, setPreview] = useState(false);
  const [pending, start] = useTransition();

  const edit = (i: number, patch: Partial<BottomPart>) => { setParts((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p))); setSource("manual"); setMsg(null); };
  const draft = () => start(async () => {
    if (parts.some((p) => p.text) && !window.confirm("Remplacer le texte actuel par une nouvelle proposition de Claude ?")) return;
    setMsg({ ok: true, text: "Claude rédige… (20 à 40 secondes)" });
    const r = await draftBottomTextAction(id);
    if (!r.ok || !r.parts) return setMsg({ ok: false, text: r.error ?? "Rédaction impossible." });
    setParts(r.parts); setSource("claude"); setInfo({ warnings: r.warnings ?? [], similar: r.similar ?? null });
    setMsg({ ok: true, text: "Proposition prête : relisez-la, puis enregistrez." });
  });
  const save = (next: "draft" | "published") => start(async () => {
    const r = await saveBottomTextAction(id, { parts, status: next, autoMeta, source });
    if (!r.ok) return setMsg({ ok: false, text: r.error ?? "Enregistrement impossible." });
    setStatus(next);
    if (r.text) setInfo({ warnings: r.text.warnings, similar: r.text.similar });
    setMsg({ ok: true, text: !r.text ? "Texte supprimé." : next === "published" ? "Publié (en ligne dans les 5 minutes)." : "Brouillon enregistré (pas visible sur le site)." });
  });

  const v = facts ? bottomValues(facts) : null;
  const meta = facts ? bottomMeta(title, { ...facts, text: null }) : null;
  const close = info.similar && info.similar.score > 0.2;

  return (
    <section className="space-y-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-ink">Texte du bas de page</p>
          <p className="text-xs text-muted">Affiché sous les annonces, après les liens vers les recherches voisines. Environ 300 mots en 3 parties. {words(parts)} mots.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={"rounded-full px-2.5 py-1 text-xs font-bold " + (status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700")}>{status === "published" ? "Publié" : "Brouillon"}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{source === "claude" ? "Rédigé par Claude" : "Rédigé à la main"}</span>
          <button type="button" disabled={pending} onClick={draft} className="rounded-md border border-brand-700 px-3 py-2 text-sm font-semibold text-brand-800 disabled:opacity-60">Rédiger avec Claude</button>
        </div>
      </div>

      {facts ? (
        <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
          <p className="font-semibold text-ink">Chiffres du jour (remplis automatiquement dans les cases)</p>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            <span><code>{"{annonces}"}</code> = {v?.annonces ?? "—"}</span>
            <span><code>{"{prix_median}"}</code> = {v?.prix_median ?? "—"}</span>
            <span><code>{"{prix_bas}"}</code> = {v?.prix_bas ?? "—"}</span>
            <span><code>{"{prix_haut}"}</code> = {v?.prix_haut ?? "—"}</span>
            <span><code>{"{mois}"}</code> = {v?.mois}</span>
          </p>
          <p className="mt-1 text-muted">Une phrase dont la case n’a pas de valeur (« — ») est retirée à l’affichage. Lieu reconnu : {facts.zone?.name ?? "—"} · catégorie : {facts.label}.</p>
        </div>
      ) : <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">Lieu ou catégorie non reconnus : vérifiez les filtres de la page (transaction, ville ou quartier).</p>}

      {parts.map((p, i) => (
        <div key={i} className="space-y-1.5">
          <label className="block text-sm font-semibold text-ink" htmlFor={`bt-title-${i}`}>Partie {i + 1} <span className="font-normal text-muted">· {HINT[i]}</span></label>
          <input id={`bt-title-${i}`} className="input font-semibold" placeholder="Sous-titre" value={p.title} onChange={(e) => edit(i, { title: e.target.value })} />
          <textarea id={`bt-text-${i}`} className="input min-h-[130px] leading-relaxed" value={p.text} onChange={(e) => edit(i, { text: e.target.value })} />
        </div>
      ))}

      {info.warnings.length || close ? (
        <ul className="space-y-1 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {close ? <li>Ce texte reprend {Math.round(info.similar!.score * 100)} % des phrases de /{info.similar!.slug} : réécrivez-le pour éviter un doublon aux yeux de Google.</li> : null}
          {info.warnings.map((w) => <li key={w}>{w}</li>)}
        </ul>
      ) : info.similar ? <p className="text-xs text-emerald-700">Texte unique : {Math.round(info.similar.score * 100)} % en commun au plus avec une autre page.</p> : null}

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1 accent-brand-700" checked={autoMeta} onChange={(e) => { setAutoMeta(e.target.checked); setMsg(null); }} />
        <span>Titre Google et description automatiques, avec les chiffres du jour (remplacent les champs « Titre SEO » et « Méta-description » quand le texte est publié).
          {meta && autoMeta ? <span className="mt-1 block text-xs text-muted">{meta.title}<br />{meta.description}</span> : null}</span>
      </label>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
        <button type="button" onClick={() => setPreview((x) => !x)} className="text-sm font-semibold text-brand-800">{preview ? "Masquer l’aperçu" : "Aperçu avec les chiffres"}</button>
        <div className="flex flex-wrap items-center gap-2">
          {msg ? <span className={"text-sm font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</span> : null}
          <button type="button" disabled={pending} onClick={() => save("draft")} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-60">{status === "published" ? "Repasser en brouillon" : "Enregistrer le brouillon"}</button>
          <button type="button" disabled={pending} onClick={() => save("published")} className="rounded-md bg-accent-600 px-5 py-2 text-sm font-bold text-white hover:bg-accent-700 disabled:opacity-60">Publier le texte</button>
        </div>
      </div>

      {preview && v ? (
        <div className="max-w-3xl space-y-3 rounded-md border border-dashed border-slate-300 p-4">
          {parts.map((p, i) => (
            <div key={i}>
              <h3 className="font-display text-lg font-bold text-ink">{fillTitle(p.title, v)}</h3>
              {paragraphs(p.text, v).map((t, j) => <p key={j} className="mt-2 leading-relaxed text-slate-700">{t}</p>)}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
