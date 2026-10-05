import type { Metadata } from "next";
import { API_URL } from "@/lib/api";
import { relayHeaders } from "@/lib/relay";

export const metadata: Metadata = { title: "Désinscription", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Lien « STOP » des SMS et messages WhatsApp : désinscription en un clic, sans connexion. */
export default async function Stop({ params }: { params: { t: string } }) {
  let res: { ok?: boolean; channel?: string; address?: string } | null = null;
  try {
    const r = await fetch(`${API_URL}/site/unsubscribe`, {
      method: "POST", cache: "no-store",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...relayHeaders(true) },
      body: JSON.stringify({ t: params.t }),
    });
    res = r.ok ? await r.json() : null;
  } catch { /* lien invalide ou API indisponible */ }
  return (
    <div className="container-page grid min-h-[50vh] place-items-center py-12">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-card">
        {res?.ok ? (
          <>
            <p className="text-4xl">✅</p>
            <h1 className="mt-3 font-display text-2xl font-extrabold text-ink">C’est noté</h1>
            <p className="mt-2 text-sm text-slate-600">Le numéro {res.address} ne recevra plus les messages promotionnels de Moboo.ci par {res.channel === "sms" ? "SMS" : "WhatsApp"}. Les messages importants liés à vos réservations restent envoyés.</p>
          </>
        ) : (
          <>
            <p className="text-4xl">⚠️</p>
            <h1 className="mt-3 font-display text-2xl font-extrabold text-ink">Lien invalide</h1>
            <p className="mt-2 text-sm text-slate-600">Ce lien de désinscription n’est pas valable. Répondez « STOP » au message ou écrivez-nous depuis la page Contact.</p>
          </>
        )}
      </div>
    </div>
  );
}
