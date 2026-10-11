import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { publishStartHref } from "@/lib/publish-route";

export const dynamic = "force-dynamic";

/** Ancienne adresse du formulaire simplifié : renvoie vers le formulaire complet de l'espace membre. */
export default function AncienFormulaire({ searchParams }: { searchParams: { cat?: string; type?: string; tel?: string; profil?: string } }) {
  redirect(publishStartHref({ ...searchParams, loggedIn: !!getSession() }));
}
