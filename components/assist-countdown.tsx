"use client";

import { useEffect, useState } from "react";

export function AssistCountdown({ endsAt }: { endsAt: string }) {
  const [left, setLeft] = useState(() => Math.max(0, new Date(endsAt).getTime() - Date.now()));
  useEffect(() => { const t = setInterval(() => setLeft(Math.max(0, new Date(endsAt).getTime() - Date.now())), 1000); return () => clearInterval(t); }, [endsAt]);
  const m = Math.floor(left / 60000); const s = Math.floor((left % 60000) / 1000);
  return <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-mono font-semibold">{left ? `${m}:${String(s).padStart(2, "0")}` : "terminé"}</span>;
}
