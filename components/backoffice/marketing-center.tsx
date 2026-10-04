"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cancelDeclaredAction, declareBookingAction, previewAction, removePromotionAction, savePromotionAction, searchTargetsAction, type Target,
} from "@/app/admin/centre-marketing/actions";
import type { ConversionSignal } from "@/lib/signals";

const TYPE_LABEL: Record<Target["type"], string> = { residence: "Résidence meublée", espace: "Espace événementiel", listing: "Annonce" };
const TONE: Record<string, string> = { urgent: "bg-red-50 text-red-800", social: "bg-amber-50 text-amber-900", deal: "bg-emerald-50 text-emerald-800", info: "bg-sky-50 text-sky-800", trust: "bg-slate-50 text-slate-700" };

/** Recherche d'un bien (résidence, espace, annonce) par nom ou commune. */
export function TargetPicker({ types, value, onPick }: { types: Target["type"][]; value: Target | null; onPick: (t: Target | null) => void }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Target[]>([]);
  useEffect(() => {
    if (q.trim().length < 2) { setItems([]); return; }
    const t = setTimeout(() => { searchTargetsAction(q).then((x) => setItems(x.filter((i) => types.includes(i.type)))).catch(() => {}); }, 250);
    return () => clearTimeout(t);
  }, [q, types]);
  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md bg-brand-50 px-3 py-2 text-sm ring-1 ring-brand-200">
        <span><span className="text-xs text-muted">{TYPE_LABEL[value.type]} · </span><strong>{value.label}</strong>{value.zone ? ` — ${value.zone}` : ""}</span>
        <button type="button" onClick={() => onPick(null)} className="text-xs font-semibold text-brand-800 hover:underline">Changer</button>
      </div>
    );
  }
  return (
    <div className="relative">
      <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom du bien ou commune (2 lettres minimum)…" />
      {items.length ? (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-slate-200">
          {items.map((t) => (
            <li key={`${t.type}:${t.id}`}>
              <button type="button" onClick={() => { onPick(t); setQ(""); setItems([]); }} className="block w-full px-3 py-2 text-left hover:bg-slate-50">
                <span className="text-xs text-muted">{TYPE_LABEL[t.type]} · </span>{t.label}{t.zone ? <span className="text-muted"> — {t.zone}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string, after?: () => void) => start(async () => {
    setMsg(null);
    const r = await fn();
    setMsg(r.ok ? { ok: true, text: ok } : { ok: false, text: r.error ?? "Action impossible." });
    if (r.ok) { after?.(); router.refresh(); }
  });
  return { pending, msg, run };
}
const Msg = ({ m }: { m: { ok: boolean; text: string } | null }) => (m ? <p className={"text-sm " + (m.ok ? "text-emerald-700" : "text-red-700")}>{m.text}</p> : null);

/** Aperçu des messages qu'affiche une fiche, en direct. */
export function SignalPreview() {
  const [t, setT] = useState<Target | null>(null);
  const [items, setItems] = useState<ConversionSignal[] | null>(null);
  useEffect(() => { setItems(null); if (t) previewAction(t.type, t.id).then(setItems).catch(() => setItems([])); }, [t]);
  return (
    <div className="space-y-3">
      <TargetPicker types={["residence", "espace", "listing"]} value={t} onPick={setT} />
      {t && items ? (items.length ? (
        <ul className="space-y-2">{items.map((s) => <li key={s.key} className={"rounded-md px-3 py-2 text-sm font-semibold " + (TONE[s.tone] ?? "")}>{s.icon} {s.text}</li>)}</ul>
      ) : <p className="text-sm text-muted">Aucun message pour l’instant : les seuils ne sont pas atteints (rien n’est affiché sans données réelles).</p>) : null}
    </div>
  );
}

/** Déclarer une réservation confirmée au téléphone avec le propriétaire. */
export function DeclareBookingForm() {
  const { pending, msg, run } = useRun();
  const [t, setT] = useState<Target | null>(null);
  const [unit, setUnit] = useState("");
  const [f, setF] = useState({ checkIn: "", checkOut: "", guests: "", note: "", ownerConfirmed: false });
  useEffect(() => { setUnit(t?.units?.[0]?.id ?? ""); }, [t]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!t) return;
    run(() => declareBookingAction({
      ...(t.type === "espace" ? { espaceId: t.id } : { apartmentId: unit }),
      checkIn: f.checkIn, checkOut: f.checkOut || undefined, guests: f.guests ? Number(f.guests) : undefined, note: f.note, ownerConfirmed: f.ownerConfirmed,
    }), "Réservation déclarée : les dates sont bloquées sur le site et dans l’application du propriétaire.", () => { setF({ checkIn: "", checkOut: "", guests: "", note: "", ownerConfirmed: false }); setT(null); });
  };
  return (
    <form onSubmit={submit} className="w-full max-w-2xl space-y-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="font-semibold text-ink">Déclarer une réservation</p>
      <p className="text-xs text-muted">Pour une réservation réelle, confirmée par le propriétaire (au téléphone, sur WhatsApp…) mais qu’il n’a pas saisie dans Moboo Resi ou Moboo Event.</p>
      <TargetPicker types={["residence", "espace"]} value={t} onPick={setT} />
      {t?.type === "residence" ? (
        <label className="block text-sm font-semibold">Logement
          <select className="input mt-1" value={unit} onChange={(e) => setUnit(e.target.value)} required>
            {(t.units ?? []).map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </label>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-semibold">{t?.type === "espace" ? "Premier jour" : "Arrivée"}<input className="input mt-1" type="date" required value={f.checkIn} onChange={(e) => setF({ ...f, checkIn: e.target.value })} /></label>
        <label className="block text-sm font-semibold">{t?.type === "espace" ? "Lendemain du dernier jour" : "Départ"}<input className="input mt-1" type="date" required={t?.type !== "espace"} value={f.checkOut} onChange={(e) => setF({ ...f, checkOut: e.target.value })} /></label>
      </div>
      {t?.type === "espace" ? <p className="-mt-2 text-xs text-muted">Un seul jour : laissez la 2ᵉ date vide.</p> : null}
      <div className="grid grid-cols-[8rem_1fr] gap-3">
        <label className="block text-sm font-semibold">{t?.type === "espace" ? "Invités" : "Voyageurs"}<input className="input mt-1" type="number" min={1} value={f.guests} onChange={(e) => setF({ ...f, guests: e.target.value })} /></label>
        <label className="block text-sm font-semibold">Note interne<input className="input mt-1" maxLength={300} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Confirmé au téléphone avec M. Kouassi le 4 oct." /></label>
      </div>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={f.ownerConfirmed} onChange={(e) => setF({ ...f, ownerConfirmed: e.target.checked })} />
        <span><strong>Confirmée avec le propriétaire.</strong> Je certifie que cette réservation est réelle. Elle est enregistrée à mon nom dans le journal d’activité.</span></label>
      <button disabled={pending || !t || !f.ownerConfirmed} className="w-full rounded-md bg-brand-700 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">Déclarer la réservation</button>
      <Msg m={msg} />
    </form>
  );
}

export function CancelDeclared({ id }: { id: string }) {
  const { pending, msg, run } = useRun();
  return (
    <span>
      <button type="button" disabled={pending} onClick={() => confirm("Annuler cette réservation ? Les dates seront libérées.") && run(() => cancelDeclaredAction(id), "Annulée.")} className="text-xs font-semibold text-red-700 hover:underline">Annuler</button>
      {msg && !msg.ok ? <Msg m={msg} /> : null}
    </span>
  );
}

/** Nouvelle promotion (offre réelle, accordée par l'hôte, avec date de fin). */
export function PromotionForm() {
  const { pending, msg, run } = useRun();
  const [t, setT] = useState<Target | null>(null);
  const [f, setF] = useState({ title: "Offre de lancement", discountPct: "", conditions: "", endsAt: "" });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!t) return;
    run(() => savePromotionAction(null, { targetType: t.type, targetId: t.id, title: f.title, discountPct: f.discountPct ? Number(f.discountPct) : null, conditions: f.conditions, endsAt: f.endsAt ? new Date(`${f.endsAt}T23:59:00`).toISOString() : "" }),
      "Promotion en ligne.", () => { setT(null); setF({ title: "Offre de lancement", discountPct: "", conditions: "", endsAt: "" }); });
  };
  return (
    <form onSubmit={submit} className="w-full max-w-2xl space-y-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="font-semibold text-ink">Nouvelle promotion</p>
      <TargetPicker types={["residence", "espace", "listing"]} value={t} onPick={setT} />
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <label className="block text-sm font-semibold">Titre<input className="input mt-1" required maxLength={60} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} list="promo-titles" /></label>
        <label className="block text-sm font-semibold">Réduction %<input className="input mt-1" type="number" min={1} max={90} value={f.discountPct} onChange={(e) => setF({ ...f, discountPct: e.target.value })} /></label>
      </div>
      <datalist id="promo-titles"><option value="Offre de lancement" /><option value="Réservation anticipée" /><option value="Dernière minute" /><option value="Long séjour" /><option value="Offre week-end" /></datalist>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-semibold">Conditions<input className="input mt-1" maxLength={120} value={f.conditions} onChange={(e) => setF({ ...f, conditions: e.target.value })} placeholder="dès 7 nuits" /></label>
        <label className="block text-sm font-semibold">Fin de l’offre<input className="input mt-1" type="date" required value={f.endsAt} onChange={(e) => setF({ ...f, endsAt: e.target.value })} /></label>
      </div>
      <p className="text-xs text-muted">À créer avec l’accord de l’hôte : la réduction doit être réellement appliquée. Affichée avec un compte à rebours jusqu’à la fin.</p>
      <button disabled={pending || !t} className="w-full rounded-md bg-brand-700 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">Publier la promotion</button>
      <Msg m={msg} />
    </form>
  );
}

export function PromotionRowActions({ id, active }: { id: string; active: boolean }) {
  const { pending, run } = useRun();
  return (
    <span className="flex gap-3">
      <button type="button" disabled={pending} onClick={() => run(() => savePromotionAction(id, { active: !active }), active ? "Suspendue." : "Réactivée.")} className="text-xs font-semibold text-brand-800 hover:underline">{active ? "Suspendre" : "Réactiver"}</button>
      <button type="button" disabled={pending} onClick={() => confirm("Supprimer cette promotion ?") && run(() => removePromotionAction(id), "Supprimée.")} className="text-xs font-semibold text-red-700 hover:underline">Supprimer</button>
    </span>
  );
}
