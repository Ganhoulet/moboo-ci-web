import Link from "next/link";

/** Boutons flottants de l'administrateur : modifier directement sur la page, ou ouvrir le constructeur. */
export function EditButtons({ live, builder }: { live: string; builder: string }) {
  return (
    <div className="fixed bottom-5 left-5 z-40 flex items-center gap-1 rounded-full bg-ink p-1 text-sm font-semibold text-white shadow-2xl print:hidden">
      <Link href={live} className="rounded-full bg-accent-600 px-4 py-2 hover:bg-accent-700">✎ Modifier cette page</Link>
      <Link href={builder} className="rounded-full px-3 py-2 hover:bg-white/10">Constructeur</Link>
    </div>
  );
}
