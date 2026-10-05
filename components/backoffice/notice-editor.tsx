"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteNoticeAction, duplicateNoticeAction, noticeStatusAction, reachAction, saveNoticeAction,
  type NoticeInput, type NoticeMeta, type NoticeRow,
} from "@/app/admin/centre-marketing/informations/actions";
import { NOTICE_TONE } from "@/lib/notice-tone";
import { NoticeBody } from "@/components/notices/notice-body";

const toLocal = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const toIso = (v: string) => (v ? new Date(v).toISOString() : null);

const PRESETS: { label: string; audiences: string[] }[] = [
  { label: "Tous les professionnels", audiences: ["agents", "agences", "proprietaires", "etablissements"] },
  { label: "Agents et agences", audiences: ["agents", "agences"] },
  { label: "Locataires et acheteurs", audiences: ["locataires", "acheteurs"] },
  { label: "Tout le monde", audiences: [] },
];

/** Éditeur d'une information ciblée, avec aperçu (bandeau, fenêtre, Mon espace) et nombre de comptes concernés. */
export function NoticeEditor({ meta, notice }: { meta: NoticeMeta; notice?: NoticeRow & { reach?: { accounts: number; visitors: boolean } } }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [n, setN] = useState<NoticeInput>({
    id: notice?.id, title: notice?.title ?? "", body: notice?.body ?? "", kind: notice?.kind ?? "info",
    audiences: notice?.audiences ?? [], places: notice?.places ?? [], placements: notice?.placements ?? ["espace"],
    ctaLabel: notice?.ctaLabel ?? "", ctaUrl: notice?.ctaUrl ?? "", startsAt: notice?.startsAt ?? null, endsAt: notice?.endsAt ?? null,
    dismissible: notice?.dismissible ?? true, pinned: notice?.pinned ?? false,
  });
  const [places, setPlaces] = useState((notice?.places ?? []).join(", "));
  const [reach, setReach] = useState(notice?.reach ?? null);
  const [view, setView] = useState<"bandeau" | "popup" | "espace">("espace");
  const set = <K extends keyof NoticeInput>(k: K, v: NoticeInput[K]) => setN((x) => ({ ...x, [k]: v }));
  const toggle = (k: "audiences" | "placements", v: string) => set(k, n[k].includes(v) ? n[k].filter((x) => x !== v) : [...n[k], v]);

  useEffect(() => {
    const t = setTimeout(() => { void reachAction({ audiences: n.audiences, places: places.split(",").map((p) => p.trim()).filter(Boolean) }).then(setReach); }, 400);
    return () => clearTimeout(t);
  }, [n.audiences, places]);
  useEffect(() => { if (n.placements.length && !n.placements.includes(view)) setView(n.placements[0] as typeof view); }, [n.placements, view]);

  const save = (status?: string) => start(async () => {
    setMsg(null);
    const r = await saveNoticeAction({ ...n, places: places.split(",").map((p) => p.trim()).filter(Boolean), ...(status ? { status } : {}) });
    if (!r.ok) return setMsg({ ok: false, text: r.error ?? "Erreur." });
    setMsg({ ok: true, text: status === "published" ? "Publié : visible sur le site d’ici 30 secondes." : "Enregistré." });
    if (!n.id && r.id) router.replace(`/admin/centre-marketing/informations/${r.id}`);
    else router.refresh();
  });
  const act = (fn: () => Promise<{ ok: boolean; id?: string; error?: string }>, after?: (id?: string) => void) => start(async () => {
    const r = await fn();
    if (!r.ok) return setMsg({ ok: false, text: r.error ?? "Erreur." });
    after ? after(r.id) : router.refresh();
  });

  const tone = NOTICE_TONE[n.kind] ?? NOTICE_TONE.info;
  const status = notice?.status ?? "draft";
  const input = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none";
  const label = "block text-xs font-semibold uppercase tracking-wide text-slate-500";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/centre-marketing/informations" className="text-sm text-brand-700 hover:underline">← Informations ciblées</Link>
          <h1 className="font-display text-2xl font-extrabold text-ink">{notice ? notice.title : "Nouveau message"}</h1>
          {notice ? <p className="text-sm text-muted">{status === "published" ? (notice.live ? "En ligne" : "Publié, hors période d’affichage") : status === "archived" ? "Archivé" : "Brouillon"} · {notice.views} vue(s) · {notice.clicks} clic(s) · {notice.dismissals} fermeture(s){notice.placements.includes("espace") ? ` · ${notice.reads} lu(s) dans Mon espace` : ""}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {notice ? <button type="button" disabled={pending} onClick={() => act(() => duplicateNoticeAction(notice.id), (id) => router.push(`/admin/centre-marketing/informations/${id}`))} className="rounded-md bg-white px-3 py-2 font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Dupliquer</button> : null}
          {notice && status === "published" ? <button type="button" disabled={pending} onClick={() => act(() => noticeStatusAction(notice.id, "archived"))} className="rounded-md bg-white px-3 py-2 font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Retirer du site</button> : null}
          {notice && status !== "published" ? <button type="button" disabled={pending} onClick={() => { if (confirm("Supprimer ce message ?")) act(() => deleteNoticeAction(notice.id), () => router.push("/admin/centre-marketing/informations")); }} className="rounded-md bg-white px-3 py-2 font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50">Supprimer</button> : null}
          <button type="button" disabled={pending} onClick={() => save()} className="rounded-md bg-white px-3 py-2 font-semibold ring-1 ring-slate-300 hover:bg-slate-50">{status === "published" ? "Enregistrer" : "Enregistrer le brouillon"}</button>
          {status !== "published" ? <button type="button" disabled={pending} onClick={() => save("published")} className="rounded-md bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800">Publier</button> : null}
        </div>
      </div>
      {msg ? <p className={"rounded-md px-3 py-2 text-sm " + (msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>{msg.text}</p> : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="space-y-5">
          <section className="space-y-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="font-display font-bold text-ink">1. Le message</h2>
            <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
              <label className="block"><span className={label}>Titre</span><input value={n.title} maxLength={140} onChange={(e) => set("title", e.target.value)} className={input} placeholder="Ex. Nouveau : faites vérifier votre compte" /></label>
              <label className="block"><span className={label}>Type</span>
                <select value={n.kind} onChange={(e) => set("kind", e.target.value)} className={input}>
                  {meta.kinds.map((k) => <option key={k} value={k}>{NOTICE_TONE[k]?.icon} {NOTICE_TONE[k]?.label ?? k}</option>)}
                </select>
              </label>
            </div>
            <label className="block"><span className={label}>Texte</span>
              <textarea value={n.body} rows={6} maxLength={4000} onChange={(e) => set("body", e.target.value)} className={input} placeholder="Une ligne vide sépare les paragraphes. Le bandeau n’affiche que la première ligne." />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className={label}>Texte du bouton</span><input value={n.ctaLabel} maxLength={40} onChange={(e) => set("ctaLabel", e.target.value)} className={input} placeholder="Ex. Je fais vérifier" /></label>
              <label className="block"><span className={label}>Lien du bouton</span><input value={n.ctaUrl} onChange={(e) => set("ctaUrl", e.target.value)} className={input} placeholder="/mon-espace/verification ou https://…" /></label>
            </div>
          </section>

          <section className="space-y-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display font-bold text-ink">2. À qui ?</h2>
              <p className="text-sm font-semibold text-brand-800">{reach ? `${reach.accounts.toLocaleString("fr-FR")} compte(s) concerné(s)${reach.visitors ? " + visiteurs non connectés" : ""}` : "…"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button key={p.label} type="button" onClick={() => set("audiences", p.audiences)} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">{p.label}</button>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(meta.audiences).map(([k, v]) => (
                <label key={k} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
                  <input type="checkbox" checked={n.audiences.includes(k)} onChange={() => toggle("audiences", k)} /> {v}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted">Aucune case cochée : tout le monde (visiteurs compris).</p>
            <label className="block"><span className={label}>Villes ou communes (facultatif)</span><input value={places} onChange={(e) => setPlaces(e.target.value)} className={input} placeholder="Ex. Cocody, Marcory, Bouaké" /></label>
          </section>

          <section className="space-y-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="font-display font-bold text-ink">3. Où et quand ?</h2>
            <div className="grid gap-2 sm:grid-cols-3">
              {Object.entries(meta.placements).map(([k, v]) => (
                <label key={k} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
                  <input type="checkbox" checked={n.placements.includes(k)} onChange={() => toggle("placements", k)} /> {v}
                </label>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className={label}>Début (facultatif)</span><input type="datetime-local" value={toLocal(n.startsAt)} onChange={(e) => set("startsAt", toIso(e.target.value))} className={input} /></label>
              <label className="block"><span className={label}>Fin (facultatif)</span><input type="datetime-local" value={toLocal(n.endsAt)} onChange={(e) => set("endsAt", toIso(e.target.value))} className={input} /></label>
            </div>
            <div className="flex flex-wrap gap-5 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={n.dismissible} onChange={(e) => set("dismissible", e.target.checked)} /> Le visiteur peut le fermer</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={n.pinned} onChange={(e) => set("pinned", e.target.checked)} /> Prioritaire (affiché en premier)</label>
            </div>
          </section>
        </div>

        <aside className="space-y-3 xl:sticky xl:top-20 xl:self-start">
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs font-semibold">
            {(["espace", "bandeau", "popup"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setView(v)} className={"flex-1 rounded-md px-2 py-1.5 " + (view === v ? "bg-white shadow-sm" : "text-slate-500")}>{v === "espace" ? "Mon espace" : v === "bandeau" ? "Bandeau" : "Fenêtre"}</button>
            ))}
          </div>
          <div className="overflow-hidden rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
            {view === "bandeau" ? (
              <div className={"flex items-center gap-2 rounded px-3 py-2 text-xs " + tone.bar}>
                <span>{tone.icon}</span>
                <p className="min-w-0 flex-1"><strong>{n.title || "Titre du message"}</strong>{n.body ? <span className="opacity-90"> — {n.body.split("\n")[0].slice(0, 90)}</span> : null}</p>
                {n.ctaUrl ? <span className="rounded-full bg-white px-2 py-0.5 font-bold text-ink">{n.ctaLabel || "En savoir plus"}</span> : null}
                {n.dismissible ? <span>✕</span> : null}
              </div>
            ) : view === "popup" ? (
              <div className="grid place-items-center rounded bg-black/40 p-4">
                <div className="w-full rounded-xl bg-white p-4 shadow-xl">
                  <span className={"inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold " + tone.chip}>{tone.icon} {tone.label}</span>
                  <p className="mt-2 font-display font-extrabold text-ink">{n.title || "Titre du message"}</p>
                  <NoticeBody text={n.body} className="mt-1 text-xs text-slate-600" />
                  <div className="mt-3 flex justify-end gap-2 text-xs"><span className="px-2 py-1 text-slate-500">Fermer</span>{n.ctaUrl ? <span className="rounded-full bg-brand-800 px-3 py-1 font-bold text-white">{n.ctaLabel || "En savoir plus"}</span> : null}</div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-white p-4 shadow-sm ring-2 ring-accent-200">
                <div className="flex items-center gap-2 text-[11px]"><span className={"rounded-full px-2 py-0.5 font-bold " + tone.chip}>{tone.icon} {tone.label}</span><span className="rounded-full bg-accent-600 px-1.5 py-0.5 font-bold text-white">Nouveau</span></div>
                <p className="mt-2 font-display font-bold text-ink">{n.title || "Titre du message"}</p>
                <NoticeBody text={n.body} className="mt-1 text-xs text-slate-600" />
                {n.ctaUrl ? <span className="mt-3 inline-flex rounded-full bg-brand-800 px-3 py-1 text-xs font-bold text-white">{n.ctaLabel || "En savoir plus"}</span> : null}
              </div>
            )}
          </div>
          {!n.placements.includes(view) ? <p className="text-xs text-amber-700">Cet emplacement n’est pas coché : le message n’y sera pas affiché.</p> : null}
        </aside>
      </div>
    </div>
  );
}
