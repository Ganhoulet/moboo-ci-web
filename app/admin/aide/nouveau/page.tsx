import { HelpEditor } from "@/components/backoffice/help-editor";
import { listHelp } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewHelp({ searchParams }: { searchParams: { q?: string } }) {
  const d = await listHelp();
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Centre d’aide indisponible.</p>;
  return <HelpEditor audiences={d.audiences} initial={{ slug: "", audience: d.audiences[0]?.key ?? "premiers-pas", category: "", kind: "guide", title: searchParams.q ? `${searchParams.q.charAt(0).toUpperCase()}${searchParams.q.slice(1)}` : "", summary: "", body: "", sort: 1000, status: "published" }} />;
}
