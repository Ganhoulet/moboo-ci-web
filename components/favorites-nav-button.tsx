"use client";

import Link from "next/link";
import { useFavorites } from "@/lib/favorites";

export function FavoritesNavButton() {
  const count = useFavorites().length;

  return (
    <Link
      href="/favoris"
      aria-label={`Mes favoris${count ? ` (${count})` : ""}`}
      className="relative grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M12 20.5s-7-4.6-9.2-9.1C1.3 8 3 4.5 6.3 4.5c2 0 3.4 1.2 4.2 2.5.8-1.3 2.2-2.5 4.2-2.5 3.3 0 5 3.5 3.5 6.9C19 15.9 12 20.5 12 20.5Z"
          strokeLinejoin="round"
        />
      </svg>
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent-600 px-1 text-[11px] font-bold text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
