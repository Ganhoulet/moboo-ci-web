"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  previewNudgeAction, runNudgesAction, saveRuleAction, sendNudgeAction, testNudgeAction,
  type ManualNudge, type NudgeOverview, type NudgeRow, type NudgeRule, type ProRow,
} from "@/app/admin/centre-marketing/relances/actions";
import { smsCounter } from "@/lib/sms";

const CHANNELS: [string, string][] = [["site", "Mon espace (boîte Infos)"], ["email", "E-mail"], ["whatsapp", "WhatsApp"], ["sms", "SMS"]];
const CH_LABEL: Record<string, string> = { site: "Mon espace", email: "E-mail", whatsapp: "WhatsApp", sms: "SMS" };
const TYPES: [string, string][] = [["agent", "Agents"], ["entreprise", "Agences / promoteurs"], ["proprietaire", "Propriétaires"], ["etablissement", "Résidences / espaces"]];
const SEGMENTS: [string, string][] = [["tous", "Tous"], ["sans_annonce", "Jamais publié"], ["inactif", "Inactifs"], ["actif", "Actifs"], ["expiration", "Annonces qui expirent"], ["demandes", "Demandes en attente"]];
const SEG_PILL: Record<string, [string, string]> = {
  actif: ["Actif", "bg-emerald-100 text-emerald-700"], inactif: ["Inactif", "bg-amber-100 text-amber-800"], sans_annonce: ["Jamais publié", "bg-red-100 text-red-700"],
};
const TARGETS: [string, string][] = [
  ["/mon-espace/annonces/nouvelle", "Publier une annonce"], ["/mon-espace/annonces", "Mes annonces"], ["/mon-espace/demandes", "Demandes"],
  ["/mon-espace/statistiques", "Statistiques"], ["/mon-espace/profil", "Mon profil"], ["/mon-espace/verification", "Vérification"], ["/forfaits", "Forfaits"], ["/mon-espace", "Tableau de bord"],
];
const input = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none";
const label = "block text-xs font-semibold uppercase tracking-wide text-slate-500";
const ago = (d: string | null) => {
  if (!d) return "—";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400_000);
  return days <= 0 ? "aujourd’hui" : days === 1 ? "hier" : `il y a ${days} j`;
};
const when = (d: string | null) => (d ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

function Variables({ vars }: { vars: Record<string, string> }) {
  return (
    <details className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
      <summary className="cursor-pointer font-semibold">Variables disponibles (vraies données de chaque compte)</summary>
      <ul className="mt-2 grid gap-1 sm:grid-cols-2">
        {Object.entries(vars).map(([k, v]) => <li key={k}><code className="rounded bg-white px-1 text-brand-800">{`{{${k}}}`}</code> {v}</li>)}
      </ul>
      <p className="mt-2">Valeur de secours si vide : <code className="rounded bg-white px-1">{"{{zone|votre quartier}}"}</code>.</p>
    </details>
  );
}

function ChannelBoxes({ value, onChange, ready }: { value: string[]; onChange: (v: string[]) => void; ready: Record<string, boolean> }) {
  return (
    <div className="flex flex-wrap gap-4 text-sm">
      {CHANNELS.map(([k, l]) => (
        <label key={k} className={"flex items-center gap-2 " + (ready[k] ? "" : "text-slate-400")} title={ready[k] ? "" : "Non configuré sur le serveur"}>
          <input type="checkbox" disabled={!ready[k]} checked={value.includes(k)} onChange={() => onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k])} />
          {l}{ready[k] ? "" : " (non configuré)"}
        </label>
      ))}
    </div>
  );
}

/* ─── Professionnels à relancer ─────────────────────────────────────────── */

export function NudgePros({ data, rules, channels, variables, filters }: {
  data: { total: number; page: number; pages: number; items: ProRow[] }; rules: NudgeRule[]; channels: Record<string, boolean>;
  variables: Record<string, string>; filters: { segment: string; q: string; type: string };
}) {
  const router = useRouter();
  const [sel, setSel] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const all = data.items.length > 0 && data.items.every((i) => sel.includes(i.id));
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const qs = (page: number) => `/admin/centre-marketing/relances?${new URLSearchParams({ tab: "pros", segment: filters.segment, ...(filters.q ? { q: filters.q } : {}), ...(filters.type ? { type: filters.type } : {}), page: String(page) })}`;

  return (
    <div className="space-y-4">
      <form className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200" action="/admin/centre-marketing/relances">
        <input type="hidden" name="tab" value="pros" />
        <label className="text-sm"><span className={label}>Situation</span>
          <select name="segment" defaultValue={filters.segment} className={input}>{SEGMENTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </label>
        <label className="text-sm"><span className={label}>Type</span>
          <select name="type" defaultValue={filters.type} className={input}><option value="">Tous</option>{TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </label>
        <label className="min-w-[220px] flex-1 text-sm"><span className={label}>Recherche</span><input name="q" defaultValue={filters.q} placeholder="Nom, téléphone, commune…" className={input} /></label>
        <button className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Filtrer</button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{data.total} professionnel(s){sel.length ? ` · ${sel.length} sélectionné(s)` : ""}</p>
        <button type="button" disabled={!sel.length} onClick={() => setOpen(true)} className="rounded-md bg-accent-600 px-4 py-2 text-sm font-bold text-white hover:bg-accent-700 disabled:opacity-40">Relancer la sélection</button>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[1060px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-8 px-3 py-2"><input type="checkbox" checked={all} onChange={() => setSel(all ? [] : data.items.map((i) => i.id))} aria-label="Tout sélectionner" /></th>
              <th className="px-3 py-2">Professionnel</th><th className="px-3 py-2">Situation</th><th className="px-3 py-2 text-right">En ligne</th>
              <th className="px-3 py-2">Dernière annonce</th><th className="px-3 py-2 text-right">Vues 30 j</th><th className="px-3 py-2 text-right">Demandes</th>
              <th className="px-3 py-2 text-right">Recherches zone</th><th className="px-3 py-2">Dernière relance</th><th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((p) => {
              const [sl, sc] = SEG_PILL[p.segment] ?? SEG_PILL.actif;
              return (
                <tr key={p.id} className={"border-t border-slate-100 " + (sel.includes(p.id) ? "bg-brand-50/40" : "")}>
                  <td className="px-3 py-2"><input type="checkbox" checked={sel.includes(p.id)} onChange={() => toggle(p.id)} aria-label={`Sélectionner ${p.name}`} /></td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/utilisateurs/${p.id}`} className="font-semibold text-ink hover:underline">{p.name || p.phone}</Link>{p.verified ? <span title="Vérifié" className="ml-1 text-emerald-600">✓</span> : null}
                    <p className="text-xs text-muted">{p.typeLabel}{p.zone ? ` · ${p.zone}` : ""} · connecté {ago(p.lastLoginAt)}</p>
                  </td>
                  <td className="px-3 py-2">
                    <span className={"rounded px-1.5 py-0.5 text-[11px] font-semibold " + sc}>{sl}</span>
                    {p.expiring ? <span className="ml-1 rounded bg-orange-100 px-1.5 py-0.5 text-[11px] font-semibold text-orange-700">{p.expiring} expire(nt)</span> : null}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{p.active}<span className="text-xs text-muted"> / {p.total}</span></td>
                  <td className="px-3 py-2 text-xs">{p.lastListingAt ? ago(p.lastListingAt) : "jamais"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{p.views30.toLocaleString("fr-FR")}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{p.inquiries30}{p.pending ? <span className="ml-1 rounded bg-red-100 px-1 text-[11px] font-semibold text-red-700">{p.pending} en attente</span> : null}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{p.zoneSearches}</td>
                  <td className="px-3 py-2 text-xs">{ago(p.lastNudgeAt)}</td>
                  <td className="px-3 py-2 text-right"><button type="button" onClick={() => { setSel([p.id]); setOpen(true); }} className="rounded-md px-2 py-1 text-xs font-semibold text-brand-800 hover:bg-brand-50">Relancer</button></td>
                </tr>
              );
            })}
            {!data.items.length ? <tr><td colSpan={10} className="p-6 text-center text-muted">Aucun professionnel dans cette situation.</td></tr> : null}
          </tbody>
        </table>
      </div>
      {data.pages > 1 ? (
        <div className="flex justify-center gap-2 text-sm">
          {data.page > 1 ? <Link href={qs(data.page - 1)} className="rounded-md bg-white px-3 py-1.5 ring-1 ring-slate-300">← Précédent</Link> : null}
          <span className="px-2 py-1.5 text-muted">Page {data.page} / {data.pages}</span>
          {data.page < data.pages ? <Link href={qs(data.page + 1)} className="rounded-md bg-white px-3 py-1.5 ring-1 ring-slate-300">Suivant →</Link> : null}
        </div>
      ) : null}
      {open ? <ManualPanel ids={sel} names={data.items.filter((i) => sel.includes(i.id)).map((i) => i.name || i.phone)} rules={rules} channels={channels} variables={variables}
        onClose={() => setOpen(false)} onSent={() => { setOpen(false); setSel([]); router.refresh(); }} /> : null}
    </div>
  );
}

function ManualPanel({ ids, names, rules, channels, variables, onClose, onSent }: {
  ids: string[]; names: string[]; rules: NudgeRule[]; channels: Record<string, boolean>; variables: Record<string, string>; onClose: () => void; onSent: () => void;
}) {
  const [pending, start] = useTransition();
  const [m, setM] = useState<ManualNudge>({
    accountIds: ids, ruleKey: rules[0]?.key ?? "manuel", channels: ["site", ...(channels.email ? ["email"] : [])],
    subject: "{{prenom}}, ", body: "Bonjour {{prenom}},\n\n{{phrase_demande}}\n\n", smsBody: "Moboo.ci: {{prenom}}, des clients cherchent a {{zone}}. Publiez vos biens: {{lien}}", ctaLabel: "Publier une annonce", target: "/mon-espace/annonces/nouvelle", waTemplate: "", waVars: ["{{prenom}}"],
  });
  const [preview, setPreview] = useState<{ subject: string; body: string; sms: string; ctaLabel: string } | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof ManualNudge>(k: K, v: ManualNudge[K]) => { setM((x) => ({ ...x, [k]: v })); setPreview(null); };
  const custom = m.ruleKey === "manuel";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="h-full w-full max-w-xl space-y-4 overflow-y-auto bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-extrabold text-ink">Relancer {ids.length} professionnel(s)</h2>
            <p className="text-xs text-muted">{names.slice(0, 6).join(", ")}{names.length > 6 ? `… (+${names.length - 6})` : ""}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full px-2 py-1 text-slate-500 hover:bg-slate-100" aria-label="Fermer">✕</button>
        </div>
        <label className="block"><span className={label}>Message</span>
          <select value={m.ruleKey} onChange={(e) => set("ruleKey", e.target.value)} className={input}>
            {rules.map((r) => <option key={r.key} value={r.key}>Modèle : {r.name}</option>)}
            <option value="manuel">Message personnalisé</option>
          </select>
        </label>
        {custom ? (
          <>
            <label className="block"><span className={label}>Objet / titre</span><input value={m.subject} onChange={(e) => set("subject", e.target.value)} className={input} /></label>
            <label className="block"><span className={label}>Message</span><textarea rows={8} value={m.body} onChange={(e) => set("body", e.target.value)} className={input} /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><span className={label}>Bouton</span><input value={m.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} className={input} /></label>
              <label className="block"><span className={label}>Page ouverte</span>
                <select value={m.target} onChange={(e) => set("target", e.target.value)} className={input}>{TARGETS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
              </label>
            </div>
            <Variables vars={variables} />
          </>
        ) : <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">Le texte du modèle se règle dans l’onglet « Relances automatiques ». Une relance manuelle ignore le délai entre deux relances.</p>}
        <div><span className={label}>Canaux</span><div className="mt-2"><ChannelBoxes value={m.channels} onChange={(v) => set("channels", v)} ready={channels} /></div></div>
        {custom && m.channels.includes("sms") ? (
          <label className="block"><span className={label}>Texte du SMS</span>
            <textarea rows={3} value={m.smsBody} onChange={(e) => set("smsBody", e.target.value)} className={input} />
            <span className="mt-1 block text-[11px] text-muted">{smsCounter((m.smsBody ?? "").replace("{{lien}}", "moboo.ci/r/00000000-0000-0000-0000-000000000000"))}</span>
          </label>
        ) : null}
        {custom && m.channels.includes("whatsapp") ? (
          <label className="block"><span className={label}>Modèle WhatsApp approuvé par Meta</span><input value={m.waTemplate} onChange={(e) => set("waTemplate", e.target.value)} className={input} placeholder="relance_agent" /></label>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={pending} onClick={() => start(async () => {
            const r = await previewNudgeAction({ ...m, accountId: ids[0] });
            if (r.ok && r.data) setPreview(r.data); else setMsg({ ok: false, text: r.error ?? "Aperçu impossible." });
          })} className="rounded-md bg-white px-3 py-2 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Aperçu pour {names[0]}</button>
          <button type="button" disabled={pending || !m.channels.length} onClick={() => start(async () => {
            const r = await sendNudgeAction(m);
            if (!r.ok) return setMsg({ ok: false, text: r.error ?? "Erreur." });
            setMsg({ ok: true, text: `${r.queued} relance(s) en cours d’envoi.` });
            setTimeout(onSent, 1200);
          })} className="rounded-md bg-accent-600 px-4 py-2 text-sm font-bold text-white hover:bg-accent-700 disabled:opacity-40">Envoyer la relance</button>
        </div>
        {msg ? <p className={"rounded-md px-3 py-2 text-sm " + (msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>{msg.text}</p> : null}
        {preview ? (
          <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Aperçu (vraies données)</p>
            <p className="mt-2 font-semibold text-ink">{preview.subject}</p>
            <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{preview.body}</p>
            <span className="mt-3 inline-flex rounded-md bg-brand-700 px-3 py-1.5 text-xs font-bold text-white">{preview.ctaLabel}</span>
            {preview.sms ? <p className="mt-3 rounded-md bg-white p-2 text-xs text-slate-700 ring-1 ring-slate-200"><strong>SMS :</strong> {preview.sms}</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ─── Relances automatiques (scénarios) ─────────────────────────────────── */

export function NudgeRules({ overview }: { overview: NudgeOverview }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [sim, setSim] = useState<Record<string, { eligible: number; queued: number; sample: { id: string; name: string; zone: string }[] }> | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (dryRun: boolean) => start(async () => {
    setMsg(null);
    const r = await runNudgesAction(dryRun);
    if (!r.ok || !r.data) return setMsg({ ok: false, text: r.error ?? "Erreur." });
    if (dryRun) setSim(r.data.rules);
    else { setMsg({ ok: true, text: `${r.data.queued} relance(s) envoyée(s).` }); router.refresh(); }
  });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="max-w-2xl text-sm text-slate-600">Chaque jour à 10 h, les scénarios activés relancent les comptes concernés : <strong>un seul message par compte et par jour</strong> (le plus important d’abord), au moins {overview.gapDays} jours entre deux relances (sauf demandes en attente), désinscriptions respectées. Est compté « réactivé » un compte qui publie une annonce ou traite une demande dans les {overview.conversionDays} jours.</p>
        <div className="flex gap-2">
          <button type="button" disabled={pending} onClick={() => run(true)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Simuler (qui serait relancé ?)</button>
          <button type="button" disabled={pending || !overview.rules.some((r) => r.enabled)} onClick={() => { if (confirm("Envoyer maintenant les relances des scénarios activés ?")) run(false); }} className="rounded-md bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-40">Lancer maintenant</button>
        </div>
      </div>
      {msg ? <p className={"rounded-md px-3 py-2 text-sm " + (msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>{msg.text}</p> : null}
      {overview.rules.map((r, i) => <RuleCard key={r.key} rule={r} order={i + 1} stats={overview.byRule[r.key]} sim={sim?.[r.key]} channels={overview.channels} variables={overview.variables} />)}
    </div>
  );
}

function RuleCard({ rule, order, stats, sim, channels, variables }: {
  rule: NudgeRule; order: number; stats?: { sent: number; converted: number }; sim?: { eligible: number; sample: { id: string; name: string; zone: string }[] };
  channels: Record<string, boolean>; variables: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [r, setR] = useState(rule);
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState("");
  const [testCh, setTestCh] = useState("sms");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof NudgeRule>(k: K, v: NudgeRule[K]) => setR((x) => ({ ...x, [k]: v }));
  const save = (patch: Partial<NudgeRule> = {}) => start(async () => {
    const next = { ...r, ...patch };
    const res = await saveRuleAction(next);
    if (!res.ok) return setMsg({ ok: false, text: res.error ?? "Erreur." });
    setR(next);
    setMsg({ ok: true, text: "Enregistré." });
    router.refresh();
  });
  return (
    <section className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{order}</span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold text-ink">{r.name}</p>
          <p className="text-xs text-muted">{r.trigger.replace("N jours", `${r.delayDays} jours`)}{r.key === "bilan" ? ` (tous les ${r.cooldownDays} jours)` : ` · pas plus d’une fois tous les ${r.cooldownDays} jours`}</p>
        </div>
        <p className="text-xs text-slate-500">{stats ? `${stats.sent} envoyée(s) · ${stats.converted} réactivé(s) · 30 j` : "aucune relance · 30 j"}</p>
        {sim ? <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800" title={sim.sample.map((s) => s.name).join(", ")}>{sim.eligible} compte(s) à relancer</span> : null}
        <button type="button" onClick={() => setOpen((o) => !o)} className="rounded-md px-2 py-1 text-sm font-semibold text-brand-800 hover:bg-brand-50">{open ? "Fermer" : "Modifier"}</button>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="h-4 w-4" checked={r.enabled} disabled={pending} onChange={(e) => save({ enabled: e.target.checked })} />
          {r.enabled ? "Activé" : "Désactivé"}
        </label>
      </div>
      {sim && sim.sample.length ? <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">Par exemple : {sim.sample.map((s) => `${s.name}${s.zone ? ` (${s.zone})` : ""}`).join(", ")}</p> : null}
      {open ? (
        <div className="space-y-4 border-t border-slate-100 p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {r.delayLabel ? <label className="block"><span className={label}>{r.delayLabel}</span><input type="number" min={1} value={r.delayDays} onChange={(e) => set("delayDays", Number(e.target.value))} className={input} /></label> : null}
            <label className="block"><span className={label}>{r.key === "bilan" ? "Tous les (jours)" : "Pas plus d’une fois tous les (jours)"}</span><input type="number" min={1} value={r.cooldownDays} onChange={(e) => set("cooldownDays", Number(e.target.value))} className={input} /></label>
          </div>
          <div><span className={label}>Comptes concernés</span>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              {TYPES.map(([k, l]) => <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={r.accountTypes.includes(k)} onChange={() => set("accountTypes", r.accountTypes.includes(k) ? r.accountTypes.filter((x) => x !== k) : [...r.accountTypes, k])} />{l}</label>)}
            </div>
          </div>
          <div><span className={label}>Canaux</span><div className="mt-2"><ChannelBoxes value={r.channels} onChange={(v) => set("channels", v)} ready={channels} /></div></div>
          <label className="block"><span className={label}>Objet / titre</span><input value={r.subject} onChange={(e) => set("subject", e.target.value)} className={input} /></label>
          <label className="block"><span className={label}>Message</span><textarea rows={9} value={r.body} onChange={(e) => set("body", e.target.value)} className={input} /></label>
          <label className="block sm:w-1/2"><span className={label}>Texte du bouton</span><input value={r.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} className={input} /></label>
          {r.channels.includes("sms") ? (
            <label className="block"><span className={label}>Texte du SMS (court ; {"{{lien}}"} = lien suivi)</span>
              <textarea rows={3} value={r.smsBody} onChange={(e) => set("smsBody", e.target.value)} className={input} />
              <span className="mt-1 block text-[11px] text-muted">{smsCounter(r.smsBody.replace("{{lien}}", "moboo.ci/r/00000000-0000-0000-0000-000000000000"))}</span>
            </label>
          ) : null}
          {r.channels.includes("whatsapp") ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className={label}>Modèle WhatsApp (Meta)</span><input value={r.waTemplate} onChange={(e) => set("waTemplate", e.target.value)} className={input} placeholder="relance_agent" /></label>
              <label className="block"><span className={label}>Variables du modèle (une par ligne)</span><textarea rows={3} value={r.waVars.join("\n")} onChange={(e) => set("waVars", e.target.value.split("\n"))} className={input} placeholder={"{{prenom}}\n{{recherches_zone}}\n{{lien}}"} /></label>
            </div>
          ) : null}
          <Variables vars={variables} />
          <div className="flex flex-wrap items-end gap-2">
            <button type="button" disabled={pending} onClick={() => save()} className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Enregistrer</button>
            <button type="button" disabled={pending} onClick={() => setR((x) => ({ ...x, ...r.defaults }))} className="rounded-md bg-white px-3 py-2 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Texte d’origine</button>
            <span className="flex-1" />
            <label className="text-sm"><span className={label}>Tester sur</span><input value={to} onChange={(e) => setTo(e.target.value)} placeholder="vous@moboo.ci ou 07 07 …" className={input} /></label>
            {to && !to.includes("@") ? (
              <label className="text-sm"><span className={label}>Par</span>
                <select value={testCh} onChange={(e) => setTestCh(e.target.value)} className={input}><option value="sms">SMS</option><option value="whatsapp">WhatsApp</option></select>
              </label>
            ) : null}
            <button type="button" disabled={pending || !to} onClick={() => start(async () => {
              const res = await testNudgeAction({ ...r, ruleKey: "manuel", target: r.target, to, testChannel: testCh });
              setMsg(res.ok ? { ok: true, text: `Test envoyé à ${to}.` } : { ok: false, text: res.error ?? "Échec." });
            })} className="rounded-md bg-white px-3 py-2 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Tester</button>
          </div>
        </div>
      ) : null}
      {msg ? <p className={"mx-4 mb-4 rounded-md px-3 py-2 text-sm " + (msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>{msg.text}</p> : null}
    </section>
  );
}

/* ─── Historique ────────────────────────────────────────────────────────── */

export function NudgeHistory({ items, rules }: { items: NudgeRow[]; rules: NudgeRule[] }) {
  const name = (k: string) => (k === "manuel" ? "Relance manuelle" : rules.find((r) => r.key === k)?.name ?? k);
  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr><th className="px-4 py-2">Date</th><th className="px-3 py-2">Professionnel</th><th className="px-3 py-2">Relance</th><th className="px-3 py-2">Canaux</th><th className="px-3 py-2">Statut</th><th className="px-3 py-2">Clic</th><th className="px-3 py-2">Réactivé</th></tr>
        </thead>
        <tbody>
          {items.map((n) => (
            <tr key={n.id} className="border-t border-slate-100 align-top">
              <td className="whitespace-nowrap px-4 py-2 text-xs text-muted">{when(n.createdAt)}</td>
              <td className="px-3 py-2"><Link href={`/admin/utilisateurs/${n.accountId}`} className="font-semibold text-ink hover:underline">{n.name}</Link></td>
              <td className="px-3 py-2"><p className="text-xs font-semibold text-slate-500">{name(n.ruleKey)}</p><p className="text-sm">{n.subject}</p></td>
              <td className="px-3 py-2 text-xs">{n.channels.map((c) => CH_LABEL[c] ?? c).join(", ")}</td>
              <td className="px-3 py-2 text-xs">
                <span className={"rounded px-1.5 py-0.5 font-semibold " + (n.status === "sent" ? "bg-emerald-100 text-emerald-700" : n.status === "failed" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600")}>{n.status === "sent" ? "Envoyée" : n.status === "failed" ? "Échec" : "En cours"}</span>
                {n.error ? <p className="mt-1 text-[11px] text-amber-700">{n.error}</p> : null}
              </td>
              <td className="px-3 py-2 text-xs">{n.clickedAt ? `✓ ${when(n.clickedAt)}` : "—"}</td>
              <td className="px-3 py-2 text-xs">{n.convertedAt ? <span className="font-semibold text-emerald-700">✓ {when(n.convertedAt)}</span> : "—"}</td>
            </tr>
          ))}
          {!items.length ? <tr><td colSpan={7} className="p-6 text-center text-muted">Aucune relance pour le moment.</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}
