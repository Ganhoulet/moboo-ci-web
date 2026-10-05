import type { Metadata } from "next";
import { ConfirmUnsubscribe } from "./confirm";

export const metadata: Metadata = { title: "Se désinscrire — Moboo.ci", robots: { index: false } };

/** Lien « Ne plus recevoir ces messages » des campagnes (signé). */
export default function Desinscription({ searchParams }: { searchParams: { c?: string; a?: string; s?: string } }) {
  const c = searchParams.c === "whatsapp" ? "whatsapp" : "email";
  const ok = !!searchParams.a && !!searchParams.s;
  return (
    <div className="container-page max-w-xl py-16">
      <h1 className="font-display text-3xl font-extrabold text-ink">Se désinscrire</h1>
      <p className="mt-3 text-slate-600">Vous ne recevrez plus nos {c === "email" ? "e-mails" : "messages WhatsApp"} d’information (nouveautés, offres, conseils).</p>
      <div className="mt-6">
        {ok ? <ConfirmUnsubscribe c={c} a={searchParams.a!} s={searchParams.s!} /> : <p className="text-sm text-red-700">Lien incomplet : utilisez le lien reçu dans le message.</p>}
      </div>
    </div>
  );
}
