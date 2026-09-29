"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SiteAccount } from "@/lib/api";
import { COMMUNES } from "@/lib/accounts";
import { saveProfileAction, uploadImageAction } from "@/app/mon-espace/actions";

async function compressAvatar(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const side = Math.min(img.width, img.height);
    const c = document.createElement("canvas"); c.width = c.height = Math.min(512, side);
    // Recadrage carré centré.
    c.getContext("2d")!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.82);
  } finally { URL.revokeObjectURL(url); }
}

export function ProfileForm({ account: a, publicProfile }: { account: SiteAccount; publicProfile: boolean }) {
  const router = useRouter();
  const [f, setF] = useState({
    firstName: a.firstName ?? "", lastName: a.lastName ?? "", companyName: a.companyName ?? "",
    username: a.username ?? "", email: a.email ?? "", commune: a.commune ?? "", bio: a.bio ?? "",
    whatsapp: a.whatsapp ?? "", website: a.website ?? "", facebook: a.facebook ?? "",
    instagram: a.instagram ?? "", tiktok: a.tiktok ?? "", linkedin: a.linkedin ?? "",
  });
  const [avatar, setAvatar] = useState(a.avatarUrl ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (p: Partial<typeof f>) => { setF((x) => ({ ...x, ...p })); setMsg(null); };

  async function pickAvatar(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const r = await uploadImageAction(await compressAvatar(file), "avatar");
      if (r.ok && r.url) { setAvatar(r.url); setMsg(null); }
      else setMsg({ ok: false, text: r.error ?? "Envoi impossible." });
    } catch { setMsg({ ok: false, text: "Cette image n'a pas pu être lue." }); }
    setUploading(false);
  }

  function save() {
    start(async () => {
      const r = await saveProfileAction({ ...f, avatarUrl: avatar });
      setMsg(r.ok ? { ok: true, text: "Profil enregistré ✓" } : { ok: false, text: r.error ?? "Erreur." });
      if (r.ok) router.refresh();
    });
  }

  const input = (k: keyof typeof f, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-ink">{label}</span>
      <input className="input" value={f[k]} onChange={(e) => set({ [k]: e.target.value } as any)} {...props} />
    </label>
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-5 shadow-card sm:p-7">
        <div className="flex flex-wrap items-center gap-5">
          <button type="button" onClick={() => fileRef.current?.click()} className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-brand-800" aria-label="Changer la photo">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center font-display text-3xl font-bold text-white">{(f.firstName || f.companyName || "?").charAt(0).toUpperCase()}</span>
            )}
            <span className="absolute inset-0 grid place-items-center bg-black/40 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
              {uploading ? "Envoi…" : "Changer"}
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickAvatar(e.target.files?.[0])} />
          <div className="min-w-0">
            <p className="font-display text-lg font-bold text-ink">Photo de profil</p>
            <p className="text-sm text-muted">{publicProfile ? "Affichée sur vos annonces et votre page publique." : "Visible par vous uniquement."}</p>
            {publicProfile && f.username ? (
              <Link href={`/pro/${f.username}`} target="_blank" className="mt-1 inline-block text-sm font-semibold text-brand-800 hover:underline">
                moboo.ci/pro/{f.username} ↗
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {input("firstName", "Prénom")}
          {input("lastName", "Nom")}
          {publicProfile ? input("companyName", "Nom commercial / raison sociale") : null}
          {input("username", "Nom d'utilisateur", { autoCapitalize: "none", spellCheck: false })}
          {input("email", "E-mail", { type: "email" })}
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">Commune</span>
            <select className="input" value={f.commune} onChange={(e) => set({ commune: e.target.value })}>
              <option value="">—</option>
              {COMMUNES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">Téléphone de connexion</span>
            <input className="input bg-slate-50 text-muted" value={a.phone} disabled />
          </label>
        </div>
      </section>

      {publicProfile ? (
        <section className="rounded-3xl bg-white p-5 shadow-card sm:p-7">
          <h2 className="font-display text-lg font-bold text-ink">Page publique</h2>
          <p className="text-sm text-muted">Ce que voient les clients sur votre page et vos annonces.</p>
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-semibold text-ink">Présentation</span>
            <textarea className="input min-h-[110px]" maxLength={1500} value={f.bio} onChange={(e) => set({ bio: e.target.value })}
              placeholder="Votre activité, vos zones, vos spécialités…" />
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {input("whatsapp", "WhatsApp (contact public)", { inputMode: "tel", placeholder: "07 00 00 00 00" })}
            {input("website", "Site web", { placeholder: "www.monagence.ci" })}
            {input("facebook", "Facebook", { placeholder: "facebook.com/…" })}
            {input("instagram", "Instagram", { placeholder: "instagram.com/…" })}
            {input("tiktok", "TikTok", { placeholder: "tiktok.com/@…" })}
            {input("linkedin", "LinkedIn", { placeholder: "linkedin.com/…" })}
          </div>
        </section>
      ) : null}

      {msg ? <p className={"rounded-xl p-3 text-sm font-medium " + (msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>{msg.text}</p> : null}
      <button type="button" onClick={save} disabled={pending || uploading} className="btn-primary w-full bg-accent-600 hover:bg-accent-700 disabled:opacity-60 sm:w-auto sm:px-8">
        {pending ? "Enregistrement…" : "Enregistrer mon profil"}
      </button>
    </div>
  );
}
