import { redirect } from "next/navigation";
import { canAccess, menuFor, type DashItem, type DashKey } from "./accounts";
import { getSiteSettings } from "./settings";
import { memberItemOn, parseMemberSpace } from "./listing-form";

/** Onglets de l'espace membre pour ce profil : droits du profil + réglages du back-office (Formulaires). */
export async function spaceMenu(type: string | null | undefined): Promise<DashItem[]> {
  const cfg = parseMemberSpace((await getSiteSettings()).forms.memberSpace);
  return menuFor(type)
    .filter((i) => memberItemOn(cfg, i.key, type))
    .map((i) => ({ ...i, label: cfg.items[i.key]?.label || i.label }));
}

export async function spaceAllows(type: string | null | undefined, key: DashKey): Promise<boolean> {
  if (!canAccess(type, key)) return false;
  return memberItemOn(parseMemberSpace((await getSiteSettings()).forms.memberSpace), key, type);
}

/** Garde d'une page de l'espace membre (onglet coupé ou réservé → tableau de bord). */
export async function requireSpace(type: string | null | undefined, key: DashKey) {
  if (!(await spaceAllows(type, key))) redirect("/mon-espace");
}
