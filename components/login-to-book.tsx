"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Réservation réservée aux comptes (réglage du back-office) : connexion puis retour sur la fiche. */
export function LoginToBook({ message }: { message: string }) {
  const path = usePathname() || "/";
  const next = encodeURIComponent(path);
  return (
    <div className="mt-2 rounded-xl bg-brand-50 p-3 text-sm text-ink ring-1 ring-brand-100">
      <p className="font-medium">{message}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link href={`/compte?next=${next}`} className="rounded-full bg-brand-800 px-4 py-1.5 font-semibold text-white">Se connecter ou créer un compte</Link>
      </div>
    </div>
  );
}
