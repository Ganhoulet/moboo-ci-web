"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fileToDataUri } from "@/lib/file-data-uri";
import { cancelBookingAction, openDisputeAction, replyDisputeAction, withdrawDisputeAction } from "@/app/mon-espace/reservations/actions";

/** Annuler sa demande (tant que l'hôte n'a pas répondu). */
export function CancelBookingButton({ bookingKey }: { bookingKey: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <div>
      <button type="button" disabled={pending}
        onClick={() => window.confirm("Annuler cette demande de réservation ? L’hôte sera prévenu.") && start(async () => {
          const r = await cancelBookingAction(bookingKey);
          if (!r.ok) setErr(r.error); else router.refresh();
        })}
        className="rounded-full px-4 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50">
        {pending ? "Annulation…" : "Annuler ma demande"}
      </button>
      {err ? <p className="mt-1 text-sm text-red-600">{err}</p> : null}
    </div>
  );
}

function FilePicker({ files, setFiles }: { files: File[]; setFiles: (f: File[]) => void }) {
  return (
    <label className="block text-sm font-semibold text-ink">Photos ou justificatifs (4 maximum)
      <input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf"
        className="mt-1 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:font-semibold file:text-brand-800"
        onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 4))} />
      {files.length ? <span className="mt-0.5 block text-xs font-normal text-muted">{files.map((f) => f.name).join(", ")}</span> : null}
    </label>
  );
}

/** Formulaire « Signaler un problème » (ouvre un litige). */
export function DisputeForm({ bookingKey, categories, outcomes, intro }: {
  bookingKey: string; categories: { key: string; label: string }[]; outcomes: Record<string, string>; intro: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [outcome, setOutcome] = useState("refund_partial");
  const [amount, setAmount] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50">
        ⚠ Signaler un problème
      </button>
    );
  }
  return (
    <form className="space-y-4 rounded-2xl bg-white p-5 shadow-card"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setErr(null);
          try {
            const r = await openDisputeAction(bookingKey, {
              category, description, desiredOutcome: outcome, amountClaimed: amount ? Number(amount) : undefined,
              files: await Promise.all(files.map((f) => fileToDataUri(f))),
            });
            if (!r.ok) setErr(r.error); else router.push(`/mon-espace/reservations/litige/${r.data.id}`);
          } catch (x: any) { setErr(x?.message || "Fichier illisible."); }
        });
      }}>
      <div>
        <h2 className="font-display text-lg font-bold text-ink">Signaler un problème</h2>
        {intro ? <p className="mt-1 text-sm text-muted">{intro}</p> : null}
      </div>
      <label className="block text-sm font-semibold text-ink">Quel est le problème ? *
        <select className="input mt-1" value={category} onChange={(e) => setCategory(e.target.value)} required>
          <option value="">Choisir…</option>
          {categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </label>
      <label className="block text-sm font-semibold text-ink">Décrivez ce qui s’est passé *
        <textarea className="input mt-1" rows={5} minLength={20} maxLength={4000} required value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Dates, ce qui ne correspondait pas, vos échanges avec l’hôte…" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-ink">Ce que vous demandez
          <select className="input mt-1" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
            {Object.entries(outcomes).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
        {outcome === "refund_partial" || outcome === "refund_full" ? (
          <label className="block text-sm font-semibold text-ink">Montant demandé (FCFA){outcome === "refund_partial" ? " *" : ""}
            <input type="number" min={1} step={500} className="input mt-1" value={amount} onChange={(e) => setAmount(e.target.value)} required={outcome === "refund_partial"} />
          </label>
        ) : null}
      </div>
      <FilePicker files={files} setFiles={setFiles} />
      {err ? <p className="text-sm font-medium text-red-600">{err}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button disabled={pending} className="btn-primary bg-brand-800 hover:bg-brand-900 disabled:opacity-60">{pending ? "Envoi…" : "Envoyer à l’équipe Moboo"}</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:underline">Annuler</button>
      </div>
    </form>
  );
}

/** Réponse du client dans un litige ouvert, et retrait du litige. */
export function DisputeReply({ id, waiting }: { id: string; waiting: boolean }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-3">
      <form className={"space-y-3 rounded-2xl bg-white p-5 shadow-card " + (waiting ? "ring-2 ring-amber-300" : "")}
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            setErr(null);
            try {
              const r = await replyDisputeAction(id, { body, files: await Promise.all(files.map((f) => fileToDataUri(f))) });
              if (!r.ok) setErr(r.error); else { setBody(""); setFiles([]); router.refresh(); }
            } catch (x: any) { setErr(x?.message || "Fichier illisible."); }
          });
        }}>
        <label className="block text-sm font-semibold text-ink">{waiting ? "L’équipe attend votre réponse" : "Ajouter un message"}
          <textarea className="input mt-1" rows={3} maxLength={4000} required value={body} onChange={(e) => setBody(e.target.value)} />
        </label>
        <FilePicker files={files} setFiles={setFiles} />
        {err ? <p className="text-sm font-medium text-red-600">{err}</p> : null}
        <button disabled={pending || !body.trim()} className="btn-primary bg-brand-800 hover:bg-brand-900 disabled:opacity-60">{pending ? "Envoi…" : "Envoyer"}</button>
      </form>
      <button type="button" disabled={pending} className="text-sm font-semibold text-slate-500 hover:underline"
        onClick={() => window.confirm("Retirer ce litige ? Le problème sera considéré comme réglé.") && start(async () => {
          const r = await withdrawDisputeAction(id);
          if (!r.ok) setErr(r.error); else router.refresh();
        })}>
        Le problème est réglé : retirer mon litige
      </button>
    </div>
  );
}
