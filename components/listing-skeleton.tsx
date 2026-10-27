/** Fiche en cours de chargement : la place des photos et du texte, pour que l'écran ne reste pas figé. */
export function ListingSkeleton() {
  return (
    <div className="container-page animate-pulse py-0 lg:py-8" aria-busy="true" aria-label="Chargement de l’annonce">
      <div className="-mx-4 h-[46vh] min-h-[260px] max-h-[480px] bg-slate-200 sm:-mx-6 lg:mx-0 lg:h-[26rem] lg:rounded-2xl" />
      <div className="mx-auto mt-6 max-w-xl space-y-3 text-center lg:mx-0 lg:text-left">
        <div className="mx-auto h-5 w-24 rounded-full bg-slate-200 lg:mx-0" />
        <div className="mx-auto h-7 w-3/4 rounded-lg bg-slate-200 lg:mx-0" />
        <div className="mx-auto h-4 w-1/2 rounded bg-slate-200 lg:mx-0" />
        <div className="mx-auto h-6 w-40 rounded bg-slate-200 lg:mx-0" />
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3">
        <div className="h-16 rounded-xl bg-slate-100" />
        <div className="h-16 rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

/** Liste d'annonces en cours de chargement. */
export function ListSkeleton() {
  return (
    <div className="container-page animate-pulse py-6" aria-busy="true" aria-label="Chargement des annonces">
      <div className="h-7 w-40 rounded-lg bg-slate-200" />
      <div className="mt-2 h-4 w-28 rounded bg-slate-200" />
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i}>
            <div className="aspect-[4/3] rounded-2xl bg-slate-200" />
            <div className="mt-3 h-4 w-2/3 rounded bg-slate-200" />
            <div className="mt-2 h-4 w-1/3 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
