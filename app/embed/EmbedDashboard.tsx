"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type ApiOk = {
  ok: true;
  headers: string[];
  count: number;
  rows: Record<string, string>[];
};

type ApiErr = { ok: false; error: string };

export default function EmbedDashboard() {
  const searchParams = useSearchParams();
  const initialUtm = searchParams.get("utm_source") ?? "";

  const [utm, setUtm] = useState(initialUtm);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<ApiOk | null>(null);

  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (utm.trim()) q.set("utm_source", utm.trim());
    return q.toString();
  }, [utm]);

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

  const displayHeaders = data?.headers?.length
    ? data.headers
    : ["אין עמודות"];

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "16px 16px 32px",
        maxWidth: "100%",
      }}
    >
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "flex-end",
          marginBottom: 16,
          borderBottom: "1px solid #2a3441",
          paddingBottom: 12,
        }}
      >
        <div style={{ flex: "1 1 200px" }}>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 4 }}>
            סינון לפי utm_source
          </div>
          <input
            value={utm}
            onChange={(e) => setUtm(e.target.value)}
            placeholder="לדוגמה: meta, ig"
            dir="ltr"
            style={{
              width: "100%",
              maxWidth: 320,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #3d4a5c",
              background: "#151c24",
              color: "#e7ecf3",
              fontSize: 15,
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => void load()}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "1px solid #3d6fd9",
            background: "#1e3a6e",
            color: "#e7ecf3",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          רענן
        </button>
        {data && (
          <div style={{ fontSize: 14, opacity: 0.9 }}>
            רשומות: <strong>{data.count}</strong>
          </div>
        )}
      </header>

      {loading && <p style={{ opacity: 0.85 }}>טוען…</p>}
      {err && !loading && (
        <p style={{ color: "#ff8a8a" }} role="alert">
          {err}
        </p>
      )}

      {!loading && data && data.rows.length === 0 && (
        <p style={{ opacity: 0.85 }}>אין שורות שתואמות את הסינון.</p>
      )}

      {!loading && data && data.rows.length > 0 && (
        <div style={{ overflow: "auto", borderRadius: 8, border: "1px solid #2a3441" }}>
          <table
            style={{
              borderCollapse: "collapse",
              width: "max-content",
              minWidth: "100%",
              fontSize: 13,
            }}
          >
            <thead>
              <tr style={{ background: "#151c24" }}>
                {displayHeaders.map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 12px",
                      textAlign: "right",
                      borderBottom: "1px solid #2a3441",
                      whiteSpace: "nowrap",
                      fontWeight: 600,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => (
                <tr key={i} style={{ background: i % 2 ? "#121820" : "#0f1419" }}>
                  {displayHeaders.map((h) => (
                    <td
                      key={h}
                      style={{
                        padding: "8px 12px",
                        borderBottom: "1px solid #1f2833",
                        verticalAlign: "top",
                        maxWidth: 360,
                        wordBreak: "break-word",
                      }}
                    >
                      {row[h] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
