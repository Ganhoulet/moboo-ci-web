import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard-ui";
import { DisputePill, fcfa } from "@/components/booking-ui";
import { DisputeReply } from "@/components/booking-dispute";
import { getMyDispute } from "../../actions";

export const dynamic = "force-dynamic";
const when = (d: string) => new Date(d).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });

/** Mon espace → Litige : fil d'échanges avec l'équipe Moboo, décision. */
export default async function DisputePage({ params }: { params: { id: string } }) {
  const d = await getMyDispute(params.id);
  if (!d) notFound();
  return (
    <div className="max-w-3xl space-y-5">
      <Link href={`/mon-espace/reservations/${encodeURIComponent(d.key)}`} className="text-sm font-semibold text-brand-800 hover:underline">← Réservation</Link>
      <PageHeader title={`Litige ${d.number}`} sub={d.title} />
      <section className="space-y-2 rounded-2xl bg-white p-5 text-sm shadow-card">
        <DisputePill status={d.status} label={d.statusLabel} />
        <p><span className="text-muted">Problème :</span> <strong>{d.categoryLabel}</strong></p>
        <p><span className="text-muted">Votre demande :</span> <strong>{d.desiredOutcomeLabel}{d.amountClaimed ? ` (${fcfa(d.amountClaimed)})` : ""}</strong></p>
        {d.respondBy && d.status === "awaiting_guest" ? <p className="font-semibold text-orange-800">Merci de répondre avant le {when(d.respondBy)}.</p> : null}
        {d.resolutionLabel ? (
          <div className="mt-2 rounded-xl bg-emerald-50 p-3 text-emerald-900">
            <p className="font-semibold">Décision : {d.resolutionLabel}{d.refundAmount ? ` · ${fcfa(d.refundAmount)}` : ""}</p>
            {d.resolutionNote ? <p className="mt-1 whitespace-pre-line">{d.resolutionNote}</p> : null}
            {d.refundRef ? <p className="mt-1 text-xs">Référence du remboursement : {d.refundRef}</p> : null}
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-ink">Échanges</h2>
        <ol className="space-y-3">
          {(d.messages ?? []).map((m) => (
            <li key={m.id} className={"rounded-2xl p-4 text-sm " + (m.author === "guest" ? "ml-8 bg-brand-50" : m.author === "system" ? "bg-slate-50 text-slate-600" : "mr-8 bg-white shadow-card")}>
              <p className="mb-1 text-xs font-semibold text-muted">{m.authorName} · {when(m.createdAt)}</p>
              <p className="whitespace-pre-line text-ink">{m.body}</p>
              {m.files.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.files.filter((f) => f.url).map((f, i) => (
                    <a key={i} href={f.url!} target="_blank" rel="noopener noreferrer" className="block h-20 w-24 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
                      {/\.pdf(\?|$)/i.test(f.url!) ? <span className="grid h-full place-items-center text-xs">📄 PDF</span> : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.url!} alt={`Pièce jointe ${i + 1}`} className="h-full w-full object-cover" />
                      )}
                    </a>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </section>
      {d.open ? <DisputeReply id={d.id} waiting={d.status === "awaiting_guest"} /> : null}
    </div>
  );
}
