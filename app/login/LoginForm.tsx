"use client";

import { signInWithPopup, signOut } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { getFirebaseAuth, getGoogleProvider } from "@/lib/firebase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/embed";
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onGoogle() {
    setErr(null);
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const cred = await signInWithPopup(auth, getGoogleProvider());
      const idToken = await cred.user.getIdToken();
      const r = await fetch("/api/auth/session", {
        method: "POST",
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
      router.push(returnTo);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#f1f5f9",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 32,
          borderRadius: 16,
          boxShadow: "0 8px 30px rgba(15,23,42,0.08)",
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
        }}
      >
        <h1 style={{ marginTop: 0, fontSize: "1.35rem" }}>התחברות ל־Liftygo</h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>
          המשך עם חשבון Google
        </p>
        <button
          type="button"
          onClick={() => void onGoogle()}
          disabled={loading}
          style={{
            marginTop: 20,
            padding: "12px 28px",
            borderRadius: 10,
            border: "none",
            background: "#2563eb",
            color: "#fff",
            fontWeight: 600,
            cursor: loading ? "wait" : "pointer",
            fontSize: "1rem",
          }}
        >
          {loading ? "מתחבר…" : "המשך עם Google"}
        </button>
        {err && (
          <p style={{ color: "#b91c1c", marginTop: 16, fontSize: 14 }}>{err}</p>
        )}
      </div>
    </main>
  );
}
