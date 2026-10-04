import Link from "next/link";
import type { ZonePartner } from "@/lib/ads";

/** Encart « Agents partenaires » de la zone d'une annonce (façon Zillow Premier Agent). */
export function ZonePartners({ zone, items }: { zone: string; items: ZonePartner[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <p className="text-sm font-bold text-ink">Besoin d’un professionnel à {zone} ?</p>
      <p className="text-xs text-muted">Agents partenaires de la zone · Sponsorisé</p>
      <ul className="mt-3 space-y-3">
        {items.map((a) => {
          const n = (a.whatsapp || a.phone || "").replace(/[^0-9]/g, "");
          return (
            <li key={a.id} className="flex items-center gap-3">
              {a.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">{a.name.slice(0, 1).toUpperCase()}</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {a.username ? <Link href={`/pro/${a.username}`} className="hover:underline">{a.name}</Link> : a.name}
                  {a.verified ? <span className="ml-1 text-emerald-600" title="Vérifié">✔</span> : null}
                </p>
                {a.company && a.company !== a.name ? <p className="truncate text-xs text-muted">{a.company}</p> : null}
              </div>
              {n ? (
                <div className="flex shrink-0 gap-1.5">
                  <a href={`/api/ads/partner/${a.id}?to=wa&n=${n}`} target="_blank" rel="noopener noreferrer nofollow" className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700" aria-label={`WhatsApp ${a.name}`}>WhatsApp</a>
                  <a href={`/api/ads/partner/${a.id}?to=tel&n=${n}`} rel="nofollow" className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-brand-800 ring-1 ring-slate-300 hover:bg-slate-50" aria-label={`Appeler ${a.name}`}>Appeler</a>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
