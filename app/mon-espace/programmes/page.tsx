import { authedFetch } from "@/lib/server-api";
import { PromoterLeads } from "@/components/promoter-leads";

export const dynamic = "force-dynamic";

/** Mon espace → Mes programmes neufs : contacts reçus (promoteur). */
export default async function MyProgramsPage() {
  const { ok, data } = await authedFetch("/site/me/programs", { method: "GET" });
  const d = ok ? (data as { programs: { id: string; name: string; slug: string; status: string; views: number; leadsCount: number }[]; leads: any[] }) : { programs: [], leads: [] };
  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-extrabold text-ink">Mes programmes neufs</h1>
      {!d.programs.length ? <p className="rounded-2xl bg-white p-6 text-sm text-muted shadow-card">Aucun programme rattaché à votre compte. Contactez l’équipe Moboo pour présenter votre programme.</p> : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2">
            {d.programs.map((p) => <li key={p.id} className="rounded-2xl bg-white p-4 shadow-card"><p className="font-bold text-ink">{p.name}</p><p className="text-sm text-muted">{p.views} vues · {p.leadsCount} contacts{p.status === "published" ? "" : " · pas encore en ligne"}</p>{p.status === "published" ? <a href={`/programmes-neufs/${p.slug}`} target="_blank" className="text-sm font-semibold text-brand-800 underline">Voir la page</a> : null}</li>)}
          </ul>
          <section className="rounded-2xl bg-white p-5 shadow-card"><h2 className="mb-3 font-bold text-ink">Contacts reçus ({d.leads.length})</h2><PromoterLeads leads={d.leads} programs={d.programs} /></section>
        </>
      )}
    </div>
  );
}
