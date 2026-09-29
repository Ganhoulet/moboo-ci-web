/** Questions fréquentes (details/summary : sans JavaScript). */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="mx-auto max-w-3xl divide-y divide-slate-200 border-y border-slate-200">
      {items.filter((x) => x.q).map((x, i) => (
        <details key={i} className="group py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
            {x.q}
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-slate-300 transition group-open:rotate-45">+</span>
          </summary>
          <p className="mt-2 whitespace-pre-line text-slate-600">{x.a}</p>
        </details>
      ))}
    </div>
  );
}
