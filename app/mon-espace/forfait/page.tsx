import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { canAccess } from "@/lib/accounts";
import { PageHeader } from "@/components/dashboard-ui";
import { PackageCards } from "@/components/package-cards";
import { fcfa, getPackages } from "@/lib/community";
import { getMyInvoice, getMySubscription } from "../actions";

const d = (s: string) => new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default async function MonForfait({ searchParams }: { searchParams: { facture?: string } }) {
  const account = getSession()!;
  if (!canAccess(account.accountType, "forfait")) redirect("/mon-espace");
  const [plan, packages, invoice] = await Promise.all([
    getMySubscription(), getPackages(), searchParams.facture ? getMyInvoice(searchParams.facture) : Promise.resolve(null),
  ]);
  if (!plan?.enabled) redirect("/mon-espace");
  const sub = plan.subscription;
  const pct = plan.limit > 0 ? Math.min(100, Math.round((plan.used / plan.limit) * 100)) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Mon forfait" sub="Propriétés en ligne, annonces sponsorisées et renouvellement." />

      {invoice ? (
        <div className={"rounded-2xl p-4 text-sm " + (invoice.status === "paid" ? "bg-emerald-50 text-emerald-800" : invoice.status === "pending" ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-700")}>
          {invoice.status === "paid" ? <>✅ Paiement confirmé : facture <strong>{invoice.number}</strong> ({fcfa(invoice.amount)}). Votre forfait est actif.</>
            : invoice.status === "pending" ? <>⏳ Paiement en attente de confirmation (facture {invoice.number}). Actualisez la page dans quelques instants.</>
            : <>Le paiement n’a pas abouti (facture {invoice.number}). Vous pouvez réessayer ci-dessous.</>}
          {" "}<Link href={`/mon-espace/factures/${invoice.id}`} className="font-bold underline">Voir la facture</Link>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Forfait</p>
          <p className="mt-1 font-display text-xl font-extrabold text-ink">{sub ? sub.packageName : "Aucun (gratuit)"}</p>
          {sub ? <p className="text-sm text-muted">Actif jusqu’au {d(sub.endsAt)}</p> : <p className="text-sm text-muted">{plan.requirePackage ? `${plan.freeListings} annonce(s) gratuite(s)` : "Publication gratuite"}</p>}
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Annonces en ligne</p>
          <p className="mt-1 font-display text-xl font-extrabold text-ink">{plan.limit < 0 ? plan.used : `${plan.used} / ${plan.limit}`}</p>
          {plan.limit < 0 ? <p className="text-sm text-muted">Sans limite</p> : null}
          {plan.limit > 0 ? <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={"h-full rounded-full " + (pct >= 100 ? "bg-red-500" : "bg-brand-700")} style={{ width: `${pct}%` }} /></div> : null}
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Annonces sponsorisées</p>
          <p className="mt-1 font-display text-xl font-extrabold text-ink">{sub ? `${sub.featuredLeft} disponible${sub.featuredLeft > 1 ? "s" : ""}` : "—"}</p>
          <p className="text-sm text-muted">{sub ? `${sub.featuredUsed} utilisée(s) sur ${sub.featured}` : "Incluses dans les forfaits"} · <Link href="/mon-espace/annonces" className="font-semibold text-brand-800 hover:underline">Mes annonces</Link></p>
        </div>
      </div>

      {packages.items.length ? (
        <div>
          <h2 className="mb-4 font-display text-lg font-bold text-ink">{sub ? "Changer ou renouveler" : "Choisir un forfait"}</h2>
          <PackageCards items={packages.items} loggedIn current={sub?.packageName ?? null} />
        </div>
      ) : null}
    </div>
  );
}
