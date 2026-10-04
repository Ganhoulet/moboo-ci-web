"use client";

import { useEffect, useState, useTransition } from "react";
import QRCode from "qrcode";
import { SeoPoster, type SeoTexts } from "./qr-poster";
import { QrPrintToolbar } from "./qr-print-toolbar";
import { seoCodeAction, type SeoPlacement } from "@/app/admin/affiches-qr/actions";

const FIELDS: { key: keyof SeoTexts; label: string; area?: boolean; group: string }[] = [
  { key: "kicker", label: "Petit titre (tout en haut)", group: "Haut de l’affiche" },
  { key: "headline", label: "Titre", group: "Haut de l’affiche" },
  { key: "text", label: "Texte court", area: true, group: "Haut de l’affiche" },
  { key: "cta", label: "Appel à l’action sous le QR code", group: "QR code" },
  { key: "contactLabel", label: "Texte du contact", group: "Contact Moboo (bas)" },
  { key: "contactPhone", label: "Numéro Moboo", group: "Contact Moboo (bas)" },
  { key: "footer", label: "Pied de l’affiche", group: "Contact Moboo (bas)" },
];
const COLORS: { key: keyof SeoTexts; label: string }[] = [
  { key: "bgColor", label: "Fond" }, { key: "accentColor", label: "Accent" }, { key: "textColor", label: "Texte" },
];

/**
 * Builder de l'affiche de rue d'une page SEO : textes et couleurs modifiables
 * (pré-remplis par le modèle), aperçu en direct, emplacement (compte les scans),
 * puis impression A3 / A4 / A5.
 */
export function SeoPosterBuilder({ pageId, defaults, placements }: { pageId: string; defaults: SeoTexts; placements: SeoPlacement[] }) {
  const [t, setT] = useState<SeoTexts>(defaults);
  const [placement, setPlacement] = useState("");
  const [ready, setReady] = useState<{ url: string; svg: string; code: string; placement: string } | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    // Aperçu : QR provisoire, remplacé par le vrai code (lien court compté) à la préparation.
    QRCode.toString("https://moboo.ci/q/xxxxxx", { type: "svg", margin: 0, errorCorrectionLevel: "L" }).then(setPreview);
  }, []);

  const set = (k: keyof SeoTexts, v: string) => { setT((x) => ({ ...x, [k]: v })); setReady(null); };
  const prepare = () => start(async () => {
    setError(null);
    const r = await seoCodeAction(pageId, placement, t);
    if (!r.ok || !r.url || !r.svg || !r.code) { setError(r.error ?? "Erreur."); return; }
    setReady({ url: r.url, svg: r.svg, code: r.code, placement });
  });
  const reuse = (p: SeoPlacement) => { setT({ ...defaults, ...(p.poster ?? {}) }); setPlacement(p.placement); setReady(null); };

  return (
    <div className="qr-builder grid gap-5 xl:grid-cols-[minmax(0,26rem)_1fr]">
      <div className="qr-toolbar space-y-4">
        {Array.from(new Set(FIELDS.map((f) => f.group))).map((g) => (
          <fieldset key={g} className="space-y-2 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <legend className="px-1 text-xs font-bold uppercase tracking-wide text-slate-500">{g}</legend>
            {FIELDS.filter((f) => f.group === g).map((f) => (
              <label key={f.key} className="block text-sm">
                <span className="font-semibold text-ink">{f.label}</span>
                {f.area ? (
                  <textarea value={t[f.key]} onChange={(e) => set(f.key, e.target.value)} rows={3} maxLength={300} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                ) : (
                  <input value={t[f.key]} onChange={(e) => set(f.key, e.target.value)} maxLength={120} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                )}
              </label>
            ))}
          </fieldset>
        ))}
        <fieldset className="flex flex-wrap gap-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <legend className="px-1 text-xs font-bold uppercase tracking-wide text-slate-500">Couleurs</legend>
          {COLORS.map((c) => (
            <label key={c.key} className="flex items-center gap-2 text-sm font-semibold text-ink">
              <input type="color" value={t[c.key]} onChange={(e) => set(c.key, e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-slate-300" />{c.label}
            </label>
          ))}
          <button type="button" onClick={() => { setT(defaults); setReady(null); }} className="ml-auto text-xs font-semibold text-brand-700 hover:underline">Revenir au modèle</button>
        </fieldset>
        <div className="space-y-2 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <label className="block text-sm">
            <span className="font-semibold text-ink">Emplacement de l’affiche</span>
            <input value={placement} onChange={(e) => { setPlacement(e.target.value); setReady(null); }} maxLength={120} placeholder="Ex. Marché de Yopougon, mur côté gare"
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
            <span className="mt-1 block text-xs text-muted">Chaque emplacement a son propre QR code : vous saurez combien de personnes ont scanné à cet endroit.</span>
          </label>
          <button type="button" onClick={prepare} disabled={pending} className="w-full rounded-md bg-[#0555CC] px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
            {pending ? "Préparation…" : ready ? "QR code prêt ✓ — préparer à nouveau" : "Préparer le QR code de cet emplacement"}
          </button>
          {ready ? <p className="text-xs text-emerald-700">Code <strong>{ready.code}</strong> · {ready.url}{ready.placement ? ` · emplacement « ${ready.placement} »` : " · sans emplacement"}</p> : null}
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>
        {placements.length ? (
          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Affiches déjà posées</p>
            <ul className="space-y-1.5 text-sm">
              {placements.map((p) => (
                <li key={p.code} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate">{p.placement || "Sans emplacement"} <span className="font-mono text-xs text-slate-400">/q/{p.code}</span></span>
                  <span className="shrink-0 font-semibold tabular-nums text-ink">{p.scans} scan{p.scans > 1 ? "s" : ""}</span>
                  <button type="button" onClick={() => reuse(p)} className="shrink-0 text-xs font-semibold text-brand-700 hover:underline">Réimprimer</button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <div>
        <QrPrintToolbar count={1} blocked={ready ? null : "Préparez d’abord le QR code de l’emplacement"}>
          <SeoPoster d={{ kind: "seo", t, url: ready?.url ?? "", qrSvg: ready?.svg ?? preview }} />
        </QrPrintToolbar>
      </div>
    </div>
  );
}
