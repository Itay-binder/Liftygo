import { getInviteDataForEmail } from "@/lib/auth/inviteLookup";
import { getUserProfile, isAdminEmail } from "@/lib/auth/profile";

/**
 * האם מותר ליצור session (עוגייה) למשתמש הזה.
 * - אדמין לפי ADMIN_EMAILS — תמיד
 * - משתמש שכבר קיים ב־users — תמיד (כבר נרשם בעבר)
 * - אחרת — מסמך ב־invites (מזהה מסמך = אימייל, או שדה email)
 */
export async function mayCreateSession(
  uid: string,
  email: string | undefined
): Promise<boolean> {
  if (isAdminEmail(email)) return true;

  const existing = await getUserProfile(uid, email);
  if (existing) return true;

  if (!email) return false;

  const inv = await getInviteDataForEmail(email);
  return inv != null;
}
