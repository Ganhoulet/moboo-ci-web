"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  edlRequestAction, foncierEstimateAction, loyerEstimateAction, serviceLeadAction,
  solvencyConfirmAction, solvencyRequestAction, solvencyResendAction,
} from "@/app/services-actions";
import type { ServiceKey, ZoneOption } from "@/lib/site-services";

const input = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
const label = "mb-1 block text-xs font-semibold text-slate-600";
const btn = "rounded-full bg-accent-600 px-6 py-3 text-sm font-bold text-white hover:bg-accent-700 disabled:opacity-60";
const fmt = (n: number) => `${Math.round(Number(n) || 0).toLocaleString("fr-FR").replace(/[  ]/g, " ")} FCFA`;

type Form = Record<string, string>;
function useForm(init: Form) {
  const [f, setF] = useState<Form>(init);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((x) => ({ ...x, [k]: e.target.type === "checkbox" ? ((e.target as HTMLInputElement).checked ? "1" : "") : e.target.value }));
  return { f, setF, set };
}

function Err({ text }: { text?: string | null }) {
  return text ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{text}</p> : null;
}

/** Communes (et quartiers) connus des grilles, proposés à la saisie. */
function ZoneFields({ zones, f, set }: { zones: ZoneOption[]; f: Form; set: (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  const communes = useMemo(() => Array.from(new Set(zones.map((z) => z.commune).filter(Boolean))).sort((a, b) => a.localeCompare(b, "fr")), [zones]);
  const quartiers = useMemo(() => Array.from(new Set(zones.filter((z) => !f.commune || z.commune.toLowerCase() === f.commune.toLowerCase()).map((z) => z.zone).filter((z) => z && z.toLowerCase() !== f.commune.toLowerCase()))).sort((a, b) => a.localeCompare(b, "fr")), [zones, f.commune]);
  return (
    <>
      <div>
        <label className={label} htmlFor="sv-commune">Commune / ville *</label>
        <input id="sv-commune" required list="sv-communes" value={f.commune} onChange={set("commune")} placeholder="Ex. Cocody" className={input} />
        <datalist id="sv-communes">{communes.map((c) => <option key={c} value={c} />)}</datalist>
      </div>
      <div>
        <label className={label} htmlFor="sv-zone">Quartier</label>
        <input id="sv-zone" list="sv-quartiers" value={f.zone} onChange={set("zone")} placeholder="Ex. Riviera 3" className={input} />
        <datalist id="sv-quartiers">{quartiers.map((c) => <option key={c} value={c} />)}</datalist>
      </div>
    </>
  );
}

/** « Être rappelé » après une estimation : critères et résultat joints à la demande. */
function CallbackForm({ service, data, title }: { service: ServiceKey; data: Record<string, unknown>; title: string }) {
  const { f, set } = useForm({ full_name: "", phone: "" });
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  if (state?.ok) return <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">✅ Merci ! Un conseiller Moboo vous rappelle au {f.phone}.</p>;
  return (
    <form onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await serviceLeadAction(service, { full_name: f.full_name, phone: f.phone, data }); setState(r.ok ? { ok: true, text: "" } : { ok: false, text: r.error }); }); }}
      className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <p className="text-sm font-semibold text-ink sm:col-span-3">{title}</p>
      <input required value={f.full_name} onChange={set("full_name")} placeholder="Nom et prénom *" className={input} autoComplete="name" />
      <input required value={f.phone} onChange={set("phone")} placeholder="Téléphone (WhatsApp) *" inputMode="tel" className={input} autoComplete="tel" />
      <button type="submit" disabled={pending} className={btn}>{pending ? "Envoi…" : "Être rappelé"}</button>
      {state && !state.ok ? <p className="text-sm text-red-700 sm:col-span-3">{state.text}</p> : null}
    </form>
  );
}

// ─── État des lieux ─────────────────────────────────────────────────────────
const PROP_TYPES = ["Appartement", "Studio", "Maison", "Villa", "Duplex", "Bureau", "Magasin", "Entrepôt", "Autre"];

export function EdlForm() {
  const { f, set } = useForm({ full_name: "", phone: "", email: "", prop_type: "Appartement", commune: "", zone: "", city: "Abidjan", purpose: "entree", role: "locataire", pieces: "", date_souhaitee: "", message: "", website: "" });
  const [done, setDone] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (done != null) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-8 text-center">
        <p className="text-4xl">✅</p>
        <p className="mt-3 font-display text-xl font-bold text-ink">Demande n° {done} enregistrée</p>
        <p className="mt-1 text-slate-600">Un agent Moboo vous appelle au {f.phone} pour fixer le rendez-vous.</p>
      </div>
    );
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (f.website) return; start(async () => { const r = await edlRequestAction(f); if (r.ok) setDone(Number(r.data?.id) || 0); else setErr(r.error); }); }}
      className="grid gap-4 sm:grid-cols-2">
      <div><label className={label} htmlFor="edl-name">Nom et prénom *</label><input id="edl-name" required value={f.full_name} onChange={set("full_name")} className={input} autoComplete="name" /></div>
      <div><label className={label} htmlFor="edl-phone">Téléphone (WhatsApp) *</label><input id="edl-phone" required value={f.phone} onChange={set("phone")} inputMode="tel" className={input} autoComplete="tel" /></div>
      <div>
        <label className={label} htmlFor="edl-type">Type de bien *</label>
        <select id="edl-type" value={f.prop_type} onChange={set("prop_type")} className={input}>{PROP_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
      </div>
      <div>
        <label className={label} htmlFor="edl-purpose">État des lieux</label>
        <select id="edl-purpose" value={f.purpose} onChange={set("purpose")} className={input}><option value="entree">D’entrée</option><option value="sortie">De sortie</option></select>
      </div>
      <ZoneFields zones={[]} f={f} set={set} />
      <div>
        <label className={label} htmlFor="edl-role">Vous êtes</label>
        <select id="edl-role" value={f.role} onChange={set("role")} className={input}><option value="locataire">Locataire</option><option value="proprietaire">Propriétaire / gestionnaire</option></select>
      </div>
      <div><label className={label} htmlFor="edl-pieces">Nombre de pièces</label><input id="edl-pieces" value={f.pieces} onChange={set("pieces")} inputMode="numeric" className={input} /></div>
      <div><label className={label} htmlFor="edl-date">Date souhaitée</label><input id="edl-date" type="date" value={f.date_souhaitee} onChange={set("date_souhaitee")} className={input} /></div>
      <div><label className={label} htmlFor="edl-email">E-mail (facultatif)</label><input id="edl-email" type="email" value={f.email} onChange={set("email")} className={input} autoComplete="email" /></div>
      <div className="sm:col-span-2"><label className={label} htmlFor="edl-msg">Précisions (facultatif)</label><textarea id="edl-msg" rows={3} value={f.message} onChange={set("message")} className={input} placeholder="Adresse, accès, meublé ou non…" /></div>
      <input value={f.website} onChange={set("website")} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <Err text={err} />
      <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
        <p className="text-xs text-muted">Vos coordonnées servent uniquement à organiser l’état des lieux.</p>
        <button type="submit" disabled={pending} className={btn}>{pending ? "Envoi…" : "Demander un état des lieux"}</button>
      </div>
    </form>
  );
}

// ─── Estimation de loyer ────────────────────────────────────────────────────
const LOYER_TYPES: [string, string][] = [["appartement", "Appartement"], ["studio", "Studio"], ["villa", "Villa"], ["duplex", "Duplex"], ["maison", "Maison"], ["chambre", "Chambre"]];
const CONF: Record<string, string> = { fiable: "bonne", indicatif: "indicative", aucune_donnee: "insuffisante" };

interface LoyerResult { has_data: boolean; mode: string; confidence: string; sample_size: number; loyer_estime: number; loyer_min: number; loyer_max: number; comparables: { titre: string; loyer: number; zone: string; url: string }[] }

export function LoyerForm({ zones }: { zones: ZoneOption[] }) {
  const { f, set } = useForm({ commune: "", zone: "", type_bien: "appartement", pieces: "3", surface: "", meuble: "", standing: "moyen", role: "proprietaire" });
  const [res, setRes] = useState<LoyerResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-6">
      <form onSubmit={(e) => { e.preventDefault(); setErr(null); start(async () => { const r = await loyerEstimateAction(f); if (r.ok) setRes(r.data as LoyerResult); else { setRes(null); setErr(r.error); } }); }}
        className="grid gap-4 sm:grid-cols-2">
        <ZoneFields zones={zones} f={f} set={set} />
        <div><label className={label} htmlFor="ly-type">Type de bien</label><select id="ly-type" value={f.type_bien} onChange={set("type_bien")} className={input}>{LOYER_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div><label className={label} htmlFor="ly-pieces">Pièces</label><select id="ly-pieces" value={f.pieces} onChange={set("pieces")} className={input}>{["1", "2", "3", "4", "5", "6"].map((n) => <option key={n} value={n}>{n === "6" ? "6 et plus" : n}</option>)}</select></div>
        <div><label className={label} htmlFor="ly-surface">Surface en m² (facultatif)</label><input id="ly-surface" value={f.surface} onChange={set("surface")} inputMode="numeric" className={input} /></div>
        <div><label className={label} htmlFor="ly-standing">Standing</label><select id="ly-standing" value={f.standing} onChange={set("standing")} className={input}><option value="eco">Économique</option><option value="moyen">Moyen</option><option value="haut">Haut standing</option></select></div>
        <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={!!f.meuble} onChange={set("meuble")} className="h-4 w-4" /> Meublé</label>
        <div className="flex justify-end"><button type="submit" disabled={pending} className={btn}>{pending ? "Calcul…" : "Estimer le loyer"}</button></div>
        <Err text={err} />
      </form>
      {res ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-live="polite">
          {res.has_data ? (
            <>
              <p className="text-sm text-muted">Loyer mensuel estimé</p>
              <p className="font-display text-3xl font-black text-ink">{fmt(res.loyer_estime)}</p>
              <p className="text-sm text-slate-600">Fourchette du marché : <b>{fmt(res.loyer_min)}</b> à <b>{fmt(res.loyer_max)}</b></p>
              <p className="text-xs text-muted">Fiabilité : {CONF[res.confidence] ?? res.confidence} · {res.sample_size} référence{res.sample_size > 1 ? "s" : ""} · {res.mode === "m2" ? "calcul au m²" : "calcul par zone, type et pièces"}</p>
              {res.comparables?.length ? (
                <div>
                  <p className="mb-2 text-sm font-semibold text-ink">Annonces comparables</p>
                  <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                    {res.comparables.map((c) => (
                      <li key={c.url}><a href={c.url} className="flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-slate-50"><span className="truncate">{c.titre} <span className="text-muted">· {c.zone}</span></span><b className="shrink-0">{fmt(c.loyer)}</b></a></li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : <p className="text-sm text-slate-700">Pas encore assez de références pour ce bien dans cette zone. Laissez vos coordonnées : un conseiller Moboo vous donne une estimation personnalisée.</p>}
          <CallbackForm service="loyer" title="Vous voulez louer ou faire gérer ce bien ? Un conseiller Moboo vous rappelle." data={{ ...f, estimation: res.has_data ? res.loyer_estime : "", fourchette: res.has_data ? `${res.loyer_min} - ${res.loyer_max}` : "" }} />
        </div>
      ) : null}
    </div>
  );
}

// ─── Estimation de terrain ──────────────────────────────────────────────────
interface FoncierResult { valeur_min: number; valeur_max: number; valeur_fiscale: number; score_risque: string; frais_notaire: number; frais_acd: number; confidence: string; sample_size: number; market_source: string }
const RISK: Record<string, [string, string]> = { vert: ["Faible", "bg-emerald-100 text-emerald-800"], orange: ["Modéré", "bg-amber-100 text-amber-800"], rouge: ["Élevé", "bg-red-100 text-red-800"] };

export function FoncierForm({ zones }: { zones: ZoneOption[] }) {
  const { f, set } = useForm({ commune: "", zone: "", ville: "Abidjan", superficie: "500", statut_admin: "acd", usage_prevu: "residentiel", situation: "interieur", viabilise: "non", milieu: "urbain" });
  const [res, setRes] = useState<FoncierResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-6">
      <form onSubmit={(e) => { e.preventDefault(); setErr(null); start(async () => { const r = await foncierEstimateAction(f); if (r.ok) setRes(r.data as FoncierResult); else { setRes(null); setErr(r.error); } }); }}
        className="grid gap-4 sm:grid-cols-2">
        <ZoneFields zones={zones} f={f} set={set} />
        <div><label className={label} htmlFor="fc-sup">Superficie (m²) *</label><input id="fc-sup" required value={f.superficie} onChange={set("superficie")} inputMode="numeric" className={input} /></div>
        <div>
          <label className={label} htmlFor="fc-statut">Statut du terrain</label>
          <select id="fc-statut" value={f.statut_admin} onChange={set("statut_admin")} className={input}>
            <option value="acd">ACD (titre définitif)</option><option value="lettre_attribution">Lettre d’attribution</option><option value="approbation_ministerielle">Approbation ministérielle</option><option value="coutumier">Coutumier / attestation villageoise</option>
          </select>
        </div>
        <div><label className={label} htmlFor="fc-usage">Usage prévu</label><select id="fc-usage" value={f.usage_prevu} onChange={set("usage_prevu")} className={input}><option value="residentiel">Résidentiel</option><option value="commercial">Commercial</option><option value="agricole">Agricole</option></select></div>
        <div>
          <label className={label} htmlFor="fc-sit">Situation</label>
          <select id="fc-sit" value={f.situation} onChange={set("situation")} className={input}><option value="interieur">Intérieur de quartier</option><option value="bordure_principale">Bord de voie principale</option><option value="bordure_secondaire">Bord de voie secondaire</option><option value="enclave">Enclavé</option></select>
        </div>
        <div><label className={label} htmlFor="fc-via">Viabilisé (eau, électricité)</label><select id="fc-via" value={f.viabilise} onChange={set("viabilise")} className={input}><option value="non">Non</option><option value="oui">Oui</option></select></div>
        <div className="flex items-end justify-end"><button type="submit" disabled={pending} className={btn}>{pending ? "Calcul…" : "Estimer le terrain"}</button></div>
        <Err text={err} />
      </form>
      {res ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-live="polite">
          <p className="text-sm text-muted">Valeur estimée du terrain</p>
          <p className="font-display text-3xl font-black text-ink">{fmt(res.valeur_min)} – {fmt(res.valeur_max)}</p>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p>Valeur fiscale (DGI) : <b>{fmt(res.valeur_fiscale)}</b></p>
            <p>Frais de notaire estimés : <b>{fmt(res.frais_notaire)}</b></p>
            {res.frais_acd ? <p>Obtention de l’ACD (estimation) : <b>{fmt(res.frais_acd)}</b></p> : null}
            <p>Risque juridique : <span className={"rounded-full px-2 py-0.5 text-xs font-bold " + (RISK[res.score_risque]?.[1] ?? "")}>{RISK[res.score_risque]?.[0] ?? res.score_risque}</span></p>
          </div>
          <p className="text-xs text-muted">Estimation indicative{res.sample_size ? ` · ${res.sample_size} références de marché` : ""}{res.market_source ? ` · source : ${res.market_source}` : ""}. Faites toujours vérifier le titre foncier.</p>
          <CallbackForm service="foncier" title="Acheter, vendre ou sécuriser ce terrain ? Un conseiller Moboo vous rappelle." data={{ ...f, estimation: `${res.valeur_min} - ${res.valeur_max}` }} />
        </div>
      ) : null}
    </div>
  );
}

// ─── Solvabilité du locataire ───────────────────────────────────────────────
interface Report {
  score: number; grade: "A" | "B" | "C" | "D";
  history: { found: boolean; leases: number; managers: number; months: number; dues: number; onTime: number; late: number; partial: number; unpaid: number; punctuality: number | null };
  income: { rent: number; income: number; ratio: number | null; multiple: number; ok: boolean | null };
  identity: { verifiedAccount: boolean };
  advice: string[];
}
const GRADE: Record<string, [string, string]> = {
  A: ["Très bon dossier", "bg-emerald-600"], B: ["Bon dossier", "bg-lime-600"], C: ["Dossier à surveiller", "bg-amber-500"], D: ["Dossier fragile", "bg-red-600"],
};

function ReportView({ name, r }: { name: string; r: Report }) {
  const h = r.history;
  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-live="polite">
      <div className="flex items-center gap-4">
        <span className={"grid h-16 w-16 shrink-0 place-items-center rounded-2xl font-display text-3xl font-black text-white " + GRADE[r.grade][1]}>{r.grade}</span>
        <div>
          <p className="font-display text-xl font-bold text-ink">{name} · {GRADE[r.grade][0]}</p>
          <p className="text-sm text-muted">Score {r.score}/100</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase text-muted">Historique de loyers</p>
          {h.found ? (
            <>
              <p className="mt-1 font-display text-2xl font-black text-ink">{h.punctuality != null ? `${h.punctuality} %` : "—"}</p>
              <p className="text-xs text-slate-600">payés à l’heure · {h.dues} échéances · {h.leases} bail{h.leases > 1 ? "s" : ""}{h.months ? ` · ${h.months} mois` : ""}</p>
              {h.late || h.unpaid || h.partial ? <p className="mt-1 text-xs text-slate-600">{h.late} retard(s) · {h.partial} partiel(s) · {h.unpaid} impayé(s)</p> : null}
            </>
          ) : <p className="mt-1 text-sm text-slate-600">Aucun historique sur Moboo</p>}
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase text-muted">Revenus / loyer</p>
          <p className="mt-1 font-display text-2xl font-black text-ink">{r.income.ratio != null ? `× ${r.income.ratio.toLocaleString("fr-FR")}` : "—"}</p>
          <p className="text-xs text-slate-600">{r.income.ok == null ? "Revenus non renseignés" : r.income.ok ? `Au-dessus du seuil (× ${r.income.multiple})` : `Sous le seuil recommandé (× ${r.income.multiple})`}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase text-muted">Identité</p>
          <p className="mt-1 text-sm font-semibold text-ink">{r.identity.verifiedAccount ? "✅ Compte vérifié sur Moboo" : "Non vérifiée sur Moboo"}</p>
        </div>
      </div>
      {r.advice.length ? (
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Nos conseils</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">{r.advice.map((a) => <li key={a}>{a}</li>)}</ul>
        </div>
      ) : null}
      <p className="text-xs text-muted">Rapport établi avec l’accord du candidat, à partir des loyers suivis sur Moboo Pro par les gestionnaires (sans nom de bailleur ni montant) et des revenus déclarés. Il aide à décider mais ne remplace pas vos propres vérifications.</p>
    </div>
  );
}

export function SolvencyForm({ incomeMultiple, codeTtlMin }: { incomeMultiple: number; codeTtlMin: number }) {
  const { f, set } = useForm({ requester_name: "", requester_phone: "", tenant_name: "", tenant_phone: "", tenant_id_number: "", rent: "", income: "", employer: "", consent: "" });
  const [step, setStep] = useState<{ ref: string; channel: string } | null>(null);
  const [code, setCode] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (report) return <ReportView name={f.tenant_name} r={report} />;
  if (step) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); setErr(null); start(async () => { const r = await solvencyConfirmAction(step.ref, code); if (r.ok) setReport((r.data as { report: Report }).report); else setErr(r.error); }); }}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="font-display text-lg font-bold text-ink">Étape 2 : code d’accord du candidat</p>
        {step.channel === "sms" ? (
          <p className="text-sm text-slate-700">Un SMS avec un code à 6 chiffres vient d’être envoyé à <b>{f.tenant_name}</b> ({f.tenant_phone}). Demandez-lui ce code : il confirme son accord. Code valable {codeTtlMin} minutes.</p>
        ) : (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">L’envoi automatique du SMS n’est pas disponible pour le moment : l’équipe Moboo transmet le code au candidat et vous recontacte. Référence : <b>{step.ref}</b>.</p>
        )}
        <div className="flex flex-wrap gap-3">
          <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="Code à 6 chiffres" aria-label="Code à 6 chiffres" className={input + " max-w-[200px] text-center text-lg tracking-[0.4em]"} />
          <button type="submit" disabled={pending || code.length !== 6} className={btn}>{pending ? "Vérification…" : "Voir le rapport"}</button>
        </div>
        <button type="button" disabled={pending} onClick={() => { setErr(null); setInfo(null); start(async () => { const r = await solvencyResendAction(step.ref); if (r.ok) setInfo("Nouveau code envoyé."); else setErr(r.error); }); }}
          className="text-sm font-semibold text-brand-700 underline underline-offset-4">Renvoyer le code</button>
        {info ? <p className="text-sm text-emerald-700">{info}</p> : null}
        {err ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p> : null}
      </form>
    );
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); setErr(null); start(async () => { const r = await solvencyRequestAction(f); if (r.ok) setStep({ ref: r.data.ref, channel: r.data.channel }); else setErr(r.error); }); }}
      className="grid gap-4 sm:grid-cols-2">
      <p className="text-sm font-semibold text-ink sm:col-span-2">Vous (propriétaire ou gestionnaire)</p>
      <div><label className={label} htmlFor="sv-rn">Nom et prénom *</label><input id="sv-rn" required value={f.requester_name} onChange={set("requester_name")} className={input} autoComplete="name" /></div>
      <div><label className={label} htmlFor="sv-rp">Téléphone *</label><input id="sv-rp" required value={f.requester_phone} onChange={set("requester_phone")} inputMode="tel" className={input} autoComplete="tel" /></div>
      <p className="mt-2 text-sm font-semibold text-ink sm:col-span-2">Le candidat locataire</p>
      <div><label className={label} htmlFor="sv-tn">Nom et prénom *</label><input id="sv-tn" required value={f.tenant_name} onChange={set("tenant_name")} className={input} /></div>
      <div><label className={label} htmlFor="sv-tp">Téléphone du candidat *</label><input id="sv-tp" required value={f.tenant_phone} onChange={set("tenant_phone")} inputMode="tel" className={input} /></div>
      <div><label className={label} htmlFor="sv-id">N° de pièce d’identité (facultatif)</label><input id="sv-id" value={f.tenant_id_number} onChange={set("tenant_id_number")} className={input} /></div>
      <div><label className={label} htmlFor="sv-emp">Employeur / activité (facultatif)</label><input id="sv-emp" value={f.employer} onChange={set("employer")} className={input} /></div>
      <div><label className={label} htmlFor="sv-rent">Loyer mensuel du logement (FCFA) *</label><input id="sv-rent" required value={f.rent} onChange={set("rent")} inputMode="numeric" className={input} /></div>
      <div><label className={label} htmlFor="sv-inc">Revenus mensuels déclarés (FCFA)</label><input id="sv-inc" value={f.income} onChange={set("income")} inputMode="numeric" className={input} placeholder={`Recommandé : au moins ${incomeMultiple} × le loyer`} /></div>
      <label className="flex items-start gap-2 text-sm text-slate-700 sm:col-span-2">
        <input type="checkbox" required checked={!!f.consent} onChange={set("consent")} className="mt-0.5 h-4 w-4" />
        <span>Le candidat est informé de cette vérification. Il recevra un code par SMS et devra me le communiquer pour donner son accord.</span>
      </label>
      <Err text={err} />
      <div className="flex justify-end sm:col-span-2"><button type="submit" disabled={pending} className={btn}>{pending ? "Envoi…" : "Envoyer le code au candidat"}</button></div>
      <p className="text-xs text-muted sm:col-span-2">Sans l’accord du candidat, aucune information n’est communiquée. <Link href="/confidentialite" className="underline">Confidentialité</Link></p>
    </form>
  );
}
