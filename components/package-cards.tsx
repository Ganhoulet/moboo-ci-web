"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { checkoutPackageAction } from "@/app/mon-espace/actions";
import { fcfa, periodLabel, sponsoredLabel, type Package } from "@/lib/community";

/** Cartes des forfaits (page /forfaits et « Mon forfait ») ; « Choisir » ouvre le paiement Money Fusion. */
export function PackageCards({ items, loggedIn, current }: { items: Package[]; loggedIn: boolean; current?: string | null }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [, start] = useTransition();

  const choose = (id: string) => start(async () => {
    setErr(null); setBusy(id);
    const r = await checkoutPackageAction(id);
    if (!r.ok) { setErr(r.error ?? "Paiement impossible."); setBusy(null); return; }
    window.location.href = r.paymentUrl || `/mon-espace/forfait?facture=${r.invoiceId}`;
  });

  return (
    <div>
      {err ? <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{err}</p> : null}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <div key={p.id} className={"relative flex flex-col rounded-2xl bg-white p-6 shadow-card " + (p.popular ? "ring-2 ring-accent-500" : "ring-1 ring-slate-200")}>
            {p.popular ? <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent-600 px-3 py-1 text-xs font-bold text-white">Le plus choisi</span> : null}
            <h3 className="font-display text-xl font-extrabold text-ink">{p.name}</h3>
            {p.description ? <p className="mt-1 text-sm text-muted">{p.description}</p> : null}
            <p className="mt-4 font-display text-3xl font-black text-brand-900">{p.price ? fcfa(p.price) : "Gratuit"}</p>
            <p className="text-sm text-muted">Période d’annonces : <strong className="text-ink">{periodLabel(p.durationDays)}</strong></p>
            <ul className="mt-5 flex-1 space-y-2 text-sm text-slate-700">
              <li>✓ {p.listings < 0 ? "Propriétés illimitées" : `${p.listings} propriété${p.listings > 1 ? "s" : ""} en ligne`}</li>
              <li>{p.featured ? "✓" : "–"} {p.featured ? sponsoredLabel(p.featured) : "Sans annonce sponsorisée"}</li>
              <li>✓ Demandes et messages illimités</li>
            </ul>
            {loggedIn ? (
              <button type="button" disabled={!!busy} onClick={() => choose(p.id)}
                className={"mt-6 rounded-full py-2.5 text-sm font-bold transition disabled:opacity-60 " + (p.popular ? "bg-accent-600 text-white hover:bg-accent-700" : "bg-brand-800 text-white hover:bg-brand-900")}>
                {busy === p.id ? "Redirection vers le paiement…" : current === p.name ? "Renouveler" : "Commencer"}
              </button>
            ) : (
              <Link href="/compte" className="mt-6 rounded-full bg-brand-800 py-2.5 text-center text-sm font-bold text-white hover:bg-brand-900">Se connecter pour choisir</Link>
            )}
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-muted">Paiement sécurisé Money Fusion : Wave, Orange Money, MTN MoMo, Moov Money, carte bancaire. Facture disponible dans votre espace.</p>
    </div>
  );
}
