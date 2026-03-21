import { FieldValue } from "firebase-admin/firestore";
import { getInviteDataForEmail, normalizeInviteEmail } from "@/lib/auth/inviteLookup";
import { getAdminDb } from "@/lib/firebase/admin";
import type { UserProfile } from "@/lib/auth/types";
import { pickUtmFromRecord } from "@/lib/auth/utmField";

/** מזהה מסמך ב-users: אימייל מנורמל (עדיף) או uid לגיבוי */
function userDocumentId(email: string | undefined, uid: string): string {
  if (email?.includes("@")) {
    return normalizeInviteEmail(email);
  }
  return uid;
}

function profileFromDocData(d: Record<string, unknown>): UserProfile {
  return {
    email: String(d.email ?? ""),
    role: d.role === "admin" ? "admin" : "partner",
    utmSource: pickUtmFromRecord(d),
    approved: Boolean(d.approved),
  };
}

/** מזהה אם האימייל מוגדר כאדמין (משתני סביבה) */
export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  const list =
    process.env.ADMIN_EMAILS?.split(",").map((s) => s.trim().toLowerCase()) ??
    [];
  return list.includes(email.toLowerCase());
}

/**
 * קורא פרופיל — מנסה קודם מסמך לפי אימייל, אחר כך מזהה uid (מסמכים ישנים).
 */
export async function getUserProfile(
  uid: string,
  email?: string
): Promise<UserProfile | null> {
  const db = getAdminDb();
  const ids: string[] = [];
  if (email?.includes("@")) {
    ids.push(normalizeInviteEmail(email));
  }
  ids.push(uid);
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const snap = await db.collection("users").doc(id).get();
    if (snap.exists) {
      const d = snap.data() as Record<string, unknown>;
      return profileFromDocData(d);
    }
  }
  return null;
}

/** יצירת / עדכון מסמך משתמש — מזהה מסמך = אימייל מנורמל (לא uid) */
export async function ensureUserDoc(
  uid: string,
  email: string | undefined
): Promise<UserProfile> {
  const db = getAdminDb();
  const admin = isAdminEmail(email);
  const docId = userDocumentId(email, uid);
  const ref = db.collection("users").doc(docId);
  let snap = await ref.get();

  if (!snap.exists && email?.includes("@") && docId !== uid) {
    const legacy = await db.collection("users").doc(uid).get();
    if (legacy.exists) {
      const d = legacy.data() as Record<string, unknown>;
      await ref.set({
        ...d,
        email: email ?? d.email,
        updatedAt: FieldValue.serverTimestamp(),
      });
      await db.collection("users").doc(uid).delete();
      snap = await ref.get();
    }
  }

  if (snap.exists) {
    const p = await getUserProfile(uid, email);
    if (p) {
      if (!admin && email && p.role === "partner") {
        const inv = await getInviteDataForEmail(email);
        const updates: Record<string, unknown> = {};
        if (!p.utmSource.trim()) {
          const utm = pickUtmFromRecord(inv ?? undefined);
          if (utm) updates.utmSource = utm;
        }
        if (!p.approved && inv) {
          updates.approved = true;
        }
        if (Object.keys(updates).length > 0) {
          updates.updatedAt = FieldValue.serverTimestamp();
          await ref.update(updates);
          const again = await getUserProfile(uid, email);
          if (again) return again;
        }
      }
      return p;
    }
  }

  const inv = email ? await getInviteDataForEmail(email) : null;
  let utmFromInvite = "";
  if (!admin && email) {
    utmFromInvite = pickUtmFromRecord(inv ?? undefined);
  }

  const profile: UserProfile = {
    email: email ?? "",
    role: admin ? "admin" : "partner",
    utmSource: admin ? "" : utmFromInvite,
    approved: admin ? true : inv != null,
  };

  await ref.set({
    ...profile,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return profile;
}
