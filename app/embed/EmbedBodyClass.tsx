"use client";

import { useEffect } from "react";

/** מסמן את body לעיצוב בהיר בדף embed בלבד */
export function EmbedBodyClass() {
  useEffect(() => {
    document.body.classList.add("embed-route");
    return () => document.body.classList.remove("embed-route");
  }, []);
  return null;
}
