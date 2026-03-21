import { redirect } from "next/navigation";
import { authDisabled, getSessionWithProfile } from "@/lib/auth/session";
import { EmbedBodyClass } from "./EmbedBodyClass";
import "./embed.css";

export const dynamic = "force-dynamic";

export default async function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!authDisabled()) {
    const session = await getSessionWithProfile();
    if (!session) {
      redirect("/login?returnTo=" + encodeURIComponent("/embed"));
    }
    if (!session.profile.approved) {
      redirect("/pending");
    }
  }
  return (
    <>
      <EmbedBodyClass />
      {children}
    </>
  );
}
