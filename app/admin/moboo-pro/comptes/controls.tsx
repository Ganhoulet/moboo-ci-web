"use client";

import { useState, useTransition } from "react";
import {
  activateProAccountAction, broadcastProAction, notifyProAccountAction, setProAccountPlanAction, setProAccountRoleAction, suspendProAccountAction,
} from "../comptes-actions";
import { PLAN_LABEL, ROLE_LABEL } from "./labels";

type Res = { ok: boolean; error?: string; data?: any };

function useAction() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (fn: () => Promise<Res>, done: string | ((r: Res) => string)) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? { ok: true, text: typeof done === "string" ? done : done(r) } : { ok: false, text: r.error ?? "Erreur." });
    });
  const note = msg ? <p className={"mt-2 text-xs " + (msg.ok ? "text-emerald-700" : "text-red-700")}>{msg.text}</p> : null;
  return { pending, run, note };
}

const box = "rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200";
const input = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";
const btn = "rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";

export function SuspendControl({ wpId, suspended, isAdmin }: { wpId: number; suspended: boolean; isAdmin: boolean }) {
  const { pending, run, note } = useAction();
  if (isAdmin) return <div className={box}><h3 className="font-semibold text-ink">Accès</h3><p className="mt-1 text-xs text-muted">Compte administrateur : il ne peut pas être suspendu (sécurité).</p></div>;
  return (
    <div className={box}>
      <h3 className="font-semibold text-ink">Accès</h3>
      <p className="mt-1 text-xs text-muted">{suspended ? "Le compte est suspendu : il ne peut plus se connecter à l’application." : "Suspendre bloque la connexion à l’application (les données sont gardées)."}</p>
      <button type="button" disabled={pending}
        onClick={() => {
          if (!confirm(suspended ? "Réactiver ce compte ?" : "Suspendre ce compte ? Il ne pourra plus se connecter.")) return;
          run(() => (suspended ? activateProAccountAction(wpId) : suspendProAccountAction(wpId)), suspended ? "Compte réactivé." : "Compte suspendu.");
        }}
        className={"mt-3 rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50 " + (suspended ? "bg-emerald-600 text-white" : "bg-red-600 text-white")}>
        {suspended ? "Réactiver le compte" : "Suspendre le compte"}
      </button>
      {note}
    </div>
  );
}

export function RoleControl({ wpId, role, roles, isAdmin }: { wpId: number; role: string; roles: string[]; isAdmin: boolean }) {
  const { pending, run, note } = useAction();
  const [value, setValue] = useState(roles.includes(role) ? role : roles[0]);
  if (isAdmin) return null;
  return (
    <div className={box}>
      <h3 className="font-semibold text-ink">Rôle</h3>
      <p className="mt-1 text-xs text-muted">Actuel : {ROLE_LABEL[role] ?? role}. Le rôle décide de l’écran d’accueil de l’application.</p>
      <div className="mt-3 flex gap-2">
        <select value={value} onChange={(e) => setValue(e.target.value)} className={input} aria-label="Nouveau rôle">
          {roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r] ?? r}</option>)}
        </select>
        <button type="button" disabled={pending || value === role} className={btn}
          onClick={() => { if (confirm(`Passer ce compte en « ${ROLE_LABEL[value] ?? value} » ?`)) run(() => setProAccountRoleAction(wpId, value), "Rôle changé."); }}>
          Changer
        </button>
      </div>
      {note}
    </div>
  );
}

export function PlanControl({ wpId, plan, plans, credits }: { wpId: number; plan: string; plans: string[]; credits: number }) {
  const { pending, run, note } = useAction();
  const [value, setValue] = useState(plan);
  const [days, setDays] = useState(30);
  const [edl, setEdl] = useState<string>(String(credits));
  return (
    <div className={box}>
      <h3 className="font-semibold text-ink">Forfait</h3>
      <p className="mt-1 text-xs text-muted">Offrir ou retirer un forfait sans paiement (geste commercial, test, correction). « Gratuit » retire le forfait.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <label className="text-xs font-semibold text-slate-600">Forfait
          <select value={value} onChange={(e) => setValue(e.target.value)} className={input}>{plans.map((p) => <option key={p} value={p}>{PLAN_LABEL[p] ?? p}</option>)}</select>
        </label>
        <label className="text-xs font-semibold text-slate-600">Durée (jours)
          <input type="number" min={1} max={3650} value={days} onChange={(e) => setDays(Number(e.target.value) || 30)} className={input} />
        </label>
        <label className="text-xs font-semibold text-slate-600">Crédits d’états des lieux
          <input type="number" min={0} value={edl} onChange={(e) => setEdl(e.target.value)} className={input} />
        </label>
      </div>
      <button type="button" disabled={pending} className={btn + " mt-3"}
        onClick={() => {
          if (!confirm(value === "starter" ? "Retirer le forfait de ce compte ?" : `Activer « ${PLAN_LABEL[value] ?? value} » pour ${days} jours ?`)) return;
          run(() => setProAccountPlanAction(wpId, value, days, edl === "" ? null : Math.max(0, Number(edl) || 0)),
            (r) => (r.data?.expires_at ? `Forfait enregistré, jusqu’au ${new Date(r.data.expires_at).toLocaleDateString("fr-FR")}.` : "Forfait enregistré."));
        }}>
        Enregistrer le forfait
      </button>
      {note}
    </div>
  );
}

export function NotifyControl({ wpId }: { wpId: number }) {
  const { pending, run, note } = useAction();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  return (
    <div className={box}>
      <h3 className="font-semibold text-ink">Notification à ce compte</h3>
      <p className="mt-1 text-xs text-muted">Arrive dans le centre de notifications de l’application (et en push si le téléphone est inscrit).</p>
      <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Titre" className={input + " mt-3"} />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} rows={3} placeholder="Message" className={input + " mt-2"} />
      <button type="button" disabled={pending || title.trim().length < 3} className={btn + " mt-2"}
        onClick={() => run(async () => { const r = await notifyProAccountAction(wpId, title.trim(), body.trim()); if (r.ok) { setTitle(""); setBody(""); } return r; }, "Notification envoyée.")}>
        Envoyer
      </button>
      {note}
    </div>
  );
}

const CIBLES: [string, string][] = [["tous", "Tous les comptes"], ["agence", "Agences et agents"], ["proprietaire", "Propriétaires"], ["locataire", "Locataires"]];

export function BroadcastForm({ audiences }: { audiences: Record<string, { accounts: number; devices: number; pushReady: boolean }> }) {
  const { pending, run, note } = useAction();
  const [cible, setCible] = useState("tous");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const a = audiences[cible];
  return (
    <div className={box}>
      <h2 className="font-semibold text-ink">Nouvelle notification</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {CIBLES.map(([k, l]) => (
          <button key={k} type="button" onClick={() => setCible(k)} className={"rounded-full px-3 py-1 text-sm font-semibold " + (cible === k ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>
            {l} <span className="opacity-70">({audiences[k]?.accounts ?? 0})</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">
        {a ? `${a.accounts.toLocaleString("fr-FR")} compte(s), ${a.devices.toLocaleString("fr-FR")} téléphone(s) inscrit(s) aux notifications push.` : ""}
        {a && !a.pushReady ? " Envoi push non configuré : la notification arrivera seulement dans l’application." : ""}
      </p>
      <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Titre (ex. Nouvelle version disponible)" className={input + " mt-3"} />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} rows={4} placeholder="Message" className={input + " mt-2"} />
      <button type="button" disabled={pending || title.trim().length < 3} className={btn + " mt-3"}
        onClick={() => {
          if (!confirm(`Envoyer « ${title.trim()} » à ${a?.accounts ?? 0} compte(s) ? Impossible d’annuler.`)) return;
          run(async () => { const r = await broadcastProAction(cible, title.trim(), body.trim()); if (r.ok) { setTitle(""); setBody(""); } return r; },
            (r) => `Envoyée à ${r.data?.accounts ?? 0} compte(s), ${r.data?.devices ?? 0} téléphone(s).`);
        }}>
        Envoyer à {CIBLES.find(([k]) => k === cible)?.[1].toLowerCase()}
      </button>
      {note}
    </div>
  );
}
