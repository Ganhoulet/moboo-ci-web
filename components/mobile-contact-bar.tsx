import Link from "next/link";
import { ContactLink } from "./contact-link";
import { waNumber } from "@/lib/whatsapp";

/** Annonceur affiché à gauche de la barre : photo, nom, rôle, lien vers sa page pro. */
export interface ContactPerson { name: string; role: string; photoUrl?: string | null; href?: string | null; verified?: boolean }

const IconPhone = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" strokeLinejoin="round" />
  </svg>
);
const IconWhatsApp = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.8.9.9-2.7-.2-.3A8 8 0 1 1 12 20Zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5c.1-.2.1-.3 0-.5l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.4c.1.2 1.6 2.5 3.9 3.5.5.2 1 .4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1 0-.1-.2-.2-.4-.3Z" />
  </svg>
);

/**
 * Barre de contact flottante en bas d'écran (mobile uniquement), au style de la page pro :
 * l'annonceur à gauche (toucher → sa page pro), « Appeler » et « WhatsApp » à droite.
 */
export function MobileContactBar({
  phone,
  whatsapp,
  listingId,
  waText,
  person,
}: {
  listingId?: string;
  /** Message WhatsApp pré-rempli (déjà encodé pour une URL). */
  waText?: string;
  phone?: string | null;
  whatsapp?: string | null;
  person?: ContactPerson | null;
}) {
  const tel = phone || whatsapp || "";
  const waDigits = waNumber(whatsapp || phone) ?? "";
  if (!tel && !waDigits) return null;

  const who = person ? (
    <span className="flex min-w-0 items-center gap-2.5">
      {person.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person.photoUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white shadow" />
      ) : (
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-800 text-sm font-bold text-white">{person.name.charAt(0).toUpperCase()}</span>
      )}
      <span className="min-w-0 leading-tight">
        <span className="flex items-center gap-1 truncate text-sm font-bold text-ink">
          <span className="truncate">{person.name}</span>
          {person.verified ? <span className="shrink-0 text-emerald-600" aria-label="Vérifié">✓</span> : null}
        </span>
        <span className="block truncate text-xs text-muted">{person.role}{person.href ? " · Voir le profil ›" : ""}</span>
      </span>
    </span>
  ) : null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-6px_20px_rgba(15,23,42,.06)] backdrop-blur lg:hidden">
      <div className="container-page flex items-center gap-2 py-2.5" style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom))" }}>
        <div className="min-w-0 flex-1">
          {who && person?.href ? <Link href={person.href} className="block min-w-0 rounded-lg active:bg-slate-50">{who}</Link> : who}
        </div>
        {tel ? (
          <ContactLink listingId={listingId} channel="call" href={`tel:${tel}`} aria-label="Appeler"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-ink text-ink transition active:bg-slate-50">
            {IconPhone}
          </ContactLink>
        ) : null}
        {waDigits ? (
          <ContactLink listingId={listingId} channel="whatsapp" href={`https://wa.me/${waDigits}${waText ? `?text=${waText}` : ""}`}
            target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2.5 text-sm font-bold text-white transition active:brightness-95">
            {IconWhatsApp}<span className="hidden min-[360px]:inline">WhatsApp</span>
          </ContactLink>
        ) : null}
      </div>
    </div>
  );
}
