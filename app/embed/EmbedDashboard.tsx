"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getPresetRange,
  PRESET_OPTIONS,
  type PresetId,
} from "@/lib/timeRange";

/** חייב להתאים לסקריפט ההטמעה באלמנטור */
export const LIFTYGO_EMBED_MSG = "liftygo-embed-height" as const;

type ApiOk = {
  ok: true;
  headers: string[];
  count: number;
  rows: Record<string, string>[];
};

type ApiErr = { ok: false; error: string };

function parsePresetParam(raw: string | null): PresetId {
  if (!raw) return "all";
  const ok = PRESET_OPTIONS.some((o) => o.value === raw);
  return ok ? (raw as PresetId) : "all";
}

function useEmbedHeightNotify(
  loading: boolean,
  rowCount: number | undefined,
  err: string | null
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
  }, [notify, loading, rowCount, err]);

  useEffect(() => {
    window.addEventListener("resize", notify);
    const ro = new ResizeObserver(() => notify());
    ro.observe(document.documentElement);
    return () => {
      window.removeEventListener("resize", notify);
      ro.disconnect();
    };
  }, [notify]);
}

export default function EmbedDashboard() {
  const searchParams = useSearchParams();
  const initialUtm = searchParams.get("utm_source") ?? "";

  const [utm, setUtm] = useState(initialUtm);
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
      const url = query ? `/api/orders?${query}` : "/api/orders";
      const res = await fetch(url, { cache: "no-store" });
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
    void load();
  }, [load]);

  useEmbedHeightNotify(loading, data?.rows?.length, err);

  const displayHeaders = data?.headers?.length
    ? data.headers
    : ["אין עמודות"];

  return (
    <div className="lg-root">
      <div className="lg-card">
        <header className="lg-header">
          <div className="lg-title-block">
            <h1 className="lg-title">דשבורד Liftygo</h1>
            <p className="lg-sub">
              סינון לפי מקור (utm_source) ולפי זמן — לפי עמודת{" "}
              <strong>תאריך הזמנה</strong> בגיליון (ניתן לשנות ב־Vercel:
              GOOGLE_DATE_COLUMN).
            </p>
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
                onChange={(e) => setPreset(e.target.value as PresetId)}
              >
                {PRESET_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p className="lg-hint">
                השבוע מתחיל ביום ראשון. תאריכים לפי אזור הזמן של הדפדפן.
              </p>
            </div>

            {preset === "custom" && (
              <>
                <div className="lg-field">
                  <label className="lg-label" htmlFor="date-from">
                    מתאריך
                  </label>
                  <input
                    id="date-from"
                    className="lg-input"
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
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
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="lg-filters-actions">
              <button
                type="button"
                className="lg-btn"
                onClick={() => void load()}
              >
                רענן
              </button>
              {data && (
                <span className="lg-badge">{data.count} רשומות</span>
              )}
            </div>
          </div>
        </header>

        <div className="lg-body">
          {loading && <p className="lg-muted">טוען נתונים…</p>}
          {err && !loading && (
            <p className="lg-error" role="alert">
              {err}
            </p>
          )}

          {!loading && data && data.rows.length === 0 && (
            <p className="lg-muted">אין שורות שתואמות את הסינון.</p>
          )}

          {!loading && data && data.rows.length > 0 && (
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
                  {data.rows.map((row, i) => (
                    <tr key={i}>
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
    </div>
  );
}
