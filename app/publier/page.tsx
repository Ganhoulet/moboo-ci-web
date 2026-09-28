import type { Metadata } from "next";
import Link from "next/link";
import { ListingForm } from "@/components/listing-form";
import { getSession, displayName } from "@/lib/session";

export const metadata: Metadata = {
  title: "Publier une annonce",
  description: "Publiez gratuitement votre bien à louer ou à vendre sur Moboo.ci.",
};

export const dynamic = "force-dynamic";

export default function PublierPage() {
  const account = getSession();
  const contactName = account ? (account.companyName || displayName(account)) : undefined;
  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-2xl">
        <span className="chip bg-brand-50 text-brand-800">Gratuit · Contact direct</span>
        <h1 className="mt-3 font-display text-2xl font-extrabold text-ink sm:text-3xl">
          Publier une annonce
        </h1>
        <p className="mt-2 text-muted">
          Mettez votre bien à louer ou à vendre sur Moboo.ci. Les intéressés vous
          contactent directement, sans commission.
        </p>
        {!account ? (
          <p className="mt-4 rounded-xl bg-brand-50 p-3 text-sm text-brand-900">
            <Link href="/compte" className="font-semibold underline">Connectez-vous</Link> ou{" "}
            <Link href="/inscription" className="font-semibold underline">créez un compte</Link> pour retrouver vos
            annonces, leurs vues et les demandes reçues dans votre espace.
          </p>
        ) : null}
        <div className="mt-6">
          <ListingForm defaults={account ? { contactName: contactName !== account.phone ? contactName : undefined, contactPhone: account.phone } : undefined} />
        </div>
      </div>
    </div>
  );
}
