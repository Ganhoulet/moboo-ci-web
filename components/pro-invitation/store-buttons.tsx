import { PRO_APP_STORE, PRO_PLAY_STORE } from "@/lib/pro-store";

export function ProStoreButtons() {
  return (
    <div className="mt-4 grid gap-2">
      <a href={PRO_PLAY_STORE} className="rounded-xl bg-slate-100 py-3 text-center text-sm font-bold text-ink hover:bg-slate-200">▶ Télécharger Moboo Pro (Android)</a>
      {PRO_APP_STORE ? <a href={PRO_APP_STORE} className="rounded-xl bg-slate-100 py-3 text-center text-sm font-bold text-ink hover:bg-slate-200"> Télécharger Moboo Pro (iPhone)</a> : null}
    </div>
  );
}
