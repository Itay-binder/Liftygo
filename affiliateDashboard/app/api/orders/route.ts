import { NextRequest, NextResponse } from "next/server";
import { getVerifiedAuthFromRequest } from "@/lib/auth/fromRequest";
import { ensureUserDoc, getUserProfile } from "@/lib/auth/profile";
import { authDisabled } from "@/lib/auth/session";
import {
  fetchSheetMatrix,
  filterByDateRange,
  filterByUtmSource,
  matrixToObjects,
} from "@/lib/sheets";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  let utm = req.nextUrl.searchParams.get("utm_source");
  const dateFrom = req.nextUrl.searchParams.get("date_from");
  const dateTo = req.nextUrl.searchParams.get("date_to");

  if (!authDisabled()) {
    const authUser = await getVerifiedAuthFromRequest(req);
    if (!authUser) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    try {
      await ensureUserDoc(authUser.uid, authUser.email);
      const profile = await getUserProfile(authUser.uid, authUser.email);
      if (!profile) {
        return NextResponse.json(
          { ok: false, error: "No profile" },
          { status: 403 }
        );
      }
      if (!profile.approved) {
        return NextResponse.json(
          { ok: false, error: "Not approved" },
          { status: 403 }
        );
      }
      if (profile.role === "partner") {
        const u = profile.utmSource?.trim();
        if (!u) {
          const matrix = await fetchSheetMatrix();
          const { headers } = matrixToObjects(matrix);
          return NextResponse.json({
            ok: true,
            headers,
            count: 0,
            rows: [],
            warning:
              "לא הוגדר utm_source לחשבון. פנה למנהל לאישור והגדרה בפיירסטור.",
          });
        }
        utm = u;
      }
    } catch {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  try {
    const matrix = await fetchSheetMatrix();
    const { headers, records } = matrixToObjects(matrix);
    let filtered = filterByUtmSource(records, utm);
    filtered = filterByDateRange(filtered, headers, dateFrom, dateTo);
    return NextResponse.json({
      ok: true,
      headers,
      count: filtered.length,
      rows: filtered,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
