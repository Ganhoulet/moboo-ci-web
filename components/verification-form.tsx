"use client";

import { useState, useTransition } from "react";
import { submitVerificationAction } from "@/app/mon-espace/actions";
import { fileToDataUri as toDataUri } from "@/lib/file-data-uri";

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Demande de vérification.
 * - identity : pièce (recto/verso), numéro, date d'expiration et selfie en tenant la pièce ;
 * - business : registre du commerce / agrément, raison sociale et numéro.
 */
export function VerificationForm({ level, docTypes, defaultName, defaultCompany = "", requireSelfie = true, requireDocNumber = true }: {
  level: "identity" | "business"; docTypes: string[]; defaultName: string; defaultCompany?: string; requireSelfie?: boolean; requireDocNumber?: boolean;
}) {
  const biz = level === "business";
  const [docType, setDocType] = useState(docTypes[0] ?? "");
  const [fullName, setFullName] = useState(defaultName);
  const [businessName, setBusinessName] = useState(defaultCompany);
  const [docNumber, setDocNumber] = useState("");
  const [docExpiry, setDocExpiry] = useState("");
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  if (done) return <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">Demande envoyée : nous l’examinons et vous prévenons par e-mail.</p>;

  const numberRequired = biz || requireDocNumber;
  const file = (label: string, f: File | null, setF: (f: File | null) => void, required: boolean, opts: { selfie?: boolean } = {}) => (
    <label className="block text-sm font-semibold text-ink">{label}{required ? " *" : ""}
      <input type="file" required={required}
        accept={opts.selfie ? "image/*" : "image/jpeg,image/png,image/webp,application/pdf"}
        {...(opts.selfie ? { capture: "user" as const } : {})}
        className="mt-1 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:font-semibold file:text-brand-800"
        onChange={(e) => setF(e.target.files?.[0] ?? null)} />
      {f ? <span className="mt-0.5 block text-xs font-normal text-muted">{f.name}</span> : null}
    </label>
  );

  return (
    <form className="space-y-4 rounded-2xl bg-white p-5 shadow-card"
      onSubmit={(e) => {
        e.preventDefault();
        if (!front) { setErr(biz ? "Ajoutez le document." : "Ajoutez la pièce (recto)."); return; }
        if (!biz && requireSelfie && !selfie) { setErr("Ajoutez un selfie en tenant votre pièce."); return; }
        start(async () => {
          setErr(null);
          try {
            const r = await submitVerificationAction({
              level, docType, fullName, docNumber: docNumber || undefined, docExpiry: docExpiry || undefined,
              businessName: biz ? businessName : undefined,
              front: await toDataUri(front), back: back ? await toDataUri(back) : undefined,
              selfie: !biz && selfie ? await toDataUri(selfie) : undefined, note: note || undefined,
            });
            if (r.ok) setDone(true); else setErr(r.error ?? "Envoi impossible.");
          } catch (x: any) { setErr(x?.message || "Fichier illisible."); }
        });
      }}>
      <label className="block text-sm font-semibold text-ink">{biz ? "Type de document *" : "Type de pièce *"}
        <select className="input mt-1" value={docType} onChange={(e) => setDocType(e.target.value)}>{docTypes.map((d) => <option key={d}>{d}</option>)}</select>
      </label>
      {biz ? (
        <label className="block text-sm font-semibold text-ink">Raison sociale (telle qu’elle figure sur le document) *
          <input className="input mt-1" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required minLength={2} maxLength={160} />
        </label>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-ink">{biz ? "Nom du responsable *" : "Nom complet (tel qu’il figure sur la pièce) *"}
          <input className="input mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={3} maxLength={120} />
        </label>
        <label className="block text-sm font-semibold text-ink">{biz ? "Numéro (RCCM, agrément…)" : "Numéro de la pièce"}{numberRequired ? " *" : ""}
          <input className="input mt-1" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} required={numberRequired} maxLength={60} placeholder={biz ? "CI-ABJ-2024-B-12345" : "CI002345678"} />
        </label>
        {!biz ? (
          <label className="block text-sm font-semibold text-ink">Date d’expiration{requireDocNumber ? " *" : ""}
            <input type="date" className="input mt-1" value={docExpiry} min={today()} onChange={(e) => setDocExpiry(e.target.value)} required={requireDocNumber} />
          </label>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {file(biz ? "Document" : "Pièce — recto", front, setFront, true)}
        {file(biz ? "Page suivante (facultatif)" : "Pièce — verso", back, setBack, false)}
      </div>
      {!biz ? (
        <div className="rounded-xl bg-slate-50 p-4">
          {file("Selfie en tenant votre pièce", selfie, setSelfie, requireSelfie, { selfie: true })}
          <p className="mt-2 text-xs text-muted">Sur téléphone, l’appareil photo s’ouvre directement. Tenez la pièce à côté de votre visage, photo de la pièce visible, sans lunettes de soleil ni casquette.</p>
        </div>
      ) : null}
      <label className="block text-sm font-semibold text-ink">Message (facultatif)
        <textarea className="input mt-1" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
      </label>
      <p className="text-xs text-muted">Photo nette ou PDF. Vos documents restent privés : seuls les administrateurs de Moboo les consultent, via un lien temporaire. Ils ne sont jamais publiés.</p>
      {err ? <p className="text-sm font-medium text-red-600">{err}</p> : null}
      <button disabled={pending} className="btn-primary bg-brand-800 hover:bg-brand-900 disabled:opacity-60">{pending ? "Envoi…" : "Envoyer ma demande"}</button>
    </form>
  );
}
