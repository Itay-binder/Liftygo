"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  email: string | null;
  onLogout: () => void;
};

function avatarLetter(email: string | null): string {
  const s = email?.trim() ?? "";
  if (!s) return "?";
  const ch = s[0];
  return /[a-z]/i.test(ch) ? ch.toUpperCase() : ch;
}

export default function EmbedUserMenu({ email, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onDoc);
      return () => document.removeEventListener("mousedown", onDoc);
    }
  }, [open]);

  return (
    <div className="lg-user-menu" ref={wrapRef}>
      <button
        type="button"
        className="lg-user-avatar"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="תפריט משתמש"
        onClick={() => setOpen((o) => !o)}
        title={email ?? "משתמש"}
      >
        {avatarLetter(email)}
      </button>
      {open && (
        <div className="lg-user-dropdown" role="menu">
          {email ? (
            <div className="lg-user-email" dir="ltr">
              {email}
            </div>
          ) : (
            <div className="lg-user-email lg-user-email-muted">—</div>
          )}
          <button
            type="button"
            className="lg-user-logout"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void onLogout();
            }}
          >
            התנתקות
          </button>
        </div>
      )}
    </div>
  );
}
