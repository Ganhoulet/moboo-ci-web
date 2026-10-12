"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api";

const input = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none";
const label = "block text-sm font-semibold text-ink";
const TYPES = [["villa", "🏡", "Villa"], ["appartement", "🏢", "Appartement"], ["bureau", "🏛", "Bureau"], ["commerce", "🏪", "Commerce"], ["terrain", "🌿", "Terrain"], ["entrepot", "🏭", "Entrepôt"], ["autre", "🏘", "Autre"]];
const MANDATS = [["gestion_locative", "🏠", "Gestion locative"], ["location_simple", "🔑", "Location simple"], ["vente", "💰", "Vente"], ["vente_et_location", "🔄", "Vente & Location"]];
const MAX_FILE = 5 * 1024 * 1024;

function Choices({ name, items, defaultValue }: { name: string; items: string[][]; defaultValue: string }) {
  return (
    <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map(([v, icon, l]) => (
        <label key={v} className="cursor-pointer">
          <input type="radio" name={name} value={v} defaultChecked={v === defaultValue} className="peer sr-only" />
          <span className="flex flex-col items-center rounded-lg border border-slate-300 px-2 py-2 text-center text-xs font-semibold text-slate-700 peer-checked:border-brand-700 peer-checked:bg-brand-50 peer-checked:text-brand-800 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-700">
            <span className="text-lg" aria-hidden="true">{icon}</span>{l}
          </span>
        </label>
      ))}
    </div>
  );
}

/** Formulaire public « Confier mon bien » d'un conseiller (ancienne page WordPress /confier-mon-bien/). */
export function MandatForm({ token, agentName }: { token: string; agentName: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const files = fd.getAll("fichiers").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length > 8) return setError("8 fichiers au maximum.");
    if (files.some((f) => f.size > MAX_FILE)) return setError("Chaque fichier doit faire moins de 5 Mo.");
    fd.delete("fichiers");
    files.forEach((f) => fd.append("fichiers", f));
    fd.set("token", token);
    setState("sending");
    try {
      const r = await fetch(`${API_URL}/pro-public/capture/mandat`, { method: "POST", body: fd });
      if (r.ok) return setState("done");
      const j = await r.json().catch(() => null);
      setError(j?.error?.message ?? j?.message ?? "Envoi impossible, réessayez.");
    } catch {
      setError("Erreur réseau, réessayez.");
    }
    setState("idle");
  }

  if (state === "done") {
    return (
      <div className="py-6 text-center" role="status">
        <p className="text-4xl" aria-hidden="true">✅</p>
        <h1 className="mt-2 font-display text-xl font-extrabold text-ink">Demande envoyée avec succès !</h1>
        <p className="mt-1 text-sm text-slate-600">Votre conseiller <strong>{agentName}</strong> va prendre contact avec vous très prochainement. Vous pouvez fermer cette page.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Confiez votre bien</h1>
        <p className="text-sm text-muted">Remplissez ce formulaire en 2 minutes. Votre conseiller vous recontactera pour convenir d’une visite et signer le mandat.</p>
      </div>
      <h2 className="text-sm font-bold uppercase tracking-wide text-brand-800">📋 Vos coordonnées</h2>
      <label className={label}>Votre nom complet *<input name="proprietaire_nom" required className={input} placeholder="Jean Kouamé" /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>Téléphone<input name="proprietaire_tel" type="tel" inputMode="tel" className={input} placeholder="+225 07 00 00 00" /></label>
        <label className={label}>E-mail<input name="proprietaire_email" type="email" className={input} /></label>
      </div>
      <h2 className="text-sm font-bold uppercase tracking-wide text-brand-800">🏠 Informations sur le bien</h2>
      <fieldset><legend className={label}>Type de bien</legend><Choices name="bien_type" items={TYPES} defaultValue="villa" /></fieldset>
      <label className={label}>Adresse complète du bien<textarea name="bien_adresse" rows={2} className={input} /></label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className={label}>Surface (m²)<input name="bien_surface" type="number" inputMode="numeric" className={input} /></label>
        <label className={label}>Nombre de pièces<input name="bien_nb_pieces" type="number" inputMode="numeric" className={input} /></label>
        <label className={label}>Valeur estimée (FCFA)<input name="bien_valeur" inputMode="numeric" className={input} /></label>
      </div>
      <h2 className="text-sm font-bold uppercase tracking-wide text-brand-800">📝 Type de mandat souhaité</h2>
      <Choices name="type_mandat" items={MANDATS} defaultValue="gestion_locative" />
      <label className={label}>Description / informations complémentaires<textarea name="description" rows={3} className={input} /></label>
      <label className={label}>Photos et titre de propriété (8 fichiers, 5 Mo chacun)
        <input name="fichiers" type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" className="mt-1 block w-full text-sm" />
      </label>
      {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
      <button type="submit" disabled={state === "sending"} className="w-full rounded-lg bg-brand-800 px-4 py-3 font-semibold text-white disabled:opacity-60">{state === "sending" ? "Envoi…" : "Envoyer à mon conseiller"}</button>
    </form>
  );
}
