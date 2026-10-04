import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { canAccess, PROPERTY_TYPES } from "@/lib/accounts";
import { EmptyState, PageHeader, STATUS_LABEL, fmtXOF } from "@/components/dashboard-ui";
import { ListingRowActions } from "@/components/listing-row-actions";
import { getMyInvoice, getMySubscription, listMyListings } from "../actions";
import { getTaxonomies } from "@/lib/taxonomies";

const TABS = [
  { key: "", label: "Toutes" },
  { key: "ACTIVE", label: "En ligne" },
  { key: "CLOSED", label: "Vendues / louées" },
  { key: "DISABLED", label: "Masquées" },
];

export default async function MesAnnonces({ searchParams }: { searchParams: { statut?: string; q?: string; publiee?: string; facture?: string } }) {
  const account = getSession()!;
  if (!canAccess(account.accountType, "annonces")) redirect("/mon-espace");

  // Retour de paiement (publication / vedette) : la facture est re-vérifiée auprès de Money Fusion.
  const invoice = searchParams.facture ? await getMyInvoice(searchParams.facture) : null;
  const [mine, plan] = await Promise.all([listMyListings(), getMySubscription()]);
  const all = mine?.items ?? [];
  const tab = searchParams.statut ?? "";
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const count = (k: string) => (k === "" ? all.length : all.filter((l) => (k === "CLOSED" ? ["SOLD", "RENTED"].includes(l.status) : l.status === k)).length);
  const items = all
    .filter((l) => (tab === "" ? true : tab === "CLOSED" ? ["SOLD", "RENTED"].includes(l.status) : l.status === tab))
    .filter((l) => !q || `${l.title} ${l.commune ?? ""} ${l.city}`.toLowerCase().includes(q));
  const tax = await getTaxonomies();
  const typeLabel = (k: string) => tax.type.find((t) => t.slug === k)?.label ?? PROPERTY_TYPES.find((t) => t.key === k)?.label ?? "Bien";

  return (
    <div>
      <PageHeader
        title="Mes annonces"
        sub={`${mine?.activeListings ?? 0} en ligne · ${mine?.totalViews ?? 0} vues · ${mine?.totalInquiries ?? 0} demandes · ${(mine?.totalCalls ?? 0) + (mine?.totalWhatsapp ?? 0)} appels / WhatsApp`}
        action={<Link href="/mon-espace/annonces/nouvelle" className="btn-primary bg-accent-600 hover:bg-accent-700">+ Publier une annonce</Link>}
      />

      {invoice ? (
        <div className={"mb-4 rounded-2xl p-4 text-sm " + (invoice.status === "paid" ? "bg-emerald-50 text-emerald-800" : invoice.status === "pending" ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-700")}>
          {invoice.status === "paid" ? <>✅ Paiement confirmé : {invoice.label}.</> : invoice.status === "pending" ? <>⏳ Paiement en attente de confirmation ({invoice.number}) : actualisez dans quelques instants.</> : <>Le paiement n’a pas abouti ({invoice.number}) : réessayez depuis le menu « ⋯ » de l’annonce.</>}
          {" "}<Link href={`/mon-espace/factures/${invoice.id}`} className="font-bold underline">Voir la facture</Link>
        </div>
      ) : null}

      {searchParams.publiee ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
          <span className="font-semibold">🎉 Votre annonce est en ligne ! Partagez-la pour obtenir vos premières demandes.</span>
          <Link href={`/annonce/${searchParams.publiee}`} target="_blank" className="font-bold underline">Voir l'annonce ↗</Link>
        </div>
      ) : null}

      {plan?.enabled && (plan.limit >= 0 || plan.subscription) ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 text-sm shadow-card">
          <span className="text-slate-700">
            {plan.subscription ? <>Forfait <strong>{plan.subscription.packageName}</strong> · </> : <>Sans forfait · </>}
            {plan.limit < 0 ? `${plan.used} annonce(s) en ligne (illimité)` : `${plan.used} / ${plan.limit} annonce(s) en ligne`}
            {plan.subscription ? ` · ${plan.subscription.featuredLeft} sponsorisation(s) disponible(s)` : ""}
          </span>
          <Link href="/mon-espace/forfait" className="font-semibold text-brand-800 hover:underline">{plan.limit >= 0 && plan.remaining === 0 ? "Passer à un forfait supérieur →" : "Mon forfait →"}</Link>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <Link key={t.key} href={t.key ? `/mon-espace/annonces?statut=${t.key}` : "/mon-espace/annonces"}
            className={"rounded-full px-3.5 py-1.5 text-sm font-semibold transition " + (tab === t.key ? "bg-ink text-white" : "bg-white text-slate-600 shadow-sm hover:bg-slate-50")}>
            {t.label} <span className="opacity-60">{count(t.key)}</span>
          </Link>
        ))}
        <form className="ml-auto w-full sm:w-auto">
          {tab ? <input type="hidden" name="statut" value={tab} /> : null}
          <input name="q" defaultValue={searchParams.q} placeholder="Rechercher…" className="input py-2 sm:w-56" />
        </form>
      </div>

      {all.length === 0 ? (
        <EmptyState
          title="Aucune annonce pour l'instant"
          text="Publiez votre premier bien : il apparaît aussitôt dans le catalogue Moboo.ci."
          action={<Link href="/mon-espace/annonces/nouvelle" className="btn-primary bg-accent-600 hover:bg-accent-700">+ Publier une annonce</Link>}
        />
      ) : items.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-muted shadow-card">Aucune annonce dans cette catégorie.</p>
      ) : (
        <div className="divide-y divide-slate-100 rounded-2xl bg-white shadow-card">
          {items.map((l) => {
            const st = STATUS_LABEL[l.status] ?? STATUS_LABEL.ACTIVE;
            return (
              <div key={l.id} className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                <Link href={`/mon-espace/annonces/${l.id}`} className="relative shrink-0">
                  {l.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.photo} alt="" className="h-16 w-20 rounded-xl object-cover sm:h-20 sm:w-28" />
                  ) : (
                    <span className="grid h-16 w-20 place-items-center rounded-xl bg-slate-100 text-xs text-slate-400 sm:h-20 sm:w-28">Sans photo</span>
                  )}
                  {l.photoCount > 1 ? <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 text-[10px] font-semibold text-white">{l.photoCount}</span> : null}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
                    {l.featured ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">★ Sponsorisée</span> : null}
                    {l.awaitingPayment ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">En attente de paiement</span> : null}
                    {l.expiresAt ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{new Date(l.expiresAt) < new Date() ? "Expirée" : `Expire le ${new Date(l.expiresAt).toLocaleDateString("fr-FR")}`}</span> : null}
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{l.transaction === "sale" ? "Vente" : "Location"} · {typeLabel(l.propertyType)}</span>
                  </div>
                  <Link href={`/mon-espace/annonces/${l.id}`} className="mt-1 block truncate font-semibold text-ink hover:text-brand-800">{l.title}</Link>
                  {l.moderation && l.moderation !== "approved" ? (
                    <p className={"mt-1 rounded-lg px-2.5 py-1.5 text-xs " + (l.moderation === "pending" ? "bg-amber-50 text-amber-900" : l.moderation === "changes" ? "bg-sky-50 text-sky-900" : "bg-red-50 text-red-800")}>
                      {l.moderation === "pending" ? "⏳ En cours de validation par l’équipe Moboo : elle sera visible dès qu’elle est validée."
                        : l.moderation === "changes" ? <>✎ Corrections demandées : {l.moderationNote} <Link href={`/mon-espace/annonces/${l.id}`} className="font-semibold underline">Modifier</Link> (elle sera revérifiée).</>
                        : l.moderation === "rejected" ? <>✕ Annonce refusée{l.moderationNote ? ` : ${l.moderationNote}` : ""}. Vous pouvez la modifier pour la soumettre à nouveau.</>
                        : "Masquée : votre compte est suspendu."}
                    </p>
                  ) : null}
                  <p className="truncate text-sm font-bold text-ink">{fmtXOF(l.price)}{l.transaction === "rent" ? <span className="font-medium text-muted"> / mois</span> : null}</p>
                  <p className="truncate text-xs text-muted">
                    {[l.commune, l.city].filter(Boolean).join(", ")} · 👁 {l.views} · 💬 {l.inquiries} · 📞 {l.callClicks ?? 0} · WhatsApp {l.whatsappClicks ?? 0} · modifiée le {new Date(l.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <ListingRowActions id={l.id} status={l.status} transaction={l.transaction} featured={l.featured} awaitingPayment={l.awaitingPayment} featuredPrice={plan?.featuredPrice ?? 0} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
