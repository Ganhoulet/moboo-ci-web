"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createKeyAction, revokeKeyAction, saveWebhookAction, testWebhookAction, type MyApi } from "@/app/mon-espace/api/actions";

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "jamais");

function Copy({ value }: { value: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" onClick={() => { navigator.clipboard?.writeText(value); setOk(true); setTimeout(() => setOk(false), 1500); }}
      className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-semibold ring-1 ring-slate-300 hover:bg-slate-50">{ok ? "Copié ✓" : "Copier"}</button>
  );
}

/** Mon espace → API & intégrations : clés, webhook, utilisation. */
export function ApiIntegrations({ d }: { d: Required<MyApi> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(Object.keys(d.scopes));
  const [newKey, setNewKey] = useState<string | null>(null);
  const [hook, setHook] = useState(d.webhookUrl ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const active = d.keys.filter((k) => !k.revokedAt);
  const total14 = d.usage.reduce((n, u) => n + u.requests, 0);

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await createKeyAction(name || "Clé API", scopes);
      if (r.ok && r.key) { setNewKey(r.key); setName(""); router.refresh(); } else setMsg(r.error ?? "Erreur");
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-card"><p className="text-xs text-muted">Clés actives</p><p className="font-display text-2xl font-extrabold">{active.length}</p></div>
        <div className="rounded-2xl bg-white p-4 shadow-card"><p className="text-xs text-muted">Requêtes (14 jours)</p><p className="font-display text-2xl font-extrabold">{total14.toLocaleString("fr-FR")}</p></div>
        <div className="rounded-2xl bg-white p-4 shadow-card"><p className="text-xs text-muted">Limite</p><p className="font-display text-2xl font-extrabold">{d.rateLimit} <span className="text-sm font-semibold text-muted">req./min par clé</span></p></div>
      </div>

      <section className="space-y-3 rounded-2xl bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-ink">Clés API</h2>
          <Link href="/developpeurs" target="_blank" className="text-sm font-semibold text-brand-700 hover:underline">Documentation de l’API ↗</Link>
        </div>
        <p className="text-sm text-muted">Adresse de l’API : <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{d.baseUrl}</code></p>

        {newKey ? (
          <div className="rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
            <p className="text-sm font-semibold text-emerald-900">Votre nouvelle clé : copiez-la maintenant, elle ne sera plus jamais affichée.</p>
            <div className="mt-2 flex items-center gap-2"><code className="min-w-0 flex-1 break-all rounded-md bg-white px-2 py-1.5 text-xs ring-1 ring-emerald-200">{newKey}</code><Copy value={newKey} /></div>
            <p className="mt-2 text-xs text-emerald-900">À utiliser dans l’en-tête : <code>Authorization: Bearer {newKey.slice(0, 12)}…</code>. Ne la partagez pas et ne la mettez jamais dans une page web ou une application.</p>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="py-2">Nom</th><th>Début de la clé</th><th>Droits</th><th>Dernière utilisation</th><th /></tr></thead>
            <tbody>
              {d.keys.map((k) => (
                <tr key={k.id} className={"border-t border-slate-100 " + (k.revokedAt ? "text-slate-400" : "")}>
                  <td className="py-2 font-semibold">{k.name}</td>
                  <td><code className="text-xs">{k.prefix}…</code></td>
                  <td className="text-xs">{k.scopes.map((s) => d.scopes[s] ?? s).join(" · ")}</td>
                  <td className="text-xs">{k.revokedAt ? `Révoquée le ${fmt(k.revokedAt)}` : `${fmt(k.lastUsedAt)} · ${k.requests.toLocaleString("fr-FR")} req.`}</td>
                  <td className="text-right">
                    {!k.revokedAt ? (
                      <button disabled={pending} onClick={() => { if (confirm(`Révoquer « ${k.name} » ? Les logiciels qui l’utilisent seront refusés immédiatement.`)) start(async () => { await revokeKeyAction(k.id); router.refresh(); }); }}
                        className="rounded-md px-2 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50">Révoquer</button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {!d.keys.length ? <tr><td colSpan={5} className="py-4 text-center text-muted">Aucune clé pour le moment.</td></tr> : null}
            </tbody>
          </table>
        </div>

        <form onSubmit={create} className="space-y-2 rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-ink">Nouvelle clé</p>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Nom (ex. Logiciel de l’agence, Site web…)" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <div className="grid gap-1 sm:grid-cols-2">
            {Object.entries(d.scopes).map(([k, v]) => (
              <label key={k} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={scopes.includes(k)} onChange={(e) => setScopes(e.target.checked ? [...scopes, k] : scopes.filter((s) => s !== k))} /> {v}
              </label>
            ))}
          </div>
          <button disabled={pending || !scopes.length} className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">Créer la clé</button>
          {msg ? <p className="text-xs text-red-700">{msg}</p> : null}
        </form>
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-5 shadow-card">
        <h2 className="font-display text-lg font-bold text-ink">Webhook : demandes en temps réel</h2>
        <p className="text-sm text-muted">Chaque nouvelle demande (contact, visite) sur vos annonces est envoyée à cette adresse de votre logiciel, signée (en-tête <code>X-Moboo-Signature</code>). En cas d’échec, nous réessayons pendant plusieurs heures.</p>
        <div className="flex flex-wrap gap-2">
          <input value={hook} onChange={(e) => setHook(e.target.value)} placeholder="https://crm.mon-agence.ci/webhooks/moboo" className="min-w-[16rem] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <button disabled={pending} onClick={() => start(async () => { const r = await saveWebhookAction(hook); setMsg(r.ok ? "Adresse enregistrée." : r.error ?? "Erreur"); router.refresh(); })}
            className="rounded-md bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800">Enregistrer</button>
          <button disabled={pending || !d.webhookUrl} onClick={() => start(async () => { const r = await testWebhookAction(); setMsg(r.ok ? `Test envoyé : votre serveur a répondu ${r.status}.` : `Échec du test : ${r.error}`); })}
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-50">Envoyer un test</button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Secret de signature :</span>
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{showSecret ? d.webhookSecret : `${d.webhookSecret.slice(0, 10)}••••••••`}</code>
          <button type="button" onClick={() => setShowSecret(!showSecret)} className="text-xs font-semibold text-brand-700">{showSecret ? "Masquer" : "Afficher"}</button>
          {showSecret ? <Copy value={d.webhookSecret} /> : null}
          <button type="button" disabled={pending} onClick={() => { if (confirm("Générer un nouveau secret ? L’ancien ne sera plus valable.")) start(async () => { await saveWebhookAction(hook, true); router.refresh(); }); }}
            className="text-xs font-semibold text-red-700">Changer le secret</button>
        </div>
        {msg ? <p className="text-xs text-muted">{msg}</p> : null}
      </section>
    </div>
  );
}
