import { cookies } from "next/headers";

export const TRACK_FLASH_COOKIE = "moboo_ev";

/** Signale au navigateur une action réussie côté serveur ; lu une seule fois par le composant de mesure. */
export function flashTrack(name: "signup" | "publish_listing") {
  cookies().set(TRACK_FLASH_COOKIE, name, { maxAge: 120, path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" });
}
