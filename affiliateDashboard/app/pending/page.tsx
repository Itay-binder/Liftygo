import { redirect } from "next/navigation";
import { authDisabled, getSessionWithProfile } from "@/lib/auth/session";
import PendingLogoutButton from "./PendingLogoutButton";
import "./pending.css";

export const dynamic = "force-dynamic";

export default async function PendingPage() {
  if (authDisabled()) {
    redirect("/embed");
  }
  const s = await getSessionWithProfile();
  if (!s) {
    redirect("/login?returnTo=" + encodeURIComponent("/pending"));
  }
  if (s.profile.approved) {
    redirect("/embed");
  }
  return (
    <main className="pending-root">
      <div className="pending-card">
        <h1 className="pending-title">ממתין לאישור</h1>
        <p className="pending-text">
          החשבון <strong dir="ltr">{s.profile.email}</strong> ממתין לאישור
          מנהל לפני גישה לדשבורד.
        </p>
        <PendingLogoutButton />
      </div>
    </main>
  );
}
