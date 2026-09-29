"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreativeView, type Creative } from "./creative";
import { FieldEditor } from "@/components/builder/field-editor";
import { saveCampaignAction, type Campaign } from "@/app/admin/marketing/actions";

export const PLACEMENTS: { id: string; label: string; help: string }[] = [
  { id: "app_banner", label: "Appli — bannière d’accueil", help: "Carrousel en haut de l’accueil de l’application." },
  { id: "app_popup", label: "Appli — pop-up", help: "Fenêtre à l’ouverture de l’application." },
  { id: "site_banner", label: "Site — bannière", help: "Bloc « Bannières marketing » de la page d’accueil." },
  { id: "site_popup", label: "Site — pop-up", help: "Fenêtre à l’arrivée sur le site." },
];

const TEMPLATES: { id: Creative["template"]; label: string; help: string }[] = [
  { id: "split", label: "Texte + photo", help: "Titre, texte et bouton à gauche, photo à droite." },
  { id: "hero", label: "Photo en fond", help: "Grande photo, texte et bouton par-dessus." },
  { id: "image", label: "Flyer (image)", help: "Votre visuel tel quel (Canva, Photoshop…)." },
];

/** Modèles prêts à l'emploi. */
const PRESETS: { label: string; v: Partial<Campaign> }[] = [
  { label: "Événement", v: { template: "hero", title: "Grand salon de l’immobilier", text: "Samedi 14 décembre · Sofitel Abidjan", ctaLabel: "Je m’inscris", badge: "Événement", bgColor: "#1e3a8a", textColor: "#ffffff", ctaColor: "#f97316" } },
  { label: "Devenir propriétaire", v: { template: "split", title: "Payez votre loyer pour devenir propriétaire", text: "Découvrez notre programme location-accession.", ctaLabel: "Je m’inscris", bgColor: "#6d5dfc", textColor: "#ffffff", ctaColor: "#22c55e" } },
  { label: "Publier gratuitement", v: { template: "split", title: "Publiez votre bien gratuitement", text: "Des milliers de visiteurs chaque jour sur Moboo.", ctaLabel: "Publier", ctaUrl: "/publier", bgColor: "#ea580c", textColor: "#ffffff", ctaColor: "#0f172a" } },
  { label: "Promo forfaits", v: { template: "hero", title: "-30 % sur les forfaits Pro", text: "Jusqu’au 31 décembre", ctaLabel: "Voir les forfaits", ctaUrl: "/forfaits", badge: "Offre limitée", bgColor: "#0f172a", textColor: "#ffffff", ctaColor: "#22c55e" } },
];

const LINKS = [
  ["Annonces à louer", "/annonces?transaction=rent"], ["Meublés", "/annonces?transaction=furnished"], ["Publier", "/publier"],
  ["Forfaits", "/forfaits"], ["WhatsApp", "https://wa.me/225"], ["Appeler", "tel:+225"],
];

const EMPTY: Partial<Campaign> = {
  name: "", placements: ["app_popup"], template: "split", title: "", text: "", imageUrl: "", badge: "", ctaLabel: "", ctaUrl: "",
  bgColor: "#4f46e5", textColor: "#ffffff", ctaColor: "#22c55e", audience: "all", platforms: [], frequency: "once",
  dismissible: true, delaySec: 2, priority: 0, active: true, startsAt: null, endsAt: null,
};

const toLocal = (iso?: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

function Label({ children, help }: { children: React.ReactNode; help?: string }) {
  return <span className="mb-1 block text-sm font-semibold text-ink">{children}{help ? <span className="block text-xs font-normal text-muted">{help}</span> : null}</span>;
}

/** Téléphone : accueil de l'appli avec la bannière, ou pop-up par-dessus. */
function PhonePreview({ c, mode }: { c: Creative & { dismissible?: boolean }; mode: "banner" | "popup" }) {
  return (
    <div className="mx-auto w-[300px] rounded-[42px] border-[10px] border-ink bg-ink shadow-2xl">
      <div className="relative h-[600px] overflow-hidden rounded-[32px] bg-white">
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <span className="font-display text-lg font-black text-brand-800">Moboo</span>
          <span className="flex gap-2"><span className="h-8 w-8 rounded-full bg-slate-100" /><span className="h-8 w-8 rounded-full bg-slate-100" /></span>
        </div>
        <div className="mx-4 flex gap-2">{["Louer", "Acheter", "Séjourner"].map((t, i) => <span key={t} className={"flex-1 rounded-xl py-2 text-center text-[11px] font-semibold " + (i === 0 ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600")}>{t}</span>)}</div>
        <div className="mx-4 mt-3 rounded-xl bg-slate-100 px-3 py-2.5 text-xs text-slate-400">Que cherchez-vous ?</div>
        <div className="mx-4 mt-3">{mode === "banner" ? <CreativeView c={c} variant="banner" /> : <div className="h-32 rounded-2xl bg-slate-100" />}</div>
        <p className="mx-4 mt-4 text-sm font-bold text-ink">Sélection Moboo</p>
        <div className="mx-4 mt-2 h-40 rounded-2xl bg-slate-100" />
        {mode === "popup" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 px-6">
            <div className="w-full"><CreativeView c={c} variant="popup" /></div>
            <span className="mt-4 grid h-9 w-9 place-items-center rounded-full border-2 border-white text-white">✕</span>
            {c.dismissible !== false ? <span className="mt-2 text-sm font-semibold text-white">Ne plus afficher</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function CampaignEditor({ initial }: { initial?: Campaign }) {
  const router = useRouter();
  const [c, setC] = useState<Partial<Campaign>>(initial ?? EMPTY);
  const [preview, setPreview] = useState<"banner" | "popup">(initial?.placements?.some((p) => p.endsWith("popup")) || !initial ? "popup" : "banner");
  const saved = useSearchParams().get("enregistre") === "1";
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(saved ? { ok: true, text: "Campagne créée : elle apparaît dans l’appli et sur le site dans la minute." } : null);
  const [pending, start] = useTransition();
  const set = (patch: Partial<Campaign>) => { setC((x) => ({ ...x, ...patch })); setMsg(null); };
  const toggleIn = (key: "placements" | "platforms", v: string) => {
    const list = (c[key] as string[]) ?? [];
    set({ [key]: list.includes(v) ? list.filter((x) => x !== v) : [...list, v] } as Partial<Campaign>);
  };
  const hasPopup = (c.placements ?? []).some((p) => p.endsWith("popup"));

  const save = () => start(async () => {
    const r = await saveCampaignAction(initial?.id ?? null, {
      ...c,
      startsAt: c.startsAt ? new Date(c.startsAt).toISOString() : null,
      endsAt: c.endsAt ? new Date(c.endsAt).toISOString() : null,
    });
    if (!r.ok) return setMsg({ ok: false, text: r.error ?? "Enregistrement impossible." });
    setMsg({ ok: true, text: "Campagne enregistrée : elle apparaît dans l’appli et sur le site dans la minute." });
    if (!initial && r.id) router.replace(`/admin/marketing/${r.id}?enregistre=1`);
  });

  return (
    <div className="space-y-4">
      <div className="sticky top-16 z-30 -mx-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-100/95 px-3 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div>
          <a href="/admin/marketing" className="text-sm font-semibold text-muted hover:text-ink">← Campagnes</a>
          <h1 className="font-display text-2xl font-extrabold text-ink">{initial ? c.name || "Campagne" : "Nouvelle campagne"}</h1>
        </div>
        <div className="flex items-center gap-3">
          {msg ? <span className={"max-w-sm text-sm font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</span> : null}
          <label className="inline-flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="accent-brand-700" checked={c.active !== false} onChange={(e) => set({ active: e.target.checked })} />Active</label>
          <button type="button" disabled={pending} onClick={save} className="rounded-md bg-accent-600 px-5 py-2 text-sm font-bold text-white hover:bg-accent-700 disabled:opacity-60">{pending ? "…" : "Enregistrer"}</button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <section className="space-y-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <label className="block"><Label>Nom de la campagne (interne)</Label><input className="input" value={c.name ?? ""} onChange={(e) => set({ name: e.target.value })} placeholder="Salon de l’immobilier — décembre" /></label>
            <div>
              <Label help="Où la créa apparaît. Une même campagne peut être à plusieurs endroits.">Emplacements</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {PLACEMENTS.map((p) => (
                  <label key={p.id} className={"flex cursor-pointer gap-3 rounded-xl border p-3 transition " + (c.placements?.includes(p.id) ? "border-brand-600 bg-brand-50/60" : "border-slate-200 hover:border-slate-300")}>
                    <input type="checkbox" className="mt-1 accent-brand-700" checked={!!c.placements?.includes(p.id)} onChange={() => toggleIn("placements", p.id)} />
                    <span><span className="block text-sm font-semibold text-ink">{p.label}</span><span className="text-xs text-muted">{p.help}</span></span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-ink">Créa</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="self-center text-xs text-muted">Modèles :</span>
                {PRESETS.map((p) => <button key={p.label} type="button" onClick={() => set(p.v)} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold hover:border-ink">{p.label}</button>)}
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {TEMPLATES.map((t) => (
                <button key={t.id} type="button" onClick={() => set({ template: t.id })}
                  className={"rounded-xl border p-3 text-left transition " + (c.template === t.id ? "border-ink ring-2 ring-ink/10" : "border-slate-200 hover:border-slate-300")}>
                  <span className="block text-sm font-semibold text-ink">{t.label}</span><span className="text-xs text-muted">{t.help}</span>
                </button>
              ))}
            </div>
            <div><Label help={c.template === "image" ? "Format conseillé : 1080 × 1350 (pop-up) ou 1200 × 500 (bannière)." : "Photo d’illustration."}>{c.template === "image" ? "Flyer / visuel" : "Image"}</Label>
              <FieldEditor f={{ key: "imageUrl", label: "", type: "image" }} value={c.imageUrl} onChange={(v) => set({ imageUrl: v })} types={[]} /></div>
            {c.template !== "image" ? (
              <>
                <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
                  <label className="block"><Label>Titre</Label><input className="input" value={c.title ?? ""} onChange={(e) => set({ title: e.target.value })} /></label>
                  <label className="block"><Label>Pastille</Label><input className="input" value={c.badge ?? ""} onChange={(e) => set({ badge: e.target.value })} placeholder="Plateforme agréée" /></label>
                </div>
                <label className="block"><Label>Texte</Label><textarea className="input min-h-[70px]" value={c.text ?? ""} onChange={(e) => set({ text: e.target.value })} /></label>
                <div className="grid grid-cols-3 gap-3">
                  {([["bgColor", "Fond"], ["textColor", "Texte"], ["ctaColor", "Bouton"]] as const).map(([k, l]) => (
                    <label key={k} className="block"><Label>{l}</Label>
                      <span className="flex items-center gap-2 rounded-md border border-slate-300 px-2 py-1.5">
                        <input type="color" value={(c[k] as string) ?? "#000000"} onChange={(e) => set({ [k]: e.target.value } as Partial<Campaign>)} className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0" />
                        <span className="font-mono text-xs">{c[k] as string}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
              <label className="block"><Label>Texte du bouton</Label><input className="input" value={c.ctaLabel ?? ""} onChange={(e) => set({ ctaLabel: e.target.value })} placeholder="Je m’inscris" /></label>
              <label className="block"><Label help="Page du site, lien externe, tel:, WhatsApp… Dans l’appli, les liens moboo.ci s’ouvrent dans l’appli.">Lien au clic</Label>
                <input className="input" value={c.ctaUrl ?? ""} onChange={(e) => set({ ctaUrl: e.target.value })} placeholder="/annonces?… ou https://…" /></label>
            </div>
            <div className="flex flex-wrap gap-1.5">{LINKS.map(([l, h]) => <button key={l} type="button" onClick={() => set({ ctaUrl: h })} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200">{l}</button>)}</div>
          </section>

          <section className="grid gap-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-2">
            <label className="block"><Label>Début</Label><input type="datetime-local" className="input" value={toLocal(c.startsAt)} onChange={(e) => set({ startsAt: e.target.value || null })} /></label>
            <label className="block"><Label>Fin (vide : sans fin)</Label><input type="datetime-local" className="input" value={toLocal(c.endsAt)} onChange={(e) => set({ endsAt: e.target.value || null })} /></label>
            <label className="block"><Label>Public</Label>
              <select className="input" value={c.audience} onChange={(e) => set({ audience: e.target.value as Campaign["audience"] })}>
                <option value="all">Tout le monde</option><option value="guests">Visiteurs non connectés</option><option value="members">Utilisateurs connectés</option>
              </select></label>
            <div><Label help="Aucune case : les deux.">Téléphones</Label>
              <div className="flex gap-4 pt-2 text-sm">{[["android", "Android"], ["ios", "iPhone"]].map(([v, l]) => <label key={v} className="inline-flex items-center gap-2"><input type="checkbox" className="accent-brand-700" checked={!!c.platforms?.includes(v)} onChange={() => toggleIn("platforms", v)} />{l}</label>)}</div></div>
            {hasPopup ? (
              <>
                <label className="block"><Label>Fréquence du pop-up</Label>
                  <select className="input" value={c.frequency} onChange={(e) => set({ frequency: e.target.value as Campaign["frequency"] })}>
                    <option value="once">Une seule fois</option><option value="daily">Une fois par jour</option><option value="always">À chaque ouverture</option>
                  </select></label>
                <label className="block"><Label>Délai avant affichage (secondes)</Label><input type="number" min={0} max={30} className="input" value={c.delaySec ?? 2} onChange={(e) => set({ delaySec: Number(e.target.value) })} /></label>
                <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" className="accent-brand-700" checked={c.dismissible !== false} onChange={(e) => set({ dismissible: e.target.checked })} />Proposer « Ne plus afficher »</label>
              </>
            ) : null}
            <label className="block"><Label help="Plus élevée = affichée en premier.">Priorité</Label><input type="number" min={-100} max={100} className="input" value={c.priority ?? 0} onChange={(e) => set({ priority: Number(e.target.value) })} /></label>
          </section>
        </div>

        <aside className="space-y-3 xl:sticky xl:top-40 xl:h-fit">
          <div className="flex justify-center gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200">
            {([["popup", "Pop-up"], ["banner", "Bannière"]] as const).map(([m, l]) => (
              <button key={m} type="button" onClick={() => setPreview(m)} className={"flex-1 rounded-full px-3 py-1.5 text-sm font-semibold " + (preview === m ? "bg-ink text-white" : "text-slate-600")}>{l}</button>
            ))}
          </div>
          <PhonePreview c={c as Creative & { dismissible?: boolean }} mode={preview} />
          <p className="text-center text-xs text-muted">Aperçu dans l’application. Sur le site, la créa garde la même présentation.</p>
        </aside>
      </div>
    </div>
  );
}
