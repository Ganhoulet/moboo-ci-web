"use client";

import { useEffect, useState, useTransition } from "react";
import { edlAgents, saveServicesConfig } from "@/app/admin/services/actions";
import type { AlertePack, ServicesConfig, Soon } from "@/lib/moboo-services";

type Tab = "site" | "alertes" | "edl" | "support" | "foncier" | "loyer" | "solvency" | "card";
const TABS: [Tab, string][] = [["site", "Services du site"], ["alertes", "Alertes"], ["edl", "État des lieux"], ["support", "Support"], ["foncier", "Estimation foncière"], ["loyer", "Estimation loyer"], ["solvency", "Solvabilité"], ["card", "Carte pro"]];
const SITE_LABEL: Record<string, string> = { edl: "État des lieux", loyer: "Estimation de loyer", foncier: "Estimation de terrain", solvabilite: "Solvabilité locataire" };
const SITE_SLUG: Record<string, string> = { edl: "etat-des-lieux", loyer: "estimation-loyer", foncier: "estimation-terrain", solvabilite: "solvabilite-locataire" };

const input = "w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-600 focus:outline-none";

function Check({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-2.5 py-1.5 text-sm">
      <input type="checkbox" className="mt-0.5 h-4 w-4" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span><span className="font-semibold text-ink">{label}</span>{hint ? <span className="block text-xs text-muted">{hint}</span> : null}</span>
    </label>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="font-semibold text-ink">{label}</span>
      <div className="mt-1">{children}</div>
      {hint ? <span className="mt-0.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

const Num = ({ value, onChange, min = 0, max }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) => (
  <input type="number" className={input} value={value} min={min} max={max} onChange={(e) => onChange(Number(e.target.value) || 0)} />
);
const Text = ({ value, onChange, area }: { value: string; onChange: (s: string) => void; area?: boolean }) =>
  area ? <textarea className={input} rows={2} value={value} onChange={(e) => onChange(e.target.value)} /> : <input className={input} value={value} onChange={(e) => onChange(e.target.value)} />;

function SoonEditor({ soon, onChange, name }: { soon: Soon; onChange: (s: Soon) => void; name: string }) {
  return (
    <div className="rounded-lg bg-amber-50 p-3 ring-1 ring-amber-200">
      <Check label="« Bientôt disponible » (compte à rebours dans l’application)" hint={`Affiche un écran d’attente pour ${name} jusqu’à la date choisie, sans mise à jour de l’application.`} checked={soon.on} onChange={(on) => onChange({ ...soon, on })} />
      {soon.on ? (
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Field label="Date de lancement"><input type="datetime-local" className={input} value={soon.at.slice(0, 16)} onChange={(e) => onChange({ ...soon, at: e.target.value })} /></Field>
          <Field label="Titre (facultatif)"><Text value={soon.title} onChange={(title) => onChange({ ...soon, title })} /></Field>
          <Field label="Message (facultatif)"><Text value={soon.message} onChange={(message) => onChange({ ...soon, message })} /></Field>
        </div>
      ) : null}
    </div>
  );
}

/** Tableau de forfaits éditable (lignes : libellé + champs numériques). */
function Packs<T extends { id: string; label: string; price: number }>({ rows, onChange, cols, make }: {
  rows: T[]; onChange: (r: T[]) => void; cols: { key: keyof T; label: string; render?: (row: T, set: (v: Partial<T>) => void) => React.ReactNode }[]; make: () => T;
}) {
  const set = (i: number, v: Partial<T>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...v } : r)));
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead><tr className="text-left text-xs uppercase text-muted"><th className="py-1 pr-2">Libellé</th>{cols.map((c) => <th key={String(c.key)} className="py-1 pr-2">{c.label}</th>)}<th className="py-1 pr-2">Prix (FCFA)</th><th /></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-100">
              <td className="py-1.5 pr-2"><Text value={r.label} onChange={(label) => set(i, { label } as Partial<T>)} /></td>
              {cols.map((c) => (
                <td key={String(c.key)} className="w-32 py-1.5 pr-2">
                  {c.render ? c.render(r, (v) => set(i, v)) : <Num value={Number(r[c.key]) || 0} onChange={(n) => set(i, { [c.key]: n } as Partial<T>)} />}
                </td>
              ))}
              <td className="w-32 py-1.5 pr-2"><Num value={r.price} onChange={(price) => set(i, { price } as Partial<T>)} /></td>
              <td className="py-1.5 text-right"><button type="button" className="text-xs font-semibold text-red-600 hover:underline" onClick={() => onChange(rows.filter((_, j) => j !== i))}>Retirer</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="mt-2 rounded-md bg-slate-100 px-3 py-1.5 text-sm font-semibold text-ink hover:bg-slate-200" onClick={() => onChange([...rows, make()])}>+ Ajouter un forfait</button>
      <p className="mt-1 text-xs text-muted">Payés par Money Fusion (Wave, Orange Money, MTN, Moov, carte) depuis le bouton « Acheter » de l’application ; les crédits sont ajoutés dès le paiement confirmé.</p>
    </div>
  );
}

/** Agents Moboo proposés en premier à l'attribution des états des lieux. */
function MobooAgents({ ids, onChange }: { ids: string[]; onChange: (ids: string[]) => void }) {
  const [names, setNames] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [found, setFound] = useState<{ id: string; name: string; phone: string; zone: string }[]>([]);
  useEffect(() => { void edlAgents("").then((x) => setNames(Object.fromEntries((x.data?.items ?? []).map((a) => [a.id, `${a.name} · ${a.phone}`])))); }, []);
  useEffect(() => {
    if (q.trim().length < 2) { setFound([]); return; }
    const t = setTimeout(() => { void edlAgents(q).then((x) => setFound(x.data?.items ?? [])); }, 250);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
      <p className="text-sm font-semibold text-ink">Agents Moboo</p>
      <p className="text-xs text-muted">Proposés en premier quand vous attribuez une demande ; ils la reçoivent dans Moboo Pro › États des lieux.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {ids.map((id) => (
          <span key={id} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold ring-1 ring-slate-300">
            {names[id] ?? id.slice(0, 8)}
            <button type="button" aria-label="Retirer" className="text-red-600" onClick={() => onChange(ids.filter((x) => x !== id))}>×</button>
          </span>
        ))}
        {!ids.length ? <span className="text-xs text-muted">Aucun agent Moboo pour l’instant.</span> : null}
      </div>
      <input value={q} onChange={(ev) => setQ(ev.target.value)} placeholder="Ajouter un agent : nom, téléphone…" className={input + " mt-2"} />
      {found.length ? (
        <ul className="mt-1 max-h-48 overflow-y-auto rounded-md bg-white ring-1 ring-slate-200">
          {found.filter((a) => !ids.includes(a.id)).map((a) => (
            <li key={a.id}><button type="button" className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50" onClick={() => { onChange([...ids, a.id]); setNames((n) => ({ ...n, [a.id]: `${a.name} · ${a.phone}` })); setQ(""); }}>{a.name} <span className="text-xs text-muted">{a.phone} · {a.zone}</span></button></li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Back-office → Services Moboo → Réglages (ex-réglages des extensions WordPress). */
export function ServicesSettingsEditor({ initial, initialTab }: { initial: ServicesConfig; initialTab?: string }) {
  const [cfg, setCfg] = useState<ServicesConfig>(initial);
  const [tab, setTab] = useState<Tab>(TABS.some(([k]) => k === initialTab) ? (initialTab as Tab) : "alertes");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const up = <K extends keyof ServicesConfig>(k: K, v: Partial<ServicesConfig[K]>) => setCfg((c) => ({ ...c, [k]: { ...c[k], ...v } }));

  const save = () => start(async () => {
    const r = await saveServicesConfig(cfg);
    if (r.ok && r.data) setCfg(r.data);
    setMsg(r.ok ? { ok: true, text: "Réglages enregistrés : ils s’appliquent tout de suite au site et aux applications." } : { ok: false, text: r.error ?? "Erreur" });
  });

  const moveTile = (k: string, dir: -1 | 1) => {
    const o = [...cfg.site.order];
    const i = o.indexOf(k);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= o.length) return;
    [o[i], o[j]] = [o[j], o[i]];
    up("site", { order: o });
  };
  const setTile = (k: string, v: Partial<ServicesConfig["site"]["tiles"][string]>) => up("site", { tiles: { ...cfg.site.tiles, [k]: { ...cfg.site.tiles[k], ...v } } });
  const serviceOn = (k: string) => (k === "edl" ? cfg.edl.enabled : k === "loyer" ? cfg.loyer.enabled : k === "foncier" ? cfg.foncier.enabled : cfg.solvency.enabled);

  const a = cfg.alertes, e = cfg.edl, s = cfg.support, f = cfg.foncier, l = cfg.loyer, c = cfg.card;
  return (
    <div className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap gap-1 border-b border-slate-200 p-2">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={"rounded-md px-3 py-1.5 text-sm font-semibold " + (tab === k ? "bg-ink text-white" : "text-ink hover:bg-slate-100")}>{label}</button>
        ))}
      </div>
      <div className="space-y-4 p-4 sm:p-5">
        {tab === "site" ? (
          <>
            <p className="text-sm text-muted">Services proposés sur moboo.ci : rangée « Services » de l’accueil (bloc du constructeur de page) et pages dédiées <code>/services/…</code>. Réordonnez, masquez ou réécrivez chaque service ; il n’apparaît que s’il est aussi activé dans son onglet.</p>
            {cfg.site.order.map((k, i) => {
              const t = cfg.site.tiles[k];
              if (!t) return null;
              return (
                <div key={k} className="rounded-lg p-3 ring-1 ring-slate-200">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-2xl">{t.icon}</span>
                    <p className="flex-1 font-display font-bold text-ink">{SITE_LABEL[k] ?? k} <a href={`/services/${SITE_SLUG[k]}`} target="_blank" rel="noreferrer" className="ml-1 text-xs font-normal text-brand-700 underline">voir la page</a></p>
                    {!serviceOn(k) ? <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">service désactivé dans son onglet</span> : null}
                    <button type="button" aria-label="Monter" disabled={i === 0} onClick={() => moveTile(k, -1)} className="rounded px-2 py-1 text-sm ring-1 ring-slate-300 disabled:opacity-30">↑</button>
                    <button type="button" aria-label="Descendre" disabled={i === cfg.site.order.length - 1} onClick={() => moveTile(k, 1)} className="rounded px-2 py-1 text-sm ring-1 ring-slate-300 disabled:opacity-30">↓</button>
                  </div>
                  <Check label="Afficher sur le site" checked={t.enabled} onChange={(enabled) => setTile(k, { enabled })} />
                  {t.enabled ? (
                    <div className="grid gap-3 sm:grid-cols-[90px_1fr_1fr]">
                      <Field label="Icône"><Text value={t.icon} onChange={(icon) => setTile(k, { icon })} /></Field>
                      <Field label="Titre de la tuile"><Text value={t.title} onChange={(title) => setTile(k, { title })} /></Field>
                      <Field label="Accroche"><Text value={t.tagline} onChange={(tagline) => setTile(k, { tagline })} /></Field>
                      <div className="sm:col-span-3"><Field label="Titre de la page dédiée"><Text value={t.landingTitle} onChange={(landingTitle) => setTile(k, { landingTitle })} /></Field></div>
                      <div className="sm:col-span-3"><Field label="Texte d’introduction de la page"><Text area value={t.landingIntro} onChange={(landingIntro) => setTile(k, { landingIntro })} /></Field></div>
                    </div>
                  ) : null}
                </div>
              );
            })}
            <p className="text-xs text-muted">Pour placer la rangée sur l’accueil : Accueil (constructeur de page) › Ajouter une section › « Services Moboo (carrousel) ».</p>
          </>
        ) : null}

        {tab === "solvency" ? (
          <>
            <Check label="Vérification de solvabilité activée" hint="Le bailleur saisit le candidat ; le candidat reçoit un code par SMS et le lui transmet pour donner son accord. Le rapport s’appuie sur les loyers suivis dans Moboo Pro (sans nom de bailleur ni montant) et sur les revenus déclarés." checked={cfg.solvency.enabled} onChange={(enabled) => up("solvency", { enabled })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Revenus minimum recommandés (× le loyer)" hint="Seuil du rapport revenus / loyer (3 = le loyer ne dépasse pas le tiers des revenus)."><Num value={cfg.solvency.incomeMultiple} onChange={(incomeMultiple) => up("solvency", { incomeMultiple })} min={1} max={10} /></Field>
              <Field label="Validité du code SMS (minutes)"><Num value={cfg.solvency.codeTtlMin} onChange={(codeTtlMin) => up("solvency", { codeTtlMin })} min={5} max={1440} /></Field>
            </div>
            <p className="rounded-lg bg-slate-50 p-3 text-xs text-muted">Le SMS part par le canal configuré dans Marketing › Canaux d’envoi. Sans canal SMS, la demande est signalée aux administrateurs par e-mail pour transmettre le code à la main.</p>
          </>
        ) : null}

        {tab === "alertes" ? (
          <>
            <Check label="Alertes activées" hint="Les locataires et acheteurs décrivent leur recherche ; les agents de la zone sont prévenus (notification + e-mail)." checked={a.enabled} onChange={(enabled) => up("alertes", { enabled })} />
            <Check label="Envoi payant pour les demandeurs" hint="Chaque alerte consomme un crédit acheté (forfaits « demandeur » ci-dessous)." checked={a.userPaid} onChange={(userPaid) => up("alertes", { userPaid })} />
            <Check label="Réception payante pour les agents" hint="Seuls les agents avec un abonnement actif (forfaits « agent ») reçoivent les alertes. Sert aussi pour l’état des lieux si « agents payants » y est coché." checked={a.agentPaid} onChange={(agentPaid) => up("alertes", { agentPaid })} />
            <h3 className="pt-2 font-display text-base font-bold text-ink">Forfaits</h3>
            <Packs rows={a.packages} onChange={(packages) => up("alertes", { packages })} make={(): AlertePack => ({ id: "", label: "", audience: "sender", credits: 1, days: 0, price: 0 })}
              cols={[
                { key: "audience", label: "Pour", render: (r, set) => (
                  <select className={input} value={r.audience} onChange={(ev) => set({ audience: ev.target.value as "sender" | "agent" })}><option value="sender">Demandeur</option><option value="agent">Agent</option></select>
                ) },
                { key: "credits", label: "Envois", render: (r, set) => (r.audience === "sender" ? <Num value={r.credits} onChange={(credits) => set({ credits })} min={1} /> : <span className="text-xs text-muted">—</span>) },
                { key: "days", label: "Jours", render: (r, set) => (r.audience === "agent" ? <Num value={r.days} onChange={(days) => set({ days })} min={1} /> : <span className="text-xs text-muted">—</span>) },
              ]} />
          </>
        ) : null}

        {tab === "edl" ? (
          <>
            <Check label="État des lieux activé" hint="Le locataire ou le propriétaire publie une demande ; les agents de la zone se portent candidats avec leur prix." checked={e.enabled} onChange={(enabled) => up("edl", { enabled })} />
            <Field label="Qui réalise les états des lieux ?" hint="Valable pour les demandes du site et de l’application.">
              <select className={input} value={e.dispatch} onChange={(ev) => up("edl", { dispatch: ev.target.value as "moboo" | "agents" })}>
                <option value="moboo">Les agents Moboo : le back-office est prévenu et attribue chaque demande</option>
                <option value="agents">Tous les agents : diffusion automatique aux agents de la zone (Moboo Pro)</option>
              </select>
            </Field>
            <MobooAgents ids={e.mobooAgents} onChange={(mobooAgents) => up("edl", { mobooAgents })} />
            <Check label="Agents payants" hint="Abonnement « Alertes » actif requis pour être ciblé et se porter candidat." checked={e.agentPaid} onChange={(agentPaid) => up("edl", { agentPaid })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Séquestre (% du prix proposé)" hint="Gelé sur le wallet de l’agent quand il est choisi ; rendu en totalité si la demande est annulée."><Num value={e.seqPct} onChange={(seqPct) => up("edl", { seqPct })} max={100} /></Field>
              <Field label="Part Moboo du séquestre (%)" hint="Prélevée à la réalisation ; le reste revient au wallet de l’agent."><Num value={e.mobooSharePct} onChange={(mobooSharePct) => up("edl", { mobooSharePct })} max={100} /></Field>
            </div>
            <SoonEditor soon={e.soon} onChange={(soon) => up("edl", { soon })} name="l’état des lieux" />
            <h3 className="pt-2 font-display text-base font-bold text-ink">Recharges du wallet</h3>
            <Packs rows={e.packages} onChange={(packages) => up("edl", { packages })} make={() => ({ id: "", label: "", amount: 0, price: 0 })} cols={[{ key: "amount", label: "Crédité (FCFA)" }]} />
          </>
        ) : null}

        {tab === "support" ? (
          <>
            <Check label="Chat ouvert à tous" hint="Par défaut, le chat est réservé aux forfaits payants (les autres envoient une demande traitée par e-mail)." checked={s.chatForAll} onChange={(chatForAll) => up("support", { chatForAll })} />
            <Check label="Mode maintenance" hint="Bannière affichée dans les applications." checked={s.maintenance} onChange={(maintenance) => up("support", { maintenance })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Message de maintenance"><Text value={s.maintenanceMsg} onChange={(maintenanceMsg) => up("support", { maintenanceMsg })} /></Field>
              <Field label="WhatsApp du support"><Text value={s.whatsapp} onChange={(whatsapp) => up("support", { whatsapp })} /></Field>
              <Field label="Version de configuration" hint="Augmentez-la pour forcer les applications à recharger leur configuration."><Num value={s.version} onChange={(version) => up("support", { version })} min={1} /></Field>
              <Field label="Version minimale conseillée de l’application"><Text value={s.minAppVersion} onChange={(minAppVersion) => up("support", { minAppVersion })} /></Field>
            </div>
          </>
        ) : null}

        {tab === "foncier" ? (
          <>
            <Check label="Estimation foncière activée" checked={f.enabled} onChange={(enabled) => up("foncier", { enabled })} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Annonces minimum par zone" hint="En dessous, la zone garde sa valeur de référence."><Num value={f.minObs} onChange={(minObs) => up("foncier", { minObs })} min={1} /></Field>
              <Field label="Annonces publiées depuis"><input type="date" className={input} value={f.since} onChange={(ev) => up("foncier", { since: ev.target.value })} /></Field>
              <Field label="Libellé du prix de référence"><Text value={f.marketLabel} onChange={(marketLabel) => up("foncier", { marketLabel })} /></Field>
              <Field label="Prix/m² minimum retenu"><Num value={f.minSqm} onChange={(minSqm) => up("foncier", { minSqm })} /></Field>
              <Field label="Prix/m² maximum retenu"><Num value={f.maxSqm} onChange={(maxSqm) => up("foncier", { maxSqm })} /></Field>
            </div>
            <SoonEditor soon={f.soon} onChange={(soon) => up("foncier", { soon })} name="l’estimation foncière" />
            <h3 className="pt-2 font-display text-base font-bold text-ink">Forfaits de rapports PDF</h3>
            <Packs rows={f.packages} onChange={(packages) => up("foncier", { packages })} make={() => ({ id: "", label: "", credits: 1, price: 0 })} cols={[{ key: "credits", label: "Rapports" }]} />
          </>
        ) : null}

        {tab === "loyer" ? (
          <>
            <Check label="Estimation de loyer activée" hint="Fourchette gratuite ; rapport détaillé (verdict, comparables) payant." checked={l.enabled} onChange={(enabled) => up("loyer", { enabled })} />
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Annonces pour « fiable »"><Num value={l.minObs} onChange={(minObs) => up("loyer", { minObs })} min={1} /></Field>
              <Field label="Grille : annonces depuis"><input type="date" className={input} value={l.since} onChange={(ev) => up("loyer", { since: ev.target.value })} /></Field>
              <Field label="Tendance : annonces depuis"><input type="date" className={input} value={l.trendSince} onChange={(ev) => up("loyer", { trendSince: ev.target.value })} /></Field>
              <Field label="Tendance : annonces au m² par an"><Num value={l.trendMin} onChange={(trendMin) => up("loyer", { trendMin })} min={2} /></Field>
            </div>
            <SoonEditor soon={l.soon} onChange={(soon) => up("loyer", { soon })} name="l’estimation de loyer" />
            <h3 className="pt-2 font-display text-base font-bold text-ink">Forfaits de rapports loyer</h3>
            <Packs rows={l.packages} onChange={(packages) => up("loyer", { packages })} make={() => ({ id: "", label: "", credits: 1, price: 0 })} cols={[{ key: "credits", label: "Rapports" }]} />
          </>
        ) : null}

        {tab === "card" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Validité (mois)"><Num value={c.durationMonths} onChange={(durationMonths) => up("card", { durationMonths })} min={1} max={60} /></Field>
              <Field label="Rappels avant expiration (jours)" hint="Séparés par des virgules.">
                <Text value={c.reminderDays.join(", ")} onChange={(v) => up("card", { reminderDays: v.split(/[,; ]+/).map(Number).filter((n) => n > 0) })} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              {([["primaryColor", "Couleur principale"], ["secondaryColor", "Couleur secondaire"], ["goldColor", "Couleur d’accent"], ["accentColor", "Texte"]] as const).map(([k, label]) => (
                <Field key={k} label={label}>
                  <div className="flex items-center gap-2"><input type="color" value={c[k]} onChange={(ev) => up("card", { [k]: ev.target.value })} className="h-9 w-12 rounded" /><Text value={c[k]} onChange={(v) => up("card", { [k]: v })} /></div>
                </Field>
              ))}
            </div>
            <div className="grid gap-x-6 sm:grid-cols-2">
              {([["showPhoto", "Photo"], ["showAgency", "Agence"], ["showPhone", "Téléphone"], ["showEmail", "E-mail"], ["showWebsite", "Site web"], ["showWhatsapp", "WhatsApp"], ["showTagline", "Slogan"]] as const).map(([k, label]) => (
                <Check key={k} label={`${label} affiché par défaut`} checked={c[k]} onChange={(v) => up("card", { [k]: v })} />
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Titre par défaut (agent)"><Text value={c.defaultTitleAgent} onChange={(defaultTitleAgent) => up("card", { defaultTitleAgent })} /></Field>
              <Field label="Titre par défaut (agence)"><Text value={c.defaultTitleAgency} onChange={(defaultTitleAgency) => up("card", { defaultTitleAgency })} /></Field>
              <Field label="Bandeau du bas"><Text value={c.footerText} onChange={(footerText) => up("card", { footerText })} /></Field>
              <Field label="Mention latérale"><Text value={c.legalSide} onChange={(legalSide) => up("card", { legalSide })} /></Field>
              <Field label="Mention recto"><Text area value={c.legalFront} onChange={(legalFront) => up("card", { legalFront })} /></Field>
              <Field label="Mention verso"><Text area value={c.legalBack} onChange={(legalBack) => up("card", { legalBack })} /></Field>
              <Field label="Avertissement"><Text area value={c.disclaimer} onChange={(disclaimer) => up("card", { disclaimer })} /></Field>
            </div>
            <CardPreview c={c} />
          </>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 p-4">
        <button type="button" onClick={save} disabled={pending} className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">{pending ? "Enregistrement…" : "Enregistrer les réglages"}</button>
        {msg ? <span className={"text-sm " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</span> : null}
      </div>
    </div>
  );
}

/** Aperçu simplifié du recto de la carte (couleurs et mentions communes). */
function CardPreview({ c }: { c: ServicesConfig["card"] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase text-muted">Aperçu</p>
      <div className="relative aspect-[1.586] w-full max-w-sm overflow-hidden rounded-2xl p-5 shadow-lg" style={{ background: `linear-gradient(135deg, ${c.primaryColor}, ${c.secondaryColor})`, color: c.accentColor }}>
        <div className="font-display text-lg font-black tracking-widest" style={{ color: c.goldColor }}>MOBOO.CI</div>
        <div className="mt-6 flex items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-white/20" />
          <div><div className="font-bold">Awa Traoré</div><div className="text-xs opacity-80">{c.defaultTitleAgent}</div><div className="text-xs opacity-80">+225 05 00 00 00 02</div></div>
        </div>
        <div className="absolute inset-x-0 bottom-0 px-5 py-2 text-center text-[10px] font-bold tracking-widest" style={{ background: c.goldColor }}>{c.footerText}</div>
        <div className="absolute bottom-9 left-5 right-5 text-[9px] leading-tight opacity-70">{c.legalFront}</div>
      </div>
    </div>
  );
}
