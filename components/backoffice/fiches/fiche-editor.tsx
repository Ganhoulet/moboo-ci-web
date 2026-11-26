"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { FicheSheets, ficheCss } from "@/components/fiches/fiche-sheets";
import { duplicateDocumentAction } from "@/app/admin/documents/actions";
import { saveFicheAction, searchFicheListingsAction, type FicheDoc, type FicheSearch, type FicheSearchResult } from "@/app/admin/fiches/actions";
import { cellMetrics, COMMUNES, DESIGNS, faces, formatAmount, pageScale, PAPERS, perFace, TX_LABEL, type FicheData, type FicheItem, type FicheSettings, type FicheTx, type PaperKey } from "@/lib/fiches/fiche";

const TYPES = [["", "Tous les types"], ["appartement", "Appartement"], ["maison", "Maison"], ["villa", "Villa"], ["studio", "Studio"], ["duplex", "Duplex"], ["immeuble", "Immeuble"], ["magasin", "Magasin"], ["bureau", "Bureau"], ["terrain", "Terrain"], ["entrepot", "Entrepôt"]];
const input = "w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-600 focus:outline-none";
const btn = "rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50";

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="block text-sm"><span className="mb-1 block font-semibold text-slate-700">{label}</span>{children}{hint ? <span className="mt-0.5 block text-xs text-muted">{hint}</span> : null}</label>;
}
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>;
}

/** Générateur de fiches d'annonces : sélection, mise en page, textes, aperçu et export PDF. */
export function FicheEditor({ doc }: { doc: FicheDoc }) {
  const router = useRouter();
  const [meta, setMeta] = useState({ title: doc.title, edition: doc.edition, editionDate: doc.editionDate, status: doc.status });
  const [data, setData] = useState<FicheData>(doc.data);
  const [tab, setTab] = useState<"annonces" | "page" | "textes">("annonces");
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, startSave] = useTransition();
  const [origin, setOrigin] = useState("https://moboo.ci");
  const [zoom, setZoom] = useState(0.55);
  useEffect(() => setOrigin(window.location.origin), []);

  const s = data.settings;
  const base = (s.siteBase.trim() || origin).replace(/\/+$/, "");
  const setS = (p: Partial<FicheSettings>) => { setData((d) => ({ ...d, settings: { ...d.settings, ...p } })); setDirty(true); };
  const setItems = (f: (l: FicheItem[]) => FicheItem[]) => { setData((d) => ({ ...d, items: f(d.items) })); setDirty(true); };
  const setM = (p: Partial<typeof meta>) => { setMeta((m) => ({ ...m, ...p })); setDirty(true); };

  useEffect(() => {
    const before = document.title;
    document.title = `${meta.title} - édition ${meta.edition}`;
    return () => { document.title = before; };
  }, [meta.title, meta.edition]);
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const save = () => startSave(async () => {
    const r = await saveFicheAction(doc.id, meta, data);
    setMsg(r.ok ? { ok: true, text: "Enregistré." } : { ok: false, text: r.error ?? "Enregistrement impossible." });
    if (r.ok) setDirty(false);
  });
  const nextEdition = () => startSave(async () => {
    if (dirty) { const r = await saveFicheAction(doc.id, meta, data); if (!r.ok) { setMsg({ ok: false, text: r.error ?? "Enregistrement impossible." }); return; } }
    const r = await duplicateDocumentAction(doc.id, "edition");
    if (r.ok && r.id) { setDirty(false); router.push(`/admin/fiches/${r.id}`); } else setMsg({ ok: false, text: r.error ?? "Copie impossible." });
  });

  const m = cellMetrics(s);
  const { w, h } = pageScale(s);
  const nFaces = faces(data.items, s).length;

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: ficheCss(s) + `
        @media screen { .fz-sheets { display: flex; flex-direction: column; align-items: center; gap: 20px; } .fz-sheets .fz-page { box-shadow: 0 6px 24px rgba(15,23,42,.18); } }
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; min-height: 0 !important; height: auto !important; }
          main { padding: 0 !important; }
          div:has(> aside), div:has(> main) { display: block !important; min-height: 0 !important; background: #fff !important; max-width: none !important; }
          body > *:not(:has(.fz-sheets)) { display: none !important; }
          .fz-noprint { display: none !important; }
          .fz-wrap { display: block !important; }
          .fz-preview { overflow: visible !important; max-height: none !important; background: none !important; padding: 0 !important; border: 0 !important; }
          .fz-sheets { zoom: 1 !important; }
          .fz-sheets .fz-page { break-after: page; page-break-after: always; box-shadow: none !important; }
          .fz-sheets .fz-page:last-child { break-after: auto; page-break-after: auto; }
        }` }} />

      <div className="fz-noprint mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <Link href="/admin/fiches" className="text-sm text-brand-700 hover:underline">← Fiches</Link>
        <input className={input + " max-w-xs font-semibold"} value={meta.title} onChange={(e) => setM({ title: e.target.value })} aria-label="Nom de la fiche" />
        <span className="text-sm text-muted">{data.items.length} annonce{data.items.length > 1 ? "s" : ""} · {nFaces} face{nFaces > 1 ? "s" : ""} · {s.paper === "custom" ? `${w} × ${h} mm` : s.paper}</span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {msg ? <span className={"text-sm font-semibold " + (msg.ok ? "text-emerald-700" : "text-red-700")}>{msg.text}</span> : null}
          {dirty ? <span className="text-xs text-amber-700">Modifications non enregistrées</span> : null}
          <button type="button" className={btn} onClick={nextEdition} disabled={saving} title="Copie cette fiche en édition n° suivante">Édition suivante</button>
          <button type="button" className={btn} onClick={save} disabled={saving}>{saving ? "…" : "Enregistrer"}</button>
          <button type="button" onClick={() => window.print()} className="rounded-md bg-brand-700 px-4 py-1.5 text-sm font-bold text-white hover:bg-brand-800">Exporter en PDF</button>
        </div>
        <p className="w-full text-xs text-muted">PDF : dans la fenêtre d’impression, choisissez « Enregistrer au format PDF », marges « Aucune » et cochez « Graphiques d’arrière-plan » (Chrome conseillé). Pour l’imprimeur, recto-verso « bord long ».</p>
      </div>

      <div className="fz-wrap grid gap-4 lg:grid-cols-[400px_1fr]">
        <div className="fz-noprint space-y-3">
          <div className="flex rounded-lg bg-slate-100 p-1 text-sm font-semibold">
            {([["annonces", "Annonces"], ["page", "Mise en page"], ["textes", "Textes"]] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setTab(k)} className={"flex-1 rounded-md px-3 py-1.5 " + (tab === k ? "bg-white text-ink shadow-sm" : "text-slate-600")}>{l}</button>
            ))}
          </div>
          {tab === "annonces" ? <ListingsPanel items={data.items} setItems={setItems} max={perFace(s)} /> : null}
          {tab === "page" ? <LayoutPanel s={s} setS={setS} qrPrinted={m.qrPrinted} base={base} origin={origin} /> : null}
          {tab === "textes" ? <TextsPanel s={s} setS={setS} meta={meta} setM={setM} faces={nFaces} /> : null}
        </div>

        <div className="fz-preview max-h-[calc(100vh-140px)] overflow-auto rounded-lg bg-slate-200 p-4">
          <div className="fz-noprint mb-2 flex items-center justify-end gap-2 text-xs text-slate-600">Zoom
            <input type="range" min={0.3} max={1} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
          </div>
          <div className="fz-sheets" style={{ zoom }}>
            <FicheSheets data={data} meta={{ edition: meta.edition, editionDate: meta.editionDate }} base={base} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Annonces : recherche, sélection, ordre ────────────────────────────────
function ListingsPanel({ items, setItems, max }: { items: FicheItem[]; setItems: (f: (l: FicheItem[]) => FicheItem[]) => void; max: number }) {
  const [f, setF] = useState<FicheSearch>({ tx: "rent", commune: "Yopougon", complete: true, page: 1 });
  const [res, setRes] = useState<FicheSearchResult | null>(null);
  const [loading, start] = useTransition();
  const picked = useMemo(() => new Set(items.map((x) => x.key)), [items]);
  const run = (page = 1) => start(async () => { const r = await searchFicheListingsAction({ ...f, page }); setRes(r); });
  // Pas deux fois le même bien (même annonce ou même photo).
  const add = (l: FicheItem[]) => setItems((cur) => [...cur, ...l.filter((x) => !cur.some((c) => c.key === x.key || (!!x.image && c.image === x.image)))]);
  const move = (i: number, d: number) => setItems((cur) => { const a = [...cur]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; });
  const edit = (i: number, p: Partial<FicheItem>) => setItems((cur) => cur.map((x, k) => (k === i ? { ...x, ...p } : x)));
  const fresh = res?.items.filter((x) => !picked.has(x.key)) ?? [];

  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-bold text-ink">Trouver des annonces</p>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Offre">
            <select className={input} value={f.tx} onChange={(e) => setF({ ...f, tx: e.target.value as FicheTx })}>
              <option value="rent">Location</option><option value="sale">Vente</option><option value="furnished">Résidences meublées</option>
            </select>
          </Field>
          <Field label="Commune">
            <select className={input} value={f.commune ?? ""} onChange={(e) => setF({ ...f, commune: e.target.value })}>
              <option value="">Toutes</option>{COMMUNES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          {f.tx !== "furnished" ? (
            <Field label="Type de bien">
              <select className={input} value={f.type ?? ""} onChange={(e) => setF({ ...f, type: e.target.value })}>{TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            </Field>
          ) : null}
          <Field label="Quartier ou mot"><input className={input} value={f.q ?? ""} placeholder="ex. Niangon" onChange={(e) => setF({ ...f, q: e.target.value })} /></Field>
          {f.tx !== "furnished" ? <Field label="Prix min (FCFA)"><input className={input} inputMode="numeric" value={f.priceMin ?? ""} onChange={(e) => setF({ ...f, priceMin: Number(e.target.value.replace(/\D/g, "")) || undefined })} /></Field> : null}
          <Field label="Prix max (FCFA)"><input className={input} inputMode="numeric" value={f.priceMax ?? ""} onChange={(e) => setF({ ...f, priceMax: Number(e.target.value.replace(/\D/g, "")) || undefined })} /></Field>
        </div>
        <Check label="Seulement les annonces complètes (photo et prix crédible)" checked={f.complete !== false} onChange={(v) => setF({ ...f, complete: v })} />
        <button type="button" onClick={() => run(1)} disabled={loading} className="w-full rounded-md bg-brand-700 px-3 py-2 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-60">{loading ? "Recherche…" : "Rechercher"}</button>
      </div>

      {res ? (
        <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted">
            <span>Page {res.page}/{Math.max(1, res.pages)} · {res.total} au total{res.dropped ? ` · ${res.dropped} écartée${res.dropped > 1 ? "s" : ""}` : ""}</span>
            <span className="flex gap-1">
              <button type="button" className={btn + " !px-2 !py-0.5 text-xs"} disabled={loading || res.page <= 1} onClick={() => run(res.page - 1)}>←</button>
              <button type="button" className={btn + " !px-2 !py-0.5 text-xs"} disabled={loading || res.page >= res.pages} onClick={() => run(res.page + 1)}>→</button>
            </span>
          </div>
          {fresh.length ? <button type="button" className={btn + " mb-2 w-full"} onClick={() => add(fresh)}>Ajouter les {fresh.length} annonces de cette page</button> : null}
          {!res.items.length ? <p className="py-4 text-center text-sm text-muted">Aucune annonce sur cette page. Essayez la page suivante ou d’autres filtres.</p> : null}
          <ul className="max-h-80 divide-y divide-slate-100 overflow-auto">
            {res.items.map((x) => (
              <li key={x.key} className="flex items-center gap-2 py-1.5">
                <img src={x.image} alt="" className="h-10 w-14 flex-none rounded object-cover" />
                <div className="min-w-0 flex-1 text-xs"><p className="truncate font-semibold text-ink">{x.title}</p><p className="truncate text-muted">{formatAmount(x.price)} FCFA {x.unit} · {x.zone}</p></div>
                {picked.has(x.key) ? <span className="text-xs font-semibold text-emerald-700">Ajoutée</span>
                  : <button type="button" className={btn + " !px-2 !py-0.5 text-xs"} onClick={() => add([x])}>Ajouter</button>}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-bold text-ink">Sélection ({items.length}) <span className="font-normal text-muted">· {max} par face</span></p>
          {items.length ? <button type="button" className="text-xs font-semibold text-red-700 hover:underline" onClick={() => { if (confirm("Retirer toutes les annonces de la fiche ?")) setItems(() => []); }}>Tout retirer</button> : null}
        </div>
        {!items.length ? <p className="py-3 text-center text-sm text-muted">Recherchez puis ajoutez des annonces.</p> : null}
        <ol className="max-h-[420px] space-y-1.5 overflow-auto">
          {items.map((x, i) => (
            <li key={x.key} className={"rounded-md border p-1.5 " + (i % max === 0 && i ? "border-t-4 border-t-orange-400" : "border-slate-200")}>
              {i % max === 0 ? <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-orange-700">Face {i / max + 1}</p> : null}
              <div className="flex items-start gap-2">
                <span className="mt-1 w-5 flex-none text-right text-xs font-bold text-slate-500">{i + 1}</span>
                <img src={x.image} alt="" className="h-10 w-12 flex-none rounded object-cover" />
                <div className="min-w-0 flex-1 space-y-1">
                  <input className={input + " !py-0.5 text-xs font-semibold"} value={x.title} onChange={(e) => edit(i, { title: e.target.value })} aria-label="Titre affiché" />
                  <div className="flex gap-1">
                    <input className={input + " !py-0.5 text-xs"} value={x.zone} onChange={(e) => edit(i, { zone: e.target.value })} aria-label="Zone affichée" />
                    <span className="whitespace-nowrap rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">{TX_LABEL[x.tx]}</span>
                  </div>
                  <p className="text-[11px] text-muted">{formatAmount(x.price)} FCFA {x.unit} · <a href={x.path} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">voir la fiche</a></p>
                </div>
                <div className="flex flex-none flex-col gap-0.5">
                  <button type="button" className="rounded px-1 text-xs hover:bg-slate-100 disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Monter">▲</button>
                  <button type="button" className="rounded px-1 text-xs hover:bg-slate-100 disabled:opacity-30" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Descendre">▼</button>
                  <button type="button" className="rounded px-1 text-xs text-red-700 hover:bg-red-50" onClick={() => setItems((cur) => cur.filter((c) => c.key !== x.key))} aria-label="Retirer">✕</button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ─── Mise en page ─────────────────────────────────────────────────────────
/** La liste se lit sur une colonne ; en revenant aux cartes, on reprend la grille du format. */
function designChange(s: FicheSettings, design: FicheSettings["design"]): Partial<FicheSettings> {
  if (design === "liste") return { design, cols: 1, rows: Math.min(12, s.cols * s.rows) };
  if (s.design === "liste") { const p = s.paper === "custom" ? PAPERS.A4 : PAPERS[s.paper]; return { design, cols: p.cols, rows: p.rows }; }
  return { design };
}
function LayoutPanel({ s, setS, qrPrinted, base, origin }: { s: FicheSettings; setS: (p: Partial<FicheSettings>) => void; qrPrinted: number; base: string; origin: string }) {
  const setPaper = (paper: PaperKey) => {
    const p = paper === "custom" ? null : PAPERS[paper];
    setS(p ? { paper, cols: p.cols, rows: p.rows } : { paper });
  };
  const small = qrPrinted < 15;
  return (
    <div className="space-y-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-bold text-ink">Modèle</p>
      <div className="grid gap-1.5">
        {DESIGNS.map((d) => (
          <label key={d.key} className={"flex cursor-pointer gap-2 rounded-md border p-2 text-sm " + (s.design === d.key ? "border-brand-600 bg-brand-50" : "border-slate-200")}>
            <input type="radio" checked={s.design === d.key} onChange={() => setS(designChange(s, d.key))} />
            <span><b>{d.label}</b><span className="block text-xs text-muted">{d.hint}</span></span>
          </label>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Format de feuille">
          <select className={input} value={s.paper} onChange={(e) => setPaper(e.target.value as PaperKey)}>
            {Object.entries(PAPERS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
            <option value="custom">Sur mesure…</option>
          </select>
        </Field>
        <Field label="Orientation">
          <select className={input} value={s.orientation} onChange={(e) => setS({ orientation: e.target.value as FicheSettings["orientation"] })}><option value="portrait">Portrait</option><option value="landscape">Paysage</option></select>
        </Field>
        {s.paper === "custom" ? <>
          <Field label="Largeur (mm)"><input className={input} type="number" min={50} max={1200} value={s.customW} onChange={(e) => setS({ customW: Number(e.target.value) })} /></Field>
          <Field label="Hauteur (mm)"><input className={input} type="number" min={50} max={1200} value={s.customH} onChange={(e) => setS({ customH: Number(e.target.value) })} /></Field>
        </> : null}
        <Field label="Colonnes"><input className={input} type="number" min={1} max={6} value={s.cols} onChange={(e) => setS({ cols: Math.min(6, Math.max(1, Number(e.target.value) || 1)) })} /></Field>
        <Field label="Lignes"><input className={input} type="number" min={1} max={12} value={s.rows} onChange={(e) => setS({ rows: Math.min(12, Math.max(1, Number(e.target.value) || 1)) })} /></Field>
      </div>
      <p className="text-xs text-muted">{s.cols * s.rows} annonces par face. Les faces suivantes sont créées toutes seules : 2 faces = un recto-verso, plus = un petit magazine.</p>
      <Field label="Taille des QR codes des biens" hint="Automatique : le plus grand possible dans la carte.">
        <select className={input} value={s.qrMm} onChange={(e) => setS({ qrMm: Number(e.target.value) })}>
          <option value={0}>Automatique</option>{[15, 18, 20, 22, 25, 30].map((n) => <option key={n} value={n}>{n} mm</option>)}
        </select>
      </Field>
      <p className={"rounded px-2 py-1 text-xs font-semibold " + (small ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700")}>
        QR imprimés : {qrPrinted.toFixed(0)} mm. {small ? "Trop petit : moins de 15 mm se lit mal. Réduisez le nombre d’annonces par face ou prenez une feuille plus grande." : "Bonne taille pour la lecture au téléphone."}
      </p>
      <div className="grid gap-1.5">
        <Check label="Cadre orange autour des annonces" checked={s.frame} onChange={(v) => setS({ frame: v })} />
        <Check label="Étiquette « À louer / À vendre / Meublé »" checked={s.showTag} onChange={(v) => setS({ showTag: v })} />
        <Check label="Numéro de chaque annonce" checked={s.showNumber} onChange={(v) => setS({ showNumber: v })} />
        <Check label="Référence du bien" checked={s.showRef} onChange={(v) => setS({ showRef: v })} />
        {s.design === "liste" ? <Check label="Ranger par commune (avec 1 colonne)" checked={s.groupByCommune} onChange={(v) => setS({ groupByCommune: v })} /> : null}
      </div>
      <Field label="Adresse des QR codes" hint={`Vide : ${origin} (adresse actuelle du site). Mettez https://moboo.ci une fois le domaine passé sur le nouveau site.`}>
        <input className={input} value={s.siteBase} placeholder={origin} onChange={(e) => setS({ siteBase: e.target.value })} />
      </Field>
      <p className="break-all text-xs text-muted">Exemple de lien : {base}/annonce/…</p>
    </div>
  );
}

// ─── Textes ───────────────────────────────────────────────────────────────
function TextsPanel({ s, setS, meta, setM, faces: n }: { s: FicheSettings; setS: (p: Partial<FicheSettings>) => void; meta: { edition: number; editionDate: string }; setM: (p: Partial<{ edition: number; editionDate: string }>) => void; faces: number }) {
  return (
    <div className="space-y-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
      <Field label="Titre de chaque face"><input className={input} value={s.title} onChange={(e) => setS({ title: e.target.value })} /></Field>
      {n > 1 ? (
        <details className="text-sm"><summary className="cursor-pointer font-semibold text-slate-700">Un titre différent par face</summary>
          <div className="mt-2 space-y-1.5">
            {Array.from({ length: n }, (_, i) => (
              <input key={i} className={input} placeholder={`Face ${i + 1} : ${s.title}`} value={s.pageTitles[i] ?? ""}
                onChange={(e) => { const t = [...s.pageTitles]; t[i] = e.target.value; setS({ pageTitles: t }); }} />
            ))}
          </div>
        </details>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <Field label="Édition n°"><input className={input} type="number" min={1} value={meta.edition} onChange={(e) => setM({ edition: Math.max(1, Number(e.target.value) || 1) })} /></Field>
        <Field label="Date de sortie"><input className={input} value={meta.editionDate} placeholder="1er décembre 2026" onChange={(e) => setM({ editionDate: e.target.value })} /></Field>
      </div>
      <Field label="Ligne d’édition" hint="{edition} et {date} sont remplacés."><input className={input} value={s.editionLine} onChange={(e) => setS({ editionLine: e.target.value })} /></Field>
      <Check label="Afficher Recto / Verso (ou Page n)" checked={s.showSide} onChange={(v) => setS({ showSide: v })} />
      <p className="pt-1 text-sm font-bold text-ink">QR « Scannez » en haut à droite</p>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Titre"><input className={input} value={s.scanTitle} onChange={(e) => setS({ scanTitle: e.target.value })} /></Field>
        <Field label="Texte"><input className={input} value={s.scanText} onChange={(e) => setS({ scanText: e.target.value })} /></Field>
      </div>
      <Field label="Lien du QR" hint="Vide : toutes les annonces du site."><input className={input} value={s.scanUrl} placeholder="https://…" onChange={(e) => setS({ scanUrl: e.target.value })} /></Field>
      <p className="pt-1 text-sm font-bold text-ink">Pied de page</p>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Site"><input className={input} value={s.footerSite} onChange={(e) => setS({ footerSite: e.target.value })} /></Field>
        <Field label="Signature"><input className={input} value={s.footerPowered} onChange={(e) => setS({ footerPowered: e.target.value })} /></Field>
      </div>
      <Field label="Phrase du milieu"><input className={input} value={s.footerHint} onChange={(e) => setS({ footerHint: e.target.value })} /></Field>
    </div>
  );
}
