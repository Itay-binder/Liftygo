import { redirect } from "next/navigation";
import { authDisabled, getSessionWithProfile } from "@/lib/auth/session";
import PendingLogoutButton from "./PendingLogoutButton";

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
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#f8fafc",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 32,
          borderRadius: 16,
          maxWidth: 420,
          textAlign: "center",
          border: "1px solid #e2e8f0",
        }}
      >
        <h1 style={{ marginTop: 0, fontSize: "1.25rem" }}>ממתין לאישור</h1>
        <p style={{ color: "#64748b", lineHeight: 1.5 }}>
          החשבון <strong dir="ltr">{s.profile.email}</strong> ממתין לאישור
          מנהל לפני גישה לדשבורד.
        </p>
        <PendingLogoutButton />
      </div>
    </main>
  );
}
