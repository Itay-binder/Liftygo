/** שמות שדות אפשריים ב-Firestore (הוזמנו בשגיאות שונות) */
const UTM_KEYS = ["utmSource", "utmSOURCE", "utm_source"] as const;

/**
 * מנקה ערך utm מהגיליון/מ-Firestore אם הוזנו מרכאות כחלק מהמחרוזת.
 */
export function normalizeUtmValue(raw: string): string {
  let s = raw.trim();
  while (s.length >= 2) {
    const q =
      (s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'"));
    if (!q) break;
    s = s.slice(1, -1).trim();
  }
  return s;
}

export function pickUtmFromRecord(
  d: Record<string, unknown> | null | undefined
): string {
  if (!d) return "";
  for (const k of UTM_KEYS) {
    const v = d[k];
    if (typeof v === "string" && v.trim()) {
      return normalizeUtmValue(v);
    }
  }
  return "";
}
