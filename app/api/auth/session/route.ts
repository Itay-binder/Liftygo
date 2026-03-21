import { NextRequest, NextResponse } from "next/server";
import { mayCreateSession } from "@/lib/auth/invites";
import { ensureUserDoc } from "@/lib/auth/profile";
import { authDisabled, SESSION_COOKIE } from "@/lib/auth/session";
import { getAdminAuth } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

const EXPIRES_MS = 1000 * 60 * 60 * 24 * 5; // 5 days

export async function POST(req: NextRequest) {
  if (authDisabled()) {
    return NextResponse.json(
      { error: "Auth disabled in this environment" },
      { status: 400 }
    );
  }
  try {
    const body = (await req.json()) as { idToken?: string };
    const idToken = body.idToken?.trim();
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const allowed = await mayCreateSession(decoded.uid, decoded.email);
    if (!allowed) {
      return NextResponse.json(
        {
          error:
            "האימייל לא ברשימת ההזמנות. צור קשר עם המנהל כדי להוסיף אותך.",
          code: "NOT_INVITED",
        },
        { status: 403 }
      );
    }
    await ensureUserDoc(decoded.uid, decoded.email);
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: EXPIRES_MS,
    });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(EXPIRES_MS / 1000),
    });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}
