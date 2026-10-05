import { notFound } from "next/navigation";
import { NoticeEditor } from "@/components/backoffice/notice-editor";
import { getNotice, listNotices } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditNotice({ params }: { params: { id: string } }) {
  const [n, d] = await Promise.all([getNotice(params.id), listNotices()]);
  if (!n || !d) notFound();
  return <NoticeEditor meta={d} notice={n} />;
}
