"use client";

import { usePathname } from "next/navigation";
import { zoneOf, type MobileZone } from "@/lib/mobile-zones";

/** Affiche `children` sur les zones choisies dans le back-office, sinon `fallback` (rien par défaut). */
export function MobileZoneGate({ zones, children, fallback = null }: { zones: MobileZone[]; children: React.ReactNode; fallback?: React.ReactNode }) {
  const path = usePathname() || "/";
  return <>{zones.includes(zoneOf(path)) ? children : fallback}</>;
}
