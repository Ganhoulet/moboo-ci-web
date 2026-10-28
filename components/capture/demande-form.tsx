"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api";
import { SiteIcon } from "@/components/site-icon";

export type Objectif = "demande" | "estimation" | "alerte" | "rdv" | "interet";
const TEXTS: Record<Objectif, [string, string, string]> = {
  demande: ["Parlez-nous un peu de votre demande", "Votre conseiller vous recontacte rapidement.", "Envoyer ma demande"],
  estimation: ["Estimez votre bien gratuitement", "Recevez une estimation par votre conseiller.", "Demander mon estimation"],
  alerte: ["Recevez les nouveaux biens en avant-première", "Soyez alerté dès qu’un bien correspond à vos critères.", "M’inscrire aux alertes"],
  rdv: ["Prenez rendez-vous avec votre conseiller", "Pour une visite ou un échange.", "Demander un rendez-vous"],
  interet: ["Ce bien vous intéresse ?", "Laissez vos coordonnées, votre conseiller vous recontacte rapidement.", "Envoyer"],
};
const TYPES = [["appartement", "Appartement"], ["maison", "Maison"], ["villa", "Villa"], ["terrain", "Terrain / Parcelle"], ["bureau", "Bureau"], ["commerce", "Commerce"], ["autre", "Autre"]];
const EQUIPEMENTS = [["meuble", "Meublé"], ["parking", "Parking"], ["piscine", "Piscine"], ["securite", "Sécurité / gardien"], ["climatisation", "Climatisation"], ["groupe_elec", "Groupe électrogène"], ["ascenseur", "Ascenseur"], ["eau_chaude", "Eau chaude"], ["internet", "Internet"], ["espace_vert", "Espace vert"]];

const input = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none";
const label = "block text-sm font-semibold text-ink";

function Field({ name, title, type = "text", required, placeholder, inputMode }: { name: string; title: string; type?: string; required?: boolean; placeholder?: string; inputMode?: "numeric" | "tel" | "email" }) {
  return <label className={label}>{title}{required ? " *" : ""}<input name={name} type={type} required={required} placeholder={placeholder} inputMode={inputMode} className={input} /></label>;
}
function Select({ name, title, options, defaultValue }: { name: string; title: string; options: string[][]; defaultValue?: string }) {
  return <label className={label}>{title}<select name={name} defaultValue={defaultValue} className={input}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>;
}

/** Formulaire public de demande d'un conseiller (ancienne page WordPress /demande/). */
export function DemandeForm({ token, objectif, src, propertyId, propertyTitle }: { token: string; objectif: Objectif; src: string; propertyId: number | null; propertyTitle: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [titre, sousTitre, bouton] = TEXTS[objectif];

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setState("sending");
    const fd = new FormData(e.currentTarget);
    const data: Record<string, unknown> = Object.fromEntries([...fd.entries()].filter(([k]) => k !== "equipements"));
    const eq = fd.getAll("equipements").map(String);
    if (eq.length) data.equipements = eq.join(",");
    try {
      const r = await fetch(`${API_URL}/pro-public/capture/demande`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, token, objectif, src, property_wp_id: propertyId ?? undefined, property_title: propertyTitle || undefined }) });
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
        <p className="text-4xl" aria-hidden="true"><SiteIcon value="✅" size={16} className="mr-1 inline-block align-[-3px]" /></p>
        <h1 className="mt-2 font-display text-xl font-extrabold text-ink">Merci, c’est envoyé !</h1>
        <p className="mt-1 text-sm text-slate-600">Votre conseiller vous recontacte très prochainement.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">{titre}</h1>
        <p className="text-sm text-muted">{sousTitre}</p>
      </div>
      {propertyId || propertyTitle ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><SiteIcon value="🏠" size={16} className="mr-1 inline-block align-[-3px]" />Concerne le bien : {propertyTitle || `Bien n° ${propertyId}`}</p> : null}

      {objectif === "interet" ? (
        <>
          <input type="hidden" name="client_statut" value="Locataire" />
          <div className="grid gap-3 sm:grid-cols-2"><Field name="client_prenom" title="Prénom" required /><Field name="client_nom" title="Nom" required /></div>
          <div className="grid gap-3 sm:grid-cols-2"><Field name="client_contact" title="Téléphone / WhatsApp" type="tel" inputMode="tel" required /><Field name="profession" title="Profession" /></div>
        </>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field name="client_nom" title="Votre nom" required />
            <Select name="client_statut" title="Vous êtes" defaultValue={objectif === "estimation" ? "Propriétaire" : ""} options={[["", "— Sélectionner —"], ["Acheteur", "Acheteur"], ["Locataire", "Locataire"], ["Propriétaire", "Propriétaire"], ["Agent immobilier", "Agent immobilier"], ["Autre", "Autre"]]} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2"><Field name="client_contact" title="Téléphone / WhatsApp" type="tel" inputMode="tel" required /><Field name="client_email" title="E-mail" type="email" inputMode="email" /></div>
        </>
      )}

      {objectif === "demande" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select name="type_transaction" title="Type de demande" options={[["achat", "Acheter"], ["location", "Louer"], ["vente", "Vendre"]]} />
            <Select name="type_bien" title="Type de bien" options={TYPES} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Select name="nb_pieces" title="Nombre de pièces" options={[["", "— Non précisé —"], ["1", "Studio / 1 pièce"], ["2", "2 pièces"], ["3", "3 pièces"], ["4", "4 pièces"], ["5", "5 pièces"], ["6", "6 pièces et +"]]} />
            <Field name="ville" title="Commune / Ville" /><Field name="quartier" title="Quartier" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2"><Field name="budget_min" title="Budget min (FCFA)" type="number" inputMode="numeric" /><Field name="budget_max" title="Budget max (FCFA)" type="number" inputMode="numeric" /></div>
          <Select name="type_document" title="Type de document (si terrain)" options={[["", "— Sans objet —"], ["Titre Foncier (TF)", "Titre Foncier (TF)"], ["ACD", "ACD"], ["Lettre d'attribution", "Lettre d’attribution"], ["Attestation villageoise", "Attestation villageoise"], ["Autre", "Autre"]]} />
          <label className={label}>Décrivez votre besoin<textarea name="description" rows={3} className={input} placeholder="Précisez votre recherche…" /></label>
        </>
      ) : null}

      {objectif === "estimation" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select name="type_bien" title="Type de bien à estimer" options={[...TYPES.slice(0, 6), ["residence_meublee", "Résidence meublée"], ["autre", "Autre"]]} />
            <Select name="standing" title="Standing" defaultValue="standard" options={[["economique", "Économique"], ["standard", "Standard"], ["bon_standing", "Bon standing"], ["haut_standing", "Haut standing"], ["luxe", "Luxe / Prestige"]]} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2"><Field name="ville" title="Commune / Ville" required /><Field name="quartier" title="Quartier" /></div>
          <div className="grid gap-3 sm:grid-cols-2"><Field name="surface_min" title="Surface (m²)" type="number" inputMode="numeric" /><Field name="nb_pieces" title="Nombre de pièces" type="number" inputMode="numeric" /></div>
          <fieldset>
            <legend className={label}>Équipements disponibles</legend>
            <div className="mt-1 grid grid-cols-2 gap-1 text-sm text-slate-700">
              {EQUIPEMENTS.map(([v, l]) => <label key={v} className="flex items-center gap-2"><input type="checkbox" name="equipements" value={v} className="h-4 w-4 accent-brand-800" />{l}</label>)}
            </div>
          </fieldset>
          <label className={label}>Précisions sur le bien<textarea name="description" rows={3} className={input} /></label>
        </>
      ) : null}

      {objectif === "alerte" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select name="type_transaction" title="Vous cherchez à" options={[["achat", "Acheter"], ["location", "Louer"]]} />
            <Select name="type_bien" title="Type de bien" options={TYPES} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2"><Field name="ville" title="Commune / Ville" /><Field name="quartier" title="Quartier" /></div>
          <div className="grid gap-3 sm:grid-cols-2"><Field name="budget_min" title="Budget min (FCFA)" type="number" inputMode="numeric" /><Field name="budget_max" title="Budget max (FCFA)" type="number" inputMode="numeric" /></div>
        </>
      ) : null}

      {objectif === "rdv" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2"><Field name="date_souhaitee" title="Date souhaitée" type="date" /><Field name="heure_souhaitee" title="Heure souhaitée" type="time" /></div>
          <label className={label}>Motif du rendez-vous / message<textarea name="description" rows={3} className={input} /></label>
        </>
      ) : null}

      <label className="flex items-start gap-2 text-xs text-slate-600"><input type="checkbox" required className="mt-0.5 h-4 w-4 accent-brand-800" />J’accepte que mes informations soient utilisées pour traiter ma demande.</label>
      {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
      <button type="submit" disabled={state === "sending"} className="w-full rounded-lg bg-brand-800 px-4 py-3 font-semibold text-white disabled:opacity-60">{state === "sending" ? "Envoi…" : bouton}</button>
    </form>
  );
}
