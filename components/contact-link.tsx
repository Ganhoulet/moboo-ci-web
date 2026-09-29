"use client";

/** Signale le clic sans retarder l'ouverture (sendBeacon survit au changement de page). */
function track(listingId: string, channel: "call" | "whatsapp") {
  const body = JSON.stringify({ listingId, channel });
  try {
    if (navigator.sendBeacon?.("/api/track", new Blob([body], { type: "text/plain" }))) return;
  } catch { /* repli ci-dessous */ }
  fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => undefined);
}

/** Lien « Appeler » / « WhatsApp » d'une fiche, compté dans les statistiques de l'annonceur. */
export function ContactLink({ listingId, channel, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  listingId?: string; channel: "call" | "whatsapp";
}) {
  return (
    <a
      {...props}
      onClick={(e) => { if (listingId) track(listingId, channel); props.onClick?.(e); }}
    />
  );
}
