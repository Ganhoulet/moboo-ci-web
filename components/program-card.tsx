import Link from "next/link";
import { KIND_LABEL, priceRange, type DevProgram } from "@/lib/programs";

/** Carte d'un programme neuf (liste, mise en avant dans les recherches). */
export function ProgramCard({ p, sponsored = false }: { p: DevProgram; sponsored?: boolean }) {
  return (
    <Link href={`/programmes-neufs/${p.slug}`} className="group block overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-200 transition hover:shadow-lg">
      <div className="relative aspect-[16/10] bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.coverUrl ? <img src={p.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-[1.02]" /> : <div className="h-full w-full bg-gradient-to-br from-brand-800 to-brand-900" />}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-900 shadow">{sponsored ? "Programme neuf · Sponsorisé" : "Programme neuf"}</span>
        {p.verified ? <span className="absolute right-3 top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow">✓ Documents vérifiés</span> : null}
        {p.delivery ? <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white">Livraison {p.delivery}</span> : null}
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold text-brand-800">{KIND_LABEL[p.kind] ?? p.kind} · {p.commune || p.city}</p>
        <p className="mt-1 font-display text-lg font-extrabold leading-snug text-ink">{p.name}</p>
        <p className="mt-1 text-sm font-bold text-ink">{priceRange(p)}</p>
        <p className="mt-2 flex items-center gap-2 text-xs text-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p.developerLogo ? <img src={p.developerLogo} alt="" className="h-5 w-5 rounded-full object-cover" /> : null}
          {p.developer}{p.legalStatus ? ` · ${p.legalStatus}` : ""}
        </p>
      </div>
    </Link>
  );
}
