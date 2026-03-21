import { FieldValue } from "firebase-admin/firestore";
import { getInviteDataForEmail } from "@/lib/auth/inviteLookup";
import { getAdminDb } from "@/lib/firebase/admin";
import type { UserProfile } from "@/lib/auth/types";
import { pickUtmFromRecord } from "@/lib/auth/utmField";

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
    utmSource: pickUtmFromRecord(d),
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
  const admin = isAdminEmail(email);

  if (snap.exists) {
    const p = await getUserProfile(uid);
    if (p) {
      if (
        !admin &&
        email &&
        p.role === "partner" &&
        !p.utmSource.trim()
      ) {
        const inv = await getInviteDataForEmail(email);
        const utm = pickUtmFromRecord(inv ?? undefined);
        if (utm) {
          await ref.update({
            utmSource: utm,
            updatedAt: FieldValue.serverTimestamp(),
          });
          const again = await getUserProfile(uid);
          if (again) return again;
        }
      }
      return p;
    }
  }

  let utmFromInvite = "";
  if (!admin && email) {
    const inv = await getInviteDataForEmail(email);
    utmFromInvite = pickUtmFromRecord(inv ?? undefined);
  }

  const profile: UserProfile = {
    email: email ?? "",
    role: admin ? "admin" : "partner",
    utmSource: admin ? "" : utmFromInvite,
    approved: admin,
  };

  await ref.set({
    ...profile,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return profile;
}
