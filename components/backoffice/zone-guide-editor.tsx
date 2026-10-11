"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveGuideAction, type ZoneGuide } from "@/app/admin/seo/generateur/actions";

const SECTIONS: [string, string, string][] = [
  ["vivre", "Vivre ici", "Ambiance, profil des habitants, points forts et points faibles du quartier."],
  ["ecoles", "Écoles et universités", "Écoles, lycées, universités et crèches réputés à proximité."],
  ["transports", "Transports et accès", "Axes, ponts, gbakas, taxis, temps de trajet vers le Plateau, l’aéroport…"],
  ["securite", "Sécurité", "Niveau de sécurité, rues calmes, zones à éviter, gardiennage courant."],
  ["commerces", "Commerces et loisirs", "Supermarchés, marchés, restaurants, maquis, salles de sport, cliniques."],
  ["investir", "Investir", "Tendance des prix, demande locative, projets en cours, rendement observé."],
];

/** Texte simple → paragraphes HTML (le HTML déjà saisi est gardé tel quel). */
const toHtml = (t: string) => (/<[a-z][\s\S]*>/i.test(t) ? t : t.split(/\n{2,}|\r\n\r\n/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>`).join(""));
const toText = (h: string) => h.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>\s*<p>/gi, "\n\n").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&amp;/g, "&").trim();
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

export function ZoneGuideEditor({ initial }: { initial: ZoneGuide }) {
  const [g, setG] = useState({
    name: initial.name, city: initial.city, image: initial.image ?? "", summary: toText(initial.summary || ""),
    sections: Object.fromEntries(SECTIONS.map(([k]) => [k, toText(initial.sections?.[k] ?? "")])) as Record<string, string>,
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const total = words(g.summary) + SECTIONS.reduce((n, [k]) => n + words(g.sections[k] ?? ""), 0);
  const save = (status: "draft" | "published") => start(async () => {
    const r = await saveGuideAction(initial.slug, {
      name: g.name, city: g.city, image: g.image || null, status, summary: toHtml(g.summary),
      sections: Object.fromEntries(SECTIONS.map(([k]) => [k, toHtml(g.sections[k] ?? "")])),
    });
    setMsg(r.ok ? { ok: true, text: status === "published" ? "Guide publié : il apparaît sur toutes les pages de la zone." : "Brouillon enregistré." } : { ok: false, text: r.error ?? "Enregistrement impossible." });
  });
  return (
    <div className="space-y-4">
      {msg ? <p className={"rounded-md px-3 py-2 text-sm " + (msg.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-800")}>{msg.text}</p> : null}
      <section className="grid gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-3">
        <label className="space-y-1"><span className="text-xs font-semibold text-ink">Nom affiché</span><input className="input text-sm" value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} /></label>
        <label className="space-y-1"><span className="text-xs font-semibold text-ink">Ville</span><input className="input text-sm" value={g.city} onChange={(e) => setG({ ...g, city: e.target.value })} /></label>
        <label className="space-y-1"><span className="text-xs font-semibold text-ink">Photo (https://…)</span><input className="input text-sm" value={g.image} onChange={(e) => setG({ ...g, image: e.target.value })} /></label>
      </section>
      <section className="space-y-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <label className="block space-y-1">
          <span className="text-sm font-semibold text-ink">Présentation</span>
          <span className="block text-xs text-muted">2 à 4 phrases : ce qui caractérise la zone. Une ligne vide sépare les paragraphes.</span>
          <textarea className="input h-28 w-full text-sm" value={g.summary} onChange={(e) => setG({ ...g, summary: e.target.value })} />
        </label>
        {SECTIONS.map(([k, l, h]) => (
          <label key={k} className="block space-y-1">
            <span className="text-sm font-semibold text-ink">{l}</span>
            <span className="block text-xs text-muted">{h}</span>
            <textarea className="input h-28 w-full text-sm" value={g.sections[k]} onChange={(e) => setG({ ...g, sections: { ...g.sections, [k]: e.target.value } })} />
          </label>
        ))}
        <p className={"text-xs " + (total >= 400 ? "text-emerald-700" : "text-muted")}>{total} mots{total < 400 ? " — visez 400 à 800 mots de texte vraiment local (Google valorise le contenu unique)." : " — bonne longueur."}</p>
      </section>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => save("draft")} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-ink">Enregistrer le brouillon</button>
        <button type="button" disabled={pending} onClick={() => save("published")} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700">Publier</button>
        <Link href={`/immobilier/${initial.slug}`} target="_blank" className="ml-auto self-center text-sm font-semibold text-brand-800 hover:underline">Voir la page « Immobilier à {g.name} » →</Link>
      </div>
    </div>
  );
}
