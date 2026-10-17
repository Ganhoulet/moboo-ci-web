import type { Metadata } from "next";
import { InvitationPage } from "@/components/pro-invitation/page";

export const metadata: Metadata = { title: "Invitation Moboo Pro", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function Page({ params }: { params: { token: string } }) {
  return <InvitationPage token={params.token} />;
}
