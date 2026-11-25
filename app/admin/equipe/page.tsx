import Link from "next/link";
import { authedFetch } from "@/lib/server-api";
import { displayName } from "@/lib/session";
import type { SiteAccount } from "@/lib/api";
import { teamGroupsFor } from "@/lib/team-space";

export const metadata = { title: "Espace équipe" };
export const dynamic = "force-dynamic";

const hello = () => {
  const h = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "Africa/Abidjan" }));
  return h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";
};

/** Accueil de l'Espace équipe : les rubriques de son rôle (le tableau de bord détaillé viendra s'y ajouter). */
export default async function TeamHome() {
  const me = await authedFetch("/site/auth/me", { method: "GET" });
  const account = me.data as SiteAccount;
  const perms = account?.permissions ?? [];
  const groups = teamGroupsFor({ perms });
  const first = (displayName(account) || "").split(" ")[0];
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">{hello()}{first ? ` ${first}` : ""} 👋</h1>
        <p className="text-sm text-muted">
          Votre espace de travail Moboo{account?.adminRole ? ` — rôle : ${account.adminRole.name}` : ""}. Vous y trouvez uniquement les rubriques de votre rôle ;
          un responsable peut en ajouter dans Rôles et permissions.
        </p>
      </div>
      {groups.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Link key={g.id} href={g.tabs[0].href} className="group rounded-xl bg-white p-4 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:ring-brand-400">
              <span className="flex items-center gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-xl" aria-hidden>{g.emoji}</span>
                <span className="font-display text-lg font-bold text-ink">{g.label}</span>
              </span>
              <span className="mt-2 block text-sm text-muted">{g.desc}</span>
              <span className="mt-3 flex flex-wrap gap-1.5">
                {g.tabs.slice(0, 5).map((t) => <span key={t.href} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{t.label}</span>)}
                {g.tabs.length > 5 ? <span className="text-[11px] text-muted">+{g.tabs.length - 5}</span> : null}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="rounded-lg bg-white p-6 text-sm text-muted ring-1 ring-slate-200">Votre rôle ne donne encore accès à aucune rubrique. Demandez à un administrateur de compléter vos permissions.</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/mon-espace/profil" className="rounded-xl bg-white p-4 text-sm ring-1 ring-slate-200 hover:ring-brand-400"><b className="text-ink">👤 Mon profil</b><br /><span className="text-muted">Photo, coordonnées et présentation visibles par les clients.</span></Link>
        <Link href="/admin/securite" className="rounded-xl bg-white p-4 text-sm ring-1 ring-slate-200 hover:ring-brand-400"><b className="text-ink">🔐 Ma sécurité</b><br /><span className="text-muted">Double authentification de votre accès.</span></Link>
      </div>
    </div>
  );
}
