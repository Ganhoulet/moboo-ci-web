// Account managers : petites aides d'affichage partagées (pages serveur et composants).
export const fcfa = (n: number) => `${new Intl.NumberFormat("fr-FR").format(Math.round(n || 0))} F`;
export const since = (min: number) => (min < 60 ? `${min} min` : min < 1440 ? `${Math.floor(min / 60)} h ${min % 60 ? `${min % 60} min` : ""}` : `${Math.floor(min / 1440)} j`);
