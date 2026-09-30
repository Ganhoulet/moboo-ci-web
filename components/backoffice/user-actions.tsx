"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  banUserAction, logoutUserAction, reactivateUserAction, resetUser2faAction, setUserVerifiedAction, suspendUserAction, updateUserAction,
} from "@/app/admin/backoffice-actions";
import { TYPE_LABEL } from "./ui";

type Msg = { ok: boolean; text: string } | null;
interface Account {
  id: string; name: string; phone: string; accountStatus: string; verified: boolean; twoFactor: boolean; isAdmin: boolean; fixedAdmin: boolean;
  firstName: string | null; lastName: string | null; email: string | null; username: string | null; companyName: string | null;
  city: string | null; commune: string | null; whatsapp: string | null; accountType: string;
}

const DURATIONS = [
  { days: 1, label: "24 heures" }, { days: 3, label: "3 jours" }, { days: 7, label: "7 jours" },
  { days: 30, label: "30 jours" }, { days: 0, label: "Sans date de fin" },
];

/** Panneau d'actions de la fiche utilisateur (suspendre, bannir, réactiver, déconnecter…). */
export function UserActions({ a, canManage, sessions }: { a: Account; canManage: boolean; sessions: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<Msg>(null);
  const [mode, setMode] = useState<null | "suspend" | "ban" | "edit">(null);
  const [reason, setReason] = useState("");
  const [days, setDays] = useState(7);
  const [hide, setHide] = useState(true);

  const run = (fn: () => Promise<{ ok: boolean; error?: string; data?: any }>, okText: string | ((d: any) => string)) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? { ok: true, text: typeof okText === "function" ? okText(r.data) : okText } : { ok: false, text: r.error ?? "Action impossible." });
      if (r.ok) { setMode(null); setReason(""); router.refresh(); }
    });

  if (!canManage) return <p className="text-sm text-muted">Votre rôle permet de consulter cette fiche, pas de la modifier.</p>;
  const btn = "w-full rounded-md border px-3 py-2 text-left text-sm font-semibold transition disabled:opacity-50";
  const blocked = a.accountStatus !== "active";

  return (
    <div className="space-y-2">
      {blocked ? (
        <button type="button" disabled={pending} className={`${btn} border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100`}
          onClick={() => window.confirm("Réactiver ce compte ? Ses annonces masquées par la suspension seront remises en ligne.") && run(() => reactivateUserAction(a.id), (d) => `Compte réactivé (${d?.restored ?? 0} annonce(s) remise(s) en ligne).`)}>
          ✓ Réactiver le compte
        </button>
      ) : (
        <>
          <button type="button" disabled={pending || a.fixedAdmin} className={`${btn} border-amber-300 text-amber-800 hover:bg-amber-50`} onClick={() => setMode(mode === "suspend" ? null : "suspend")}>⏸ Suspendre…</button>
          <button type="button" disabled={pending || a.fixedAdmin} className={`${btn} border-red-300 text-red-700 hover:bg-red-50`} onClick={() => setMode(mode === "ban" ? null : "ban")}>⛔ Bannir…</button>
        </>
      )}

      {mode === "suspend" || mode === "ban" ? (
        <form className={`space-y-2 rounded-md p-3 ring-1 ${mode === "ban" ? "bg-red-50/60 ring-red-200" : "bg-amber-50/60 ring-amber-200"}`}
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === "ban") {
              if (!window.confirm("Bannir ce compte ? Il sera déconnecté partout, ses annonces seront masquées et il ne pourra plus se connecter.")) return;
              run(() => banUserAction(a.id, reason), "Compte banni.");
            } else {
              run(() => suspendUserAction(a.id, { reason, days: days || undefined, hideListings: hide }), "Compte suspendu.");
            }
          }}>
          <label className="block text-xs font-semibold text-slate-600">Motif (envoyé à la personne par e-mail)</label>
          <textarea required rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className="input text-sm" placeholder="Ex. annonces trompeuses signalées à plusieurs reprises" />
          {mode === "suspend" ? (
            <>
              <label className="block text-xs font-semibold text-slate-600">Durée</label>
              <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="input text-sm">
                {DURATIONS.map((d) => <option key={d.days} value={d.days}>{d.label}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={hide} onChange={(e) => setHide(e.target.checked)} /> Masquer ses annonces pendant la suspension</label>
            </>
          ) : <p className="text-xs text-red-700">Définitif jusqu’à réactivation manuelle. L’accès au back-office est aussi retiré.</p>}
          <div className="flex gap-2">
            <button disabled={pending} className={`rounded-md px-3 py-1.5 text-sm font-semibold text-white ${mode === "ban" ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"}`}>{mode === "ban" ? "Bannir" : "Suspendre"}</button>
            <button type="button" className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-white" onClick={() => setMode(null)}>Annuler</button>
          </div>
        </form>
      ) : null}

      <button type="button" disabled={pending || !sessions} className={`${btn} border-slate-300 text-slate-700 hover:bg-slate-50`}
        onClick={() => window.confirm("Fermer toutes les sessions de ce compte ? La personne devra se reconnecter sur chaque appareil.") && run(() => logoutUserAction(a.id), (d) => `${d?.count ?? 0} session(s) fermée(s).`)}>
        ⎋ Déconnecter partout {sessions ? `(${sessions})` : ""}
      </button>
      <button type="button" disabled={pending} className={`${btn} border-slate-300 text-slate-700 hover:bg-slate-50`}
        onClick={() => run(() => setUserVerifiedAction(a.id, !a.verified), a.verified ? "Badge « Vérifié » retiré." : "Badge « Vérifié » accordé.")}>
        {a.verified ? "✕ Retirer le badge « Vérifié »" : "✔ Accorder le badge « Vérifié »"}
      </button>
      {a.twoFactor ? (
        <button type="button" disabled={pending} className={`${btn} border-slate-300 text-slate-700 hover:bg-slate-50`}
          onClick={() => window.confirm("Réinitialiser la double authentification (téléphone perdu) ? La personne pourra la reconfigurer.") && run(() => resetUser2faAction(a.id), "Double authentification réinitialisée.")}>
          🔐 Réinitialiser la 2FA
        </button>
      ) : null}
      <button type="button" disabled={pending} className={`${btn} border-slate-300 text-slate-700 hover:bg-slate-50`} onClick={() => setMode(mode === "edit" ? null : "edit")}>✎ Modifier le profil…</button>
      {mode === "edit" ? <EditProfile a={a} pending={pending} onSave={(patch) => run(() => updateUserAction(a.id, patch), "Profil enregistré.")} onCancel={() => setMode(null)} /> : null}

      {msg ? <p className={"text-sm font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
    </div>
  );
}

function EditProfile({ a, pending, onSave, onCancel }: { a: Account; pending: boolean; onSave: (p: Record<string, string>) => void; onCancel: () => void }) {
  const [v, setV] = useState<Record<string, string>>({
    firstName: a.firstName ?? "", lastName: a.lastName ?? "", email: a.email ?? "", username: a.username ?? "",
    companyName: a.companyName ?? "", city: a.city ?? "", commune: a.commune ?? "", whatsapp: a.whatsapp ?? "", accountType: a.accountType,
  });
  const f = (k: string, label: string, type = "text") => (
    <label className="block text-xs font-semibold text-slate-600">{label}
      <input type={type} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} className="input mt-0.5 text-sm font-normal" />
    </label>
  );
  return (
    <form className="space-y-2 rounded-md bg-slate-50 p-3 ring-1 ring-slate-200" onSubmit={(e) => { e.preventDefault(); onSave(v); }}>
      <div className="grid grid-cols-2 gap-2">{f("firstName", "Prénom")}{f("lastName", "Nom")}</div>
      {f("email", "E-mail", "email")}
      <div className="grid grid-cols-2 gap-2">{f("username", "Identifiant")}{f("whatsapp", "WhatsApp")}</div>
      {f("companyName", "Société / établissement")}
      <div className="grid grid-cols-2 gap-2">{f("city", "Ville")}{f("commune", "Commune")}</div>
      <label className="block text-xs font-semibold text-slate-600">Type de compte
        <select value={v.accountType} onChange={(e) => setV({ ...v, accountType: e.target.value })} className="input mt-0.5 text-sm font-normal">
          {Object.entries(TYPE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </label>
      <div className="flex gap-2">
        <button disabled={pending} className="rounded-md bg-brand-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-800">Enregistrer</button>
        <button type="button" className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-white" onClick={onCancel}>Annuler</button>
      </div>
    </form>
  );
}

/** Fermer la session d'un seul appareil. */
export function SessionRevoke({ accountId, sessionId }: { accountId: string; sessionId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
      onClick={() => start(async () => { const r = await logoutUserAction(accountId, sessionId); if (r.ok) router.refresh(); else window.alert(r.error); })}>
      Fermer
    </button>
  );
}
