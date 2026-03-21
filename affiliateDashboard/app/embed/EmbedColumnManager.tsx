"use client";

import { useCallback, useEffect, useState } from "react";
import type { ColumnPrefs } from "./embedColumnPrefs";

type Props = {
  open: boolean;
  apiHeaders: string[];
  initialPrefs: ColumnPrefs;
  onClose: () => void;
  onConfirm: (prefs: ColumnPrefs) => void;
};

function reorder<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0) return list;
  if (from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function EmbedColumnManager({
  open,
  apiHeaders,
  initialPrefs,
  onClose,
  onConfirm,
}: Props) {
  const [draftOrder, setDraftOrder] = useState<string[]>(initialPrefs.order);
  const [draftHidden, setDraftHidden] = useState<Set<string>>(
    () => new Set(initialPrefs.hidden)
  );

  useEffect(() => {
    if (!open) return;
    setDraftOrder(initialPrefs.order);
    setDraftHidden(new Set(initialPrefs.hidden));
  }, [open, initialPrefs.order, initialPrefs.hidden]);

  const toggleVisible = useCallback((key: string) => {
    setDraftHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const onDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    const from = parseInt(raw, 10);
    if (Number.isNaN(from)) return;
    setDraftOrder((prev) => reorder(prev, from, targetIndex));
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function confirm() {
    onConfirm({
      order: draftOrder,
      hidden: [...draftHidden],
    });
    onClose();
  }

  return (
    <div
      className="lg-col-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="lg-col-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lg-col-modal-title"
      >
        <h2 id="lg-col-modal-title" className="lg-col-modal-title">
          עמודות בטבלה
        </h2>

        <ul className="lg-col-list">
          {draftOrder.map((key, index) => (
            <li
              key={key}
              className="lg-col-row"
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, index)}
            >
              <span
                className="lg-col-drag"
                draggable
                aria-hidden
                title="גרירה לשינוי סדר"
                onDragStart={(e) => onDragStart(e, index)}
              >
                ⋮⋮
              </span>
              <label className="lg-col-check-label">
                <input
                  type="checkbox"
                  className="lg-col-check"
                  checked={!draftHidden.has(key)}
                  onChange={() => toggleVisible(key)}
                />
                <span className="lg-col-name" dir="auto">
                  {key}
                </span>
              </label>
            </li>
          ))}
        </ul>

        <div className="lg-col-actions">
          <button
            type="button"
            className="lg-col-btn lg-col-btn-secondary"
            onClick={() => {
              setDraftOrder([...apiHeaders]);
              setDraftHidden(new Set());
            }}
          >
            סדר ברירת מחדל
          </button>
          <button
            type="button"
            className="lg-col-btn lg-col-btn-primary"
            onClick={confirm}
          >
            אישור
          </button>
        </div>
      </div>
    </div>
  );
}
