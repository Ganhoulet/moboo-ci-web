import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAgent, agentGet } from "@/lib/agent";
import { formatXOF } from "@/lib/api";
import { agentLogoutAction } from "./actions";

export const metadata: Metadata = { title: "Espace agent" };
export const dynamic = "force-dynamic";

interface AgentListing {
  id: string; title: string; transaction: string; listingKind: string;
  price: number; city: string; commune: string | null; status: string;
  views: number; photo: string | null;
}
interface Inquiry {
  id: string; name: string; phone: string; kind: string; message: string | null;
  preferredDate: string | null; listingTitle: string | null; createdAt: string;
}

const KIND_LABEL: Record<string, string> = { furnished: "Meublé", event: "Événementiel", classic: "Classique" };
const INQ_LABEL: Record<string, string> = { contact: "Contact", visit: "Visite", reservation: "Réservation" };

function Kpi({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={"rounded-2xl border p-5 " + (accent ? "border-accent-200 bg-accent-50" : "border-slate-200 bg-white")}>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-extrabold text-ink">{value}</p>
    </div>
  );
}

export default async function AgentDashboard() {
  const agent = getAgent();
  if (!agent) redirect("/agent/login");

  const listingsData = await agentGet<{ totalListings: number; totalViews: number; totalCalls?: number; totalWhatsapp?: number; items: AgentListing[] }>(
    "/marketplace/agent/listings",
  );
  const inquiriesData = await agentGet<{ items: Inquiry[] }>("/marketplace/agent/inquiries");

  // Session expirée (token invalide) → renvoyer au login.
  if (listingsData === null) redirect("/agent/login");

  const listings = listingsData?.items ?? [];
  const inquiries = inquiriesData?.items ?? [];

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-800 text-lg font-bold text-white">
            {agent.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink">{agent.name}</h1>
            <p className="text-sm text-muted">Espace agent · {agent.kind === "agency" ? "Agence" : "Agent"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/publier" className="btn-primary bg-accent-600 hover:bg-accent-700">+ Publier une annonce</Link>
          <form action={agentLogoutAction}><button className="btn-ghost">Déconnexion</button></form>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Mes annonces" value={listingsData?.totalListings ?? 0} />
        <Kpi label="Vues totales" value={(listingsData?.totalViews ?? 0).toLocaleString("fr-FR")} accent />
        <Kpi label="Demandes reçues" value={inquiries.length} />
        <Kpi label="Clics Appeler · WhatsApp" value={`${listingsData?.totalCalls ?? 0} · ${listingsData?.totalWhatsapp ?? 0}`} />
      </div>

      {/* Mes annonces */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-ink">Mes annonces</h2>
        {listings.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Aucune annonce pour l'instant. Publiez votre premier bien.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="divide-y divide-slate-100">
              {listings.map((l) => (
                <Link key={l.id} href={`/annonce/${l.id}`} className="flex items-center gap-3 p-3 transition hover:bg-slate-50">
                  <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {l.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.photo} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink">{l.title}</span>
                    <span className="block text-xs text-muted">
                      {KIND_LABEL[l.listingKind] ?? l.listingKind} · {[l.commune, l.city].filter(Boolean).join(", ")}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-bold text-ink">{formatXOF(l.price)}</span>
                    <span className="block text-xs text-muted">{l.views} vue(s)</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Demandes reçues */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-ink">Demandes reçues</h2>
        {inquiries.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Aucune demande pour l'instant.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {inquiries.map((i) => (
              <div key={i.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-ink">{i.name}</span>
                  <span className="chip bg-brand-50 text-brand-800">{INQ_LABEL[i.kind] ?? i.kind}</span>
                </div>
                {i.listingTitle ? <p className="mt-0.5 text-xs text-muted">{i.listingTitle}</p> : null}
                {i.message ? <p className="mt-2 text-sm text-slate-600">{i.message}</p> : null}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                  <a href={`tel:${i.phone}`} className="font-semibold text-brand-800">{i.phone}</a>
                  <a href={`https://wa.me/${i.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-green-600">WhatsApp</a>
                  <span className="text-xs text-muted">{new Date(i.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
