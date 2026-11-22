import Link from "next/link";
import { getProAgency } from "../../../actions";
import { getParc, type ParcType } from "../../../parc-actions";
import { fmtDate, Pill, Stat } from "../../../ui";
import { ImportPanel } from "./import-panel";

export const dynamic = "force-dynamic";

const TABS: [ParcType, string][] = [["biens", "Biens"], ["proprietaires", "Propriétaires"], ["locataires", "Locataires"], ["baux", "Baux"], ["loyers", "Loyers"]];
const money = (n: unknown) => (typeof n === "number" && n ? `${Math.round(n).toLocaleString("fr-FR")} F` : "—");
const BIEN: Record<string, string> = { disponible: "Disponible", loue: "Loué", vendu: "Vendu", reserve: "Réservé", indisponible: "Indisponible" };
const person = (r: any) => `${r.prenom ?? ""} ${r.nom ?? ""}`.trim() || "—";
const LOYER: Record<string, [string, "green" | "amber" | "red" | "slate"]> = {
  paye: ["Payé", "green"], en_attente: ["En attente", "amber"], en_retard: ["En retard", "red"], partiel: ["Partiel", "amber"],
};

/** Colonnes affichées par type (les fichiers exportés contiennent tous les champs). */
const VIEW: Record<ParcType, { head: string[]; row: (r: any) => React.ReactNode[] }> = {
  biens: {
    head: ["Bien", "Opération", "Statut", "Loyer / prix", "Propriétaire", "Créé le"],
    row: (r) => [<><span className="font-semibold text-ink">{r.titre}</span><span className="block text-xs text-muted">{[r.reference, r.quartier, r.ville].filter(Boolean).join(" · ")}</span></>,
      r.typeTransaction, <Pill tone={r.statut === "disponible" ? "green" : "slate"}>{BIEN[r.statut] ?? r.statut}</Pill>, money(r.typeTransaction === "vente" ? r.prixVente : r.loyer), r.proprietaire ?? "—", fmtDate(r.createdAt)],
  },
  proprietaires: {
    head: ["Propriétaire", "Contact", "Type", "Biens", "Commission"],
    row: (r) => [<span className="font-semibold text-ink">{person(r)}</span>, <span className="text-xs">{[r.telephone, r.email].filter(Boolean).join(" · ") || "—"}</span>, r.typeProprietaire, r.biens, `${r.tauxCommission ?? 0} %`],
  },
  locataires: {
    head: ["Locataire", "Contact", "Bien", "Profession", "Créé le"],
    row: (r) => [<span className="font-semibold text-ink">{person(r)}</span>, <span className="text-xs">{[r.telephone, r.email].filter(Boolean).join(" · ") || "—"}</span>, r.bien ?? "—", r.profession ?? "—", fmtDate(r.createdAt)],
  },
  baux: {
    head: ["Bail", "Bien", "Locataire", "Loyer", "Début", "Statut"],
    row: (r) => [<span className="font-semibold text-ink">{r.reference ?? `Bail n° ${r.id}`}</span>, r.bien ?? "—", r.locataire ?? "—", money(r.loyer), fmtDate(r.dateDebut),
      <Pill tone={r.statut === "actif" ? "green" : "slate"}>{({ actif: "Actif", termine: "Terminé", resilie: "Résilié" } as Record<string, string>)[r.statut] ?? r.statut}</Pill>],
  },
  loyers: {
    head: ["Échéance", "Locataire", "Bien", "Montant", "Statut", "Payé le"],
    row: (r) => [fmtDate(r.dateEcheance), r.locataire ?? "—", r.bien ?? "—", money(r.montant),
      <Pill tone={LOYER[r.statut]?.[1] ?? "slate"}>{LOYER[r.statut]?.[0] ?? r.statut}</Pill>, fmtDate(r.datePaiement)],
  },
};

export default async function ParcAgence({ params, searchParams }: { params: { orgId: string }; searchParams: Record<string, string | undefined> }) {
  const type = (TABS.find(([k]) => k === searchParams.type)?.[0] ?? "biens") as ParcType;
  const q = (searchParams.q ?? "").trim();
  const page = Number(searchParams.page) || 1;
  const [agency, d] = await Promise.all([getProAgency(params.orgId), getParc(params.orgId, type, q, page)]);
  if (!agency || !d) return <p className="text-muted">Agence introuvable ou accès refusé (droit « Application » requis).</p>;
  const pages = Math.max(1, Math.ceil(d.total / d.perPage));
  const base = `/admin/moboo-pro/agence/${params.orgId}/parc`;
  const href = (o: Record<string, string>) => `${base}?${new URLSearchParams(Object.entries({ type, q, ...o }).filter(([, v]) => v))}`;
  const l = d.loyers;
  return (
    <div className="space-y-5">
      <div>
        <Link href={`/admin/moboo-pro/agence/${params.orgId}`} className="text-sm font-semibold text-brand-800 hover:underline">← {agency.org.name}</Link>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">Parc de l’agence</h1>
        <p className="max-w-3xl text-sm text-muted">Biens, propriétaires, locataires, baux et loyers de l’agence sur Render, export Excel et import des biens et locataires. Remplace l’administration de Moboo Core sur WordPress.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Biens" value={d.counts.biens} />
        <Stat label="Locataires" value={d.counts.locataires} hint={`${d.counts.proprietaires} propriétaire(s)`} />
        <Stat label="Baux actifs" value={d.bauxActifs} hint={`${d.counts.baux} au total`} />
        <Stat label="Loyers payés" value={money(l.paye?.montant ?? 0)} hint={`${l.paye?.nombre ?? 0} paiement(s)`} />
        <Stat label="Loyers en retard" value={money(l.en_retard?.montant ?? 0)} hint={`${(l.en_retard?.nombre ?? 0) + (l.en_attente?.nombre ?? 0)} en retard ou en attente`} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2 text-sm">
          {TABS.map(([k, label]) => (
            <Link key={k} href={`${base}?type=${k}`} className={"rounded-full px-3 py-1 font-semibold " + (type === k ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{label} ({d.counts[k]})</Link>
          ))}
        </div>
        <a href={`/admin/moboo-pro/agence/${params.orgId}/export/${type}`} className="rounded-md px-3 py-1.5 text-sm font-semibold text-brand-800 ring-1 ring-slate-300 hover:bg-slate-50">Exporter en Excel (CSV)</a>
      </div>

      <form className="flex flex-wrap gap-2" action={base}>
        <input type="hidden" name="type" value={type} />
        <input name="q" defaultValue={q} placeholder="Rechercher (nom, téléphone, référence, quartier…)" className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <button className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white">Rechercher</button>
      </form>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        {d.items.length ? (
          <table className="w-full min-w-[48rem] text-sm">
            <thead className="border-b border-slate-200 text-left"><tr>{VIEW[type].head.map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {d.items.map((r) => <tr key={r.id}>{VIEW[type].row(r).map((c, i) => <td key={i} className="px-4 py-2.5">{c}</td>)}</tr>)}
            </tbody>
          </table>
        ) : <p className="p-8 text-center text-sm text-muted">Rien à afficher{q ? ` pour « ${q} »` : ""}.</p>}
      </div>
      {pages > 1 ? (
        <div className="flex justify-center gap-2 text-sm">
          {page > 1 ? <Link href={href({ page: String(page - 1) })} className="rounded bg-white px-3 py-1.5 ring-1 ring-slate-200">← Précédent</Link> : null}
          <span className="px-2 py-1.5 text-muted">Page {page} / {pages}</span>
          {page < pages ? <Link href={href({ page: String(page + 1) })} className="rounded bg-white px-3 py-1.5 ring-1 ring-slate-200">Suivant →</Link> : null}
        </div>
      ) : null}

      <ImportPanel orgId={params.orgId} />
    </div>
  );
}
