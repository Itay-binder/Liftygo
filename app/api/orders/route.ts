import { NextRequest, NextResponse } from "next/server";
import {
  fetchSheetMatrix,
  filterByUtmSource,
  matrixToObjects,
} from "@/lib/sheets";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const utm = req.nextUrl.searchParams.get("utm_source");
    const matrix = await fetchSheetMatrix();
    const { headers, records } = matrixToObjects(matrix);
    const filtered = filterByUtmSource(records, utm);
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
