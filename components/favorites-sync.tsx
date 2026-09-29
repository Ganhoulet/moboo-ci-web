"use client";

import { useEffect } from "react";
import { replaceFavorites, readFavorites } from "@/lib/favorites";
import { syncFavoritesAction } from "@/app/mon-espace/actions";

/**
 * Compte connecté : fusionne les favoris de cet appareil avec ceux du compte
 * (une fois par session d'onglet), puis aligne l'appareil sur le compte.
 */
export function FavoritesSync() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("moboo:fav-synced") === "1") return;
    } catch { /* stockage indisponible */ }
    (async () => {
      const merged = await syncFavoritesAction(readFavorites());
      if (merged) {
        replaceFavorites(merged);
        try { sessionStorage.setItem("moboo:fav-synced", "1"); } catch { /* ignore */ }
      }
    })();
  }, []);
  return null;
}
