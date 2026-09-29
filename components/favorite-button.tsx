"use client";

import { toggleFavorite, useFavorites } from "@/lib/favorites";
import { toggleAccountFavoriteAction } from "@/app/mon-espace/actions";
import type { Property } from "@/lib/property";

export function FavoriteButton({
  property,
  className = "",
}: {
  property: Property;
  className?: string;
}) {
  const favorites = useFavorites();
  const active = favorites.some((f) => f.id === property.id);

  return (
    <button
      type="button"
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={active}
      onClick={(e) => {
        // La carte est un <Link> : on empêche la navigation.
        e.preventDefault();
        e.stopPropagation();
        // Réglage « Connexion requise pour les favoris » (back-office → Général).
        const cfg = (window as any).__moboo;
        if (!active && cfg?.favoritesLoginRequired && !cfg.loggedIn) {
          window.location.assign("/compte");
          return;
        }
        const on = toggleFavorite(property);
        void toggleAccountFavoriteAction(property, on).catch(() => {});
      }}
      className={
        "grid h-9 w-9 place-items-center rounded-full backdrop-blur-sm transition " +
        (active
          ? "bg-white text-accent-600 shadow"
          : "bg-ink/45 text-white hover:bg-ink/65") +
        (className ? ` ${className}` : "")
      }
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          d="M12 20.5s-7-4.6-9.2-9.1C1.3 8 3 4.5 6.3 4.5c2 0 3.4 1.2 4.2 2.5.8-1.3 2.2-2.5 4.2-2.5 3.3 0 5 3.5 3.5 6.9C19 15.9 12 20.5 12 20.5Z"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
