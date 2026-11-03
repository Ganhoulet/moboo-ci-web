import Link from "next/link";
import { bottomValues, fillText, fillTitle, paragraphs, type BottomChip, type SeoBottom } from "@/lib/seo-bottom";

function Chips({ title, items }: { title: string; items: BottomChip[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-5">
      <h3 className="text-sm font-semibold text-muted">{title}</h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {items.map((c) => (
          <li key={c.href}>
            <Link href={c.href} className="inline-flex items-baseline gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-sm text-ink hover:border-ink">
              {c.label}{c.count ? <span className="text-xs text-muted">{c.count.toLocaleString("fr-FR")}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Bas de page « catégorie × lieu » : liens vers les recherches voisines, texte
 * en trois parties avec les chiffres du jour, questions fréquentes.
 */
export function SeoBottomBlock({ title, b, total, extra = [] }: { title: string; b: SeoBottom; total: number; extra?: BottomChip[] }) {
  const v = bottomValues(b, total);
  const parts = (b.text?.parts ?? []).map((p) => ({ title: fillTitle(p.title, v), paras: paragraphs(p.text, v) })).filter((p) => p.paras.length);
  const same = [...(b.chips?.same.items ?? []), ...extra];
  const faq = b.faq.map((x) => ({ q: fillText(x.q, v), a: fillText(x.a, v) })).filter((x) => x.a);
  if (!same.length && !b.chips?.zones.items.length && !b.chips?.cities.items.length && !parts.length && !faq.length) return null;
  return (
    <section className="mt-14 border-t border-slate-200 pt-10" aria-labelledby="seo-bottom-title">
      <h2 id="seo-bottom-title" className="font-display text-2xl font-bold text-ink">{title}</h2>
      {b.chips ? (
        <>
          <Chips title={b.chips.same.title} items={same} />
          <Chips title={b.chips.zones.title} items={b.chips.zones.items} />
          <Chips title={b.chips.cities.title} items={b.chips.cities.items} />
        </>
      ) : <Chips title="Pour aller plus loin" items={extra} />}

      {parts.length ? (
        <article className="mt-10 max-w-3xl space-y-3">
          {parts.map((p, i) => (
            <div key={i} className={i ? "pt-4" : ""}>
              {p.title ? <h3 className="font-display text-lg font-bold text-ink">{p.title}</h3> : null}
              {p.paras.map((t, j) => <p key={j} className="mt-2 leading-relaxed text-slate-700">{t}</p>)}
            </div>
          ))}
        </article>
      ) : null}

      {faq.length ? (
        <div className="mt-10 max-w-3xl">
          <h3 className="font-display text-xl font-bold text-ink">Questions fréquentes</h3>
          <div className="mt-4 divide-y divide-slate-200 rounded-2xl ring-1 ring-slate-200">
            {faq.map((x) => (
              <details key={x.q} className="group px-5 py-4">
                <summary className="cursor-pointer list-none font-semibold text-ink marker:hidden">{x.q}</summary>
                <p className="mt-2 text-sm text-muted">{x.a}</p>
              </details>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

/** Questions fréquentes remplies (données structurées FAQPage). */
export function bottomFaq(b: SeoBottom, total: number) {
  const v = bottomValues(b, total);
  return b.faq.map((x) => ({ q: fillText(x.q, v), a: fillText(x.a, v) })).filter((x) => x.a);
}
