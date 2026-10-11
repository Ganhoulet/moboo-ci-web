import { redirect } from "next/navigation";
import { canAccess, menuFor, type DashItem, type DashKey } from "./accounts";
import { getSiteSettings } from "./settings";
import { memberActionOn, memberItemOn, parseMemberSpace } from "./listing-form";
import { MEMBER_ACTIONS } from "./member-actions";

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

/** Actions coupées pour ce profil (boutons data-action masqués dans l'espace membre). */
export async function blockedActions(type: string | null | undefined): Promise<string[]> {
  const cfg = parseMemberSpace((await getSiteSettings()).forms.memberSpace);
  return MEMBER_ACTIONS.map((a) => a.key).filter((k) => !memberActionOn(cfg, k, type));
}

/** Feuille de style qui masque les boutons des actions coupées. */
export function blockedActionsCss(keys: string[]) {
  return keys.length ? `${keys.map((k) => `[data-action="${k.replace(/[^\w.]/g, "")}"]`).join(",")}{display:none!important}` : "";
}

/** Action permise pour ce profil (pages qui ne servent qu'à cette action, ex. modifier une annonce). */
export async function actionAllowed(type: string | null | undefined, key: string): Promise<boolean> {
  return !(await blockedActions(type)).includes(key);
}
