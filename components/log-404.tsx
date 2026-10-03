"use client";

import { useEffect } from "react";
import { log404Action } from "@/app/not-found-actions";

/** Note l'adresse introuvable (une fois par affichage de la page 404). */
export function Log404() {
  useEffect(() => {
    void log404Action(window.location.pathname + window.location.search, document.referrer || undefined);
  }, []);
  return null;
}
