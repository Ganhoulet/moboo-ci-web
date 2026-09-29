"use client";

import { useEffect, useState } from "react";
import type { Property } from "./property";

const KEY = "moboo:favorites";
const EVENT = "moboo:favorites-changed";

/** Les favoris sont stockés côté client (localStorage) — aucun compte requis. */
function read(): Property[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: Property[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* stockage indisponible (navigation privée, quota) — on ignore */
  }
}

/** Ajoute / retire un favori. Renvoie true s'il est désormais en favori. */
export function toggleFavorite(p: Property): boolean {
  const items = read();
  const exists = items.some((f) => f.id === p.id);
  write(exists ? items.filter((f) => f.id !== p.id) : [p, ...items]);
  return !exists;
}

/** Lecture ponctuelle (synchronisation avec le compte). */
export function readFavorites(): Property[] {
  return read();
}

/** Remplace les favoris de l'appareil (après fusion avec le compte). */
export function replaceFavorites(items: Property[]) {
  write(items);
}

export function removeFavorite(id: string) {
  write(read().filter((f) => f.id !== id));
}

/** Liste réactive des favoris (se met à jour entre les composants et les onglets). */
export function useFavorites(): Property[] {
  const [items, setItems] = useState<Property[]>([]);

  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return items;
}
