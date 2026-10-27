"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { refreshProfileAction } from "@/app/mon-espace/actions";

/** Met à jour l'en-tête (photo, nom) quand le profil a changé ailleurs. */
export function ProfileSync() {
  const router = useRouter();
  useEffect(() => {
    refreshProfileAction().then((ok) => ok && router.refresh()).catch(() => {});
  }, [router]);
  return null;
}
