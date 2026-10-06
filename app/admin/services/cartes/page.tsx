import Link from "next/link";
import { getServices } from "../actions";
import { CardActions } from "@/components/backoffice/services-admin-widgets";

export const dynamic = "force-dynamic";

const STATE: Record<string, [string, string]> = {
  active: ["Active", "bg-emerald-100 text-emerald-800"], pending: ["À activer", "bg-sky-100 text-sky-800"], expiring: ["Expire bientôt", "bg-amber-100 text-amber-800"],
  expired: ["Expirée", "bg-red-100 text-red-700"], not_verified: ["Compte non vérifié", "bg-slate-100 text-slate-600"],
};

/** Services Moboo → Cartes professionnelles des agents et agences vérifiés. */
export default async function CardsAdmin({ searchParams }: { searchParams: { q?: string; etat?: string } }) {
  const q = searchParams.q ?? "";
  const etat = searchParams.etat ?? "";
  const d = await getServices<any>(`/cards?q=${encodeURIComponent(q)}&filter=${etat}`);
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Cartes indisponibles.</p>;
  const s = d.stats;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Cartes professionnelles</h1>
        <p className="max-w-3xl text-sm text-muted">La carte s’active toute seule à la première ouverture dans l’application, une fois le compte vérifié. Rappels d’expiration envoyés par e-mail (réglables). Couleurs et mentions : onglet Réglages → Carte pro.</p>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {[["", `Toutes (${s.total})`], ["active", "Actives"], ["expiring", `Expirent bientôt (${s.expiring_soon})`], ["expired", `Expirées (${s.expired})`], ["pending", "À activer"], ["not_verified", `Non vérifiés (${s.not_verified})`]].map(([k, l]) => (
          <Link key={k} href={`?etat=${k}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={"rounded-full px-3 py-1 font-semibold " + (etat === k ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{l}</Link>
        ))}
      </div>
      <form className="flex gap-2"><input type="hidden" name="etat" value={etat} /><input name="q" defaultValue={q} placeholder="Nom, agence, téléphone…" className="w-64 rounded-md border border-slate-300 px-3 py-1.5 text-sm" /><button className="rounded-md bg-ink px-3 py-1.5 text-sm font-semibold text-white">Rechercher</button></form>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-muted"><tr><th className="p-3">Agent / agence</th><th className="p-3">Téléphone</th><th className="p-3">État</th><th className="p-3">Activée le</th><th className="p-3">Expire le</th><th className="p-3">Actions</th></tr></thead>
          <tbody>
            {d.items.map((c: any) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="p-3"><strong>{c.name}</strong><span className="block text-xs text-muted">{c.kind === "agence" ? "Agence" : "Agent"} · n° app {c.appId}</span></td>
                <td className="p-3">{c.phone}</td>
                <td className="p-3"><span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (STATE[c.state]?.[1] ?? "")}>{STATE[c.state]?.[0] ?? c.state}</span></td>
                <td className="p-3">{c.activated_at ?? "—"}</td><td className="p-3">{c.expires_at ?? "—"}</td>
                <td className="p-3">{c.verified ? <CardActions accountId={c.id} expiresAt={c.expires_at} /> : <Link href="/admin/verifications" className="text-xs text-brand-700 hover:underline">Vérifier le compte</Link>}</td>
              </tr>
            ))}
            {!d.items.length ? <tr><td colSpan={6} className="p-6 text-center text-muted">Aucun agent.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
