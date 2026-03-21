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
      className="pending-logout"
      onClick={() => void logout()}
    >
      התנתקות
    </button>
  );
}
