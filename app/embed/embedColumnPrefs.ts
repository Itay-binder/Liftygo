export const EMBED_COLUMNS_LS_KEY = "liftygo.embed.columns.v1";

export type ColumnPrefs = {
  order: string[];
  hidden: string[];
};

export function loadColumnPrefsFromStorage(): ColumnPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(EMBED_COLUMNS_LS_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as { order?: unknown; hidden?: unknown };
    if (!Array.isArray(j.order)) return null;
    return {
      order: j.order.filter((x): x is string => typeof x === "string"),
      hidden: Array.isArray(j.hidden)
        ? j.hidden.filter((x): x is string => typeof x === "string")
        : [],
    };
  } catch {
    return null;
  }
}

export function saveColumnPrefsToStorage(p: ColumnPrefs): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(EMBED_COLUMNS_LS_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

/** מיזוג סדר שמור עם עמודות מה־API (חדשות בסוף, נעלמות נזרקות) */
export function mergeColumnPrefs(
  apiHeaders: string[],
  saved: ColumnPrefs | null
): ColumnPrefs {
  const order: string[] = [];
  const seen = new Set<string>();
  if (saved?.order?.length) {
    for (const h of saved.order) {
      if (apiHeaders.includes(h) && !seen.has(h)) {
        order.push(h);
        seen.add(h);
      }
    }
  }
  for (const h of apiHeaders) {
    if (!seen.has(h)) {
      order.push(h);
      seen.add(h);
    }
  }
  const hiddenSet = new Set(
    saved?.hidden?.filter((h) => apiHeaders.includes(h)) ?? []
  );
  return { order, hidden: [...hiddenSet] };
}

export function hiddenSet(prefs: ColumnPrefs): Set<string> {
  return new Set(prefs.hidden);
}
