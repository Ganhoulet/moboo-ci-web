"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { publishStartHref } from "@/lib/publish-route";
import { SiteIcon } from "@/components/site-icon";

const WHO: [string, string][] = [["proprietaire", "Propriétaire"], ["agent", "Agent"], ["agence", "Agence / promoteur"]];
const GOAL: [string, string, string][] = [["rent", "Louer", "🔑"], ["sale", "Vendre", "🏷️"], ["short", "Meublé / espace", "🛏️"]];
const TYPES: [string, string][] = [["appartement", "Appartement"], ["villa", "Villa"], ["maison", "Maison"], ["studio", "Studio"], ["terrain", "Terrain"], ["bureau", "Bureau"], ["magasin", "Magasin"], ["autre", "Autre"]];

const pill = (on: boolean) => "rounded-full border px-4 py-2 text-sm font-semibold transition " + (on ? "border-accent-600 bg-accent-50 text-accent-800" : "border-slate-300 text-ink hover:border-ink");

/** Carte « Commençons » de la page /publier : profil, objectif, type, téléphone → formulaire pré-rempli. */
export function PublishStarter({ phone, loggedIn }: { phone?: string; loggedIn: boolean }) {
  const router = useRouter();
  const [who, setWho] = useState("proprietaire");
  const [goal, setGoal] = useState("rent");
  const [type, setType] = useState("appartement");
  const [tel, setTel] = useState(phone ?? "");
  const go = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(publishStartHref({ cat: goal, type, tel, profil: who, loggedIn }));
  };
  return (
    <form onSubmit={go} className="rounded-3xl bg-white p-6 text-ink shadow-2xl ring-1 ring-black/5 sm:p-7" aria-label="Commencer une annonce">
      <p className="font-display text-xl font-extrabold">Commençons</p>
      <p className="mt-1 text-sm text-muted">Publication gratuite, en quelques minutes.</p>
      <fieldset className="mt-5">
        <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vous êtes</legend>
        <div className="mt-2 flex flex-wrap gap-2">{WHO.map(([k, l]) => <button key={k} type="button" aria-pressed={who === k} onClick={() => setWho(k)} className={pill(who === k)}>{l}</button>)}</div>
      </fieldset>
      <fieldset className="mt-4">
        <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vous souhaitez</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {GOAL.map(([k, l, i]) => (
            <button key={k} type="button" aria-pressed={goal === k} onClick={() => setGoal(k)}
              className={"rounded-2xl border p-3 text-center text-sm font-semibold transition " + (goal === k ? "border-accent-600 bg-accent-50 text-accent-800" : "border-slate-200 hover:border-slate-400")}>
              <span className="mb-1 flex justify-center"><SiteIcon value={i} size={24} /></span>{l}
            </button>
          ))}
        </div>
      </fieldset>
      {goal !== "short" ? (
        <label className="mt-4 block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type de bien</span>
          <select value={type} onChange={(e) => setType(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-600">
            {TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
      ) : null}
      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Votre numéro (WhatsApp)</span>
        <input value={tel} onChange={(e) => setTel(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="07 00 00 00 00"
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-600" />
      </label>
      <button type="submit" className="mt-5 w-full rounded-full bg-accent-600 py-3.5 text-base font-bold text-white hover:bg-accent-700">{goal === "short" ? "Découvrir Moboo Resi et Event →" : "Continuer →"}</button>
      <p className="mt-3 text-center text-xs text-muted">
        {goal === "short" ? "Meublés et espaces se publient avec réservation en ligne." : loggedIn ? "Vous allez compléter votre annonce dans votre espace." : "Connexion ou inscription en 1 minute, puis vous décrivez votre bien."}
      </p>
    </form>
  );
}
