import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

/**
 * כשהדשבורד מוטמע ב־iframe באתר אחר (למשל Elementor), דפדפנים חוסמים עוגיות "צד שלישי".
 * SameSite=None + Secure + Partitioned (CHIPS) מאפשרים לעוגיית session לעבוד בתוך iframe.
 * הגדר ב-Vercel: SESSION_COOKIE_CROSS_SITE=true
 *
 * בפיתוח מקומי / בלי iframe — אל תגדיר (נשאר Lax).
 */
export function getSessionCookieSetOptions(
  maxAgeSeconds: number
): Partial<ResponseCookie> {
  const crossSite = process.env.SESSION_COOKIE_CROSS_SITE === "true";
  if (crossSite) {
    return {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: maxAgeSeconds,
      partitioned: true,
    };
  }
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/** מחיקת עוגייה — חייבת אותן אפשרויות כמו בהגדרה */
export function getSessionCookieDeleteOptions(): Partial<ResponseCookie> {
  const crossSite = process.env.SESSION_COOKIE_CROSS_SITE === "true";
  if (crossSite) {
    return {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 0,
      partitioned: true,
    };
  }
  return {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  };
}
