"use client";

import { useRouter } from "next/navigation";

export default function PendingLogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/session", {
      method: "DELETE",
      credentials: "include",
    });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      style={{
        marginTop: 24,
        padding: "10px 20px",
        borderRadius: 10,
        border: "1px solid #cbd5e1",
        background: "#fff",
        color: "#64748b",
        cursor: "pointer",
        fontSize: 14,
      }}
    >
      התנתקות
    </button>
  );
}
