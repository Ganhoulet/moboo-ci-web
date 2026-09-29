/**
 * Client OAuth « Web » du projet Firebase moboo-app (le même que l'appli
 * Moboo.ci). Pour que le bouton Google fonctionne, le domaine du site doit
 * figurer dans ses « Origines JavaScript autorisées » (Google Cloud Console).
 */
export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "322322883630-gf34t8evcce34adm11esnu0rkmp7vfpn.apps.googleusercontent.com";
