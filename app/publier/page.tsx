import type { Metadata } from "next";
import { ListingForm } from "@/components/listing-form";

export const metadata: Metadata = {
  title: "Publier une annonce",
  description: "Publiez gratuitement votre bien à louer ou à vendre sur Moboo.ci.",
};

export default function PublierPage() {
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
        <div className="mt-6">
          <ListingForm />
        </div>
      </div>
    </div>
  );
}
