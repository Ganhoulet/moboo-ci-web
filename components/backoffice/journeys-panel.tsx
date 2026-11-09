"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  applyTriageAction, cancelCorrectionAction, journeyEntryAction, previewJourneyAction, requestCorrectionAction, saveCallAction, saveJourneyAction, testJourneyAction, undoTriageAction,
  type CorrectionContact, type CorrectionHistory, type EtabTriage, type Journey, type JourneyCall, type JourneyChannel, type JourneyDiagnostic, type JourneyOverview, type JourneyPerformance, type JourneyPerson, type PerfJourney, type JourneyStep, type Paged, type SimulationRow,
} from "@/app/admin/centre-marketing/parcours/actions";

const input = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none";
const label = "block text-xs font-semibold uppercase tracking-wide text-slate-500";
const btn = "rounded-md bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-50";
const primary = "rounded-md bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50";
const card = "rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200";
const n = (v: number | undefined) => (v ?? 0).toLocaleString("fr-FR");
const when = (d: string | null) => (d ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "");
const PROFILE: Record<string, string> = { agent: "Agents", entreprise: "Agences et promoteurs", etab_residences: "Résidences meublées", etab_espaces: "Espaces événementiels", proprietaire: "Propriétaires", etab_inconnu: "Établissements à classer", particulier: "Particuliers", autre: "Autres" };
const APP: Record<string, string> = { pro: "Moboo Pro", resi: "Moboo Resi", event: "Moboo Event", tri: "Question : comptes à classer" };
const SUBTYPE: Record<string, string> = { residences: "Résidences meublées", espaces: "Espaces événementiels", les_deux: "Les deux" };
const PAGE = "/admin/centre-marketing/parcours";

function Msg({ m }: { m: { ok: boolean; text: string } | null }) {
  return m ? <p className={"text-sm " + (m.ok ? "text-emerald-700" : "text-red-600")}>{m.text}</p> : null;
}

/* ─── Vue d'ensemble ───────────────────────────────────────────────────── */

function TriagePanel({ t }: { t: EtabTriage }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const apply = () => start(async () => {
    const r = await applyTriageAction(confirm);
    setMsg(r.ok ? { ok: true, text: `${n(r.data?.applied)} compte(s) classé(s).` } : { ok: false, text: r.error ?? "Erreur" });
    if (r.ok) { setConfirm(""); router.refresh(); }
  });
  const undo = () => start(async () => {
    const r = await undoTriageAction();
    setMsg(r.ok ? { ok: true, text: `Tri annulé pour ${n(r.data?.undone)} compte(s).${r.data?.kept ? ` ${n(r.data.kept)} compte(s) déjà entrés dans un parcours ne changent pas.` : ""}` } : { ok: false, text: r.error ?? "Erreur" });
    if (r.ok) router.refresh();
  });
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold text-ink">Établissements à classer</h2>
      <p className="max-w-3xl text-sm text-muted">Ces comptes ne disent pas s’ils proposent des résidences meublées ou des espaces événementiels. Le tri regarde leurs annonces et les applications qu’ils utilisent. Il n’envoie aucun e-mail et ne remplace jamais une information déjà renseignée.</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile k="Résidences meublées" v={n(t.counts.residences)} hint="à classer d’après les faits" />
        <Tile k="Espaces événementiels" v={n(t.counts.espaces)} hint="à classer d’après les faits" />
        <Tile k="Les deux" v={n(t.counts.les_deux)} hint="à classer d’après les faits" />
        <Tile k="Sans indice" v={n(t.unknown)} hint="à questionner par e-mail" />
      </div>
      <div className={card + " space-y-3"}>
        {t.samples.length ? (
          <div>
            <p className="text-sm font-semibold text-ink">Exemples à vérifier avant d’appliquer</p>
            <ul className="mt-1 divide-y divide-slate-100 text-sm">
              {t.samples.map((s, i) => <li key={i} className="flex flex-wrap justify-between gap-2 py-1.5"><span>{s.name}</span><span className="text-muted">{SUBTYPE[s.result]} · {n(s.furnished)} annonce(s) meublée(s), {n(s.event)} d’espace{s.onApp ? ", déjà sur l’application" : ""}</span></li>)}
            </ul>
          </div>
        ) : <p className="text-sm text-muted">Aucun compte ne peut être classé automatiquement pour l’instant.</p>}
        {t.classifiable ? (
          <div className="flex flex-wrap items-end gap-2">
            <div><label className={label} htmlFor="classer">Pour appliquer, écrivez CLASSER</label><input id="classer" className={input + " max-w-xs"} value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
            <button disabled={pending || confirm !== "CLASSER"} className={primary} onClick={apply}>Classer {n(t.classifiable)} compte(s)</button>
          </div>
        ) : null}
        {t.autoApplied ? <button disabled={pending} className={btn} onClick={undo}>Annuler le tri automatique ({n(t.autoApplied)} compte(s))</button> : null}
        {t.answered ? <p className="text-sm text-muted">{n(t.answered)} personne(s) ont indiqué elles-mêmes leur activité.</p> : null}
        <Msg m={msg} />
        <p className="text-xs text-muted">Pour les comptes sans indice, allumez « Comptes à classer » dans Réglages et textes : un seul e-mail, avec trois réponses possibles.</p>
      </div>
    </section>
  );
}

export function JourneyResults({ overview: o, diagnostic: d, simulation: sim, triage }: { overview: JourneyOverview; diagnostic: JourneyDiagnostic | null; simulation: Record<string, SimulationRow> | null; triage: EtabTriage | null }) {
  return (
    <div className="space-y-6">
      {triage && (triage.total > 0 || triage.autoApplied > 0) ? <TriagePanel t={triage} /> : null}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-ink">Où en sont les personnes</h2>
        {o.journeys.filter((j) => j.key !== "tri").map((j) => (
          <div key={j.key} className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-ink">{j.name}</p>
              <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (j.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>{j.enabled ? "Allumé" : "Éteint"}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
              {o.stages.map((s, i) => (
                <Link key={s.key} href={`${PAGE}?tab=personnes&journey=${j.key}&stage=${s.key}`} title={s.hint} className="rounded-md bg-slate-50 p-2 ring-1 ring-slate-200 hover:ring-brand-300">
                  <p className="text-[11px] font-semibold text-slate-500">{i + 1}. {s.label}</p>
                  <p className="font-display text-xl font-extrabold tabular-nums text-ink">{n(j.stages[s.key])}</p>
                  <p className="text-[11px] text-slate-400">{s.en}</p>
                </Link>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">E-mails sur 30 jours : {n(j.last30.sent)} envoyés, {n(j.last30.failed)} en échec.{j.paid30.whatsapp || j.paid30.sms ? ` WhatsApp : ${n(j.paid30.whatsapp)}, SMS : ${n(j.paid30.sms)}.` : ""} {Object.entries(j.statuses).map(([k, v]) => `${o.statusLabels[k] ?? k} : ${n(v)}`).join(" · ")}</p>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold text-ink">Simulation : qui recevrait un e-mail</h2>
        <p className="text-sm text-muted">Calcul sur la base actuelle, anciens inscrits compris. Aucun e-mail n’est envoyé.</p>
        {sim ? (
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Application</th><th className="px-3 py-2 text-right">Public</th><th className="px-3 py-2 text-right">Joignables</th><th className="px-3 py-2 text-right">Déjà sur l’appli</th><th className="px-3 py-2 text-right">Sans e-mail valable</th><th className="px-3 py-2 text-right">Désinscrits</th><th className="px-3 py-2">Durée du premier envoi</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(sim).map(([k, v]) => (
                  <tr key={k}>
                    <td className="px-3 py-2 font-semibold">{APP[k] ?? k}</td><td className="px-3 py-2 text-right tabular-nums">{n(v.total)}</td><td className="px-3 py-2 text-right font-semibold tabular-nums text-emerald-700">{n(v.sendable)}</td><td className="px-3 py-2 text-right tabular-nums">{n(v.already)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-amber-700">{n(v.noEmail)}</td><td className="px-3 py-2 text-right tabular-nums">{n(v.optedOut)}</td><td className="px-3 py-2 text-slate-600">{v.sendable ? `${n(v.daysFirstEmail)} jour(s) à ${n(v.dailyCap)} par jour` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className={card + " text-sm text-red-600"}>Simulation indisponible.</p>}
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold text-ink">Diagnostic de la base</h2>
        {d ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Tile k="Comptes du site" v={n(d.accounts)} hint={`dont ${n(d.professionals.total)} professionnels`} />
              <Tile k="Pros déjà sur une appli" v={n(d.professionals.onAny)} hint={`Pro ${n(d.professionals.onApps.pro)} · Resi ${n(d.professionals.onApps.resi)} · Event ${n(d.professionals.onApps.event)}`} />
              <Tile k="Anciens comptes moboo.ci" v={n(d.legacy.total)} hint={`${n(d.legacy.linked)} reliés · ${n(d.legacy.noEmail)} sans e-mail`} />
              <Tile k="Désinscrits des e-mails" v={n(d.optedOut)} hint={`Applications : ${n(d.appUsers.total)} comptes, ${n(d.appUsers.generatedEmail)} e-mails générés`} />
            </div>
            <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Profil</th><th className="px-3 py-2 text-right">Comptes</th><th className="px-3 py-2 text-right">E-mail réel</th><th className="px-3 py-2 text-right">Généré</th><th className="px-3 py-2 text-right">Invalide</th><th className="px-3 py-2 text-right">Absent</th><th className="px-3 py-2 text-right">Récupérable (ancien site)</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(d.byProfile).map(([k, v]) => (
                    <tr key={k}><td className="px-3 py-2 font-semibold">{PROFILE[k] ?? k}</td><td className="px-3 py-2 text-right tabular-nums">{n(v.total)}</td><td className="px-3 py-2 text-right tabular-nums text-emerald-700">{n(v.real)}</td><td className="px-3 py-2 text-right tabular-nums">{n(v.generated)}</td><td className="px-3 py-2 text-right tabular-nums">{n(v.invalid)}</td><td className="px-3 py-2 text-right tabular-nums">{n(v.missing)}</td><td className="px-3 py-2 text-right tabular-nums">{n(v.recoverable)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : <p className={card + " text-sm text-red-600"}>Diagnostic indisponible.</p>}
      </section>
    </div>
  );
}

function Tile({ k, v, hint }: { k: string; v: string; hint: string }) {
  return <div className={card}><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k}</p><p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-ink">{v}</p><p className="mt-0.5 text-xs text-muted">{hint}</p></div>;
}

/* ─── Performance ─────────────────────────────────────────────────────── */

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : "—");

function Cell({ v, of }: { v: number; of: number }) {
  return <td className="px-3 py-2 text-right tabular-nums"><span className="font-semibold">{n(v)}</span> <span className="text-xs text-muted">{pct(v, of)}</span></td>;
}

function PerfCard({ j }: { j: PerfJourney }) {
  const tri = j.key === "tri";
  return (
    <section className={card + " space-y-3"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-ink">{tri ? "Comptes à classer" : j.name}</h2>
        <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (j.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>{j.enabled ? "Allumé" : "Éteint"}</span>
      </div>
      {j.steps.length ? <>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Tile k="Personnes contactées" v={n(j.contacted)} hint="au moins un message envoyé" />
          <Tile k="Ont cliqué" v={n(j.clickedPeople)} hint={`${pct(j.clickedPeople, j.contacted)} des personnes contactées`} />
          {tri ? <Tile k="Ont répondu" v={n(j.answered)} hint={`${pct(j.answered, j.contacted)} des personnes contactées`} /> : <>
            <Tile k="Installé et connecté" v={n(j.installed)} hint={`${pct(j.installed, j.contacted)} des personnes contactées`} />
            <Tile k="Abonnés" v={n(j.subscribed)} hint={`${pct(j.subscribed, j.contacted)} des personnes contactées`} />
          </>}
        </div>
        <div className="overflow-x-auto rounded-md ring-1 ring-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Message</th><th className="px-3 py-2 text-right">Envoyés</th><th className="px-3 py-2 text-right">Échecs</th><th className="px-3 py-2 text-right">Ouverts</th><th className="px-3 py-2 text-right">Cliqués</th>{tri ? <th className="px-3 py-2 text-right">Ont répondu</th> : <><th className="px-3 py-2 text-right">Installé ensuite</th><th className="px-3 py-2 text-right">Abonné ensuite</th></>}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {j.steps.map((s) => (
                <tr key={`${s.step}-${s.channel}-${s.subject}`}>
                  <td className="min-w-52 px-3 py-2"><span className="font-semibold">{s.step + 1}. {CHANNEL_NAME[s.channel] ?? s.channel}</span><br /><span className="text-xs text-muted">{s.subject}</span></td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{n(s.sent)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-amber-700">{n(s.failed)}</td>
                  {s.channel === "email" ? <Cell v={s.opened} of={s.sent} /> : <td className="px-3 py-2 text-right text-muted">non mesuré</td>}
                  <Cell v={s.clicked} of={s.sent} />
                  {tri ? <Cell v={s.answered} of={s.sent} /> : <><Cell v={s.installed} of={s.sent} /><Cell v={s.subscribed} of={s.sent} /></>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </> : <p className="text-sm text-muted">Aucun message envoyé sur cette période.</p>}
    </section>
  );
}

export function JourneyPerformancePanel({ data }: { data: JourneyPerformance | null }) {
  if (!data) return <p className={card + " text-sm text-red-600"}>Performance indisponible.</p>;
  const periods: [number, string][] = [[7, "7 jours"], [30, "30 jours"], [90, "90 jours"], [0, "Depuis le début"]];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {periods.map(([d, l]) => <Link key={d} className={d === data.days ? primary : btn} href={`${PAGE}?tab=performance&days=${d}`}>{l}</Link>)}
      </div>
      {data.journeys.map((j) => <PerfCard key={j.key} j={j} />)}
      <div className="rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-600 ring-1 ring-slate-200">
        <p><strong>Envoyés</strong> : acceptés par le fournisseur, ce qui ne prouve pas l’arrivée dans la boîte. <strong>Ouverts</strong> : approximatif. <strong>Cliqués</strong> : le meilleur signal, un antivirus de messagerie peut parfois cliquer à la place de la personne.</p>
        <p className="mt-1"><strong>Installé ensuite</strong> : la personne s’est connectée à l’application après ce message, le dernier reçu avant son arrivée. Chaque personne n’est comptée qu’une fois.</p>
      </div>
    </div>
  );
}

/* ─── Réglages ─────────────────────────────────────────────────────────── */

const CHANNEL_NAME: Record<JourneyChannel, string> = { email: "E-mail", whatsapp: "WhatsApp", sms: "SMS" };
const channel = (s: JourneyStep): JourneyChannel => s.channel ?? "email";
const paid = (s: JourneyStep) => channel(s) !== "email";

const delayText = (h: number) => (h >= 24 && h % 24 === 0 ? `soit ${h / 24} jour${h > 24 ? "s" : ""}` : "");

export function JourneySettings({ overview: o }: { overview: JourneyOverview }) {
  const [key, setKey] = useState(o.journeys[0].key);
  const j = o.journeys.find((x) => x.key === key)!;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {o.journeys.map((x) => <button key={x.key} onClick={() => setKey(x.key)} className={"rounded-full px-3 py-1.5 text-sm font-semibold ring-1 " + (x.key === key ? "bg-brand-700 text-white ring-brand-700" : "bg-white ring-slate-300")}>{x.name}{x.enabled ? " · allumé" : ""}</button>)}
      </div>
      <JourneyForm key={`${j.key}-${j.updatedAt}`} j={j} o={o} />
    </div>
  );
}

function JourneyForm({ j, o }: { j: Journey; o: JourneyOverview }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState({ enabled: j.enabled, backfill: j.backfill, audiences: j.audiences, dailyCap: j.dailyCap, paidCap: j.paidCap, gapDays: j.gapDays, steps: j.steps });
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [to, setTo] = useState("");
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const turningOn = (f.enabled && !j.enabled) || (f.backfill && !j.backfill) || (f.enabled && f.steps.some(paid) && !j.steps.some(paid));
  const addStep = (c: "whatsapp" | "sms") => setF((s) => ({ ...s, steps: [...s.steps, { ...o.stepSamples[c], ctaUrl: (s.steps[0]?.ctaUrl ?? "https://moboo.ci").replace("utm_medium=email", `utm_medium=${c}`) }] }));
  const move = (i: number, d: number) => setF((s) => { const steps = [...s.steps]; const [x] = steps.splice(i, 1); steps.splice(i + d, 0, x); return { ...s, steps }; });
  const remove = (i: number) => setF((s) => ({ ...s, steps: s.steps.filter((_, k) => k !== i) }));
  const emails = f.steps.filter((x) => !paid(x)).length;
  const setStep = (i: number, p: Partial<JourneyStep>) => setF((s) => ({ ...s, steps: s.steps.map((x, k) => (k === i ? { ...x, ...p } : x)) }));
  const save = () => start(async () => {
    const r = await saveJourneyAction({ key: j.key, ...f }, confirm);
    setMsg(r.ok ? { ok: true, text: "Enregistré." } : { ok: false, text: r.error ?? "Erreur" });
    if (r.ok) { setConfirm(""); router.refresh(); }
  });
  return (
    <div className="space-y-4">
      <div className={card + " space-y-4"}>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={f.enabled} onChange={(e) => setF({ ...f, enabled: e.target.checked, backfill: e.target.checked && f.backfill })} /><span><strong>Parcours allumé</strong><br /><span className="text-muted">Les nouveaux inscrits reçoivent les e-mails après le délai.</span></span></label>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" disabled={!f.enabled} checked={f.backfill} onChange={(e) => setF({ ...f, backfill: e.target.checked })} /><span><strong>Inclure les anciens inscrits</strong><br /><span className="text-muted">Les personnes déjà en base, par petits lots chaque jour.</span></span></label>
        </div>
        {j.key === "tri" ? <p className="text-sm text-muted">Reçu seulement par les établissements restés sans indice après le tri. Dès qu’une personne répond, son compte est classé et elle peut entrer dans le parcours Moboo Resi ou Moboo Event.</p> : <div>
          <p className={label}>Qui reçoit ce parcours</p>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            {Object.entries(o.audiences).filter(([k]) => k !== "etab_inconnu").map(([k, l]) => <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={f.audiences.includes(k)} onChange={() => setF({ ...f, audiences: f.audiences.includes(k) ? f.audiences.filter((x) => x !== k) : [...f.audiences, k] })} />{l}</label>)}
          </div>
        </div>}
        <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
          <div><label className={label} htmlFor="cap">E-mails par jour au plus</label><input id="cap" type="number" min={1} max={o.maxDailyCap} className={input} value={f.dailyCap} onChange={(e) => setF({ ...f, dailyCap: Number(e.target.value) })} /></div>
          {j.key !== "tri" ? <div><label className={label} htmlFor="paid">WhatsApp et SMS par jour au plus</label><input id="paid" type="number" min={0} max={o.maxDailyCap} className={input} value={f.paidCap} onChange={(e) => setF({ ...f, paidCap: Number(e.target.value) })} /><p className="mt-1 text-xs text-muted">Ces messages sont facturés par votre fournisseur.</p></div> : null}
          <div><label className={label} htmlFor="gap">Jours entre deux messages</label><input id="gap" type="number" min={1} max={60} className={input} value={f.gapDays} onChange={(e) => setF({ ...f, gapDays: Number(e.target.value) })} /></div>
        </div>
      </div>

      {f.steps.map((s, i) => {
        const c = channel(s);
        const ready = o.channels[c];
        return (
        <div key={i} className={card + " space-y-3"}>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-ink">Message {i + 1} : {CHANNEL_NAME[c]}</p>
            {paid(s) ? <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (ready ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800")}>{ready ? "Connecté" : "En attente de connexion"}</span> : null}
            {j.key !== "tri" ? <span className="ml-auto flex gap-1">
              <button type="button" aria-label={`Monter le message ${i + 1}`} disabled={i === 0} className={btn} onClick={() => move(i, -1)}>↑</button>
              <button type="button" aria-label={`Descendre le message ${i + 1}`} disabled={i === f.steps.length - 1} className={btn} onClick={() => move(i, 1)}>↓</button>
              {f.steps.length > 1 ? <button type="button" className={btn} onClick={() => remove(i)}>Retirer</button> : null}
            </span> : null}
          </div>
          {paid(s) && !ready ? <p className="rounded-md bg-amber-50 p-2 text-sm text-amber-900 ring-1 ring-amber-200">Rien ne part sur ce canal pour l’instant. Les personnes arrivées à ce message attendent, et repartent dès que le service est connecté dans <Link className="font-semibold underline" href="/admin/centre-marketing/canaux">Canaux d’envoi</Link>.</p> : null}
          <div className="lg:max-w-xs"><label className={label} htmlFor={`d${i}`}>{i === 0 ? "Heures après l’inscription" : "Heures après le message précédent"}</label><input id={`d${i}`} type="number" min={1} className={input} value={s.delayHours} onChange={(e) => setStep(i, { delayHours: Number(e.target.value) })} /><p className="mt-1 text-xs text-muted">{delayText(s.delayHours)}{i === 0 ? " (les anciens inscrits n’attendent pas ce délai)" : ""}</p></div>
          {c === "email" ? <>
            <div><label className={label} htmlFor={`s${i}`}>Objet</label><input id={`s${i}`} className={input} value={s.subject} onChange={(e) => setStep(i, { subject: e.target.value })} /></div>
            <div><label className={label} htmlFor={`b${i}`}>Message</label><textarea id={`b${i}`} rows={8} className={input} value={s.body} onChange={(e) => setStep(i, { body: e.target.value })} /></div>
          </> : null}
          {c === "sms" ? <div><label className={label} htmlFor={`b${i}`}>Texte du SMS</label><textarea id={`b${i}`} rows={3} className={input} value={s.body} onChange={(e) => setStep(i, { body: e.target.value })} /><p className="mt-1 text-xs text-muted">Gardez {"{{lien}}"} dans le texte. Faites court : chaque tranche de 160 caractères est facturée. Le lien STOP s’ajoute tout seul.</p></div> : null}
          {c === "whatsapp" ? <>
            <div className="lg:max-w-md"><label className={label} htmlFor={`t${i}`}>Modèle approuvé par Meta</label><input id={`t${i}`} className={input} value={s.waTemplate ?? ""} onChange={(e) => setStep(i, { waTemplate: e.target.value })} /><p className="mt-1 text-xs text-muted">Le texte à faire approuver se trouve dans Canaux d’envoi.</p></div>
            <div><label className={label} htmlFor={`v${i}`}>Valeurs du modèle, une par ligne</label><textarea id={`v${i}`} rows={3} className={input} value={(s.waVars ?? []).join("\n")} onChange={(e) => setStep(i, { waVars: e.target.value.split("\n") })} /></div>
          </> : null}
          {j.key === "tri" ? <p className="text-sm text-muted">Trois boutons s’ajoutent tout seuls à l’e-mail : Résidences meublées, Espaces événementiels, Les deux.</p> : <div className="grid gap-3 md:grid-cols-2">
            {c === "email" ? <div><label className={label} htmlFor={`c${i}`}>Texte du bouton</label><input id={`c${i}`} className={input} value={s.ctaLabel} onChange={(e) => setStep(i, { ctaLabel: e.target.value })} /></div> : null}
            <div><label className={label} htmlFor={`u${i}`}>{c === "email" ? "Lien du bouton" : "Page ouverte par le lien"}</label><input id={`u${i}`} className={input} value={s.ctaUrl} onChange={(e) => setStep(i, { ctaUrl: e.target.value })} /></div>
          </div>}
          {paid(s) ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!s.skipIfClicked} onChange={(e) => setStep(i, { skipIfClicked: e.target.checked })} />Ne pas envoyer si la personne a déjà cliqué : elle passe dans la liste À appeler</label> : null}
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={pending} className={btn} onClick={() => start(async () => { const r = await previewJourneyAction(j.key, i, f.steps); if (r.ok && r.data) setPreview(r.data); else setMsg({ ok: false, text: r.error ?? "Erreur" }); })}>Aperçu</button>
            <input aria-label={c === "email" ? "Adresse de test" : "Numéro de test"} placeholder={c === "email" ? "Adresse de test" : "Numéro de test"} className="w-60 rounded-md border border-slate-300 px-3 py-1.5 text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
            <button type="button" disabled={pending || !to.trim()} className={btn} onClick={() => start(async () => { const r = await testJourneyAction(j.key, i, f.steps, to); setMsg(r.ok ? { ok: true, text: `Essai envoyé à ${to}.` } : { ok: false, text: r.error ?? "Erreur" }); })}>Envoyer un essai</button>
          </div>
        </div>
        );
      })}
      {j.key !== "tri" ? (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={f.steps.length >= 6} className={btn} onClick={() => addStep("whatsapp")}>Ajouter une relance WhatsApp</button>
          <button type="button" disabled={f.steps.length >= 6} className={btn} onClick={() => addStep("sms")}>Ajouter une relance SMS</button>
          <span className="text-xs text-muted">{n(emails)} e-mail(s) sur 3 au plus, {n(f.steps.length)} message(s) sur 6 au plus. N’oubliez pas d’enregistrer.</span>
        </div>
      ) : null}
      <p className="text-xs text-muted">Variables : {Object.entries(o.variables).map(([k, v]) => `{{${k}}} ${v}`).join(" · ")}. Valeur de secours : {"{{prenom|à vous}}"}. Le lien de désinscription s’ajoute tout seul.</p>

      {preview ? (
        <div className={card}>
          <div className="flex items-center justify-between gap-3"><p className="font-semibold text-ink">{preview.subject}</p><button className={btn} onClick={() => setPreview(null)}>Fermer</button></div>
          <iframe title="Aperçu de l’e-mail" sandbox="" srcDoc={preview.html} className="mt-3 h-[480px] w-full rounded border border-slate-200 bg-white" />
        </div>
      ) : null}

      <div className={card + " space-y-3"}>
        {turningOn ? (
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
            <p className="font-semibold">De vrais messages vont partir vers de vraies personnes{f.steps.some(paid) ? " dès que chaque canal sera connecté, et WhatsApp et SMS sont facturés" : ""}.</p>
            <label className="mt-2 block" htmlFor="confirm">Pour confirmer, écrivez <strong>ACTIVER</strong> :</label>
            <input id="confirm" className={input + " max-w-xs bg-white"} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={pending || (turningOn && confirm !== "ACTIVER")} className={primary} onClick={save}>Enregistrer</button>
          <Msg m={msg} />
        </div>
        {j.updatedBy ? <p className="text-xs text-muted">Dernière modification : {j.updatedBy}, {when(j.updatedAt)}.</p> : null}
      </div>
    </div>
  );
}

/* ─── Suivi par personne ───────────────────────────────────────────────── */

const STATUS_TONE: Record<string, string> = { active: "bg-blue-100 text-blue-700", converted: "bg-emerald-100 text-emerald-700", already: "bg-emerald-50 text-emerald-700", no_email: "bg-amber-100 text-amber-800", invalid: "bg-red-100 text-red-700", optout: "bg-slate-200 text-slate-600", stopped: "bg-slate-200 text-slate-600", finished: "bg-slate-100 text-slate-600" };

function Pager({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  return <div className="flex items-center justify-end gap-3 text-sm">{page > 1 ? <Link className={btn} href={href(page - 1)}>Précédent</Link> : null}<span className="text-muted">Page {page} sur {pages}</span>{page < pages ? <Link className={btn} href={href(page + 1)}>Suivant</Link> : null}</div>;
}

function Tick({ on, at, children }: { on: boolean; at?: string | null; children: string }) {
  return <span title={at ? when(at) : ""} className={"rounded px-1.5 py-0.5 text-[11px] font-semibold " + (on ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400")}>{on ? "✓ " : ""}{children}</span>;
}

export function JourneyPeople({ overview: o, data, filters: f }: { overview: JourneyOverview; data: Paged<JourneyPerson> | null; filters: { journey: string; stage: string; status: string; q: string } }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const act = (id: string, a: string, value?: boolean) => start(async () => { const r = await journeyEntryAction(id, a, value); if (r.ok) router.refresh(); else setMsg({ ok: false, text: r.error ?? "Erreur" }); });
  if (!data) return <p className={card + " text-sm text-red-600"}>Suivi indisponible.</p>;
  const url = (p: number) => `${PAGE}?${new URLSearchParams({ tab: "personnes", ...(f.journey ? { journey: f.journey } : {}), ...(f.stage ? { stage: f.stage } : {}), ...(f.status ? { status: f.status } : {}), ...(f.q ? { q: f.q } : {}), page: String(p) })}`;
  return (
    <div className="space-y-3">
      <form className="flex flex-wrap items-end gap-2" action={PAGE}>
        <input type="hidden" name="tab" value="personnes" />
        <select aria-label="Application" name="journey" defaultValue={f.journey} className="rounded-md border border-slate-300 px-2 py-2 text-sm"><option value="">Toutes les applications</option>{o.journeys.map((j) => <option key={j.key} value={j.key}>{j.name}</option>)}</select>
        <select aria-label="Étape" name="stage" defaultValue={f.stage} className="rounded-md border border-slate-300 px-2 py-2 text-sm"><option value="">Toutes les étapes</option>{o.stages.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
        <select aria-label="Situation" name="status" defaultValue={f.status} className="rounded-md border border-slate-300 px-2 py-2 text-sm"><option value="">Toutes les situations</option>{Object.entries(o.statusLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <input aria-label="Recherche" name="q" defaultValue={f.q} placeholder="Nom, e-mail, téléphone" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <button className={btn}>Filtrer</button>
        <span className="ml-auto text-sm text-muted">{n(data.total)} personne(s)</span>
      </form>
      <Msg m={msg} />
      <div className="divide-y divide-slate-100 rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        {data.items.length ? data.items.map((p) => (
          <details key={p.id} className="p-3">
            <summary className="flex cursor-pointer flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-ink">{p.name}</span>
              <span className="text-muted">{APP[p.journeyKey]} · {o.stages.find((s) => s.key === p.stage)?.label}</span>
              <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (STATUS_TONE[p.status] ?? "bg-slate-100")}>{o.statusLabels[p.status] ?? p.status}</span>
              <span className="ml-auto flex flex-wrap gap-1">
                <Tick on={p.stepsSent > 0} at={p.lastSentAt}>Envoyé</Tick><Tick on={!!p.openedAt} at={p.openedAt}>Ouvert</Tick><Tick on={!!p.clickedAt} at={p.clickedAt}>Cliqué</Tick>
                <Tick on={!!p.connectedAt} at={p.connectedAt}>Application installée et connectée</Tick><Tick on={!!p.subscribedAt} at={p.subscribedAt}>Abonné</Tick>
              </span>
            </summary>
            <div className="mt-3 space-y-2 text-sm">
              <p className="text-muted">{p.address ?? "Pas d’adresse valable"} · {p.phone} · {p.source === "new" ? "Nouvel inscrit" : "Ancien inscrit"}{p.nextAt ? ` · prochain e-mail : ${when(p.nextAt)}` : ""}</p>
              {p.messages.length ? <ul className="space-y-1">{p.messages.map((m) => <li key={m.id} className="text-slate-700">{CHANNEL_NAME[m.channel] ?? "E-mail"} (message {m.step + 1}) : {m.subject} — {m.status === "sent" ? `envoyé ${when(m.sentAt)}` : m.status === "failed" ? `échec (${m.error})` : m.status === "cancelled" ? "annulé" : "en cours"}{m.openedAt ? `, ouvert ${when(m.openedAt)}` : ""}{m.clickedAt ? `, cliqué ${when(m.clickedAt)}` : ""}</li>)}</ul> : null}
              <div className="flex flex-wrap gap-2">
                {p.status === "active" ? <button disabled={pending} className={btn} onClick={() => act(p.id, "stop")}>Arrêter les e-mails</button> : null}
                {p.status === "stopped" ? <button disabled={pending} className={btn} onClick={() => act(p.id, "resume")}>Reprendre</button> : null}
                <button disabled={pending} className={btn} onClick={() => act(p.id, "advocate", !p.advocateAt)}>{p.advocateAt ? "Retirer « a recommandé »" : "Marquer « a recommandé Moboo »"}</button>
                <button disabled={pending} className={btn} onClick={() => act(p.id, "promoter", !p.promoterAt)}>{p.promoterAt ? "Retirer « ambassadeur »" : "Marquer « ambassadeur »"}</button>
              </div>
            </div>
          </details>
        )) : <p className="p-4 text-sm text-muted">Personne dans cette liste. Les personnes apparaissent ici une fois le parcours allumé.</p>}
      </div>
      <Pager page={data.page} pages={data.pages} href={url} />
      <p className="text-xs text-muted">« Ouvert » reste approximatif : certaines messageries bloquent ou anticipent cette mesure. Le téléchargement n’est visible que lorsque la personne ouvre l’application et s’y connecte.</p>
    </div>
  );
}

/* ─── À appeler ────────────────────────────────────────────────────────── */

function CallRow({ c, outcomes }: { c: JourneyCall; outcomes: Record<string, string> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [note, setNote] = useState(c.callNote ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const digits = c.whatsapp.replace(/[^\d]/g, "");
  return (
    <div className="space-y-2 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-ink">{c.name}</span>
        <span className="text-muted">{APP[c.journeyKey]}</span>
        {c.hot ? <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">A cliqué {when(c.clickedAt)}</span> : null}
        {c.callOutcome ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{outcomes[c.callOutcome] ?? c.callOutcome}, {when(c.calledAt)}</span> : null}
        <span className="ml-auto flex gap-2">
          <a href={`tel:${c.phone}`} className={btn}>Appeler {c.phone}</a>
          <a href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer" className={btn}>WhatsApp</a>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input aria-label={`Note sur ${c.name}`} placeholder="Note après l’appel" className="w-72 rounded-md border border-slate-300 px-3 py-1.5 text-sm" value={note} onChange={(e) => setNote(e.target.value)} />
        {Object.entries(outcomes).map(([k, l]) => <button key={k} disabled={pending} className={btn} onClick={() => start(async () => { const r = await saveCallAction(c.id, k, note); if (r.ok) router.refresh(); else setMsg({ ok: false, text: r.error ?? "Erreur" }); })}>{l}</button>)}
      </div>
      <Msg m={msg} />
    </div>
  );
}

export function JourneyCalls({ overview: o, data, filters: f }: { overview: JourneyOverview; data: Paged<JourneyCall> | null; filters: { journey: string; done: boolean } }) {
  if (!data) return <p className={card + " text-sm text-red-600"}>Liste indisponible.</p>;
  const url = (p: number, done = f.done) => `${PAGE}?${new URLSearchParams({ tab: "appels", ...(f.journey ? { journey: f.journey } : {}), ...(done ? { done: "1" } : {}), page: String(p) })}`;
  return (
    <div className="space-y-3">
      <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-200">Ceux qui ont cliqué sans rejoindre l’application apparaissent en premier, puis ceux qui ont reçu tous les messages. Après l’appel, cliquez sur le résultat : « Pas intéressé » arrête aussi les messages.</p>
      <div className="flex flex-wrap items-center gap-2">
        <Link className={f.done ? btn : primary} href={url(1, false)}>À appeler</Link>
        <Link className={f.done ? primary : btn} href={url(1, true)}>Déjà appelés</Link>
        <form className="flex items-center gap-2" action={PAGE}>
          <input type="hidden" name="tab" value="appels" />
          {f.done ? <input type="hidden" name="done" value="1" /> : null}
          <select aria-label="Application" name="journey" defaultValue={f.journey} className="rounded-md border border-slate-300 px-2 py-2 text-sm"><option value="">Toutes les applications</option>{o.journeys.filter((j) => j.key !== "tri").map((j) => <option key={j.key} value={j.key}>{j.name}</option>)}</select>
          <button className={btn}>Filtrer</button>
        </form>
        <span className="ml-auto text-sm text-muted">{n(data.total)} personne(s)</span>
      </div>
      <div className="divide-y divide-slate-100 rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        {data.items.length ? data.items.map((c) => <CallRow key={`${c.id}-${c.calledAt}`} c={c} outcomes={o.callOutcomes} />) : <p className="p-4 text-sm text-muted">Personne à appeler pour l’instant. La liste se remplit quand un parcours est allumé.</p>}
      </div>
      <Pager page={data.page} pages={data.pages} href={(p) => url(p)} />
    </div>
  );
}

/* ─── E-mails à corriger ───────────────────────────────────────────────── */

const STATE: Record<string, [string, string]> = { real: ["Réel", "bg-emerald-100 text-emerald-700"], generated: ["Généré", "bg-amber-100 text-amber-800"], invalid: ["Invalide", "bg-red-100 text-red-700"], missing: ["Absent", "bg-red-100 text-red-700"] };
const CH_STATUS: Record<string, string> = { pending: "En attente de confirmation", confirmed: "Confirmée et appliquée", cancelled: "Annulée", refused: "Refusée", expired: "Lien expiré" };
const waLink = (c: CorrectionContact) => `https://wa.me/${c.whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent(`Bonjour ${c.name}, ici l’équipe Moboo.ci. Pour vous relier à nos applications, pouvez-vous nous indiquer votre adresse e-mail ? Vous recevrez un lien pour la confirmer. Merci !`)}`;

function CorrectionRow({ c, history }: { c: CorrectionContact; history: CorrectionHistory[] | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [tone, text] = [STATE[c.emailState]?.[1] ?? "", STATE[c.emailState]?.[0] ?? c.emailState];
  const pendingRow = history?.find((h) => h.accountId === c.id && h.status === "pending");
  return (
    <div className="space-y-2 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-ink">{c.name}</span>
        <span className="text-muted">{c.email ?? "pas d’e-mail"}</span>
        <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + tone}>{text}</span>
        <span className="text-muted">{c.phone}</span>
        <a href={waLink(c)} target="_blank" rel="noreferrer" className="ml-auto text-sm font-semibold text-emerald-700 hover:underline">Demander son e-mail sur WhatsApp</a>
      </div>
      {c.pending ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-blue-900">
          En attente : {c.pending.newEmail}, la personne doit confirmer depuis sa boîte mail.
          {pendingRow ? <button disabled={pending} className={btn} onClick={() => start(async () => { const r = await cancelCorrectionAction(pendingRow.id); if (r.ok) router.refresh(); else setMsg({ ok: false, text: r.error ?? "Erreur" }); })}>Annuler</button> : null}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <input aria-label={`Bonne adresse pour ${c.name}`} type="email" placeholder="Bonne adresse e-mail" className="w-72 rounded-md border border-slate-300 px-3 py-1.5 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
          {c.oldSiteEmail ? <button className={btn} onClick={() => setEmail(c.oldSiteEmail!)}>Reprendre {c.oldSiteEmail}</button> : null}
          <button disabled={pending || !email.trim()} className={btn} onClick={() => start(async () => { const r = await requestCorrectionAction(c.id, email); setMsg(r.ok ? { ok: true, text: "Lien de confirmation envoyé." } : { ok: false, text: r.error ?? "Erreur" }); if (r.ok) router.refresh(); })}>Envoyer le lien de confirmation</button>
        </div>
      )}
      <Msg m={msg} />
    </div>
  );
}

export function EmailCorrections({ data, history, filters: f }: { data: Paged<CorrectionContact> | null; history: CorrectionHistory[] | null; filters: { state: string; q: string } }) {
  if (!data) return <p className={card + " text-sm text-red-600"}>Rubrique réservée aux administrateurs qui gèrent les utilisateurs.</p>;
  const url = (p: number) => `${PAGE}?${new URLSearchParams({ tab: "emails", ...(f.state ? { state: f.state } : {}), ...(f.q ? { q: f.q } : {}), page: String(p) })}`;
  return (
    <div className="space-y-3">
      <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-200">Une correction ne change rien tout de suite : la personne reçoit un lien sur la nouvelle adresse et doit confirmer. C’est ce qui évite qu’un compte passe aux mains de quelqu’un d’autre. Chaque demande est gardée dans l’historique.</p>
      <form className="flex flex-wrap items-end gap-2" action={PAGE}>
        <input type="hidden" name="tab" value="emails" />
        <select aria-label="État de l’adresse" name="state" defaultValue={f.state} className="rounded-md border border-slate-300 px-2 py-2 text-sm"><option value="">À corriger (absentes ou générées)</option><option value="missing">Absentes</option><option value="generated">Générées</option><option value="real">Réelles</option><option value="all">Toutes</option></select>
        <input aria-label="Recherche" name="q" defaultValue={f.q} placeholder="Nom, e-mail, téléphone" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <button className={btn}>Filtrer</button>
        <span className="ml-auto text-sm text-muted">{n(data.total)} compte(s)</span>
      </form>
      <div className="divide-y divide-slate-100 rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        {data.items.length ? data.items.map((c) => <CorrectionRow key={c.id} c={c} history={history} />) : <p className="p-4 text-sm text-muted">Aucun compte dans cette liste.</p>}
      </div>
      <Pager page={data.page} pages={data.pages} href={url} />
      {history?.length ? (
        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold text-ink">Historique des corrections</h2>
          <ul className="divide-y divide-slate-100 rounded-lg bg-white text-sm shadow-sm ring-1 ring-slate-200">
            {history.map((h) => <li key={h.id} className="flex flex-wrap justify-between gap-2 px-3 py-2"><span><strong>{h.name}</strong> : {h.oldEmail ?? "aucune"} → {h.newEmail}</span><span className="text-muted">{CH_STATUS[h.status] ?? h.status} · demandé par {h.requestedBy ?? "—"}, {when(h.createdAt)}</span></li>)}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
