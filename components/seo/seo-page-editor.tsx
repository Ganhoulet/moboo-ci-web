"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { analyze, type Check, type Level } from "@/lib/seo-analysis";
import type { SeoPage } from "@/lib/seo";
import { deleteSeoPageAction, saveSeoPageAction } from "@/app/admin/seo/actions";
import { RichEditor } from "./rich-editor";

type Opt = { value: string; label: string };

/** Pages existantes du site dont on peut régler le SEO et le texte de bas de page. */
export const SITE_PAGES: Opt[] = [
  { value: "/", label: "Accueil" }, { value: "/annonces", label: "Annonces (recherche)" }, { value: "/forfaits", label: "Forfaits" },
  { value: "/publier", label: "Publier une annonce" }, { value: "/reserver", label: "Réserver" }, { value: "/favoris", label: "Favoris" },
  { value: "/inscription", label: "Inscription" },
];
const TX: Opt[] = [
  { value: "", label: "Toutes" }, { value: "rent", label: "À louer" }, { value: "sale", label: "À vendre" },
  { value: "furnished", label: "Meublés (réservables)" }, { value: "event", label: "Espaces événementiels" },
];

const DOT: Record<Level, string> = { good: "bg-emerald-500", ok: "bg-amber-400", bad: "bg-red-500" };
const LABEL: Record<Level, string> = { good: "Bon", ok: "À améliorer", bad: "Problème" };
const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/['’]/g, "-").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function Checks({ list }: { list: Check[] }) {
  return (
    <ul className="space-y-2">
      {list.map((c) => (
        <li key={c.id} className="flex gap-2 text-sm text-slate-700">
          <span className={"mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full " + DOT[c.level]} title={LABEL[c.level]} />
          <span>{c.text}</span>
        </li>
      ))}
    </ul>
  );
}

function Counter({ value, min, max }: { value: number; min: number; max: number }) {
  const pct = Math.min(100, (value / (max * 1.15)) * 100);
  const color = value >= min && value <= max ? "bg-emerald-500" : value > 0 && value <= max * 1.12 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200"><div className={"h-full " + color} style={{ width: `${pct}%` }} /></div>
      <span className="w-16 text-right text-[11px] tabular-nums text-muted">{value} / {max}</span>
    </div>
  );
}

/** Aperçu du résultat Google (ordinateur ou téléphone). */
function GooglePreview({ title, desc, url, mobile }: { title: string; desc: string; url: string; mobile: boolean }) {
  const t = title.length > (mobile ? 78 : 60) ? `${title.slice(0, mobile ? 76 : 58)}…` : title;
  const d = desc.length > (mobile ? 120 : 156) ? `${desc.slice(0, mobile ? 118 : 154)} …` : desc;
  return (
    <div className={"rounded-xl border border-slate-200 bg-white p-4 " + (mobile ? "max-w-[360px]" : "")}>
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-[10px] font-black text-brand-800">M</span>
        <span className="min-w-0 leading-tight">
          <span className="block text-[13px] text-[#202124]">Moboo</span>
          <span className="block truncate text-[12px] text-[#4d5156]">{url}</span>
        </span>
      </div>
      <p className="mt-1.5 text-[19px] leading-snug text-[#1a0dab] hover:underline" style={{ fontFamily: "arial,sans-serif" }}>{t || "Titre SEO de la page"}</p>
      <p className="mt-1 text-[13.5px] leading-snug text-[#4d5156]" style={{ fontFamily: "arial,sans-serif" }}>{d || "Méta-description : le texte qui donne envie de cliquer depuis Google."}</p>
    </div>
  );
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-ink">{label}{help ? <span className="block text-xs font-normal text-muted">{help}</span> : null}</span>
      {children}
    </label>
  );
}

const EMPTY: Partial<SeoPage> = {
  kind: "landing", status: "draft", slug: "", title: "", seoTitle: "", metaDescription: "", focusKeyword: "", canonical: "",
  noindex: false, ogImage: "", intro: "", content: "", filters: {}, perPage: 12, sort: null, hubTab: "", hubColumn: "", hubLabel: "", hubOrder: 0,
};

export function SeoPageEditor({ initial, types, siteUrl, columns, tabs }: {
  initial?: SeoPage; types: Opt[]; siteUrl: string; columns: string[]; tabs: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [p, setP] = useState<Partial<SeoPage>>(() => initial ?? { ...EMPTY, kind: params.get("type") === "page" ? "override" : "landing", slug: params.get("type") === "page" ? "/" : "" });
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [tab, setTab] = useState<"seo" | "read">("seo");
  const [mobile, setMobile] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(params.get("enregistre") === "1" ? { ok: true, text: "Page créée." } : null);
  const [pending, start] = useTransition();
  const set = (patch: Partial<SeoPage>) => { setP((x) => ({ ...x, ...patch })); setMsg(null); };
  const f = p.filters ?? {};
  const landing = p.kind !== "override";

  const result = useMemo(() => analyze({
    keyword: p.focusKeyword ?? "", seoTitle: p.seoTitle ?? "", title: p.title ?? "", metaDescription: p.metaDescription ?? "",
    slug: p.slug ?? "", intro: p.intro ?? "", content: p.content ?? "",
  }), [p.focusKeyword, p.seoTitle, p.title, p.metaDescription, p.slug, p.intro, p.content]);

  const path = landing ? `/${p.slug || "adresse-de-la-page"}` : p.slug || "/";
  const displayUrl = `${siteUrl.replace(/^https?:\/\//, "")}${path === "/" ? "" : path.replace(/\//g, " › ").replace(/^ › /, " › ")}`;

  const save = (status?: "draft" | "published") => start(async () => {
    const body = { ...p, ...(status ? { status } : {}) };
    const r = await saveSeoPageAction(initial?.id ?? null, body);
    if (!r.ok) return setMsg({ ok: false, text: r.error ?? "Enregistrement impossible." });
    if (status) setP((x) => ({ ...x, status }));
    setMsg({ ok: true, text: (status ?? p.status) === "published" ? "Enregistré et publié (en ligne dans la minute)." : "Brouillon enregistré." });
    if (!initial && r.id) router.replace(`/admin/seo/${r.id}?enregistre=1`);
  });

  return (
    <div className="space-y-4">
      <div className="sticky top-16 z-30 -mx-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-100/95 px-3 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="min-w-0">
          <a href="/admin/seo" className="text-sm font-semibold text-muted hover:text-ink">← Pages SEO</a>
          <h1 className="truncate font-display text-2xl font-extrabold text-ink">{p.title || (landing ? "Nouvelle page SEO" : "SEO d’une page du site")}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {msg ? <span className={"text-sm font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</span> : null}
          <span className={"rounded-full px-2.5 py-1 text-xs font-bold " + (p.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700")}>{p.status === "published" ? "Publiée" : "Brouillon"}</span>
          {initial && p.status === "published" ? <a href={path} target="_blank" rel="noopener noreferrer" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold">Voir la page ↗</a> : null}
          <button type="button" disabled={pending} onClick={() => save("draft")} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-60">Enregistrer le brouillon</button>
          <button type="button" disabled={pending} onClick={() => save("published")} className="rounded-md bg-accent-600 px-5 py-2 text-sm font-bold text-white hover:bg-accent-700 disabled:opacity-60">{pending ? "…" : "Publier"}</button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <section className="space-y-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            {landing ? (
              <>
                <Field label="Titre de la page (H1)" help="Le grand titre affiché en haut de la page.">
                  <input className="input text-lg font-semibold" value={p.title ?? ""} placeholder="Maisons à louer à Cocody"
                    onChange={(e) => set({ title: e.target.value, ...(!slugTouched ? { slug: slugify(e.target.value) } : {}) })} />
                </Field>
                <Field label="Adresse de la page" help="Gardez l’adresse de l’ancien site pour conserver le référencement.">
                  <div className="flex items-center rounded-md border border-slate-300 bg-white focus-within:border-brand-600">
                    <span className="pl-3 text-sm text-muted">{siteUrl.replace(/^https?:\/\//, "")}/</span>
                    <input className="w-full bg-transparent py-2 pr-3 text-sm outline-none" value={p.slug ?? ""} onChange={(e) => { setSlugTouched(true); set({ slug: e.target.value.toLowerCase() }); }} />
                  </div>
                </Field>
              </>
            ) : (
              <>
                <Field label="Page du site" help="Le titre SEO, la méta-description et le texte ci-dessous s’appliquent à cette page.">
                  <select className="input" value={p.slug ?? "/"} onChange={(e) => set({ slug: e.target.value, title: SITE_PAGES.find((x) => x.value === e.target.value)?.label ?? p.title })}>
                    {SITE_PAGES.map((o) => <option key={o.value} value={o.value}>{o.label} ({o.value})</option>)}
                  </select>
                </Field>
                <Field label="Nom interne"><input className="input" value={p.title ?? ""} onChange={(e) => set({ title: e.target.value })} /></Field>
              </>
            )}
          </section>

          {landing ? (
            <section className="space-y-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="font-semibold text-ink">Annonces affichées</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Transaction">
                  <select className="input" value={f.transaction ?? ""} onChange={(e) => set({ filters: { ...f, transaction: (e.target.value || undefined) as never } })}>
                    {TX.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="Type de bien">
                  <select className="input" value={f.propertyType ?? ""} disabled={f.transaction === "furnished" || f.transaction === "event"} onChange={(e) => set({ filters: { ...f, propertyType: e.target.value || undefined } })}>
                    <option value="">Tous les types</option>
                    {types.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="Ville, commune ou quartier">
                  <input className="input" value={f.q ?? ""} placeholder="Cocody" onChange={(e) => set({ filters: { ...f, q: e.target.value || undefined } })} />
                </Field>
                <Field label="Prix minimum (FCFA)"><input type="number" className="input" value={f.priceMin ?? ""} onChange={(e) => set({ filters: { ...f, priceMin: Number(e.target.value) || undefined } })} /></Field>
                <Field label="Prix maximum (FCFA)"><input type="number" className="input" value={f.priceMax ?? ""} onChange={(e) => set({ filters: { ...f, priceMax: Number(e.target.value) || undefined } })} /></Field>
                <Field label="Annonces affichées"><input type="number" min={3} max={48} className="input" value={p.perPage ?? 12} onChange={(e) => set({ perPage: Number(e.target.value) })} /></Field>
              </div>
              <Field label="Texte d’introduction (facultatif)" help="Une ou deux phrases sous le titre, avant les annonces.">
                <textarea className="input min-h-[70px]" value={p.intro ?? ""} onChange={(e) => set({ intro: e.target.value })} />
              </Field>
            </section>
          ) : null}

          <section className="space-y-2 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="font-semibold text-ink">{landing ? "Texte SEO (sous les annonces)" : "Texte SEO en bas de la page"}</p>
            <p className="text-xs text-muted">Le texte qui fait monter la page dans Google : sous-titres (H2), paragraphes, liens vers les autres pages de Moboo. {result.words} mots.</p>
            <RichEditor value={p.content ?? ""} onChange={(v) => set({ content: v })} />
          </section>

          {landing ? (
            <section className="space-y-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="font-semibold text-ink">Bloc « Liens SEO » de l’accueil</p>
              <p className="text-xs text-muted">Où apparaît le lien vers cette page dans le bloc de liens (onglet = ville, colonne = catégorie).</p>
              <div className="grid gap-3 sm:grid-cols-4">
                <Field label="Onglet"><input className="input" list="seo-tabs" value={p.hubTab ?? ""} onChange={(e) => set({ hubTab: e.target.value })} placeholder="Abidjan" /></Field>
                <Field label="Colonne"><input className="input" list="seo-cols" value={p.hubColumn ?? ""} onChange={(e) => set({ hubColumn: e.target.value })} placeholder="Maisons à louer" /></Field>
                <Field label="Texte du lien"><input className="input" value={p.hubLabel ?? ""} onChange={(e) => set({ hubLabel: e.target.value })} placeholder={p.title || "Titre de la page"} /></Field>
                <Field label="Ordre"><input type="number" className="input" value={p.hubOrder ?? 0} onChange={(e) => set({ hubOrder: Number(e.target.value) })} /></Field>
              </div>
              <datalist id="seo-tabs">{tabs.map((t) => <option key={t} value={t} />)}</datalist>
              <datalist id="seo-cols">{columns.map((t) => <option key={t} value={t} />)}</datalist>
            </section>
          ) : null}

          {initial ? (
            <div className="text-right">
              <button type="button" disabled={pending} onClick={() => window.confirm("Supprimer cette page ? Son adresse ne répondra plus (pensez au référencement).") && start(async () => { await deleteSeoPageAction(initial.id); router.push("/admin/seo"); })}
                className="text-sm font-semibold text-red-600">Supprimer la page</button>
            </div>
          ) : null}
        </div>

        {/* Panneau SEO façon Yoast */}
        <aside className="space-y-4 xl:sticky xl:top-40 xl:h-fit">
          <section className="space-y-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink">Référencement (SEO)</p>
              <span className="flex gap-3 text-xs font-semibold text-muted">
                <span className="flex items-center gap-1"><span className={"h-2.5 w-2.5 rounded-full " + DOT[result.seoScore]} />SEO</span>
                <span className="flex items-center gap-1"><span className={"h-2.5 w-2.5 rounded-full " + DOT[result.readScore]} />Lisibilité</span>
              </span>
            </div>
            <Field label="Mot-clé principal" help="L’expression pour laquelle la page doit sortir dans Google.">
              <input className="input" value={p.focusKeyword ?? ""} onChange={(e) => set({ focusKeyword: e.target.value })} placeholder="maisons à louer Cocody" />
            </Field>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">Aperçu Google</span>
                <span className="flex rounded-full bg-slate-100 p-0.5 text-xs font-semibold">
                  {[["Ordinateur", false], ["Téléphone", true]].map(([l, m]) => (
                    <button key={String(l)} type="button" onClick={() => setMobile(m as boolean)} className={"rounded-full px-2.5 py-1 " + (mobile === m ? "bg-white shadow-sm" : "text-slate-500")}>{l as string}</button>
                  ))}
                </span>
              </div>
              <GooglePreview title={p.seoTitle || p.title || ""} desc={p.metaDescription ?? ""} url={displayUrl} mobile={mobile} />
            </div>
            <Field label="Titre SEO" help="Le titre bleu dans Google.">
              <input className="input" value={p.seoTitle ?? ""} placeholder={p.title ? `${p.title} | Moboo` : ""} onChange={(e) => set({ seoTitle: e.target.value })} />
              <Counter value={(p.seoTitle || p.title || "").length} min={30} max={60} />
            </Field>
            <Field label="Méta-description" help="Le texte gris sous le titre dans Google.">
              <textarea className="input min-h-[84px]" value={p.metaDescription ?? ""} onChange={(e) => set({ metaDescription: e.target.value })} />
              <Counter value={(p.metaDescription ?? "").length} min={120} max={156} />
            </Field>

            <div className="flex rounded-full bg-slate-100 p-0.5 text-sm font-semibold">
              {([["seo", "Analyse SEO", result.seoScore], ["read", "Lisibilité", result.readScore]] as const).map(([id, l, s]) => (
                <button key={id} type="button" onClick={() => setTab(id)} className={"flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 " + (tab === id ? "bg-white shadow-sm" : "text-slate-500")}>
                  <span className={"h-2 w-2 rounded-full " + DOT[s]} />{l}
                </button>
              ))}
            </div>
            <Checks list={tab === "seo" ? result.seo : result.read} />
          </section>

          <details className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <summary className="cursor-pointer text-sm font-semibold text-ink">Réglages avancés</summary>
            <div className="mt-3 space-y-3">
              <Field label="Adresse canonique" help="Vide : l’adresse de la page."><input className="input" value={p.canonical ?? ""} onChange={(e) => set({ canonical: e.target.value })} placeholder="https://…" /></Field>
              <Field label="Image de partage (réseaux sociaux)"><input className="input" value={p.ogImage ?? ""} onChange={(e) => set({ ogImage: e.target.value })} placeholder="https://…/image.jpg" /></Field>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-700" checked={!!p.noindex} onChange={(e) => set({ noindex: e.target.checked })} />Ne pas indexer dans Google (noindex)</label>
            </div>
          </details>
        </aside>
      </div>
    </div>
  );
}
