import { NoticeEditor } from "@/components/backoffice/notice-editor";
import { listNotices } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewNotice() {
  const d = await listNotices();
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Informations indisponibles.</p>;
  return <NoticeEditor meta={d} />;
}
