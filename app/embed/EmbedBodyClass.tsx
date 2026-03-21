"use client";

import { useEffect } from "react";

/**
 * ב־iframe: מוסיף `embed-seamless` — רקע שקוף ובלי צל/מסגרת של הקלף,
 * כדי שייראה חלק מהדף האם (ולא «קופסה בתוך קופסה»).
 * `?seamless=0` — כיבוי גם ב־iframe; `?seamless=1` — כפייה (תצוגה מקדימה).
 */
function shouldUseSeamlessEmbed(): boolean {
  if (typeof window === "undefined") return false;
  const q = new URLSearchParams(window.location.search);
  if (q.get("seamless") === "0") return false;
  if (q.get("seamless") === "1") return true;
  return window.self !== window.top;
}

/** מסמן את body לעיצוב בהיר בדף embed בלבד */
export function EmbedBodyClass() {
  useEffect(() => {
    document.body.classList.add("embed-route");
    const seamless = shouldUseSeamlessEmbed();
    if (seamless) {
      document.documentElement.classList.add("embed-seamless");
      document.body.classList.add("embed-seamless");
    }
    return () => {
      document.body.classList.remove("embed-route");
      document.documentElement.classList.remove("embed-seamless");
      document.body.classList.remove("embed-seamless");
    };
  }, []);
  return null;
}
