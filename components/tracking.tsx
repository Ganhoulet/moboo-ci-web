"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { TrackingIds } from "@/lib/tracking-config";
import {
  OPEN_CONSENT_EVENT, activateTracking, clearTrackingCookies, getConsent, saveConsent, trackEvent, trackPageView, type Consent,
} from "@/lib/tracking";

const FLASH = "moboo_ev";
const BACKOFFICE = /^\/(admin|administration)(\/|$)/;
const PRIVATE = /^\/(admin|administration|mon-espace|compte|agent)(\/|$)/;
const LISTING = /^\/(?:annonce|residence|espace)\/([^/]+)$/;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readFlash(): "signup" | "publish_listing" | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${FLASH}=([^;]*)`));
  if (!m) return null;
  document.cookie = `${FLASH}=;path=/;max-age=0`;
  return m[1] === "signup" || m[1] === "publish_listing" ? m[1] : null;
}

/** Facebook, TikTok et Google Analytics : chargés seulement après l'accord du visiteur, jamais dans le back-office. */
export function Tracking({ ids, text }: { ids: TrackingIds; text: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const search = params.toString();
  const [consent, setConsent] = useState<Consent | "unknown">("unknown");
  const [panel, setPanel] = useState(false);
  const [active, setActive] = useState(false);
  const backoffice = BACKOFFICE.test(pathname);

  useEffect(() => {
    const saved = getConsent();
    setConsent(saved);
    if (saved === "denied") clearTrackingCookies(); // Google peut réécrire un cookie juste avant le rechargement
  }, []);

  useEffect(() => {
    const open = () => setPanel(true);
    window.addEventListener(OPEN_CONSENT_EVENT, open);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open);
  }, []);

  useEffect(() => {
    if (consent !== "granted" || backoffice) return;
    activateTracking(ids);
    setActive(true);
  }, [consent, backoffice, ids]);

  useEffect(() => {
    if (backoffice) return;
    const flash = readFlash();
    if (flash) trackEvent({ name: flash });
  }, [pathname, search, backoffice]);

  useEffect(() => {
    if (!active || PRIVATE.test(pathname)) return;
    trackPageView();
    const listing = pathname.match(LISTING);
    if (listing) trackEvent({ name: "view_listing", id: listing[1].match(UUID)?.[0] ?? listing[1] });
    if (pathname === "/annonces") {
      const q = new URLSearchParams(search);
      const term = q.get("q") || q.get("propertyType") || q.get("transaction");
      if (term) trackEvent({ name: "search", term });
    }
  }, [active, pathname, search]);

  useEffect(() => {
    if (!active) return;
    const onClick = (e: MouseEvent) => {
      if (PRIVATE.test(location.pathname)) return;
      const a = (e.target as Element | null)?.closest?.("a");
      const href = a?.getAttribute("href") ?? "";
      if (href.startsWith("tel:")) trackEvent({ name: "contact", channel: "call" });
      else if (/wa\.me\/\d/.test(href)) trackEvent({ name: "contact", channel: "whatsapp" });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [active]);

  if (backoffice || consent === "unknown" || !(consent === null || panel)) return null;

  const choose = (choice: "granted" | "denied") => {
    const wasActive = active;
    saveConsent(choice);
    setPanel(false);
    if (choice === "denied") {
      clearTrackingCookies();
      if (wasActive) { location.reload(); return; }
    }
    setConsent(choice);
  };

  return (
    <div role="dialog" aria-label="Cookies de mesure et de publicité" className="fixed inset-x-3 bottom-20 z-50 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200 print:hidden md:bottom-4 md:left-4 md:right-auto md:max-w-md">
      <p className="text-sm text-slate-700">{text} <Link href="/confidentialite" className="font-semibold text-brand-800 underline">En savoir plus</Link></p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => choose("denied")} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50">Refuser</button>
        <button type="button" onClick={() => choose("granted")} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50">Accepter</button>
      </div>
    </div>
  );
}

/** Lien du pied de page : changer son choix à tout moment. */
export function CookiePreferences({ className }: { className?: string }) {
  return <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}>Gérer les cookies</button>;
}

/** Page de retour de paiement : facture confirmée payée. */
export function TrackPurchase({ id, value }: { id: string; value: number }) {
  useEffect(() => { trackEvent({ name: "purchase", id, value }); }, [id, value]);
  return null;
}
