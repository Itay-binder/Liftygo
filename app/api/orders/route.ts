import { NextRequest, NextResponse } from "next/server";
import {
  fetchSheetMatrix,
  filterByDateRange,
  filterByUtmSource,
  matrixToObjects,
} from "@/lib/sheets";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const utm = req.nextUrl.searchParams.get("utm_source");
    const dateFrom = req.nextUrl.searchParams.get("date_from");
    const dateTo = req.nextUrl.searchParams.get("date_to");
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
