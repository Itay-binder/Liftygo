import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type { UserProfile } from "@/lib/auth/types";

/** מזהה אם האימייל מוגדר כאדמין (משתני סביבה) */
export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  const list =
    process.env.ADMIN_EMAILS?.split(",").map((s) => s.trim().toLowerCase()) ??
    [];
  return list.includes(email.toLowerCase());
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getAdminDb();
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) return null;
  const d = snap.data() as Record<string, unknown>;
  return {
    email: String(d.email ?? ""),
    role: d.role === "admin" ? "admin" : "partner",
    utmSource: String(d.utmSource ?? ""),
    approved: Boolean(d.approved),
  };
}

/** יצירת מסמך משתמש בהתחברות ראשונה */
export async function ensureUserDoc(
  uid: string,
  email: string | undefined
): Promise<UserProfile> {
  const db = getAdminDb();
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  if (snap.exists) {
    const p = await getUserProfile(uid);
    if (p) return p;
  }

  const admin = isAdminEmail(email);
  const profile: UserProfile = {
    email: email ?? "",
    role: admin ? "admin" : "partner",
    utmSource: "",
    approved: admin,
  };

  await ref.set({
    ...profile,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return profile;
}
