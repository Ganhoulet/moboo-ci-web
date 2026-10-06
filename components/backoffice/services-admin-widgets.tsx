"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCredits, analyze, deleteAlerte, deleteGridRow, getWallets, importGridCsv, saveGridRow, setCard, supportReply, supportStatus, supportTicket } from "@/app/admin/services/actions";
import { WALLET_LABEL } from "@/lib/moboo-services";

const input = "rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-600 focus:outline-none";
const btn = "rounded-md bg-brand-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60";
const btn2 = "rounded-md bg-slate-100 px-3 py-1.5 text-sm font-semibold text-ink hover:bg-slate-200 disabled:opacity-60";

/** Crédits et portefeuilles d'un compte (geste commercial, correction). */
export function CreditsTool() {
  const [ref, setRef] = useState("");
  const [kind, setKind] = useState("alerte_send");
  const [amount, setAmount] = useState(1);
  const [wallets, setWallets] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const look = () => start(async () => { const r = await getWallets(ref); setWallets(r.ok ? r.data : null); setMsg(r.ok ? null : r.error ?? "Compte introuvable."); });
  const give = () => start(async () => {
    const r = await addCredits(ref, kind, kind === "alerte_agent" ? 0 : amount, kind === "alerte_agent" ? amount : undefined);
    setMsg(r.ok ? "Crédit enregistré." : r.error ?? "Erreur");
    if (r.ok) { const w = await getWallets(ref); if (w.ok) setWallets(w.data); }
  });
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h2 className="font-display text-base font-bold text-ink">Crédits d’un compte</h2>
      <p className="text-xs text-muted">Numéro de téléphone ou identifiant du compte. Un montant négatif retire des crédits.</p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <input className={input + " w-56"} placeholder="+225 07 00 00 00 01" value={ref} onChange={(e) => setRef(e.target.value)} />
        <button type="button" className={btn2} disabled={pending || !ref.trim()} onClick={look}>Voir les soldes</button>
        <select className={input} value={kind} onChange={(e) => setKind(e.target.value)}>
          {Object.entries(WALLET_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <input type="number" className={input + " w-28"} value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
        <button type="button" className={btn} disabled={pending || !ref.trim() || !amount} onClick={give}>{kind === "alerte_agent" ? "Ajouter les jours" : "Ajouter"}</button>
      </div>
      {msg ? <p className="mt-2 text-sm text-ink">{msg}</p> : null}
      {wallets ? (
        <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm">
          <p className="font-semibold text-ink">{wallets.account?.name} · {wallets.account?.phone}</p>
          <ul className="mt-1 grid gap-1 sm:grid-cols-2">
            {Object.keys(WALLET_LABEL).map((k) => (
              <li key={k}>{WALLET_LABEL[k]} : <strong>{k === "alerte_agent" ? (wallets[k]?.until ? `jusqu’au ${new Date(wallets[k].until).toLocaleDateString("fr-FR")}` : "aucun") : wallets[k]?.balance ?? 0}</strong></li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function DeleteAlerteButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button type="button" disabled={pending} className="text-xs font-semibold text-red-600 hover:underline" onClick={() => {
      if (!confirm("Supprimer cette alerte ?")) return;
      start(async () => { await deleteAlerte(id); router.refresh(); });
    }}>Supprimer</button>
  );
}

const STATUS_LABEL: Record<string, string> = { ouvert: "Ouvert", repondu: "Répondu", ferme: "Fermé" };

/** Console du support : fil de discussion, réponse, statut. */
export function SupportConsole({ ticketId }: { ticketId: string }) {
  const [d, setD] = useState<any>(null);
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { start(async () => { const r = await supportTicket(ticketId); if (r.ok) setD(r.data); else setErr(r.error ?? "Ticket introuvable."); }); }, [ticketId]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [d]);
  if (err) return <p className="text-sm text-red-600">{err}</p>;
  if (!d) return <p className="text-sm text-muted">Chargement…</p>;
  const send = () => start(async () => {
    const r = await supportReply(ticketId, text);
    if (r.ok) { setD(r.data); setText(""); router.refresh(); } else setErr(r.error ?? "Erreur");
  });
  const status = (s: string) => start(async () => { await supportStatus(ticketId, s); setD({ ...d, ticket: { ...d.ticket, status: s } }); router.refresh(); });
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 pb-3">
        <h2 className="font-display text-lg font-bold text-ink">#{d.ticket.id} · {d.ticket.subject}</h2>
        <p className="text-xs text-muted">
          {d.user?.name ?? "Compte supprimé"} · {d.user?.phone ?? ""} {d.user?.email ? `· ${d.user.email}` : ""} · {d.ticket.app === "moboo_pro" ? "Moboo Pro" : d.ticket.app === "moboo_ci" ? "Moboo.ci" : d.ticket.app} · {d.ticket.role} · forfait {d.ticket.plan} · {d.ticket.channel === "chat" ? "chat" : "demande par e-mail"}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {Object.entries(STATUS_LABEL).map(([k, l]) => (
            <button key={k} type="button" disabled={pending} onClick={() => status(k)} className={"rounded-full px-3 py-0.5 text-xs font-semibold " + (d.ticket.status === k ? "bg-ink text-white" : "bg-slate-100 text-ink hover:bg-slate-200")}>{l}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto py-3" style={{ maxHeight: 460 }}>
        {d.messages.map((m: any) => (
          <div key={m.id} className={"max-w-[85%] rounded-xl px-3 py-2 text-sm " + (m.from_staff ? "ml-auto bg-brand-700 text-white" : "bg-slate-100 text-ink")}>
            <p className="whitespace-pre-wrap">{m.body}</p>
            {m.attachment ? (/\.(jpe?g|png|gif|webp)$/i.test(m.attachment)
              ? <a href={m.attachment} target="_blank" rel="noreferrer"><img src={m.attachment} alt="Pièce jointe" className="mt-2 max-h-48 rounded-lg" /></a>
              : <a href={m.attachment} target="_blank" rel="noreferrer" className="mt-1 block underline">📎 Pièce jointe</a>) : null}
            <p className={"mt-1 text-[10px] " + (m.from_staff ? "text-white/70" : "text-muted")}>{m.from_staff ? "Support" : "Client"} · {m.created_at}</p>
          </div>
        ))}
        <div ref={end} />
      </div>
      <div className="border-t border-slate-200 pt-3">
        <textarea className={input + " w-full"} rows={3} placeholder="Votre réponse (le client est prévenu par notification et e-mail)…" value={text} onChange={(e) => setText(e.target.value)} />
        <button type="button" className={btn + " mt-2"} disabled={pending || !text.trim()} onClick={send}>{pending ? "Envoi…" : "Répondre"}</button>
      </div>
    </div>
  );
}

/** Grilles DGI / marché : ajout, modification, suppression d'une ligne. */
export function GridRowEditor({ kind, row }: { kind: "dgi" | "marche"; row?: any }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<any>(row ?? { ville: "Abidjan", commune: "", zone: "", usage: "residentiel", priceSqm: 0, priceMin: 0, priceMax: 0, source: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!open) return <button type="button" className={row ? "text-xs font-semibold text-brand-700 hover:underline" : btn} onClick={() => setOpen(true)}>{row ? "Modifier" : "+ Ajouter une zone"}</button>;
  const f = (k: string, num = false) => (
    <input className={input + (num ? " w-28" : " w-36")} type={num ? "number" : "text"} value={v[k] ?? ""} placeholder={k} onChange={(e) => setV({ ...v, [k]: num ? Number(e.target.value) || 0 : e.target.value })} />
  );
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md bg-slate-50 p-2">
      {f("ville")}{f("commune")}{f("zone")}
      <select className={input} value={v.usage} onChange={(e) => setV({ ...v, usage: e.target.value })}><option value="residentiel">Résidentiel</option><option value="commercial">Commercial</option><option value="agricole">Agricole</option></select>
      {f("priceSqm", true)}{kind === "marche" ? <>{f("priceMin", true)}{f("priceMax", true)}</> : null}{f("source")}
      <button type="button" className={btn} disabled={pending} onClick={() => start(async () => { const r = await saveGridRow(kind, v); setMsg(r.ok ? null : r.error ?? "Erreur"); if (r.ok) { setOpen(false); router.refresh(); } })}>Enregistrer</button>
      {row ? <button type="button" className="text-xs font-semibold text-red-600 hover:underline" disabled={pending} onClick={() => { if (confirm("Supprimer cette zone ?")) start(async () => { await deleteGridRow(row.id); router.refresh(); }); }}>Supprimer</button> : null}
      <button type="button" className={btn2} onClick={() => setOpen(false)}>Annuler</button>
      {msg ? <span className="text-sm text-red-600">{msg}</span> : null}
    </div>
  );
}

/** Import CSV d'une grille (fichier lu dans le navigateur, envoyé en texte). */
export function GridImport({ kind, hint }: { kind: "dgi" | "marche" | "loyer"; hint: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="text-sm">
      <label className={btn2 + " inline-block cursor-pointer"}>
        {pending ? "Import…" : "Importer un CSV"}
        <input type="file" accept=".csv,text/csv" className="hidden" onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const csv = await file.text();
          start(async () => { const r = await importGridCsv(kind, csv); setMsg(r.ok ? r.data?.message ?? "Import terminé." : r.error ?? "Erreur"); router.refresh(); });
          e.target.value = "";
        }} />
      </label>
      <span className="ml-2 text-xs text-muted">{hint}</span>
      {msg ? <p className="mt-1 text-sm text-ink">{msg}</p> : null}
    </div>
  );
}

const ANALYZE_LABEL = { foncier: "Analyser les terrains (prix du marché)", loyer: "Analyser les locations (grille des loyers)", trend: "Recalculer la tendance des loyers" } as const;

export function AnalyzeButtons() {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const run = (w: keyof typeof ANALYZE_LABEL) => start(async () => {
    const r = await analyze(w);
    const d: any = r.data ?? {};
    setMsg(!r.ok ? r.error ?? "Erreur"
      : w === "foncier" ? `${d.scanned} annonce(s) de terrain, ${d.used} retenue(s), ${d.rejected} écartée(s) ; ${d.zones_updated} zone(s) recalculée(s), ${d.zones_skipped} sans assez d’annonces.`
      : w === "loyer" ? `${d.rental} location(s) retenue(s) ; ${d.zones} combinaison(s) zone/type/pièces recalculée(s).`
      : `${d.rental} location(s) ; ${d.points} point(s) de tendance.`);
    router.refresh();
  });
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(ANALYZE_LABEL) as (keyof typeof ANALYZE_LABEL)[]).map((w) => <button key={w} type="button" className={btn2} disabled={pending} onClick={() => run(w)}>{ANALYZE_LABEL[w]}</button>)}
      </div>
      {pending ? <p className="mt-2 text-sm text-muted">Analyse en cours…</p> : msg ? <p className="mt-2 text-sm text-ink">{msg}</p> : null}
    </div>
  );
}

export function CardActions({ accountId, expiresAt }: { accountId: string; expiresAt: string | null }) {
  const [date, setDate] = useState(expiresAt ?? "");
  const [pending, start] = useTransition();
  const router = useRouter();
  const go = (body: { action?: string; expiresAt?: string }) => start(async () => { await setCard(accountId, body); router.refresh(); });
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="text-xs font-semibold text-brand-700 hover:underline" disabled={pending} onClick={() => go({ action: "renew" })}>Prolonger</button>
      <input type="date" className={input + " py-0.5 text-xs"} value={date} onChange={(e) => setDate(e.target.value)} />
      <button type="button" className="text-xs font-semibold text-brand-700 hover:underline" disabled={pending || !date} onClick={() => go({ expiresAt: date })}>Fixer</button>
      <button type="button" className="text-xs font-semibold text-red-600 hover:underline" disabled={pending} onClick={() => { if (confirm("Réinitialiser la carte (réactivée à la prochaine ouverture) ?")) go({ action: "reset" }); }}>Réinitialiser</button>
    </div>
  );
}
