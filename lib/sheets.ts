import { google } from "googleapis";

function getServiceAccountCredentials(): {
  client_email: string;
  private_key: string;
} {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw?.trim()) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");
  }
  const parsed = JSON.parse(raw) as { client_email?: string; private_key?: string };
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON must include client_email and private_key");
  }
  return {
    client_email: parsed.client_email,
    private_key: parsed.private_key.replace(/\\n/g, "\n"),
  };
}

export async function fetchSheetMatrix(): Promise<string[][]> {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID?.trim();
  if (!spreadsheetId) {
    throw new Error("Missing GOOGLE_SPREADSHEET_ID");
  }

  const range =
    process.env.GOOGLE_SHEET_RANGE?.trim() ||
    "'הזמנות (לא לשנות שם - MAKE)'!A:AL";

  const creds = getServiceAccountCredentials();
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const values = res.data.values;
  if (!values?.length) {
    return [];
  }
  return values as string[][];
}

export function matrixToObjects(rows: string[][]): {
  headers: string[];
  records: Record<string, string>[];
} {
  if (rows.length < 2) {
    return { headers: rows[0] ?? [], records: [] };
  }
  const headers = rows[0].map((h) => String(h ?? "").trim());
  const records: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c] || `col_${c}`;
      obj[key] = row?.[c] != null ? String(row[c]) : "";
    }
    records.push(obj);
  }
  return { headers, records };
}

const UTM_KEYS = ["utm_source", "utm_source ", "UTM_SOURCE"];

export function pickUtmSource(row: Record<string, string>): string {
  for (const k of UTM_KEYS) {
    if (k in row && row[k]?.trim()) return row[k].trim();
  }
  const direct = Object.keys(row).find((k) => k.trim().toLowerCase() === "utm_source");
  return direct ? row[direct].trim() : "";
}

export function filterByUtmSource(
  records: Record<string, string>[],
  utm: string | null
): Record<string, string>[] {
  if (!utm?.trim()) return records;
  const needle = utm.trim().toLowerCase();
  return records.filter((r) => pickUtmSource(r).toLowerCase() === needle);
}
