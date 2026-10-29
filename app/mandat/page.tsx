import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Lien d'accord envoyé par un conseiller Moboo : connexion avec son numéro, puis validation. */
export default function MandateLink({ searchParams }: { searchParams: { t?: string } }) {
  const t = /^[A-Za-z0-9_-]{10,60}$/.test(searchParams.t ?? "") ? searchParams.t! : "";
  const target = `/mon-espace/mandat${t ? `?t=${t}` : ""}`;
  redirect(getSession() ? target : `/compte?next=${encodeURIComponent(target)}`);
}
