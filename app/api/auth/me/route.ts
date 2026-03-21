import { NextResponse } from "next/server";
import { authDisabled, getSessionWithProfile } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  if (authDisabled()) {
    return NextResponse.json({
      ok: true,
      authDisabled: true,
      user: null,
      profile: null,
    });
  }
  const s = await getSessionWithProfile();
  if (!s) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    authDisabled: false,
    user: { uid: s.uid, email: s.email },
    profile: s.profile,
  });
}
