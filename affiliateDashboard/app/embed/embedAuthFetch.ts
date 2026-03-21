"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";

/** כותרות ל־API כשהעוגייה לא זמינה ב־iframe — Firebase ID token ב־Bearer */
export async function getEmbedAuthHeaders(): Promise<Record<string, string>> {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) return {};
  const idToken = await user.getIdToken();
  return { Authorization: `Bearer ${idToken}` };
}
