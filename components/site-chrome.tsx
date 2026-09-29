"use client";

import { useEffect, useState } from "react";

/** Réglages utiles aux composants client (favoris…), posés une fois par page. */
export function ClientSettings({ favoritesLoginRequired, loggedIn }: { favoritesLoginRequired: boolean; loggedIn: boolean }) {
  if (typeof window !== "undefined") {
    (window as any).__moboo = { favoritesLoginRequired, loggedIn };
  }
  useEffect(() => { (window as any).__moboo = { favoritesLoginRequired, loggedIn }; }, [favoritesLoginRequired, loggedIn]);
  return null;
}

/** Bouton « retour en haut » (réglage Général). */
export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 600);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  if (!show) return null;
  return (
    <button type="button" aria-label="Retour en haut" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="print:hidden fixed bottom-24 right-4 z-30 grid h-11 w-11 place-items-center rounded-full bg-brand-800 text-white shadow-lg transition hover:bg-brand-900 lg:bottom-6">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m6 15 6-6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  );
}
