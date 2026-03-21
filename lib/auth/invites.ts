import { getAdminDb } from "@/lib/firebase/admin";
import { getUserProfile, isAdminEmail } from "@/lib/auth/profile";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * האם מותר ליצור session (עוגייה) למשתמש הזה.
 * - אדמין לפי ADMIN_EMAILS — תמיד
 * - משתמש שכבר קיים ב־users — תמיד (כבר נרשם בעבר)
 * - אחרת — מסמך ב־invites באחת מהצורות:
 *   - מזהה מסמך = האימייל באותיות קטנות (למשל itay@gmail.com), או
 *   - כל מזהה מסמך + שדה string בשם `email` ששווה לאימייל המחובר (אחרי נרמול)
 */
export async function mayCreateSession(
  uid: string,
  email: string | undefined
): Promise<boolean> {
  if (isAdminEmail(email)) return true;

  const existing = await getUserProfile(uid);
  if (existing) return true;

  if (!email) return false;

  const normalized = normalizeEmail(email);
  const db = getAdminDb();
  const col = db.collection("invites");

  const byDocId = await col.doc(normalized).get();
  if (byDocId.exists) return true;

  const byEmailField = await col
    .where("email", "==", normalized)
    .limit(1)
    .get();
  return !byEmailField.empty;
}
