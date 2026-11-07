import { Section } from "@/components/detail";
import { formatXOF } from "@/lib/api";
import type { CustomField } from "@/lib/listing-form";

export type CustomGroup = { title: string; rows: { f: CustomField; title: string; value: string; list: string[] | null }[] };

/**
 * Champs créés de l'annonce (back-office → Formulaires), rubrique par rubrique :
 * prix et conditions (avec la somme à prévoir à l'entrée), eau et électricité, papiers…
 */
export function CustomSections({ groups, entry }: {
  groups: CustomGroup[];
  /** Location au mois : caution + avance + frais d'agence, en mois et en FCFA. */
  entry: { total: number; caution: number; avance: number; fee: number } | null;
}) {
  return (
    <>
      {groups.map((g) => (
        <Section key={g.title} title={g.title}>
          {g.title === "Prix et conditions" && entry ? (
            <div className="mb-3 rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-100">
              <p className="text-sm text-muted">À prévoir à l’entrée</p>
              <p className="font-display text-2xl font-extrabold text-brand-800">{formatXOF(entry.total)}</p>
              <p className="text-xs text-muted">
                {[entry.caution ? `${entry.caution} mois de caution` : "", entry.avance ? `${entry.avance} mois d’avance` : "", entry.fee ? `${entry.fee} mois de frais d’agence` : ""].filter(Boolean).join(" + ")}
                , soit {entry.caution + entry.avance + entry.fee} mois de loyer.
              </p>
            </div>
          ) : null}
          <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            {g.rows.map((r) => (
              <div key={r.f.key} className={"flex justify-between gap-4 border-b border-slate-100 py-2 " + (r.list && r.list.length > 2 ? "sm:col-span-2" : "")}>
                <dt className="shrink-0 text-muted">{r.title}</dt>
                <dd className="min-w-0 text-right font-semibold text-ink">
                  {r.list && r.list.length > 1 ? (
                    <span className="flex flex-wrap justify-end gap-1.5">{r.list.map((x) => <span key={x} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold">{x}</span>)}</span>
                  ) : r.value}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      ))}
    </>
  );
}
