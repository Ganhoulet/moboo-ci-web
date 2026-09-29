import Link from "next/link";
import { ContactHandled } from "@/components/app-contact-toggle";
import { getAppContacts } from "../actions";

export const dynamic = "force-dynamic";

const SOURCES: Record<string, string> = {
  developer: "Nous contacter", property: "Contact annonceur", realtor: "Contact agent", tour: "Demande de visite", report: "Signalement", deletion: "Suppression de compte",
};

export default async function Contacts({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const source = searchParams.source ?? "";
  const data = await getAppContacts({ source, page: searchParams.page });
  const counts = data?.counts ?? {};
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Contacts</h1>
        <p className="text-sm text-muted">Messages envoyés depuis l’application via la passerelle (les demandes sur les annonces arrivent aussi chez l’annonceur).</p>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {[["", "Tous"], ...Object.entries(SOURCES)].map(([k, l]) => (
          <Link key={k} href={k ? `/admin/application/contacts?source=${k}` : "/admin/application/contacts"}
            className={"rounded-full px-3.5 py-1.5 font-semibold " + (source === k ? "bg-brand-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200")}>
            {l} <span className="opacity-70">({k ? counts[k] ?? 0 : Object.values(counts).reduce((s, n) => s + n, 0)})</span>
          </Link>
        ))}
      </div>
      <div className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        {data?.items.length ? (
          <ul className="divide-y divide-slate-100">
            {data.items.map((c) => (
              <li key={c.id} className="flex flex-wrap items-start gap-3 px-4 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase text-muted">{SOURCES[c.source] ?? c.source} · {new Date(c.createdAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</p>
                  <p className="font-semibold text-ink">{c.name || "—"} {c.phone ? <span className="font-normal text-slate-600">· {c.phone}</span> : null} {c.email ? <span className="font-normal text-slate-600">· {c.email}</span> : null}</p>
                  {c.meta?.title ? <p className="text-xs text-slate-500">{c.meta.title}</p> : null}
                  {c.message ? <p className="mt-1 whitespace-pre-line text-slate-700">{c.message}</p> : null}
                </div>
                <ContactHandled id={c.id} handled={c.handled} />
              </li>
            ))}
          </ul>
        ) : <p className="p-8 text-center text-sm text-muted">Aucun message.</p>}
      </div>
    </div>
  );
}
