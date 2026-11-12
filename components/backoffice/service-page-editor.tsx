"use client";

import { useState, useTransition } from "react";
import { saveServicePage } from "@/app/admin/services/actions";
import { uploadHelpImageAction } from "@/app/admin/aide/actions";
import type { PageField, PageFieldType, ServicePage } from "@/lib/site-services";

const inp = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-600";
const lab = "mb-1 block text-xs font-semibold text-slate-600";
const card = "rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200";
const small = "rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-30";
const TYPES: [PageFieldType, string][] = [["text", "Texte court"], ["number", "Nombre"], ["select", "Liste de choix"], ["textarea", "Texte long"], ["date", "Date"]];

/** Photo réduite dans le navigateur (1600 px, JPEG) avant l'envoi. */
async function shrinkPhoto(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.width * scale)); c.height = Math.max(1, Math.round(img.height * scale));
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.82);
  } finally { URL.revokeObjectURL(url); }
}

function ImageInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [busy, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <div>
      <span className={lab}>{label}</span>
      <div className="flex gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {value ? <img src={value} alt="" className="h-16 w-24 shrink-0 rounded-md object-cover ring-1 ring-slate-200" /> : <span className="grid h-16 w-24 shrink-0 place-items-center rounded-md bg-slate-100 text-[10px] text-muted">Aucune</span>}
        <div className="min-w-0 flex-1 space-y-1.5">
          <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… (lien d’une photo)" className={inp} />
          <label className={"inline-block cursor-pointer rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-200 " + (busy ? "opacity-60" : "")}>
            {busy ? "Envoi…" : "Téléverser une photo"}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={busy} onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setErr(null);
              start(async () => { const r = await uploadHelpImageAction(await shrinkPhoto(file)); if (r.ok && r.url) onChange(r.url); else setErr(r.error ?? "Envoi impossible."); });
            }} />
          </label>
          {err ? <p className="text-xs text-red-600">{err}</p> : null}
        </div>
      </div>
    </div>
  );
}

/** Liste modifiable (ajouter, monter, descendre, supprimer). */
function ListEditor<T>({ items, onChange, make, render, addLabel, max = 12 }: { items: T[]; onChange: (v: T[]) => void; make: () => T; render: (x: T, set: (v: T) => void) => React.ReactNode; addLabel: string; max?: number }) {
  const move = (i: number, d: number) => { const o = [...items]; const [x] = o.splice(i, 1); o.splice(i + d, 0, x); onChange(o); };
  return (
    <div className="space-y-3">
      {items.map((x, i) => (
        <div key={i} className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
          <div className="mb-2 flex justify-end gap-1">
            <button type="button" className={small} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Monter">↑</button>
            <button type="button" className={small} disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Descendre">↓</button>
            <button type="button" className={small + " text-red-700"} onClick={() => onChange(items.filter((_, k) => k !== i))}>Supprimer</button>
          </div>
          {render(x, (v) => onChange(items.map((y, k) => (k === i ? v : y))))}
        </div>
      ))}
      {items.length < max ? <button type="button" onClick={() => onChange([...items, make()])} className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-brand-700 ring-1 ring-brand-200">+ {addLabel}</button> : null}
    </div>
  );
}

function Text({ label, value, onChange, area, rows = 3, placeholder }: { label: string; value: string; onChange: (v: string) => void; area?: boolean; rows?: number; placeholder?: string }) {
  return <label className="block"><span className={lab}>{label}</span>{area ? <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inp} /> : <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inp} />}</label>;
}

/** Back-office → Services Moboo → Pages des services : contenu complet d'une page de service. */
export function ServicePageEditor({ serviceKey, title, initial, href }: { serviceKey: string; title: string; initial: ServicePage; href: string }) {
  const [p, setP] = useState<ServicePage>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof ServicePage>(k: K, v: ServicePage[K]) => setP((x) => ({ ...x, [k]: v }));
  const save = () => start(async () => {
    setMsg(null);
    const r = await saveServicePage(serviceKey, p);
    if (r.ok && r.page) { setP(r.page as ServicePage); setMsg({ ok: true, text: "Page enregistrée. Elle est en ligne d’ici 2 minutes." }); }
    else setMsg({ ok: false, text: r.error ?? "Enregistrement impossible." });
  });

  return (
    <div className="space-y-5 pb-24">
      <div className={card + " flex flex-wrap items-center justify-between gap-3"}>
        <label className="flex items-center gap-3 text-sm font-semibold text-ink">
          <input type="checkbox" checked={p.enabled} onChange={(e) => set("enabled", e.target.checked)} className="h-5 w-5" />
          Afficher la page détaillée de « {title} »
        </label>
        <a href={href} target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand-700 underline">Voir la page en ligne ↗</a>
        <p className="w-full text-xs text-muted">Décochée, la page garde la présentation simple (titre, texte et formulaire). Le titre, le texte d’introduction et le prix se règlent dans Réglages › Services du site.</p>
      </div>

      <section className={card + " space-y-4"}>
        <h2 className="font-display text-lg font-bold text-ink">Couverture</h2>
        <ImageInput label="Grande photo du haut" value={p.heroImage} onChange={(v) => set("heroImage", v)} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Text label="Description de la photo (accessibilité)" value={p.heroAlt} onChange={(v) => set("heroAlt", v)} />
          <Text label="Pastille au-dessus du titre" value={p.badge} onChange={(v) => set("badge", v)} placeholder="Abidjan · 7 j/7" />
          <Text label="Texte du bouton principal" value={p.cta} onChange={(v) => set("cta", v)} placeholder="Réserver" />
        </div>
      </section>

      <section className={card + " space-y-3"}>
        <h2 className="font-display text-lg font-bold text-ink">Points forts <span className="text-sm font-normal text-muted">(4 conseillés)</span></h2>
        <ListEditor items={p.highlights} onChange={(v) => set("highlights", v)} max={6} addLabel="Ajouter un point fort" make={() => ({ icon: "⭐", title: "", text: "" })}
          render={(x, s) => <div className="grid gap-2 sm:grid-cols-[80px_1fr_2fr]"><Text label="Icône" value={x.icon} onChange={(v) => s({ ...x, icon: v })} /><Text label="Titre" value={x.title} onChange={(v) => s({ ...x, title: v })} /><Text label="Texte" value={x.text} onChange={(v) => s({ ...x, text: v })} /></div>} />
      </section>

      <section className={card + " space-y-3"}>
        <h2 className="font-display text-lg font-bold text-ink">Onglets</h2>
        <div className="grid gap-3 sm:grid-cols-2"><Text label="Titre de la rubrique" value={p.tabsTitle} onChange={(v) => set("tabsTitle", v)} /><Text label="Introduction" value={p.tabsIntro} onChange={(v) => set("tabsIntro", v)} /></div>
        <ListEditor items={p.tabs} onChange={(v) => set("tabs", v)} max={8} addLabel="Ajouter un onglet" make={() => ({ title: "", intro: "", image: "", items: [] })}
          render={(x, s) => (
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-2"><Text label="Nom de l’onglet" value={x.title} onChange={(v) => s({ ...x, title: v })} /><Text label="Phrase d’introduction" value={x.intro} onChange={(v) => s({ ...x, intro: v })} /></div>
              <ImageInput label="Photo de l’onglet" value={x.image} onChange={(v) => s({ ...x, image: v })} />
              <Text area rows={5} label="Points contrôlés / inclus (un par ligne)" value={x.items.join("\n")} onChange={(v) => s({ ...x, items: v.split("\n") })} />
            </div>
          )} />
      </section>

      <section className={card + " space-y-3"}>
        <h2 className="font-display text-lg font-bold text-ink">Étapes</h2>
        <Text label="Titre de la rubrique" value={p.stepsTitle} onChange={(v) => set("stepsTitle", v)} />
        <ListEditor items={p.steps} onChange={(v) => set("steps", v)} max={6} addLabel="Ajouter une étape" make={() => ({ icon: "", title: "", text: "" })}
          render={(x, s) => <div className="grid gap-2 sm:grid-cols-[1fr_2fr]"><Text label="Titre" value={x.title} onChange={(v) => s({ ...x, title: v })} /><Text label="Texte" value={x.text} onChange={(v) => s({ ...x, text: v })} /></div>} />
      </section>

      <section className={card + " space-y-3"}>
        <h2 className="font-display text-lg font-bold text-ink">Formules et tarifs</h2>
        <div className="grid gap-3 sm:grid-cols-2"><Text label="Titre de la rubrique" value={p.offersTitle} onChange={(v) => set("offersTitle", v)} /><Text label="Phrase sous le titre" value={p.offersIntro} onChange={(v) => set("offersIntro", v)} /></div>
        <ListEditor items={p.offers} onChange={(v) => set("offers", v)} max={6} addLabel="Ajouter une formule" make={() => ({ name: "", price: "", period: "", items: [], featured: false })}
          render={(x, s) => (
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-3"><Text label="Nom" value={x.name} onChange={(v) => s({ ...x, name: v })} /><Text label="Prix" value={x.price} onChange={(v) => s({ ...x, price: v })} placeholder="15 000 FCFA" /><Text label="Unité" value={x.period} onChange={(v) => s({ ...x, period: v })} placeholder="le passage" /></div>
              <Text area rows={3} label="Inclus (un par ligne)" value={x.items.join("\n")} onChange={(v) => s({ ...x, items: v.split("\n") })} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={x.featured} onChange={(e) => s({ ...x, featured: e.target.checked })} />Mettre en avant (« Le plus choisi »)</label>
            </div>
          )} />
      </section>

      <section className={card + " space-y-3"}>
        <h2 className="font-display text-lg font-bold text-ink">Galerie de photos</h2>
        <ListEditor items={p.gallery} onChange={(v) => set("gallery", v)} max={8} addLabel="Ajouter une photo" make={() => ""}
          render={(x, s) => <ImageInput label="Photo" value={x} onChange={s} />} />
      </section>

      <section className={card + " space-y-4"}>
        <h2 className="font-display text-lg font-bold text-ink">Formulaire de demande</h2>
        <p className="text-sm text-muted">Nom, téléphone, commune, quartier, type de bien, date, e-mail et précisions sont toujours demandés. Ajoutez ici les questions propres à ce service : les réponses arrivent avec la demande (Missions ou États des lieux).</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Text label="Titre" value={p.formTitle} onChange={(v) => set("formTitle", v)} />
          <Text label="Texte du bouton d’envoi" value={p.submitText} onChange={(v) => set("submitText", v)} />
          <Text label="Phrase sous le titre" value={p.formIntro} onChange={(v) => set("formIntro", v)} />
          <Text label="Message après l’envoi" value={p.successText} onChange={(v) => set("successText", v)} />
        </div>
        <ListEditor<PageField> items={p.fields} onChange={(v) => set("fields", v)} max={15} addLabel="Ajouter une question" make={() => ({ key: "", label: "", type: "text", options: [], required: false, placeholder: "" })}
          render={(x, s) => (
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr]">
                <Text label="Question" value={x.label} onChange={(v) => s({ ...x, label: v })} />
                <label className="block"><span className={lab}>Type de réponse</span><select value={x.type} onChange={(e) => s({ ...x, type: e.target.value as PageFieldType })} className={inp}>{TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
                <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={x.required} onChange={(e) => s({ ...x, required: e.target.checked })} />Obligatoire</label>
              </div>
              {x.type === "select" ? <Text area rows={3} label="Choix proposés (un par ligne)" value={x.options.join("\n")} onChange={(v) => s({ ...x, options: v.split("\n") })} /> : <Text label="Exemple affiché dans le champ (facultatif)" value={x.placeholder} onChange={(v) => s({ ...x, placeholder: v })} />}
            </div>
          )} />
      </section>

      <section className={card + " space-y-3"}>
        <h2 className="font-display text-lg font-bold text-ink">Questions fréquentes</h2>
        <Text label="Titre de la rubrique" value={p.faqTitle} onChange={(v) => set("faqTitle", v)} />
        <ListEditor items={p.faq} onChange={(v) => set("faq", v)} max={20} addLabel="Ajouter une question" make={() => ({ q: "", a: "" })}
          render={(x, s) => <div className="space-y-2"><Text label="Question" value={x.q} onChange={(v) => s({ ...x, q: v })} /><Text area label="Réponse" value={x.a} onChange={(v) => s({ ...x, a: v })} /></div>} />
      </section>

      <section className={card + " space-y-3"}>
        <h2 className="font-display text-lg font-bold text-ink">Contact</h2>
        <p className="text-sm text-muted">Bloc « Parler à un conseiller » à côté du formulaire. Laissez vide pour le masquer.</p>
        <div className="grid gap-3 sm:grid-cols-2"><Text label="Téléphone" value={p.contactPhone} onChange={(v) => set("contactPhone", v)} /><Text label="WhatsApp" value={p.contactWhatsapp} onChange={(v) => set("contactWhatsapp", v)} /></div>
      </section>

      <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-3 rounded-xl bg-white/95 p-3 shadow-lg ring-1 ring-slate-200 backdrop-blur">
        <button type="button" onClick={save} disabled={pending} className="rounded-md bg-ink px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{pending ? "Enregistrement…" : "Enregistrer la page"}</button>
        {msg ? <p className={"text-sm " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
      </div>
    </div>
  );
}

