import type { Metadata } from "next";
import Link from "next/link";
import { API_URL, formatXOF } from "@/lib/api";
import { getSession } from "@/lib/session";
import { CoDecision } from "./decision";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Proposition de collaboration", robots: { index: false, follow: false } };

interface View {
  token: string; status: string; property: { id: number; title: string; image: string | null; price: number; link: string };
  owner: { name: string; photo: string | null; agency: string | null }; commission_owner_pct: number; commission_co_pct: number;
  expires_at: number; duration_days?: number; message: string | null;
}

/** Lien de collaboration reçu par un confrère (sans l'application) : voir la proposition, puis accepter ou refuser. */
export default async function CoPage({ params }: { params: { token: string } }) {
  let v: View | null = null;
  let error = "Cette proposition est introuvable.";
  try {
    const r = await fetch(`${API_URL}/site/co/${encodeURIComponent(params.token)}`, { cache: "no-store" });
    const d = await r.json().catch(() => ({}));
    if (r.ok) v = d as View; else error = d?.message || d?.error?.message || error;
  } catch { error = "Service indisponible. Réessayez dans un instant."; }
  const me = getSession();
  const pro = me && ["agent", "entreprise"].includes(me.accountType ?? "");
  const until = v ? new Date(v.expires_at * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : "";
  return (
    <div className="bg-slate-50">
      <div className="container-page max-w-xl py-10 sm:py-14">
        <div className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-slate-200">
          <div className="bg-ink px-6 py-5 text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-accent-400">Collaboration Moboo</p>
            <p className="mt-1 font-display text-xl font-extrabold">{v ? `${v.owner.name} vous propose une annonce` : "Proposition de collaboration"}</p>
          </div>
          <div className="p-6">
            {!v ? <p className="text-base text-slate-700">{error}</p> : (
              <>
                <div className="flex gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {v.property.image ? <img src={v.property.image} alt="" className="h-24 w-32 shrink-0 rounded-xl object-cover" /> : null}
                  <div className="min-w-0">
                    <a href={v.property.link} target="_blank" rel="noreferrer" className="font-display text-lg font-bold text-ink hover:text-brand-800">{v.property.title}</a>
                    <p className="text-sm text-slate-600">{formatXOF(v.property.price)}</p>
                    <p className="mt-1 text-xs text-muted">Proposé par {v.owner.name}{v.owner.agency ? ` · ${v.owner.agency}` : ""}</p>
                  </div>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-2xl bg-emerald-50 p-3"><dt className="text-xs font-semibold text-emerald-800">Votre commission</dt><dd className="font-display text-2xl font-black text-emerald-900">{v.commission_co_pct} %</dd></div>
                  <div className="rounded-2xl bg-slate-50 p-3"><dt className="text-xs font-semibold text-slate-600">Proposant</dt><dd className="font-display text-2xl font-black text-ink">{v.commission_owner_pct} %</dd></div>
                </dl>
                {v.message ? <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">« {v.message} »</p> : null}
                <ul className="mt-4 space-y-1.5 text-sm text-slate-700">
                  <li>✓ Vous diffusez l’annonce avec votre propre lien : votre numéro s’affiche.</li>
                  <li>✓ Les appels, WhatsApp et demandes vous arrivent (copie au proposant).</li>
                  <li>✓ Accord de {v.duration_days ?? 30} jours ; vente ou location comptée dans vos réalisations.</li>
                </ul>
                <div className="mt-6">
                  {v.status !== "pending" ? (
                    <p className="rounded-2xl bg-slate-100 p-4 text-center font-semibold text-slate-700">{v.status === "accepted" ? "Cette proposition a déjà été acceptée." : v.status === "expired" ? "Cette proposition a expiré." : "Cette proposition n’est plus disponible."}</p>
                  ) : !me ? (
                    <Link href={`/compte?next=${encodeURIComponent(`/app/co/${params.token}`)}`} className="block rounded-full bg-accent-600 px-6 py-3.5 text-center font-bold text-white">Se connecter pour accepter</Link>
                  ) : !pro ? (
                    <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">Seuls les comptes agent ou agence peuvent accepter une collaboration.</p>
                  ) : (
                    <CoDecision token={params.token} />
                  )}
                  {v.status === "pending" ? <p className="mt-3 text-center text-xs text-muted">Proposition valable jusqu’au {until}.</p> : null}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
