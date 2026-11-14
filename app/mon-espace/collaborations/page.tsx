import { requireSpace } from "@/lib/member-space";
import { getSession } from "@/lib/session";
import { EmptyState, PageHeader } from "@/components/dashboard-ui";
import { getCoListings, listMyListings } from "../actions";
import { CoProposeForm, CoCard } from "./co-ui";

/** Mon espace → Collaborations : partager une annonce avec un confrère (commission partagée), mêmes données que l'application. */
export default async function Collaborations({ searchParams }: { searchParams: { annonce?: string } }) {
  const account = getSession()!;
  await requireSpace(account.accountType, "collaborations");
  const [data, listings] = await Promise.all([getCoListings(), listMyListings()]);
  const active = (listings?.items ?? []).filter((l: any) => l.status === "ACTIVE").map((l: any) => ({ id: String(l.id), title: String(l.title) }));
  const sent = data?.sent ?? [];
  const received = data?.received ?? [];
  return (
    <div className="space-y-8">
      <PageHeader title="Collaborations" sub="Proposez une de vos annonces à un confrère : il la diffuse avec son propre lien, reçoit les contacts (copie pour vous) et vous partagez la commission." />
      <section className="rounded-2xl bg-white p-5 shadow-card">
        <h2 className="font-display text-lg font-bold text-ink">Proposer une collaboration</h2>
        {active.length ? <CoProposeForm listings={active} initial={searchParams.annonce} /> : <p className="mt-2 text-sm text-muted">Publiez d’abord une annonce en ligne pour la proposer à un confrère.</p>}
      </section>
      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-ink">Mes propositions <span className="text-sm font-normal text-muted">({sent.length})</span></h2>
        {sent.length ? <div className="grid gap-3 lg:grid-cols-2">{sent.map((c) => <CoCard key={c.token} c={c} />)}</div> : <EmptyState title="Aucune proposition" text="Vos propositions envoyées apparaissent ici, avec leur statut et les contacts obtenus par votre confrère." />}
      </section>
      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-ink">Annonces que je diffuse <span className="text-sm font-normal text-muted">({received.length})</span></h2>
        {received.length ? <div className="grid gap-3 lg:grid-cols-2">{received.map((c) => <CoCard key={c.token} c={c} />)}</div> : <EmptyState title="Aucune collaboration reçue" text="Quand un confrère vous envoie un lien de collaboration, acceptez-le : l’annonce apparaît ici avec votre lien personnel." />}
      </section>
    </div>
  );
}
