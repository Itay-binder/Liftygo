"use client";

import { signInWithPopup, signOut } from "firebase/auth";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { getFirebaseAuth, getGoogleProvider } from "@/lib/firebase/client";
import "./login.css";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/embed";
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onGoogle() {
    setErr(null);
    setLoading(true);
    try {
      if (typeof window !== "undefined" && window.self !== window.top) {
        try {
          await document.requestStorageAccess?.();
        } catch {
          /* דפדפנים שונים — ממשיכים בכל זאת */
        }
      }

      const auth = getFirebaseAuth();
      const cred = await signInWithPopup(auth, getGoogleProvider());
      const idToken = await cred.user.getIdToken();
      const r = await fetch("/api/auth/session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = (await r.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };
      if (!r.ok) {
        if (r.status === 403 && data.code === "NOT_INVITED") {
          await signOut(auth);
        }
        setErr(data.error ?? "התחברות נכשלה");
        return;
      }
      const next =
        returnTo.startsWith("/") && !returnTo.includes("//")
          ? returnTo
          : "/embed";
      window.location.assign(next);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-root">
      <div className="login-card">
        <h1 className="login-title">התחברות ל־Liftygo</h1>
        <p className="login-sub">המשך עם חשבון Google</p>
        <button
          type="button"
          className="login-btn"
          onClick={() => void onGoogle()}
          disabled={loading}
        >
          {loading ? "מתחבר…" : "המשך עם Google"}
        </button>
        {err && <p className="login-err">{err}</p>}
      </div>
    </main>
  );
}
