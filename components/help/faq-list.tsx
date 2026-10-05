import Link from "next/link";
import type { HelpCard } from "@/lib/help";
import { HelpBody } from "./help-body";

/** Questions fréquentes en accordéon (fonctionne sans JavaScript). */
export function FaqList({ items, showAudience = false }: { items: HelpCard[]; showAudience?: boolean }) {
  return (
    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-100">
      {items.map((f) => (
        <details key={f.slug} className="group px-5 py-1 open:bg-slate-50/60">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
            <span>{f.title}</span>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 transition group-open:rotate-45">+</span>
          </summary>
          <div className="pb-4">
            <HelpBody body={f.body ?? ""} compact />
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              {showAudience && f.audienceTitle ? <span className="text-muted">{f.audienceTitle}</span> : null}
              <Link href={`/aide/article/${f.slug}`} className="font-semibold text-brand-700 hover:underline">Lien direct</Link>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}
