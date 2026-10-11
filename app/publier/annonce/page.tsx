import type { Metadata } from "next";
import Link from "next/link";
import { ListingForm } from "@/components/listing-form";
import type { Category } from "@/components/listing-form";
import { getSession, displayName } from "@/lib/session";

export const metadata: Metadata = {
  title: "Déposer mon annonce",
  description: "Formulaire de dépôt d'annonce sur Moboo.ci : bien à louer ou à vendre, gratuit.",
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

const CATS: Category[] = ["rent", "sale", "short"];

/** Formulaire de dépôt (ouvert depuis la page /publier, critères pré-remplis). */
export default function DeposerAnnoncePage({ searchParams }: { searchParams: { cat?: string; type?: string; tel?: string } }) {
  const account = getSession();
  const contactName = account ? (account.companyName || displayName(account)) : undefined;
  const category = CATS.includes(searchParams.cat as Category) ? (searchParams.cat as Category) : undefined;
  const phone = account?.phone || (searchParams.tel ?? "").replace(/[^\d+ ]/g, "").slice(0, 20) || undefined;
  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-2xl">
        <nav className="text-xs text-muted"><Link href="/publier" className="hover:underline">Publier une annonce</Link> › Déposer</nav>
        <h1 className="mt-3 font-display text-2xl font-extrabold text-ink sm:text-3xl">Décrivez votre bien</h1>
        <p className="mt-2 text-muted">Quelques minutes suffisent. Les intéressés vous contactent directement, sans commission.</p>
        {!account ? (
          <p className="mt-4 rounded-xl bg-brand-50 p-3 text-sm text-brand-900">
            <Link href="/compte?next=/publier/annonce" className="font-semibold underline">Connectez-vous</Link> ou{" "}
            <Link href="/inscription" className="font-semibold underline">créez un compte</Link> pour retrouver vos
            annonces, leurs vues et les demandes reçues dans votre espace.
          </p>
        ) : null}
        <div className="mt-6">
          <ListingForm defaults={{ contactName: account && contactName !== account.phone ? contactName : undefined, contactPhone: phone, category, propertyType: searchParams.type }} />
        </div>
      </div>
    </div>
  );
}
