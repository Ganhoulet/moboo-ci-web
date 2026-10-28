import Link from "next/link";
import { ContactLink } from "./contact-link";
import { waNumber } from "@/lib/whatsapp";
import { formatXOF } from "@/lib/api";
import type { SiteSettings } from "@/lib/settings";

/** Annonceur affiché à gauche de la barre : photo, nom, rôle, lien vers sa page pro. */
export interface ContactPerson { name: string; role: string; photoUrl?: string | null; href?: string | null; verified?: boolean; agency?: boolean }

type Bar = Pick<SiteSettings["listing"], "cbButtons" | "cbButtonSize" | "cbCallShape" | "cbWhatsappShape" | "cbMessageShape" | "cbCallColor" | "cbWhatsappColor" | "cbMessageColor" | "cbName" | "cbNameLines" | "cbNameMax" | "cbInfo" | "cbPhoto" | "cbBackground" | "cbLayout">;

const IconPhone = (s: number) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" strokeLinejoin="round" />
  </svg>
);
const IconWhatsApp = (s: number) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.8.9.9-2.7-.2-.3A8 8 0 1 1 12 20Zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5c.1-.2.1-.3 0-.5l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.4c.1.2 1.6 2.5 3.9 3.5.5.2 1 .4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1 0-.1-.2-.2-.4-.3Z" />
  </svg>
);
const IconMessage = (s: number) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
    <path d="M4 5h16v11H8l-4 4z" strokeLinejoin="round" />
  </svg>
);

const COLOR: Record<string, string> = {
  outline: "border border-current bg-transparent",
  brand: "bg-brand-800 text-white",
  accent: "bg-accent-600 text-white",
  dark: "bg-ink text-white",
  green: "bg-[#25D366] text-white",
};
const SIZE = {
  sm: { round: "h-9 w-9", pill: "h-9 px-2.5 text-xs", icon: 15 },
  md: { round: "h-11 w-11", pill: "h-11 px-3 text-sm", icon: 18 },
  lg: { round: "h-12 w-12", pill: "h-12 px-4 text-base", icon: 20 },
} as const;
const BG = {
  white: { bar: "bg-white/95 border-slate-200", text: "text-ink", sub: "text-muted", outline: "text-ink" },
  soft: { bar: "bg-slate-100/95 border-slate-200", text: "text-ink", sub: "text-muted", outline: "text-ink" },
  brand: { bar: "bg-brand-800 border-brand-900", text: "text-white", sub: "text-brand-100", outline: "text-white" },
  dark: { bar: "bg-ink border-black", text: "text-white", sub: "text-slate-300", outline: "text-white" },
} as const;

const shorten = (s: string, max: number) => (s.length > max ? s.slice(0, Math.max(4, max - 1)).trimEnd() + "…" : s);

/**
 * Barre de contact flottante en bas d'écran (mobile uniquement). Tout se règle dans le back-office
 * (Détails de la propriété → Barre de contact) : boutons Appeler / WhatsApp / Message, forme de chacun,
 * tailles, couleurs, nom de l'annonceur (complet, prénom, longueur, lignes), ligne d'information, fond.
 */
export function MobileContactBar({
  phone, whatsapp, listingId, waText, person, price, transaction, messageHref, bar,
}: {
  listingId?: string;
  /** Message WhatsApp pré-rempli (déjà encodé pour une URL). */
  waText?: string;
  phone?: string | null;
  whatsapp?: string | null;
  person?: ContactPerson | null;
  price?: number;
  transaction?: "rent" | "sale";
  /** Formulaire de demande de la fiche (bouton « Message »), absent s'il est désactivé. */
  messageHref?: string | null;
  bar: Bar;
}) {
  const tel = phone || whatsapp || "";
  const waDigits = waNumber(whatsapp || phone) ?? "";
  const want = new Set(bar.cbButtons?.length ? bar.cbButtons : ["call", "whatsapp"]);
  const buttons = [
    want.has("call") && tel ? "call" : null,
    want.has("message") && messageHref ? "message" : null,
    want.has("whatsapp") && waDigits ? "whatsapp" : null,
  ].filter(Boolean) as ("call" | "message" | "whatsapp")[];
  if (!buttons.length) return null;

  const bg = BG[bar.cbBackground] ?? BG.white;
  const size = SIZE[bar.cbButtonSize] ?? SIZE.md;
  // Forme choisie bouton par bouton : rond (icône seule) ou rectangle aux bords arrondis (icône + texte).
  const shape = { call: bar.cbCallShape ?? "round", whatsapp: bar.cbWhatsappShape ?? "pill", message: bar.cbMessageShape ?? "round" } as Record<string, string>;
  const labelled = (b: string) => shape[b] === "pill";
  const cls = (b: string, color: string) => {
    const c = COLOR[color] ?? COLOR.brand;
    return `flex shrink-0 items-center justify-center gap-1.5 font-bold transition active:opacity-80 ${c} ${color === "outline" ? bg.outline : ""} ` +
      (labelled(b) ? `rounded-xl ${size.pill}` : `rounded-full ${size.round}`);
  };

  const showName = person && bar.cbName !== "hidden";
  const rawName = person ? (bar.cbName === "first" && !person.agency ? person.name.split(" ")[0] : person.name) : "";
  const name = shorten(rawName, Math.max(8, Number(bar.cbNameMax) || 32));
  const info = bar.cbInfo === "none" ? null
    : bar.cbInfo === "price" && price ? `${formatXOF(price)}${transaction === "rent" ? " / mois" : ""}`
    : person ? `${person.role}${bar.cbInfo === "role_profile" && person.href ? " · Voir le profil ›" : ""}` : null;

  const who = showName ? (
    <span className="flex min-w-0 items-center gap-2.5">
      {bar.cbPhoto !== false ? (person!.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person!.photoUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover shadow ring-2 ring-white" />
      ) : (
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-800 text-sm font-bold text-white ring-2 ring-white">{person!.name.charAt(0).toUpperCase()}</span>
      )) : null}
      <span className="min-w-0 leading-tight">
        <span className={`text-sm font-bold ${bg.text} ${bar.cbNameLines === "1" ? "block truncate" : "line-clamp-2 break-words"}`}>
          {name}{person!.verified ? <span className="ml-1 text-emerald-500" aria-label="Vérifié">✓</span> : null}
        </span>
        {info ? <span className={`mt-0.5 block truncate text-xs ${bg.sub}`}>{info}</span> : null}
      </span>
    </span>
  ) : null;

  // Deux lignes (annonceur en haut, boutons en dessous) : au choix, ou automatiquement quand
  // plusieurs boutons à texte ne laisseraient plus de place au nom.
  const pills = buttons.filter(labelled).length;
  const twoRows = !!who && (bar.cbLayout === "two_rows" || (bar.cbLayout !== "one_row" && (pills >= 2 || (pills === 1 && buttons.length >= 3))));
  const person_ = who && person?.href ? <Link href={person.href} className="block min-w-0 rounded-lg">{who}</Link> : who;
  const actions = buttons.map((b) => b === "call" ? (
          <ContactLink key={b} listingId={listingId} channel="call" href={`tel:${tel}`} aria-label="Appeler" className={cls(b, bar.cbCallColor)}>
            {IconPhone(size.icon)}{labelled(b) ? <span>Appeler</span> : null}
          </ContactLink>
        ) : b === "message" ? (
          <a key={b} href={messageHref!} aria-label="Envoyer un message" className={cls(b, bar.cbMessageColor)}>
            {IconMessage(size.icon)}{labelled(b) ? <span>Message</span> : null}
          </a>
        ) : (
          <ContactLink key={b} listingId={listingId} channel="whatsapp" href={`https://wa.me/${waDigits}${waText ? `?text=${waText}` : ""}`}
            target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className={cls(b, bar.cbWhatsappColor)}>
            {IconWhatsApp(size.icon)}{labelled(b) ? <span>WhatsApp</span> : null}
          </ContactLink>
        ));

  return (
    <div className={`fixed inset-x-0 bottom-0 z-40 border-t shadow-[0_-6px_20px_rgba(15,23,42,.08)] backdrop-blur lg:hidden ${bg.bar}`}>
      {twoRows ? (
        <div className="container-page space-y-2 py-2.5" style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom))" }}>
          <div className="min-w-0">{person_}</div>
          <div className="flex items-center gap-2 [&>a]:flex-1">{actions}</div>
        </div>
      ) : (
        <div className="container-page flex items-center gap-2 py-2.5" style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom))" }}>
          <div className="min-w-0 flex-1">{person_}</div>
          {actions}
        </div>
      )}
    </div>
  );
}
