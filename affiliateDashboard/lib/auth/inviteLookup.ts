import { getAdminDb } from "@/lib/firebase/admin";

export function normalizeInviteEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * מחזיר את מסמך ההזמנה (אם קיים) לפי מזהה מסמך = אימייל או שדה email.
 */
export async function getInviteDataForEmail(
  email: string | undefined
): Promise<Record<string, unknown> | null> {
  if (!email) return null;
  const normalized = normalizeInviteEmail(email);
  const col = getAdminDb().collection("invites");

  const byDocId = await col.doc(normalized).get();
  if (byDocId.exists) {
    return (byDocId.data() as Record<string, unknown>) ?? null;
  }

  const byEmailField = await col
    .where("email", "==", normalized)
    .limit(1)
    .get();
  if (!byEmailField.empty) {
    return (byEmailField.docs[0].data() as Record<string, unknown>) ?? null;
  }

  return null;
}
