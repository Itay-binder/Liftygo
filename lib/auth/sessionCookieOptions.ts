import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import type { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth/session";

/**
 * כשהדשבורד ב־iframe באתר אחר (Elementor) — חובה ב־Vercel: SESSION_COOKIE_CROSS_SITE=true
 *
 * Next.js לפעמים לא שולח נכון את תכונת Partitioned; לכן בפרודקשן עם cross-site
 * משתמשים ב־Set-Cookie ידני עם SameSite=None; Secure; Partitioned (CHIPS).
 */
export function crossSiteSessionCookiesEnabled(): boolean {
  return process.env.SESSION_COOKIE_CROSS_SITE === "true";
}

function buildPartitionedSetCookieHeader(
  name: string,
  value: string,
  maxAgeSeconds: number
): string {
  /** ערך ה-session מ-Firebase הוא JWT ASCII — בלי encodeURIComponent כדי להתאים לפענוח בשרת */
  return [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=None",
    "Partitioned",
    `Max-Age=${maxAgeSeconds}`,
  ].join("; ");
}

function buildPartitionedDeleteCookieHeader(name: string): string {
  return [
    `${name}=`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=None",
    "Partitioned",
    "Max-Age=0",
  ].join("; ");
}

export function getSessionCookieSetOptions(
  maxAgeSeconds: number
): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function getSessionCookieDeleteOptions(): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  };
}

export function setSessionCookieOnResponse(
  res: NextResponse,
  sessionToken: string,
  maxAgeSeconds: number
): void {
  if (crossSiteSessionCookiesEnabled()) {
    res.headers.append(
      "Set-Cookie",
      buildPartitionedSetCookieHeader(SESSION_COOKIE, sessionToken, maxAgeSeconds)
    );
    return;
  }
  res.cookies.set(
    SESSION_COOKIE,
    sessionToken,
    getSessionCookieSetOptions(maxAgeSeconds)
  );
}

export function clearSessionCookieOnResponse(res: NextResponse): void {
  if (crossSiteSessionCookiesEnabled()) {
    res.headers.append(
      "Set-Cookie",
      buildPartitionedDeleteCookieHeader(SESSION_COOKIE)
    );
    return;
  }
  res.cookies.set(SESSION_COOKIE, "", getSessionCookieDeleteOptions());
}
