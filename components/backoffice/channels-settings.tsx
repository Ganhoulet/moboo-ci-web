"use client";

import { useState, useTransition } from "react";
import {
  listWaTemplatesAction, saveMessagingAction, testSmsAction, testWhatsappAction,
  type MessagingConfig, type MessagingView,
} from "@/app/admin/centre-marketing/canaux/actions";
import { smsCounter } from "@/lib/sms";

const input = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none";
const label = "block text-xs font-semibold uppercase tracking-wide text-slate-500";
const PROVIDERS: [MessagingConfig["sms"]["provider"], string, string][] = [
  ["auto", "Automatique", "Le premier fournisseur complet (y compris les variables Render ORANGE_SMS_*, TWILIO_*)."],
  ["orange", "Orange SMS API", "Côte d’Ivoire, developer.orange.com : paquets de SMS prépayés, nom d’expéditeur « MOBOO » possible."],
  ["infobip", "Infobip", "Agrégateur international, bonne couverture Orange / MTN / Moov."],
  ["twilio", "Twilio", "International, simple à ouvrir, plus cher en Côte d’Ivoire."],
  ["http", "Fournisseur local", "N’importe quel agrégateur ivoirien qui fournit une adresse d’envoi (API HTTP)."],
  ["none", "Désactivés", "Aucun SMS (ni codes, ni relances)."],
];

function Field({ l, v, on, ph, secret, mono }: { l: string; v: string; on: (v: string) => void; ph?: string; secret?: boolean; mono?: boolean }) {
  return (
    <label className="block"><span className={label}>{l}</span>
      <input type={secret ? "password" : "text"} autoComplete="off" value={v} onChange={(e) => on(e.target.value)} placeholder={ph} className={input + (mono ? " font-mono" : "")} />
    </label>
  );
}
function Toggle({ l, help, v, on }: { l: string; help: string; v: boolean; on: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 rounded-md p-2 hover:bg-slate-50">
      <input type="checkbox" className="mt-1 h-4 w-4" checked={v} onChange={(e) => on(e.target.checked)} />
      <span><span className="text-sm font-semibold text-ink">{l}</span><span className="block text-xs text-muted">{help}</span></span>
    </label>
  );
}
function Dot({ ok, text }: { ok: boolean; text: string }) {
  return <span className={"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold " + (ok ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500")}><span className={"h-2 w-2 rounded-full " + (ok ? "bg-emerald-500" : "bg-slate-400")} />{text}</span>;
}

/** Réglage des canaux d'envoi : SMS (fournisseurs) et WhatsApp Business, avec tests. */
export function ChannelsSettings({ initial }: { initial: MessagingView }) {
  const [cfg, setCfg] = useState(initial.config);
  const [status, setStatus] = useState(initial.status);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<Record<string, { ok: boolean; text: string } | null>>({});
  const [smsTo, setSmsTo] = useState("");
  const [smsText, setSmsText] = useState(initial.smsSuggestions[0]?.text ?? "Moboo.ci : SMS de test.");
  const [waTo, setWaTo] = useState("");
  const [waTpl, setWaTpl] = useState("");
  const [waVars, setWaVars] = useState("");
  const [tpls, setTpls] = useState<Awaited<ReturnType<typeof listWaTemplatesAction>> | null>(null);
  const sms = cfg.sms;
  const wa = cfg.whatsapp;
  const setSms = (p: Partial<MessagingConfig["sms"]>) => setCfg((c) => ({ ...c, sms: { ...c.sms, ...p } }));
  const setSub = <K extends "orange" | "twilio" | "infobip" | "http">(k: K, p: Partial<MessagingConfig["sms"][K]>) => setCfg((c) => ({ ...c, sms: { ...c.sms, [k]: { ...c.sms[k], ...p } } }));
  const setWa = (p: Partial<MessagingConfig["whatsapp"]>) => setCfg((c) => ({ ...c, whatsapp: { ...c.whatsapp, ...p } }));
  const note = (k: string, ok: boolean, text: string) => setMsg((m) => ({ ...m, [k]: { ok, text } }));
  const save = (k: string) => start(async () => {
    const r = await saveMessagingAction(cfg);
    if (!r.ok) return note(k, false, r.error ?? "Erreur.");
    if (r.config) setCfg(r.config);
    if (r.status) setStatus(r.status);
    note(k, true, "Enregistré.");
  });
  const Msg = ({ k }: { k: string }) => (msg[k] ? <p className={"rounded-md px-3 py-2 text-sm " + (msg[k]!.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>{msg[k]!.text}</p> : null);
  const opt = status.optouts ?? {};

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200"><p className={label}>E-mail</p><div className="mt-2"><Dot ok={status.email.ready} text={status.email.ready ? "Prêt" : "SMTP non configuré"} /></div></div>
        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200"><p className={label}>SMS</p><div className="mt-2 space-y-1"><Dot ok={!!status.sms.provider} text={status.sms.label ?? "Non configuré"} />{status.sms.provider ? <p className="text-xs text-muted">{status.sms.marketing ? "Relances et campagnes autorisées" : "Codes de connexion seulement"}</p> : null}</div></div>
        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200"><p className={label}>WhatsApp Business</p><div className="mt-2"><Dot ok={status.whatsapp.ready} text={status.whatsapp.ready ? "Connecté" : "Non configuré"} /></div></div>
        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200"><p className={label}>Désinscrits</p><p className="mt-1 text-sm text-slate-700">E-mail {opt.email ?? 0} · SMS {opt.sms ?? 0} · WhatsApp {opt.whatsapp ?? 0}</p></div>
      </div>

      {/* ─── SMS ─── */}
      <section className="space-y-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-display text-lg font-bold text-ink">SMS</h2>
        <div className="grid gap-2 md:grid-cols-3">
          {PROVIDERS.map(([k, l, d]) => (
            <button key={k} type="button" onClick={() => setSms({ provider: k })} className={"rounded-lg p-3 text-left ring-1 " + (sms.provider === k ? "bg-brand-50 ring-2 ring-brand-600" : "bg-white ring-slate-200 hover:bg-slate-50")}>
              <p className="text-sm font-semibold text-ink">{l}</p><p className="text-xs text-muted">{d}</p>
            </button>
          ))}
        </div>
        {sms.provider === "orange" || sms.provider === "auto" ? (
          <div className="grid gap-3 rounded-md bg-slate-50 p-3 sm:grid-cols-2">
            <p className="text-xs font-semibold text-slate-600 sm:col-span-2">Orange SMS API — developer.orange.com → « SMS Côte d’Ivoire » → My Apps</p>
            <Field l="Client ID" v={sms.orange.clientId} on={(v) => setSub("orange", { clientId: v })} mono />
            <Field l="Client secret" v={sms.orange.clientSecret} on={(v) => setSub("orange", { clientSecret: v })} secret />
            <Field l="Numéro expéditeur" v={sms.orange.sender} on={(v) => setSub("orange", { sender: v })} ph="+2250000" />
            <Field l="Nom d’expéditeur (validé par Orange)" v={sms.orange.senderName} on={(v) => setSub("orange", { senderName: v })} ph="MOBOO" />
          </div>
        ) : null}
        {sms.provider === "infobip" ? (
          <div className="grid gap-3 rounded-md bg-slate-50 p-3 sm:grid-cols-3">
            <Field l="Adresse de l’API (Base URL)" v={sms.infobip.baseUrl} on={(v) => setSub("infobip", { baseUrl: v })} ph="https://xxxxx.api.infobip.com" />
            <Field l="Clé d’API" v={sms.infobip.apiKey} on={(v) => setSub("infobip", { apiKey: v })} secret />
            <Field l="Expéditeur" v={sms.infobip.from} on={(v) => setSub("infobip", { from: v })} ph="MOBOO" />
          </div>
        ) : null}
        {sms.provider === "twilio" ? (
          <div className="grid gap-3 rounded-md bg-slate-50 p-3 sm:grid-cols-3">
            <Field l="Account SID" v={sms.twilio.accountSid} on={(v) => setSub("twilio", { accountSid: v })} mono />
            <Field l="Auth token" v={sms.twilio.authToken} on={(v) => setSub("twilio", { authToken: v })} secret />
            <Field l="Expéditeur (numéro ou MOBOO)" v={sms.twilio.from} on={(v) => setSub("twilio", { from: v })} />
          </div>
        ) : null}
        {sms.provider === "http" ? (
          <div className="grid gap-3 rounded-md bg-slate-50 p-3">
            <p className="text-xs text-slate-600">Recopiez la documentation de votre fournisseur. Variables : <code>{"{{to}}"}</code> (+225…), <code>{"{{to_digits}}"}</code> (225…), <code>{"{{from}}"}</code> (nom d’expéditeur, réglé dans « Orange »), <code>{"{{text}}"}</code>.</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
              <Field l="Adresse d’envoi" v={sms.http.url} on={(v) => setSub("http", { url: v })} ph="https://api.fournisseur.ci/sms/send" />
              <label className="block"><span className={label}>Méthode</span><select value={sms.http.method} onChange={(e) => setSub("http", { method: e.target.value as "POST" | "GET" })} className={input}><option>POST</option><option>GET</option></select></label>
            </div>
            <Field l="En-têtes (JSON, ex. clé d’API)" v={sms.http.headers} on={(v) => setSub("http", { headers: v })} ph='{"Authorization":"Bearer VOTRE_CLE"}' secret />
            {sms.http.method === "POST" ? <label className="block"><span className={label}>Corps de la requête</span><textarea rows={3} value={sms.http.body} onChange={(e) => setSub("http", { body: e.target.value })} className={input + " font-mono text-xs"} /></label> : null}
            <Field l="Texte attendu dans une réponse réussie (facultatif)" v={sms.http.okPattern} on={(v) => setSub("http", { okPattern: v })} ph='"status":"success"' />
          </div>
        ) : null}
        <div className="grid gap-1 md:grid-cols-3">
          <Toggle l="Relances et campagnes par SMS" help="Sinon, les SMS servent seulement aux codes de connexion." v={sms.marketing} on={(v) => setSms({ marketing: v })} />
          <Toggle l="Économiser les SMS" help="Remplace ê, ç, ’… : 160 caractères par SMS au lieu de 70." v={sms.plainText} on={(v) => setSms({ plainText: v })} />
          <Toggle l="Lien « STOP » automatique" help="Désinscription en un clic à la fin des SMS promotionnels (recommandé, ARTCI)." v={sms.optOut} on={(v) => setSms({ optOut: v })} />
        </div>
        <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" disabled={pending} onClick={() => save("sms")} className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Enregistrer</button>
          <span className="flex-1" />
          <label className="text-sm"><span className={label}>Tester sur</span><input value={smsTo} onChange={(e) => setSmsTo(e.target.value)} placeholder="07 07 12 34 56" className={input} /></label>
          <label className="min-w-[280px] flex-1 text-sm"><span className={label}>Texte</span><input value={smsText} onChange={(e) => setSmsText(e.target.value)} className={input} /></label>
          <button type="button" disabled={pending || !smsTo} onClick={() => start(async () => { const r = await testSmsAction(smsTo, smsText); note("sms", r.ok, r.ok ? `SMS envoyé au ${smsTo}.` : r.error ?? "Échec."); })} className="rounded-md bg-white px-3 py-2 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Envoyer un SMS de test</button>
        </div>
        <p className="text-[11px] text-muted">{smsCounter(smsText, sms.plainText, false)}. Pensez à enregistrer avant de tester.</p>
        <Msg k="sms" />
      </section>

      {/* ─── WhatsApp ─── */}
      <section className="space-y-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-display text-lg font-bold text-ink">WhatsApp Business</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
          <li>Sur <strong>business.facebook.com</strong>, créez (ou ouvrez) le portefeuille Moboo et faites-le vérifier.</li>
          <li>Dans <strong>WhatsApp Manager</strong>, ajoutez un numéro dédié (pas celui d’un téléphone WhatsApp déjà utilisé) et le nom affiché « Moboo.ci ».</li>
          <li>Dans <strong>developers.facebook.com</strong> → votre appli → WhatsApp → Configuration de l’API, copiez l’<strong>identifiant du numéro</strong> et l’<strong>identifiant du compte WhatsApp Business</strong>, puis créez un <strong>jeton permanent</strong> (utilisateur système).</li>
          <li>Webhook : adresse <code className="rounded bg-slate-100 px-1">{initial.webhookUrl}</code>, jeton de vérification ci-dessous, abonnement « messages » (les réponses « STOP » désinscrivent automatiquement).</li>
          <li>Créez les <strong>modèles de message</strong> proposés plus bas (catégorie Marketing) et attendez leur approbation (quelques minutes à 24 h).</li>
        </ol>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Field l="Identifiant du numéro (Phone number ID)" v={wa.phoneId} on={(v) => setWa({ phoneId: v })} mono />
          <Field l="Identifiant du compte (WABA ID)" v={wa.wabaId} on={(v) => setWa({ wabaId: v })} mono />
          <Field l="Jeton d’accès permanent" v={wa.accessToken} on={(v) => setWa({ accessToken: v })} secret />
          <Field l="Jeton de vérification du webhook" v={wa.verifyToken} on={(v) => setWa({ verifyToken: v })} ph="une phrase secrète de votre choix" />
          <Field l="Version de l’API Graph" v={wa.apiVersion} on={(v) => setWa({ apiVersion: v })} ph="v19.0" />
          <Field l="Langue des modèles" v={wa.language} on={(v) => setWa({ language: v })} ph="fr" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={pending} onClick={() => save("wa")} className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Enregistrer</button>
          <button type="button" disabled={pending || !status.whatsapp.ready} onClick={() => start(async () => setTpls(await listWaTemplatesAction()))} className="rounded-md bg-white px-3 py-2 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-40">Voir mes modèles Meta</button>
        </div>
        <Msg k="wa" />
        {tpls ? (
          tpls.ok ? (
            <div className="overflow-x-auto rounded-md ring-1 ring-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Modèle</th><th className="px-3 py-2">Statut</th><th className="px-3 py-2">Variables</th><th className="px-3 py-2">Texte</th></tr></thead>
                <tbody>{tpls.items.map((t) => (
                  <tr key={t.name + t.language} className="border-t border-slate-100 align-top">
                    <td className="px-3 py-2 font-mono text-xs">{t.name}</td>
                    <td className="px-3 py-2"><span className={"rounded px-1.5 py-0.5 text-[11px] font-semibold " + (t.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : t.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800")}>{t.status === "APPROVED" ? "Approuvé" : t.status === "REJECTED" ? "Refusé" : "En attente"}</span></td>
                    <td className="px-3 py-2 text-xs">{t.variables}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{t.body}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{tpls.error}</p>
        ) : null}

        <div className="space-y-2">
          <h3 className="font-display font-bold text-ink">Modèles à créer chez Meta</h3>
          <p className="text-xs text-muted">Copiez le nom et le texte dans WhatsApp Manager → Modèles de message → Créer (catégorie Marketing, langue French). Les relances et campagnes remplissent ensuite {"{{1}}"}, {"{{2}}"}… avec les valeurs indiquées.</p>
          <div className="grid gap-3 lg:grid-cols-2">
            {initial.waSuggestions.map((t) => (
              <div key={t.name} className="rounded-md bg-slate-50 p-3 ring-1 ring-slate-200">
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm font-bold text-brand-800">{t.name}</code>
                  <button type="button" onClick={() => { void navigator.clipboard?.writeText(t.body); setWaTpl(t.name); setWaVars(t.vars.map((v) => (v.startsWith("{{") ? "" : v)).join("\n")); }} className="rounded px-2 py-1 text-xs font-semibold text-brand-800 hover:bg-white">Copier le texte</button>
                </div>
                <p className="text-[11px] font-semibold text-slate-500">{t.usage}</p>
                <p className="mt-1 whitespace-pre-line text-xs text-slate-700">{t.body}</p>
                <p className="mt-1 text-[11px] text-muted">Variables : {t.vars.map((v, i) => `{{${i + 1}}} = ${v}`).join(" · ")}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
          <label className="text-sm"><span className={label}>Tester sur</span><input value={waTo} onChange={(e) => setWaTo(e.target.value)} placeholder="07 07 12 34 56" className={input} /></label>
          <label className="text-sm"><span className={label}>Modèle approuvé</span><input value={waTpl} onChange={(e) => setWaTpl(e.target.value)} placeholder="relance_demandes" className={input + " font-mono"} /></label>
          <label className="min-w-[240px] flex-1 text-sm"><span className={label}>Valeurs {"{{1}}, {{2}}…"} (une par ligne)</span><textarea rows={2} value={waVars} onChange={(e) => setWaVars(e.target.value)} className={input} /></label>
          <button type="button" disabled={pending || !waTo || !waTpl || !status.whatsapp.ready} onClick={() => start(async () => { const r = await testWhatsappAction(waTo, waTpl, waVars.split("\n").map((v) => v.trim()).filter(Boolean)); note("watest", r.ok, r.ok ? `Message envoyé au ${waTo}.` : r.error ?? "Échec."); })} className="rounded-md bg-white px-3 py-2 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-40">Envoyer un test</button>
        </div>
        <Msg k="watest" />
      </section>

      <section className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
        <p className="font-semibold">Et Firebase ?</p>
        <p className="mt-1">Firebase envoie seulement des <strong>codes de vérification</strong> (connexion par SMS) et des <strong>notifications push</strong> vers les applications : il ne permet pas d’envoyer des SMS promotionnels. Pour les relances et promotions par SMS, il faut un fournisseur ci-dessus (achat de paquets de SMS).</p>
      </section>
    </div>
  );
}
