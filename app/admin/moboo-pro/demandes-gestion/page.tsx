import Link from "next/link";
import { getMandatRequests } from "../outils-actions";
import { fmtDate, Pill } from "../ui";
import { RequestControls } from "./controls";
import { STATUS_LABEL } from "./labels";

export const dynamic = "force-dynamic";

export default async function DemandesGestion({ searchParams }: { searchParams: { status?: string } }) {
  const status = searchParams.status ?? "";
  const d = await getMandatRequests(status);
  if (!d) return <p className="text-muted">Demandes indisponibles (droit « Application » requis).</p>;
  const total = Object.values(d.counts).reduce((a, b) => a + b, 0);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Moboo Pro › Confier ma gestion</h1>
        <p className="max-w-3xl text-sm text-muted">
          Propriétaires autonomes qui demandent, depuis l’application, à confier la gestion de leur bien à une agence. Mettez-les en relation avec une agence de leur zone,
          puis notez la suite ici. Remplace la page « Demandes mandat » de l’extension WordPress.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/admin/moboo-pro/demandes-gestion" className={"rounded-full px-3 py-1 font-semibold " + (!status ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>Toutes ({total})</Link>
        {Object.entries(STATUS_LABEL).map(([k, l]) => (
          <Link key={k} href={`/admin/moboo-pro/demandes-gestion?status=${k}`} className={"rounded-full px-3 py-1 font-semibold " + (status === k ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{l} ({d.counts[k] ?? 0})</Link>
        ))}
      </div>
      {d.items.length ? (
        <ul className="space-y-3">
          {d.items.map((r) => (
            <li key={r.id} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">
                    {r.wpId ? <Link href={`/admin/moboo-pro/comptes/${r.wpId}`} className="text-brand-800 hover:underline">{r.ownerName || "Propriétaire"}</Link> : r.ownerName || "Propriétaire"}
                  </p>
                  <p className="text-xs text-muted">{[r.ownerPhone, r.ownerEmail].filter(Boolean).join(" · ") || "Pas de contact"}</p>
                </div>
                <span className="flex items-center gap-2"><Pill tone={r.status === "nouveau" ? "amber" : r.status === "clos" ? "slate" : "green"}>{STATUS_LABEL[r.status] ?? r.status}</Pill><span className="text-xs text-muted">{fmtDate(r.createdAt)}</span></span>
              </div>
              <p className="mt-2 text-sm text-ink">{[r.propertyLabel && `Bien : ${r.propertyLabel}`, r.zone && `Zone : ${r.zone}`].filter(Boolean).join(" · ") || "Bien non précisé"}</p>
              {r.message ? <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{r.message}</p> : null}
              <RequestControls id={r.id} status={r.status} note={r.note} />
            </li>
          ))}
        </ul>
      ) : <p className="rounded-lg bg-white p-8 text-center text-sm text-muted ring-1 ring-slate-200">Aucune demande{status ? " avec ce statut" : ""}.</p>}
    </div>
  );
}
