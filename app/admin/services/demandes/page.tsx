import Link from "next/link";
import { getServices } from "../actions";
import { LeadStatusButton } from "@/components/backoffice/lead-status-button";

export const dynamic = "force-dynamic";

const SERVICES: [string, string][] = [["", "Tous"], ["loyer", "Estimation de loyer"], ["foncier", "Estimation de terrain"], ["edl", "État des lieux"], ["solvabilite", "Solvabilité"]];
const KEY: Record<string, string> = {
  commune: "Commune", zone: "Quartier", type_bien: "Type", pieces: "Pièces", surface: "Surface", meuble: "Meublé", standing: "Standing",
  superficie: "Superficie (m²)", statut_admin: "Statut", usage_prevu: "Usage", situation: "Situation", viabilise: "Viabilisé", estimation: "Estimation", fourchette: "Fourchette",
};

/** Services Moboo → Demandes du site : « être rappelé » après une estimation. */
export default async function LeadsAdmin({ searchParams }: { searchParams: { service?: string; statut?: string; page?: string } }) {
  const sv = searchParams.service ?? "";
  const st = searchParams.statut ?? "new";
  const page = Number(searchParams.page) || 1;
  const d = await getServices<any>(`/leads?service=${sv}&status=${st === "all" ? "" : st}&page=${page}`);
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Demandes indisponibles.</p>;
  const q = (o: Record<string, string>) => `?${new URLSearchParams({ service: sv, statut: st, ...o }).toString()}`;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Demandes du site</h1>
        <p className="max-w-3xl text-sm text-muted">Visiteurs qui demandent à être rappelés depuis les pages de services (après une estimation de loyer ou de terrain). Chaque demande est aussi envoyée par e-mail aux administrateurs.</p>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {[["new", `À traiter (${d.fresh})`], ["handled", "Traitées"], ["all", "Toutes"]].map(([k, l]) => <Link key={k} href={q({ statut: k, page: "1" })} className={"rounded-full px-3 py-1 font-semibold " + (st === k ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{l}</Link>)}
        <span className="mx-1 text-slate-300">|</span>
        {SERVICES.map(([k, l]) => <Link key={k} href={q({ service: k, page: "1" })} className={"rounded-full px-3 py-1 font-semibold " + (sv === k ? "bg-brand-700 text-white" : "bg-white ring-1 ring-slate-300")}>{l}</Link>)}
      </div>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-muted"><tr><th className="p-3">Date</th><th className="p-3">Service</th><th className="p-3">Contact</th><th className="p-3">Détails</th><th className="p-3" /></tr></thead>
          <tbody>
            {d.items.map((r: any) => (
              <tr key={r.id} className="border-t border-slate-100 align-top">
                <td className="p-3 text-xs text-muted">{r.created_at}</td>
                <td className="p-3 font-semibold">{r.label}</td>
                <td className="p-3"><strong>{r.full_name}</strong><br /><a href={`tel:${r.phone}`} className="text-xs text-brand-700">{r.phone}</a> · <a href={`https://wa.me/${String(r.phone).replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-xs text-emerald-700">WhatsApp</a></td>
                <td className="p-3 text-xs text-slate-700">{Object.entries(r.data ?? {}).filter(([, v]) => v !== "" && v != null && typeof v !== "object").map(([k, v]) => <span key={k} className="mr-3 inline-block">{KEY[k] ?? k} : <b>{String(v)}</b></span>)}</td>
                <td className="p-3 text-right"><LeadStatusButton id={r.id} status={r.status} /></td>
              </tr>
            ))}
            {!d.items.length ? <tr><td colSpan={5} className="p-6 text-center text-muted">Aucune demande.</td></tr> : null}
          </tbody>
        </table>
      </div>
      {d.pages > 1 ? <div className="flex gap-2 text-sm">{page > 1 ? <Link href={q({ page: String(page - 1) })} className="rounded px-3 py-1 ring-1 ring-slate-300">← Précédent</Link> : null}{page < d.pages ? <Link href={q({ page: String(page + 1) })} className="rounded px-3 py-1 ring-1 ring-slate-300">Suivant →</Link> : null}</div> : null}
    </div>
  );
}
