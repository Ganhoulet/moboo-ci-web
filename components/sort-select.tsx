"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SORTS } from "@/lib/sorts";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
      Trier par
      <select value={value} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-semibold text-ink"
        onChange={(e) => {
          const q = new URLSearchParams(params.toString());
          q.set("sort", e.target.value);
          q.delete("page");
          router.push(`${pathname}?${q}`);
        }}>
        {SORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
    </label>
  );
}
