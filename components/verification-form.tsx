"use client";

import { useState, useTransition } from "react";
import { submitVerificationAction } from "@/app/mon-espace/actions";

/** Fichier → data URI (images réduites à 1600 px ; PDF tel quel, 5 Mo max). */
async function toDataUri(file: File): Promise<string> {
  if (file.type === "application/pdf") {
    if (file.size > 5 * 1024 * 1024) throw new Error("PDF trop lourd (5 Mo maximum).");
    return await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(file); });
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  } finally { URL.revokeObjectURL(url); }
}

export function VerificationForm({ docTypes, defaultName }: { docTypes: string[]; defaultName: string }) {
  const [docType, setDocType] = useState(docTypes[0] ?? "");
  const [fullName, setFullName] = useState(defaultName);
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  if (done) return <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">Demande envoyée : nous l’examinons et vous prévenons par e-mail.</p>;
  const file = (label: string, f: File | null, setF: (f: File | null) => void, required: boolean) => (
    <label className="block text-sm font-semibold text-ink">{label}{required ? " *" : ""}
      <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required={required}
        className="mt-1 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:font-semibold file:text-brand-800"
        onChange={(e) => setF(e.target.files?.[0] ?? null)} />
      {f ? <span className="mt-0.5 block text-xs font-normal text-muted">{f.name}</span> : null}
    </label>
  );
  return (
    <form className="space-y-4 rounded-2xl bg-white p-5 shadow-card"
      onSubmit={(e) => {
        e.preventDefault();
        if (!front) { setErr("Ajoutez la pièce (recto)."); return; }
        start(async () => {
          setErr(null);
          try {
            const r = await submitVerificationAction({ docType, fullName, front: await toDataUri(front), back: back ? await toDataUri(back) : undefined, note: note || undefined });
            if (r.ok) setDone(true); else setErr(r.error ?? "Envoi impossible.");
          } catch (x: any) { setErr(x?.message || "Fichier illisible."); }
        });
      }}>
      <label className="block text-sm font-semibold text-ink">Type de pièce *
        <select className="input mt-1" value={docType} onChange={(e) => setDocType(e.target.value)}>{docTypes.map((d) => <option key={d}>{d}</option>)}</select>
      </label>
      <label className="block text-sm font-semibold text-ink">Nom complet (tel qu’il figure sur la pièce) *
        <input className="input mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={3} maxLength={120} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        {file("Pièce — recto", front, setFront, true)}
        {file("Pièce — verso (facultatif)", back, setBack, false)}
      </div>
      <label className="block text-sm font-semibold text-ink">Message (facultatif)
        <textarea className="input mt-1" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
      </label>
      <p className="text-xs text-muted">Photo nette ou PDF. Vos documents restent privés : seuls les administrateurs de Moboo les consultent, via un lien temporaire.</p>
      {err ? <p className="text-sm font-medium text-red-600">{err}</p> : null}
      <button disabled={pending} className="btn-primary bg-brand-800 hover:bg-brand-900 disabled:opacity-60">{pending ? "Envoi…" : "Envoyer ma demande"}</button>
    </form>
  );
}
