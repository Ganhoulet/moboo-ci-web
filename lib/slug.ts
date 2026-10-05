/** « Attécoubé » → « attecoube » (mêmes adresses que l'indice des prix de l'API). */
export const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
