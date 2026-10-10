"use client";

import { useState, useTransition } from "react";
import { saveAppConfig, setAutonomousOwner } from "@/app/admin/services/actions";

type Acc = "agency" | "agent" | "owner" | "tenant";
const ACC: [Acc, string][] = [["agency", "Agence"], ["agent", "Agent"], ["owner", "Propriétaire"], ["tenant", "Locataire"]];
const input = "rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-600 focus:outline-none";
const btn = "rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60";
const btn2 = "rounded-md bg-slate-100 px-3 py-1.5 text-sm font-semibold text-ink hover:bg-slate-200 disabled:opacity-60";

function Accounts({ value, onChange }: { value: Acc[]; onChange: (v: Acc[]) => void }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {ACC.map(([k, l]) => (
        <label key={k} className="flex items-center gap-1 text-xs">
          <input type="checkbox" checked={value.includes(k)} onChange={(e) => onChange(e.target.checked ? [...value, k] : value.filter((x) => x !== k))} /> {l}
        </label>
      ))}
      {!value.length ? <span className="text-xs text-muted">(tous)</span> : null}
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <h2 className="font-display text-base font-bold text-ink">{title}</h2>
      {hint ? <p className="mb-3 mt-0.5 text-xs text-muted">{hint}</p> : <div className="mb-3" />}
      {children}
    </section>
  );
}

/** Back-office → Configuration des applications (fonctions, onglets, écrans, lien compte). */
export function AppConfigEditor({ initial }: { initial: any }) {
  const [view, setView] = useState(initial);
  const [cfg, setCfg] = useState<any>(initial.config);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [owner, setOwner] = useState("");
  const [pending, start] = useTransition();
  const up = (v: any) => setCfg((c: any) => ({ ...c, ...v }));
  const row = (k: "flags" | "tabs" | "screens", i: number, v: any) => up({ [k]: cfg[k].map((x: any, j: number) => (j === i ? { ...x, ...v } : x)) });
  const del = (k: "flags" | "tabs" | "screens", i: number) => up({ [k]: cfg[k].filter((_: any, j: number) => j !== i) });

  const save = () => start(async () => {
    const r = await saveAppConfig(cfg);
    if (r.ok) { setView(r.data); setCfg(r.data.config); }
    setMsg(r.ok ? { ok: true, text: `Configuration publiée (version ${r.data.config.version}) : les applications la rechargent au prochain lancement.` } : { ok: false, text: r.error ?? "Erreur" });
  });
  const toggleOwner = (ref: string, on: boolean) => start(async () => {
    const r = await setAutonomousOwner(ref, on);
    if (r.ok) { setView(r.data); setCfg(r.data.config); setOwner(""); setMsg(null); } else setMsg({ ok: false, text: r.error ?? "Erreur" });
  });

  return (
    <div className="space-y-4">
      <Card title="Lien « gérer mon compte »" hint="Modèle « Netflix » : aucun prix ni paiement dans l’application ; le lien, au libellé neutre, ouvre le site déjà connecté (lien à usage unique) pour choisir un forfait.">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={cfg.accountLinkEnabled} onChange={(e) => up({ accountLinkEnabled: e.target.checked })} /> Afficher le lien dans l’application</label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm"><span className="font-semibold">Libellé (neutre)</span><input className={input + " mt-1 w-full"} value={cfg.accountLabel} onChange={(e) => up({ accountLabel: e.target.value })} /></label>
          <label className="text-sm"><span className="font-semibold">Page du site</span><input className={input + " mt-1 w-full"} value={cfg.accountUrl} placeholder={view.defaultAccountUrl} onChange={(e) => up({ accountUrl: e.target.value })} /><span className="text-xs text-muted">Vide = {view.defaultAccountUrl}</span></label>
          <label className="text-sm"><span className="font-semibold">Retour automatique après paiement</span><input className={input + " mt-1 w-full"} value={cfg.paymentReturn} placeholder="mon-espace/factures, facture=" onChange={(e) => up({ paymentReturn: e.target.value })} /><span className="text-xs text-muted">Morceaux d’adresse de la page de confirmation, séparés par des virgules (vide = valeurs de l’application).</span></label>
          <div className="grid grid-cols-2 gap-3">
            {([["upgradeModeAndroid", "Android"], ["upgradeModeIos", "iOS"]] as const).map(([k, l]) => (
              <label key={k} className="text-sm"><span className="font-semibold">{l}</span>
                <select className={input + " mt-1 w-full"} value={cfg[k]} onChange={(e) => up({ [k]: e.target.value })}>
                  <option value="webview">Vue interne (paiement dans l’app)</option><option value="email">E-mail (lien envoyé)</option><option value="hidden">Masqué</option>
                </select>
              </label>
            ))}
            <p className="col-span-2 text-xs text-muted">Recommandé : Android = vue interne, iOS = e-mail (conforme Apple).</p>
          </div>
        </div>
      </Card>

      <Card title="Adresse de l’API pour l’application" hint={<>Repointe l’application à distance, sans nouvelle version. Doit finir par <code>/api/v1</code> et répondre en HTTPS. Vide = adresse compilée dans l’application.</>}>
        <input className={input + " w-full max-w-xl"} value={cfg.nestApiUrl} placeholder="https://pro.moboo.ci/api/v1" onChange={(e) => up({ nestApiUrl: e.target.value })} />
      </Card>

      <Card title="Fonctions (activation à distance)" hint="Clé technique testée par l’application (ex. module_devis) ; cochez les comptes concernés (aucun = tous).">
        <div className="space-y-2">
          {cfg.flags.map((f: any, i: number) => (
            <div key={i} className="flex flex-wrap items-center gap-2 rounded-md bg-slate-50 p-2">
              <input className={input + " w-40"} value={f.key} placeholder="module_xxx" onChange={(e) => row("flags", i, { key: e.target.value })} />
              <input className={input + " w-52"} value={f.label} placeholder="Nom lisible" onChange={(e) => row("flags", i, { label: e.target.value })} />
              <label className="flex items-center gap-1 text-sm font-semibold"><input type="checkbox" checked={f.enabled} onChange={(e) => row("flags", i, { enabled: e.target.checked })} /> Activée</label>
              <Accounts value={f.accounts} onChange={(accounts) => row("flags", i, { accounts })} />
              <button type="button" className="ml-auto text-xs font-semibold text-red-600 hover:underline" onClick={() => del("flags", i)}>Retirer</button>
            </div>
          ))}
          <button type="button" className={btn2} onClick={() => up({ flags: [...cfg.flags, { key: "", label: "", enabled: true, accounts: [] }] })}>+ Ajouter une fonction</button>
        </div>
      </Card>

      <Card title="Propriétaires en gestion autonome" hint="Active « Ma gestion » (loyers, locataires, baux, encaissements, état des lieux) pour ces propriétaires.">
        <div className="flex flex-wrap gap-2">
          <input className={input + " w-60"} value={owner} placeholder="Téléphone ou identifiant" onChange={(e) => setOwner(e.target.value)} />
          <button type="button" className={btn2} disabled={pending || !owner.trim()} onClick={() => toggleOwner(owner, true)}>Ajouter</button>
        </div>
        <ul className="mt-3 space-y-1 text-sm">
          {view.owners.map((o: any) => (
            <li key={o.id} className="flex items-center gap-3"><span>{o.name || o.phone} · {o.phone}</span><button type="button" className="text-xs font-semibold text-red-600 hover:underline" disabled={pending} onClick={() => toggleOwner(o.id, false)}>Retirer</button></li>
          ))}
          {!view.owners.length ? <li className="text-xs text-muted">Aucun.</li> : null}
        </ul>
      </Card>

      <Card title="Onglets dynamiques" hint={<>Section « Services » du profil. Type <b>url</b> = page web, <b>info</b> = texte, <b>screen</b> = écran ci-dessous (mettez son identifiant dans « Adresse »). Icône : nom Material (star, campaign, storefront, school…).</>}>
        <div className="space-y-2">
          {cfg.tabs.map((t: any, i: number) => (
            <div key={i} className="grid gap-2 rounded-md bg-slate-50 p-2 sm:grid-cols-[1fr_120px_110px_1.5fr_90px_70px]">
              <input className={input} value={t.label} placeholder="Libellé" onChange={(e) => row("tabs", i, { label: e.target.value })} />
              <input className={input} value={t.icon} placeholder="star" onChange={(e) => row("tabs", i, { icon: e.target.value })} />
              <select className={input} value={t.type} onChange={(e) => row("tabs", i, { type: e.target.value })}><option value="url">url</option><option value="info">info</option><option value="screen">screen</option></select>
              {t.type === "info"
                ? <textarea className={input} rows={2} value={t.content} placeholder="Texte affiché" onChange={(e) => row("tabs", i, { content: e.target.value })} />
                : <input className={input} value={t.url} placeholder={t.type === "screen" ? "identifiant de l’écran" : "https://moboo.ci/…"} onChange={(e) => row("tabs", i, { url: e.target.value })} />}
              <input className={input} value={t.badge} placeholder="Badge" onChange={(e) => row("tabs", i, { badge: e.target.value })} />
              <input className={input} type="number" value={t.order} title="Ordre" onChange={(e) => row("tabs", i, { order: Number(e.target.value) || 0 })} />
              <div className="flex flex-wrap items-center gap-3 sm:col-span-6">
                <label className="flex items-center gap-1 text-sm font-semibold"><input type="checkbox" checked={t.enabled} onChange={(e) => row("tabs", i, { enabled: e.target.checked })} /> Affiché</label>
                <Accounts value={t.accounts} onChange={(accounts) => row("tabs", i, { accounts })} />
                <button type="button" className="ml-auto text-xs font-semibold text-red-600 hover:underline" onClick={() => del("tabs", i)}>Retirer</button>
              </div>
            </div>
          ))}
          <button type="button" className={btn2} onClick={() => up({ tabs: [...cfg.tabs, { id: "", label: "", icon: "star", type: "url", url: "", content: "", badge: "", order: cfg.tabs.length, enabled: true, accounts: [] }] })}>+ Ajouter un onglet</button>
        </div>
      </Card>

      <Card title="Écrans dynamiques" hint={<>Un bloc par ligne, champs séparés par « | » : <code>banner | Texte | orange</code> · <code>text | Votre texte</code> · <code>stat | Lots dispo | 24</code> · <code>button | Libellé | url:https://… ou whatsapp:+225… ou tel:+225… ou screen:clé</code> · <code>image | https://…</code> · <code>separator</code>.</>}>
        <div className="space-y-3">
          {cfg.screens.map((s: any, i: number) => (
            <div key={i} className="space-y-2 rounded-md bg-slate-50 p-3">
              <div className="flex flex-wrap gap-2">
                <input className={input + " w-44"} value={s.id} placeholder="identifiant" onChange={(e) => row("screens", i, { id: e.target.value })} />
                <input className={input + " flex-1"} value={s.title} placeholder="Titre" onChange={(e) => row("screens", i, { title: e.target.value })} />
                <button type="button" className="text-xs font-semibold text-red-600 hover:underline" onClick={() => del("screens", i)}>Retirer</button>
              </div>
              <Accounts value={s.accounts} onChange={(accounts) => row("screens", i, { accounts })} />
              <textarea className={input + " w-full font-mono"} rows={5} value={s.body} placeholder={"banner | Bienvenue | orange\nstat | Lots | 24\nbutton | WhatsApp | whatsapp:+2250789311323"} onChange={(e) => row("screens", i, { body: e.target.value })} />
            </div>
          ))}
          <button type="button" className={btn2} onClick={() => up({ screens: [...cfg.screens, { id: "", title: "", accounts: [], body: "" }] })}>+ Ajouter un écran</button>
        </div>
      </Card>

      <div className="sticky bottom-3 flex flex-wrap items-center gap-3 rounded-lg bg-white p-3 shadow-lg ring-1 ring-slate-200">
        <button type="button" className={btn} disabled={pending} onClick={save}>{pending ? "Publication…" : "Enregistrer et publier dans l’application"}</button>
        <span className="text-xs text-muted">Version actuelle : {view.config.version}</span>
        {msg ? <span className={"text-sm " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</span> : null}
      </div>
    </div>
  );
}
