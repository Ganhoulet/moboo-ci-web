"use client";

import { useState } from "react";
import { toggleFavorite, useFavorites } from "@/lib/favorites";
import type { Property } from "@/lib/property";

/** Boutons « Partager » et « Enregistrer » en tête de fiche (barre du haut de l'appli). */
export function DetailActions({ property }: { property: Property }) {
  const favorites = useFavorites();
  const saved = favorites.some((f) => f.id === property.id);
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    const data = { title: property.title, text: `${property.title} — Moboo.ci`, url };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* partage annulé par l'utilisateur */
    }
  }

  const btn = "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-ink underline-offset-2 transition hover:bg-slate-100 hover:underline";

  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={share} className={btn}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {copied ? "Lien copié" : "Partager"}
      </button>
      <button
        type="button"
        className={btn + " hidden sm:inline-flex"}
        onClick={() => {
          const text = `${property.title} — ${window.location.href}`;
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
        }}
      >
        WhatsApp
      </button>
      <button type="button" onClick={() => toggleFavorite(property)} aria-pressed={saved} className={btn}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"
          className={saved ? "text-accent-600" : ""}>
          <path d="M12 20.5s-7-4.6-9.2-9.1C1.3 8 3 4.5 6.3 4.5c2 0 3.4 1.2 4.2 2.5.8-1.3 2.2-2.5 4.2-2.5 3.3 0 5 3.5 3.5 6.9C19 15.9 12 20.5 12 20.5Z" strokeLinejoin="round" />
        </svg>
        {saved ? "Enregistré" : "Enregistrer"}
      </button>
    </div>
  );
}

/** Description repliée au-delà de quelques lignes, avec « Lire la suite ». */
export function ReadMore({ text, lines = 6 }: { text: string; lines?: number }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 420 || text.split("\n").length > lines;
  return (
    <div>
      <p
        className="whitespace-pre-line text-slate-600"
        style={!open && long ? { display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical", overflow: "hidden" } : undefined}
      >
        {text}
      </p>
      {long ? (
        <button type="button" onClick={() => setOpen((v) => !v)} className="mt-2 text-sm font-semibold text-ink underline underline-offset-2">
          {open ? "Réduire" : "Lire la suite"}
        </button>
      ) : null}
    </div>
  );
}
