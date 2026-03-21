"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  getPresetRange,
  PRESET_OPTIONS,
  type PresetId,
} from "@/lib/timeRange";
import { getEmbedAuthHeaders } from "./embedAuthFetch";
import EmbedColumnManager from "./EmbedColumnManager";
import {
  hiddenSet,
  loadColumnPrefsFromStorage,
  mergeColumnPrefs,
  saveColumnPrefsToStorage,
  type ColumnPrefs,
} from "./embedColumnPrefs";
import EmbedUserMenu from "./EmbedUserMenu";

/** חייב להתאים לסקריפט ההטמעה באלמנטור */
export const LIFTYGO_EMBED_MSG = "liftygo-embed-height" as const;

type ApiOk = {
  ok: true;
  headers: string[];
  count: number;
  rows: Record<string, string>[];
  warning?: string;
};

type ApiErr = { ok: false; error: string };

/** עמודת סטטוס בגיליון — שורות עם ערך זה נחשבות לא מזכות בתשלום */
const LEAD_STATUS_COLUMN = "סטטוס ליד";
const LEAD_STATUS_NOT_APPROVED = "לא אושר";

function normalizeLeadStatusCell(raw: string | undefined): string {
  return (raw ?? "").trim().replace(/\s+/g, " ");
}

function isNonQualifyingLeadRow(row: Record<string, string>): boolean {
  return (
    normalizeLeadStatusCell(row[LEAD_STATUS_COLUMN]) ===
    LEAD_STATUS_NOT_APPROVED
  );
}

function parsePresetParam(raw: string | null): PresetId {
  if (!raw) return "all";
  const ok = PRESET_OPTIONS.some((o) => o.value === raw);
  return ok ? (raw as PresetId) : "all";
}

function useEmbedHeightNotify(
  loading: boolean,
  rowCount: number | undefined,
  err: string | null,
  columnsModalOpen: boolean
) {
  const notify = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.parent === window) return;
    const height = Math.max(
      document.documentElement.scrollHeight,
      document.body?.scrollHeight ?? 0
    );
    window.parent.postMessage(
      { type: LIFTYGO_EMBED_MSG, height },
      "*"
    );
  }, []);

  useEffect(() => {
    notify();
    const t = window.setTimeout(notify, 100);
    const t2 = window.setTimeout(notify, 500);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
    };
  }, [notify, loading, rowCount, err, columnsModalOpen]);

  useEffect(() => {
    window.addEventListener("resize", notify);
    const ro = new ResizeObserver(() => notify());
    ro.observe(document.documentElement);
    return () => {
      window.removeEventListener("resize", notify);
      ro.disconnect();
    };
  }, [notify, loading, rowCount, err, columnsModalOpen]);
}

export default function EmbedDashboard() {
  const searchParams = useSearchParams();
  const initialUtm = searchParams.get("utm_source") ?? "";

  const [utm, setUtm] = useState(initialUtm);
  const [utmLocked, setUtmLocked] = useState(false);
  const [booting, setBooting] = useState(true);
  const [preset, setPreset] = useState<PresetId>(() =>
    parsePresetParam(searchParams.get("range"))
  );
  const [customFrom, setCustomFrom] = useState(
    () => searchParams.get("date_from") ?? ""
  );
  const [customTo, setCustomTo] = useState(
    () => searchParams.get("date_to") ?? ""
  );

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<ApiOk | null>(null);
  const [accountMenu, setAccountMenu] = useState<{
    show: boolean;
    email: string | null;
  }>({ show: false, email: null });
  const [pendingApproval, setPendingApproval] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [columnPrefs, setColumnPrefs] = useState<ColumnPrefs | null>(null);
  const [columnsModalOpen, setColumnsModalOpen] = useState(false);
  /** כבוי = מסתיר שורות «לא אושר» מהטבלה (המונה נשאר מלא) */
  const [showNonQualifyingRows, setShowNonQualifyingRows] = useState(true);

  const onPresetChange = (next: PresetId) => {
    if (next === "custom" && preset !== "custom" && preset !== "all") {
      const r = getPresetRange(preset);
      if (r) {
        setCustomFrom(r.from);
        setCustomTo(r.to);
      }
    }
    setPreset(next);
  };

  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (utm.trim()) q.set("utm_source", utm.trim());

    let df: string | null = null;
    let dt: string | null = null;

    if (preset === "custom") {
      if (customFrom.trim()) df = customFrom.trim();
      if (customTo.trim()) dt = customTo.trim();
    } else if (preset !== "all") {
      const r = getPresetRange(preset);
      if (r) {
        df = r.from;
        dt = r.to;
      }
    }

    if (df) q.set("date_from", df);
    if (dt) q.set("date_to", dt);

    return q.toString();
  }, [utm, preset, customFrom, customTo]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const h = await getEmbedAuthHeaders();
      const url = query ? `/api/orders?${query}` : "/api/orders";
      const res = await fetch(url, {
        cache: "no-store",
        credentials: "include",
        headers: { ...h },
      });
      if (res.status === 401) {
        window.location.href = "/login?returnTo=" + encodeURIComponent("/embed");
        return;
      }
      if (res.status === 403) {
        setPendingApproval(true);
        setPendingEmail(null);
        setData(null);
        return;
      }
      const json = (await res.json()) as ApiOk | ApiErr;
      if (!json.ok) {
        setData(null);
        setErr("error" in json ? json.error : "שגיאה");
        return;
      }
      setData(json);
    } catch {
      setData(null);
      setErr("לא ניתן לטעון נתונים");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const h = await getEmbedAuthHeaders();
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          headers: { ...h },
        });
        if (cancelled) return;
        if (res.status === 401) {
          window.location.href = "/login?returnTo=" + encodeURIComponent("/embed");
          return;
        }
        if (res.status === 403) {
          const j = (await res.json().catch(() => ({}))) as {
            user?: { email?: string };
          };
          setPendingEmail(j.user?.email ?? null);
          setPendingApproval(true);
          setLoading(false);
          return;
        }
        const me = (await res.json()) as {
          ok?: boolean;
          authDisabled?: boolean;
          user?: { email?: string };
          profile?: { role?: string; utmSource?: string };
        };
        if (me.ok && !me.authDisabled && me.profile?.role === "partner") {
          setUtm(me.profile.utmSource ?? "");
          setUtmLocked(true);
        }
        setAccountMenu({
          show: Boolean(me.ok && !me.authDisabled),
          email: me.user?.email ?? null,
        });
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (booting || pendingApproval) return;
    void load();
  }, [booting, pendingApproval, load]);

  useEffect(() => {
    if (!data?.headers?.length) {
      setColumnPrefs(null);
      return;
    }
    const saved = loadColumnPrefsFromStorage();
    setColumnPrefs(mergeColumnPrefs(data.headers, saved));
  }, [data?.headers]);

  const displayHeaders = useMemo(() => {
    if (!data?.headers?.length) return ["אין עמודות"];
    if (!columnPrefs) return data.headers;
    const hidden = hiddenSet(columnPrefs);
    return columnPrefs.order.filter((h) => !hidden.has(h));
  }, [data?.headers, columnPrefs]);

  const nonQualifyingCount = useMemo(() => {
    if (!data?.rows?.length) return 0;
    return data.rows.filter(isNonQualifyingLeadRow).length;
  }, [data?.rows]);

  const displayRows = useMemo(() => {
    if (!data?.rows?.length) return [];
    if (showNonQualifyingRows) return data.rows;
    return data.rows.filter((row) => !isNonQualifyingLeadRow(row));
  }, [data?.rows, showNonQualifyingRows]);

  useEmbedHeightNotify(
    loading || booting || pendingApproval,
    displayRows.length,
    err,
    columnsModalOpen
  );

  async function logout() {
    try {
      await signOut(getFirebaseAuth());
    } catch {
      /* ignore */
    }
    await fetch("/api/auth/session", {
      method: "DELETE",
      credentials: "include",
    });
    window.location.href = "/login?returnTo=" + encodeURIComponent("/embed");
  }

  const presetRange =
    preset !== "all" && preset !== "custom" ? getPresetRange(preset) : null;
  const fromValue =
    preset === "custom" ? customFrom : (presetRange?.from ?? "");
  const toValue = preset === "custom" ? customTo : (presetRange?.to ?? "");
  const datesEditable = preset === "custom";

  if (pendingApproval) {
    return (
      <div className="lg-root">
        <div className="lg-card lg-pending-card">
          <h1 className="lg-title">ממתין לאישור</h1>
          <p className="lg-muted lg-pending-text">
            {pendingEmail ? (
              <>
                החשבון <strong dir="ltr">{pendingEmail}</strong> ממתין לאישור
                מנהל לפני גישה לדשבורד.
              </>
            ) : (
              "החשבון ממתין לאישור מנהל לפני גישה לדשבורד."
            )}
          </p>
          <button type="button" className="lg-btn" onClick={() => void logout()}>
            התנתקות
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lg-root">
      <div className="lg-card">
        <header className="lg-header">
          <div className="lg-header-row">
            <div className="lg-title-block">
              <h1 className="lg-title">דשבורד Liftygo</h1>
            </div>
            {accountMenu.show && (
              <EmbedUserMenu
                email={accountMenu.email}
                onLogout={logout}
              />
            )}
          </div>

          <div className="lg-filters-grid">
            <div className="lg-field">
              <label className="lg-label" htmlFor="utm-source-input">
                utm_source
              </label>
              <input
                id="utm-source-input"
                className="lg-input"
                value={utm}
                onChange={(e) => setUtm(e.target.value)}
                placeholder="לדוגמה: meta, ig"
                dir="ltr"
                autoComplete="off"
                readOnly={utmLocked}
                title={
                  utmLocked
                    ? "שותף: הסינון לפי utm_source נקבע על ידי המנהל"
                    : undefined
                }
              />
            </div>

            <div className="lg-field">
              <label className="lg-label" htmlFor="date-preset-select">
                טווח תאריכים
              </label>
              <select
                id="date-preset-select"
                className="lg-select"
                value={preset}
                onChange={(e) =>
                  onPresetChange(e.target.value as PresetId)
                }
              >
                {PRESET_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {preset !== "all" && (
              <>
                <div className="lg-field">
                  <label className="lg-label" htmlFor="date-from">
                    מתאריך
                  </label>
                  <input
                    id="date-from"
                    className="lg-input"
                    type="date"
                    value={fromValue}
                    readOnly={!datesEditable}
                    onChange={(e) => {
                      if (datesEditable) setCustomFrom(e.target.value);
                    }}
                  />
                </div>
                <div className="lg-field">
                  <label className="lg-label" htmlFor="date-to">
                    עד תאריך
                  </label>
                  <input
                    id="date-to"
                    className="lg-input"
                    type="date"
                    value={toValue}
                    readOnly={!datesEditable}
                    onChange={(e) => {
                      if (datesEditable) setCustomTo(e.target.value);
                    }}
                  />
                </div>
              </>
            )}

            <div className="lg-filters-actions">
              <button
                type="button"
                className="lg-btn-columns"
                onClick={() => setColumnsModalOpen(true)}
                disabled={booting || !data?.headers?.length}
                aria-haspopup="dialog"
              >
                <svg
                  className="lg-btn-columns-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                נהל עמודות
              </button>
              <button
                type="button"
                className="lg-btn"
                onClick={() => void load()}
                disabled={booting}
              >
                רענן
              </button>
              {data && (
                <>
                  <span className="lg-badge">{data.count} רשומות</span>
                  <button
                    type="button"
                    className={`lg-badge lg-badge-nonqual lg-badge-nonqual-toggle ${!showNonQualifyingRows ? "is-off" : ""}`}
                    disabled={nonQualifyingCount === 0}
                    onClick={() =>
                      setShowNonQualifyingRows((v) => !v)
                    }
                    aria-pressed={showNonQualifyingRows}
                    title={
                      showNonQualifyingRows
                        ? "לחץ להסתרת שורות לא מזכות מהטבלה (המונה נשאר)"
                        : "לחץ להצגת שורות לא מזכות בטבלה"
                    }
                  >
                    {showNonQualifyingRows ? (
                      <svg
                        className="lg-badge-nonqual-eye"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : (
                      <svg
                        className="lg-badge-nonqual-eye"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L4.5 4.5m1.728 1.728L19.07 19.07l-1.728 1.728L6.228 6.228z" />
                      </svg>
                    )}
                    <span>{nonQualifyingCount} לא מזכות</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="lg-body">
          {(loading || booting) && <p className="lg-muted">טוען נתונים…</p>}
          {err && !loading && !booting && (
            <p className="lg-error" role="alert">
              {err}
            </p>
          )}

          {!loading && !booting && data?.warning && (
            <p className="lg-error" role="status">
              {data.warning}
            </p>
          )}

          {!loading &&
            !booting &&
            data &&
            !data.warning &&
            data.rows.length === 0 && (
            <p className="lg-muted">אין שורות שתואמות את הסינון.</p>
          )}

          {!loading &&
            !booting &&
            data &&
            data.rows.length > 0 &&
            displayHeaders.length === 0 &&
            displayHeaders[0] !== "אין עמודות" && (
            <p className="lg-muted" role="status">
              לא נבחרו עמודות להצגה. לחץ «נהל עמודות» וסמן לפחות עמודה אחת.
            </p>
          )}

          {!loading &&
            !booting &&
            data &&
            data.rows.length > 0 &&
            displayRows.length === 0 &&
            displayHeaders.length > 0 && (
            <p className="lg-muted" role="status">
              שורות לא מזכות מוסתרות. לחץ על העין ב־«לא מזכות» כדי להציג את
              כולן.
            </p>
          )}

          {!loading &&
            !booting &&
            data &&
            data.rows.length > 0 &&
            displayRows.length > 0 &&
            displayHeaders.length > 0 && (
            <div className="lg-table-scroll">
              <table className="lg-table">
                <thead>
                  <tr>
                    {displayHeaders.map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row, i) => (
                    <tr
                      key={i}
                      className={
                        isNonQualifyingLeadRow(row)
                          ? "lg-row-non-qualifying"
                          : undefined
                      }
                    >
                      {displayHeaders.map((h) => (
                        <td key={h}>{row[h] ?? ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {data?.headers?.length ? (
        <EmbedColumnManager
          open={columnsModalOpen}
          apiHeaders={data.headers}
          initialPrefs={
            columnPrefs ??
            mergeColumnPrefs(data.headers, loadColumnPrefsFromStorage())
          }
          onClose={() => setColumnsModalOpen(false)}
          onConfirm={(prefs) => {
            saveColumnPrefsToStorage(prefs);
            setColumnPrefs(prefs);
          }}
        />
      ) : null}
    </div>
  );
}
