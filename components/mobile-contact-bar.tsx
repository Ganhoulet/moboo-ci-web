import { formatXOF } from "@/lib/api";
import { ContactLink } from "./contact-link";

/**
 * Barre de contact flottante en bas d'écran (mobile uniquement, façon Airbnb).
 * Toujours visible pendant le défilement pour joindre l'agent/l'annonceur.
 */
export function MobileContactBar({
  price,
  transaction,
  phone,
  whatsapp,
  listingId,
}: {
  listingId?: string;
  price: number;
  transaction: "rent" | "sale";
  phone?: string | null;
  whatsapp?: string | null;
}) {
  const tel = phone || whatsapp || "";
  const waDigits = (whatsapp || phone || "").replace(/[^0-9]/g, "");
  if (!tel && !waDigits) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
      <div
        className="container-page flex items-center gap-3 py-3"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-extrabold text-ink">
            {formatXOF(price)}
            {transaction === "rent" ? <span className="text-xs font-medium text-muted"> / mois</span> : null}
          </p>
        </div>
        {tel ? (
          <ContactLink listingId={listingId} channel="call" href={`tel:${tel}`} className="btn-primary shrink-0 bg-brand-800 px-4 hover:bg-brand-900">
            Appeler
          </ContactLink>
        ) : null}
        {waDigits ? (
          <ContactLink
            listingId={listingId}
            channel="whatsapp"
            href={`https://wa.me/${waDigits}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#25D366] text-white"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.8.9.9-2.7-.2-.3A8 8 0 1 1 12 20Zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5c.1-.2.1-.3 0-.5l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.4c.1.2 1.6 2.5 3.9 3.5.5.2 1 .4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1 0-.1-.2-.2-.4-.3Z" />
            </svg>
          </ContactLink>
        ) : null}
      </div>
    </div>
  );
}
