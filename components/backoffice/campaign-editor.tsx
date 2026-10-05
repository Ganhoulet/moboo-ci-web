"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { previewAction, saveCampaignAction, sendCampaignAction, testCampaignAction, type Campaign } from "@/app/admin/centre-marketing/campagnes/actions";

const TYPES: [string, string][] = [["particulier", "Particuliers"], ["proprietaire", "Propriétaires"], ["agent", "Agents"], ["entreprise", "Agences / entreprises"], ["etablissement", "Établissements (meublés, espaces)"]];
const CHANNELS: [Campaign["channel"], string, string][] = [
  ["email", "E-mail", "Comptes du site ayant une adresse e-mail"],
  ["whatsapp", "WhatsApp", "Comptes du site (modèle approuvé par Meta)"],
  ["push", "Notification push", "Hôtes des applications Moboo Resi / Moboo Event"],
];

const input = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";
const label = "text-xs font-semibold uppercase tracking-wide text-muted";

/** Éditeur de campagne : canal, segment (nombre de destinataires en direct), message, test, envoi. */
export function CampaignEditor({ initial, variables }: { initial: Campaign; variables: Record<string, string> }) {
  const router = useRouter();
  const [c, setC] = useState<Campaign>(initial);
  const [count, setCount] = useState<{ count: number; excluded: number; sample: { nom: string; ville: string }[] } | null>(null);
  const [testTo, setTestTo] = useState("");
  const [when, setWhen] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const a = c.audience;
  const set = (p: Partial<Campaign>) => setC({ ...c, ...p });
  const setA = (p: Partial<Campaign["audience"]>) => setC({ ...c, audience: { ...c.audience, ...p } });

  // Nombre de destinataires, recalculé après chaque changement de segment.
  useEffect(() => {
    const t = setTimeout(async () => setCount(await previewAction({ channel: c.channel, audience: c.audience, pushApp: c.pushApp })), 400);
    return () => clearTimeout(t);
  }, [c.channel, c.audience, c.pushApp]);

  const save = async () => {
    const r = await saveCampaignAction(c);
    if (!r.ok) setMsg({ ok: false, text: r.error ?? "Erreur" });
    return r;
  };

  const varsHelp = (
    <p className="text-[11px] text-muted">
      Variables : {Object.keys(variables).filter((k) => c.channel === "whatsapp" || k !== "lien_desinscription").map((k) => <code key={k} className="mr-1 rounded bg-slate-100 px-1" title={variables[k]}>{`{{${k}}}`}</code>)}
      · valeur si vide : <code className="rounded bg-slate-100 px-1">{"{{commune|votre quartier}}"}</code>
    </p>
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <section className="space-y-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <label className={label} htmlFor="cname">Nom de la campagne (interne)</label>
          <input id="cname" value={c.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ex. Relance propriétaires Cocody — octobre" className={input} />
          <p className={label}>Canal</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {CHANNELS.map(([k, l, d]) => (
              <button key={k} type="button" onClick={() => set({ channel: k })}
                className={"rounded-lg p-3 text-left ring-1 " + (c.channel === k ? "bg-brand-50 ring-2 ring-brand-600" : "bg-white ring-slate-200 hover:bg-slate-50")}>
                <p className="font-semibold text-ink">{l}</p><p className="text-xs text-muted">{d}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-display font-bold text-ink">Destinataires</h2>
          {c.channel === "push" ? (
            <div className="flex gap-2">
              {(["resi", "event"] as const).map((app) => (
                <button key={app} type="button" onClick={() => set({ pushApp: app })} className={"rounded-md px-3 py-2 text-sm font-semibold ring-1 " + (c.pushApp === app ? "bg-ink text-white ring-ink" : "bg-white ring-slate-300")}>
                  Hôtes {app === "resi" ? "Moboo Resi" : "Moboo Event"}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className={label}>Types de compte</p>
                {TYPES.map(([k, l]) => (
                  <label key={k} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={a.accountTypes?.includes(k) ?? false} onChange={(e) => setA({ accountTypes: e.target.checked ? [...(a.accountTypes ?? []), k] : (a.accountTypes ?? []).filter((x) => x !== k) })} /> {l}
                  </label>
                ))}
                <p className="text-[11px] text-muted">Rien de coché : tous les types.</p>
              </div>
              <div className="space-y-2">
                <div>
                  <label className={label} htmlFor="places">Villes ou communes</label>
                  <input id="places" value={(a.places ?? []).join(", ")} onChange={(e) => setA({ places: e.target.value.split(",").map((x) => x.trimStart()).filter((x, i, arr) => x || i === arr.length - 1) })} placeholder="Cocody, Yopougon, Bouaké" className={input} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-sm">Vérifiés
                    <select value={a.verified ?? "any"} onChange={(e) => setA({ verified: e.target.value as "yes" | "no" | "any" })} className={input}><option value="any">Peu importe</option><option value="yes">Oui</option><option value="no">Non</option></select>
                  </label>
                  <label className="text-sm">Annonces en ligne
                    <select value={a.listings ?? "any"} onChange={(e) => setA({ listings: e.target.value as "with" | "without" | "any" })} className={input}><option value="any">Peu importe</option><option value="with">Au moins une</option><option value="without">Aucune</option></select>
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <label>Inscrits depuis moins de (j)<input type="number" min={1} value={a.signedUpWithinDays ?? ""} onChange={(e) => setA({ signedUpWithinDays: Number(e.target.value) || undefined })} className={input} /></label>
                  <label>Inactifs depuis (j)<input type="number" min={1} value={a.inactiveDays ?? ""} onChange={(e) => setA({ inactiveDays: Number(e.target.value) || undefined })} className={input} /></label>
                  <label>Actifs ces (j)<input type="number" min={1} value={a.activeWithinDays ?? ""} onChange={(e) => setA({ activeWithinDays: Number(e.target.value) || undefined })} className={input} /></label>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-display font-bold text-ink">Message</h2>
          {c.channel === "whatsapp" ? (
            <>
              <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-900 ring-1 ring-amber-200">WhatsApp n’accepte, pour les messages d’information, que des modèles validés à l’avance dans le gestionnaire WhatsApp de Meta. Indiquez son nom exact et la valeur de chacune de ses variables (dans l’ordre).</p>
              <div className="grid grid-cols-[2fr_1fr] gap-2">
                <input value={c.waTemplate} onChange={(e) => set({ waTemplate: e.target.value.trim() })} placeholder="Nom du modèle (ex. moboo_relance_proprietaires)" className={input + " font-mono"} />
                <input value={c.waLanguage} onChange={(e) => set({ waLanguage: e.target.value })} placeholder="Langue (fr)" className={input} />
              </div>
              {(c.waVars.length ? c.waVars : [""]).map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-10 text-xs text-muted">{`{{${i + 1}}}`}</span>
                  <input value={v} onChange={(e) => { const w = [...(c.waVars.length ? c.waVars : [""])]; w[i] = e.target.value; set({ waVars: w }); }} placeholder={i === 0 ? "{{prenom}}" : ""} className={input} />
                </div>
              ))}
              <button type="button" onClick={() => set({ waVars: [...(c.waVars.length ? c.waVars : [""]), ""] })} className="text-xs font-semibold text-brand-700">+ Variable</button>
            </>
          ) : (
            <>
              <input value={c.subject} onChange={(e) => set({ subject: e.target.value })} placeholder={c.channel === "push" ? "Titre de la notification" : "Objet de l’e-mail"} className={input} />
              <textarea value={c.body} onChange={(e) => set({ body: e.target.value })} rows={c.channel === "push" ? 3 : 9} maxLength={c.channel === "push" ? 300 : undefined}
                placeholder={c.channel === "push" ? "Texte (300 caractères au plus)" : "Bonjour {{prenom}},\n\nVotre message… (laissez une ligne vide entre les paragraphes)"} className={input} />
              <input value={c.link} onChange={(e) => set({ link: e.target.value.trim() })} placeholder={c.channel === "push" ? "Lien ouvert au toucher (facultatif, https://…)" : "Lien du bouton « En savoir plus » (facultatif, https://…)"} className={input} />
              {c.channel === "email" ? <p className="text-[11px] text-muted">Un lien « Ne plus recevoir ces e-mails » est ajouté automatiquement en bas de chaque e-mail.</p> : null}
            </>
          )}
          {varsHelp}
        </section>
      </div>

      <aside className="space-y-4">
        <div className="sticky top-4 space-y-4">
          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className={label}>Destinataires</p>
            <p className="font-display text-3xl font-extrabold text-ink">{count ? count.count.toLocaleString("fr-FR") : "…"}</p>
            {count?.excluded ? <p className="text-xs text-muted">{count.excluded} exclus (désinscrits ou sans adresse)</p> : null}
            {count?.sample.length ? <p className="mt-1 text-xs text-muted">Ex. : {count.sample.map((s) => s.nom).filter(Boolean).slice(0, 4).join(", ")}…</p> : null}
          </div>
          <div className="space-y-2 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className={label}>Envoi de test</p>
            <input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder={c.channel === "email" ? "votre@email.ci" : c.channel === "push" ? "Téléphone d’un hôte" : "+225 07 …"} className={input} />
            <button type="button" disabled={pending || !testTo} onClick={() => start(async () => { const r = await testCampaignAction(c, testTo); setMsg({ ok: r.ok, text: r.ok ? "Test envoyé." : `Échec : ${r.error}` }); })}
              className="w-full rounded-md bg-white px-3 py-2 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-50">Envoyer un test</button>
          </div>
          <div className="space-y-2 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <button type="button" disabled={pending} onClick={() => start(async () => { const r = await save(); if (r.ok) { setMsg({ ok: true, text: "Brouillon enregistré." }); if (!c.id && r.id) router.replace(`/admin/centre-marketing/campagnes/${r.id}`); } })}
              className="w-full rounded-md bg-white px-3 py-2 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Enregistrer le brouillon</button>
            <label className="block text-xs text-muted">Programmer pour (facultatif)
              <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={input} />
            </label>
            <button type="button" disabled={pending || !count?.count}
              onClick={() => {
                if (!confirm(when ? `Programmer l’envoi à ${count?.count} destinataires ?` : `Envoyer maintenant à ${count?.count} destinataires ?`)) return;
                start(async () => {
                  const r = await save();
                  if (!r.ok || !r.id) return;
                  const s = await sendCampaignAction(r.id, when ? new Date(when).toISOString() : null);
                  if (s.ok) router.push(`/admin/centre-marketing/campagnes/${r.id}`); else setMsg({ ok: false, text: s.error ?? "Erreur" });
                });
              }}
              className="w-full rounded-md bg-brand-700 px-3 py-2 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-50">{when ? "Programmer l’envoi" : "Envoyer maintenant"}</button>
          </div>
          {msg ? <p className={"rounded-md p-2 text-sm " + (msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700")}>{msg.text}</p> : null}
        </div>
      </aside>
    </div>
  );
}
