import type { SiteSettings } from "@/lib/settings";

/** Barre du haut (réglage « En-têtes et barre du haut »). */
export function TopBar({ h }: { h: SiteSettings["header"] }) {
  const wa = h.topBarWhatsapp.replace(/[^0-9]/g, "");
  const socials = [
    ["Facebook", h.facebookUrl], ["Instagram", h.instagramUrl], ["TikTok", h.tiktokUrl],
    ["LinkedIn", h.linkedinUrl], ["YouTube", h.youtubeUrl],
  ].filter(([, u]) => u) as [string, string][];
  return (
    <div className="bg-brand-900 text-xs text-white/90 print:hidden">
      <div className="container-page flex min-h-9 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-1.5">
        <p className="min-w-0 font-medium">{h.topBarText}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {h.topBarPhone ? <a href={`tel:${h.topBarPhone}`} className="hover:text-white">📞 {h.topBarPhone}</a> : null}
          {wa ? <a href={`https://wa.me/${wa.startsWith("225") ? wa : `225${wa}`}`} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a> : null}
          {h.topBarEmail ? <a href={`mailto:${h.topBarEmail}`} className="hidden hover:text-white sm:inline">{h.topBarEmail}</a> : null}
          {socials.map(([name, url]) => (
            <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-white">{name}</a>
          ))}
        </div>
      </div>
    </div>
  );
}
