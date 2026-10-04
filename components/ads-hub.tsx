"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdZone } from "@/lib/ads";
import {
  boostAction, campaignAction, cancelCampaignAction, partnerAction, showcaseAction, topupAction, type AdsOverview,
} from "@/app/mon-espace/publicite/actions";

const n = (v: number) => Math.round(v).toLocaleString("fr-FR");
const d = (s: string | null) => (s ? new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—");
const ctr = (clicks: number, views: number) => (views ? `${((clicks / views) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %` : "—");

type Tab = "boost" | "showcase" | "partner" | "banner" | "history";
const TABS: [Tab, string, string][] = [
  ["boost", "Boost par zone", "En tête des résultats d’une commune ou d’une ville"],
  ["showcase", "Vitrine premium", "Grand format et badge « Vitrine »"],
  ["partner", "Partenaire de zone", "Votre encart sur les annonces d’une zone"],
  ["banner", "Bannières", "Votre publicité sur le site et l’application"],
  ["history", "Historique", "Recharges et dépenses"],
];

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="font-display text-lg font-extrabold tabular-nums text-ink">{value}</p>
      {hint ? <p className="text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}

/** Espace annonceur façon Zillow : Crédits Moboo, boosts, vitrines, zones, bannières. */
export function AdsHub({ data, zones, isPro, initialTab, initialListing }: { data: AdsOverview; zones: AdZone[]; isPro: boolean; initialTab?: string; initialListing?: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(TABS.some(([k]) => k === initialTab) ? (initialTab as Tab) : "boost");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const p = data.pricing;
  const online = data.listings.filter((l) => l.online);

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    start(async () => {
      setMsg(null);
      const r = await fn();
      setMsg(r.ok ? { ok: true, text: r.message ?? "C’est fait." } : { ok: false, text: r.error ?? "Action impossible." });
      if (r.ok) router.refresh();
    });
  };
  const topup = (amount: number) => start(async () => {
    setMsg(null);
    const r = await topupAction(amount);
    if (!r.ok) { setMsg({ ok: false, text: r.error ?? "Recharge impossible." }); return; }
    window.location.href = r.paymentUrl!;
  });

  // ─── Boost ───
  const [bListing, setBListing] = useState(online.find((l) => l.id === initialListing)?.id ?? online[0]?.id ?? "");
  const [bScope, setBScope] = useState<"commune" | "city">("commune");
  const [bDays, setBDays] = useState(p.boost.durations[0] ?? 7);
  const bl = online.find((l) => l.id === bListing);
  const wholeCity = bScope === "city" || !bl?.commune;
  const bPrice = Math.round(p.boost.pricePerDay * bDays * (wholeCity ? p.boost.cityFactor : 1));

  // ─── Partenaire ───
  const [pZone, setPZone] = useState(zones.find((z) => z.kind === "area")?.zone ?? zones[0]?.zone ?? "");
  const pz = zones.find((z) => z.zone === pZone);
  const pPrice = Math.round(p.partner.price30 * (pz?.kind === "city" ? p.partner.cityFactor : 1));

  // ─── Bannière ───
  const [ban, setBan] = useState({ title: "", text: "", imageUrl: "", ctaLabel: "Découvrir", ctaUrl: "", days: 7, site: true, app: false, zones: [] as string[] });
  const banPrice = p.banner.pricePerDay * ban.days * ((ban.site ? 1 : 0) + (ban.app ? 1 : 0));

  const totals = useMemo(() => ({
    views: data.boosts.reduce((s, b) => s + b.impressions, 0) + data.partners.reduce((s, x) => s + x.impressions, 0) + data.campaigns.reduce((s, c) => s + c.views, 0),
    clicks: data.boosts.reduce((s, b) => s + b.clicks, 0) + data.partners.reduce((s, x) => s + x.clicks, 0) + data.campaigns.reduce((s, c) => s + c.clicks, 0),
    live: data.boosts.filter((b) => b.live).length + data.partners.filter((x) => x.live).length + data.listings.filter((l) => l.showcaseUntil).length + data.campaigns.filter((c) => c.active && c.review === "approved").length,
  }), [data]);

  const short = (need: number) => need > data.balance;
  const BuyBtn = ({ price, onClick, label }: { price: number; onClick: () => void; label: string }) => (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" disabled={pending || price <= 0 || short(price)} onClick={onClick}
        className="rounded-full bg-accent-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-accent-700 disabled:opacity-50">{label} · {n(price)} crédits</button>
      {short(price) ? <span className="text-sm text-red-700">Solde insuffisant : rechargez ci-dessus.</span> : null}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Solde + recharges */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div className="rounded-2xl bg-gradient-to-br from-brand-800 to-brand-900 p-5 text-white shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Mes crédits Moboo</p>
          <p className="mt-1 font-display text-4xl font-black tabular-nums">{n(data.balance)}</p>
          <p className="text-sm text-white/80">1 crédit = 1 FCFA · utilisables pour tous les outils ci-dessous</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div><p className="font-display text-xl font-extrabold">{totals.live}</p><p className="text-[11px] text-white/70">actifs</p></div>
            <div><p className="font-display text-xl font-extrabold">{n(totals.views)}</p><p className="text-[11px] text-white/70">vues</p></div>
            <div><p className="font-display text-xl font-extrabold">{n(totals.clicks)}</p><p className="text-[11px] text-white/70">clics</p></div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <p className="font-semibold text-ink">Recharger mon solde</p>
          <p className="text-sm text-muted">Paiement par Wave, Orange Money, MTN MoMo, Moov Money ou carte. Plus vous rechargez, plus le bonus est grand.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
            {p.packs.map((k) => (
              <button key={k.amount} type="button" disabled={pending} onClick={() => topup(k.amount)}
                className="relative rounded-xl px-3 py-3 text-left ring-1 ring-slate-200 transition hover:bg-brand-50 hover:ring-brand-600 disabled:opacity-60">
                {k.bonusPct ? <span className="absolute -top-2 right-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">+{k.bonusPct} %</span> : null}
                <span className="block whitespace-nowrap font-display text-base font-extrabold text-ink xl:text-lg">{n(k.amount)} F</span>
                <span className="block text-xs text-muted">{n(k.credits)} crédits</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {msg ? <p className={"rounded-xl p-3 text-sm font-medium " + (msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700")}>{msg.text}</p> : null}

      {/* Onglets */}
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={"shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition " + (tab === k ? "bg-brand-800 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50")}>{label}</button>
        ))}
      </div>
      <p className="-mt-3 text-sm text-muted">{TABS.find(([k]) => k === tab)?.[2]}.</p>

      {tab === "boost" ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-5 shadow-card">
            {online.length ? (
              <div className="grid gap-4 md:grid-cols-3">
                <label className="block text-sm font-semibold md:col-span-3">Annonce
                  <select className="input mt-1" value={bListing} onChange={(e) => setBListing(e.target.value)}>
                    {online.map((l) => <option key={l.id} value={l.id}>{l.title} — {[l.commune, l.city].filter(Boolean).join(", ")}</option>)}
                  </select>
                </label>
                <fieldset className="text-sm">
                  <legend className="font-semibold">Zone</legend>
                  {bl?.commune ? (
                    <label className="mt-1 flex items-center gap-2"><input type="radio" checked={bScope === "commune"} onChange={() => setBScope("commune")} /> Commune : {bl.commune}</label>
                  ) : null}
                  <label className="mt-1 flex items-center gap-2"><input type="radio" checked={wholeCity} onChange={() => setBScope("city")} /> Toute la ville : {bl?.city} {p.boost.cityFactor > 1 ? <span className="text-xs text-muted">(×{p.boost.cityFactor})</span> : null}</label>
                </fieldset>
                <fieldset className="text-sm">
                  <legend className="font-semibold">Durée</legend>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {p.boost.durations.map((x) => (
                      <button key={x} type="button" onClick={() => setBDays(x)} className={"rounded-full px-3 py-1 font-semibold ring-1 " + (bDays === x ? "bg-brand-50 text-brand-900 ring-brand-600" : "ring-slate-200")}>{x} jours</button>
                    ))}
                  </div>
                </fieldset>
                <div className="text-sm text-slate-700">
                  <p className="font-semibold text-ink">Ce que vous obtenez</p>
                  <p>Votre annonce en tête des résultats « {wholeCity ? bl?.city : bl?.commune} », mention « Sponsorisé », rotation équitable avec les autres annonceurs.</p>
                </div>
                <div className="md:col-span-3"><BuyBtn price={bPrice} label="Booster" onClick={() => run(() => boostAction(bListing, wholeCity ? "city" : "commune", bDays))} /></div>
              </div>
            ) : <p className="text-sm text-muted">Aucune annonce en ligne à booster pour le moment.</p>}
          </div>
          {data.boosts.length ? (
            <div className="overflow-x-auto rounded-2xl bg-white shadow-card">
              <table className="w-full min-w-[40rem] text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted"><tr><th className="px-4 py-3">Annonce</th><th className="px-2 py-3">Zone</th><th className="px-2 py-3">Fin</th><th className="px-2 py-3 text-right">Vues</th><th className="px-2 py-3 text-right">Clics</th><th className="px-4 py-3 text-right">Taux</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.boosts.map((b) => (
                    <tr key={b.id} className={b.live ? "" : "text-muted"}>
                      <td className="px-4 py-2.5 font-medium">{b.listingTitle}{b.live ? <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Actif</span> : null}</td>
                      <td className="px-2 py-2.5">{b.zoneLabel}</td><td className="px-2 py-2.5">{d(b.endsAt)}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{n(b.impressions)}</td><td className="px-2 py-2.5 text-right tabular-nums">{n(b.clicks)}</td><td className="px-4 py-2.5 text-right">{ctr(b.clicks, b.impressions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "showcase" ? (
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <p className="text-sm text-slate-700">Votre annonce en <strong>grand format</strong> dans les résultats (2 colonnes), avec le badge « Vitrine » : idéal pour un bien d’exception ou un programme neuf. <strong>{n(p.showcase.price30)} crédits pour 30 jours</strong> (prolongeable).</p>
          {data.listings.length ? (
            <ul className="mt-4 divide-y divide-slate-100">
              {data.listings.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center gap-3 py-3">
                  {l.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.photo} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                  ) : <span className="h-12 w-16 shrink-0 rounded-lg bg-slate-100" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{l.title}</p>
                    <p className="text-xs text-muted">{[l.commune, l.city].filter(Boolean).join(", ")} · {n(l.views)} vues{l.showcaseUntil ? ` · Vitrine jusqu’au ${d(l.showcaseUntil)}` : ""}</p>
                  </div>
                  <button type="button" disabled={pending || !l.online || short(p.showcase.price30)} onClick={() => run(() => showcaseAction(l.id), `Mettre « ${l.title} » en vitrine pour ${n(p.showcase.price30)} crédits ?`)}
                    className="rounded-full bg-accent-600 px-4 py-2 text-xs font-bold text-white hover:bg-accent-700 disabled:opacity-50">{l.showcaseUntil ? "Prolonger 30 j" : "Mettre en vitrine"}</button>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-sm text-muted">Aucune annonce.</p>}
        </div>
      ) : null}

      {tab === "partner" ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-5 shadow-card">
            <p className="text-sm text-slate-700">Comme les « Premier Agents » de Zillow : votre profil et vos boutons <strong>WhatsApp / Appeler</strong> apparaissent sur les annonces de la zone choisie (y compris celles des particuliers). <strong>{p.partner.slots} places maximum par zone.</strong></p>
            {isPro ? (
              <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <label className="block text-sm font-semibold">Zone
                  <select className="input mt-1" value={pZone} onChange={(e) => setPZone(e.target.value)}>
                    <optgroup label="Communes">{zones.filter((z) => z.kind === "area").map((z) => <option key={z.zone} value={z.zone}>{z.label}{z.city ? ` (${z.city})` : ""} — {z.listings} annonce(s)</option>)}</optgroup>
                    <optgroup label={`Villes entières (×${p.partner.cityFactor})`}>{zones.filter((z) => z.kind === "city").map((z) => <option key={z.zone} value={z.zone}>{z.label} — {z.listings} annonce(s)</option>)}</optgroup>
                  </select>
                </label>
                <BuyBtn price={pPrice} label="Devenir partenaire 30 j" onClick={() => run(() => partnerAction(pZone))} />
              </div>
            ) : <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Réservé aux comptes agent ou agence. Changez votre type de compte dans « Mon profil ».</p>}
          </div>
          {data.partners.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.partners.map((x) => (
                <div key={x.id} className="rounded-2xl bg-white p-4 shadow-card">
                  <p className="font-semibold text-ink">{x.zoneLabel} {x.live ? <span className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Actif</span> : <span className="text-xs text-muted">(terminé)</span>}</p>
                  <p className="text-xs text-muted">Jusqu’au {d(x.endsAt)}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2"><Stat label="Vues" value={n(x.impressions)} /><Stat label="Contacts" value={n(x.clicks)} /><Stat label="Taux" value={ctr(x.clicks, x.impressions)} /></div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "banner" ? (
        <div className="space-y-4">
          <form className="grid gap-3 rounded-2xl bg-white p-5 shadow-card md:grid-cols-2" onSubmit={(e) => {
            e.preventDefault();
            run(() => campaignAction({ title: ban.title, text: ban.text, imageUrl: ban.imageUrl, ctaLabel: ban.ctaLabel, ctaUrl: ban.ctaUrl, days: ban.days, placements: [...(ban.site ? ["site_banner"] : []), ...(ban.app ? ["app_banner"] : [])], zones: ban.zones }));
          }}>
            <label className="block text-sm font-semibold">Titre<input className="input mt-1" required maxLength={80} value={ban.title} onChange={(e) => setBan({ ...ban, title: e.target.value })} placeholder="Résidence Les Palmiers — livraison 2027" /></label>
            <label className="block text-sm font-semibold">Texte<input className="input mt-1" maxLength={200} value={ban.text} onChange={(e) => setBan({ ...ban, text: e.target.value })} placeholder="Appartements neufs à Cocody, dès 45 M FCFA" /></label>
            <label className="block text-sm font-semibold">Image (adresse https://…, facultatif)<input className="input mt-1" type="url" value={ban.imageUrl} onChange={(e) => setBan({ ...ban, imageUrl: e.target.value })} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-semibold">Bouton<input className="input mt-1" maxLength={30} value={ban.ctaLabel} onChange={(e) => setBan({ ...ban, ctaLabel: e.target.value })} /></label>
              <label className="block text-sm font-semibold">Lien<input className="input mt-1" value={ban.ctaUrl} onChange={(e) => setBan({ ...ban, ctaUrl: e.target.value })} placeholder="https://… ou /pro/…" /></label>
            </div>
            <fieldset className="text-sm">
              <legend className="font-semibold">Où ?</legend>
              <label className="mt-1 flex items-center gap-2"><input type="checkbox" checked={ban.site} onChange={(e) => setBan({ ...ban, site: e.target.checked })} /> Site Moboo.ci</label>
              <label className="mt-1 flex items-center gap-2"><input type="checkbox" checked={ban.app} onChange={(e) => setBan({ ...ban, app: e.target.checked })} /> Application Moboo.ci</label>
            </fieldset>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-semibold">Durée (jours)<input className="input mt-1" type="number" min={1} max={90} value={ban.days} onChange={(e) => setBan({ ...ban, days: Math.max(1, Math.min(90, Number(e.target.value) || 1)) })} /></label>
              <label className="block text-sm font-semibold">Zones visées (facultatif)
                <select multiple className="input mt-1 h-20" value={ban.zones} onChange={(e) => setBan({ ...ban, zones: [...e.target.selectedOptions].map((o) => o.value) })}>
                  {zones.map((z) => <option key={z.zone} value={z.zone}>{z.label}</option>)}
                </select>
              </label>
            </div>
            <div className="md:col-span-2">
              <p className="mb-2 text-xs text-muted">{n(p.banner.pricePerDay)} crédits par jour et par emplacement.{p.banner.review ? " Validée par l’équipe Moboo avant diffusion : crédits rendus en cas de refus." : ""} Sans zone : affichée partout ; avec zones : sur les recherches de ces lieux.</p>
              <div className="flex flex-wrap items-center gap-3">
                <button disabled={pending || banPrice <= 0 || short(banPrice)} className="rounded-full bg-accent-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-700 disabled:opacity-50">Publier la bannière · {n(banPrice)} crédits</button>
                {short(banPrice) ? <span className="text-sm text-red-700">Solde insuffisant.</span> : null}
              </div>
            </div>
          </form>
          {data.campaigns.length ? (
            <div className="overflow-x-auto rounded-2xl bg-white shadow-card">
              <table className="w-full min-w-[40rem] text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted"><tr><th className="px-4 py-3">Bannière</th><th className="px-2 py-3">État</th><th className="px-2 py-3">Période</th><th className="px-2 py-3 text-right">Vues</th><th className="px-2 py-3 text-right">Clics</th><th className="px-4 py-3" /></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.campaigns.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-2.5"><p className="font-medium text-ink">{c.title}</p><p className="text-xs text-muted">{c.placements.map((x) => (x === "app_banner" ? "Application" : "Site")).join(" + ")}{c.targetZones.length ? ` · ${c.targetZones.map((z) => zones.find((x) => x.zone === z)?.label ?? z).join(", ")}` : " · partout"}</p></td>
                      <td className="px-2 py-2.5">{c.review === "pending" ? <span className="text-amber-700">En validation</span> : c.review === "rejected" ? <span className="text-red-700" title={c.reviewNote ?? ""}>Refusée{c.reviewNote ? ` : ${c.reviewNote}` : ""}</span> : c.endsAt && new Date(c.endsAt) > new Date() ? <span className="font-semibold text-emerald-700">En ligne</span> : <span className="text-muted">Terminée</span>}</td>
                      <td className="px-2 py-2.5 text-xs">{c.startsAt ? `${d(c.startsAt)} → ${d(c.endsAt)}` : `${c.days} jours après validation`}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{n(c.views)}</td><td className="px-2 py-2.5 text-right tabular-nums">{n(c.clicks)}</td>
                      <td className="px-4 py-2.5 text-right">{c.review === "pending" ? <button type="button" disabled={pending} onClick={() => run(() => cancelCampaignAction(c.id), "Annuler cette bannière ? Les crédits vous seront rendus.")} className="text-xs font-semibold text-red-700 hover:underline">Annuler</button> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "history" ? (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-card">
          {data.history.length ? (
            <table className="w-full min-w-[32rem] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted"><tr><th className="px-4 py-3">Date</th><th className="px-2 py-3">Opération</th><th className="px-2 py-3 text-right">Montant</th><th className="px-4 py-3 text-right">Solde</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data.history.map((t) => (
                  <tr key={t.id}>
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted">{new Date(t.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</td>
                    <td className="px-2 py-2.5">{t.label}</td>
                    <td className={"whitespace-nowrap px-2 py-2.5 text-right font-semibold tabular-nums " + (t.amount > 0 ? "text-emerald-700" : "text-ink")}>{t.amount > 0 ? "+" : "−"}{n(Math.abs(t.amount))}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted">{n(t.balanceAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="p-6 text-center text-sm text-muted">Aucune opération pour l’instant.</p>}
        </div>
      ) : null}
    </div>
  );
}
