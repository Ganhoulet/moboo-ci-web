/** Galerie style Airbnb : une grande photo + jusqu'à 4 vignettes. */
export function PhotoGrid({ photos, alt }: { photos: string[]; alt: string }) {
  const list = (photos ?? []).filter(Boolean);
  if (list.length === 0) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-slate-100 text-brand-300">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  const [main, ...rest] = list;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl sm:aspect-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={main} alt={alt} className="h-full w-full object-cover" />
      </div>
      {rest.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {rest.slice(0, 4).map((src, i) => (
            <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
