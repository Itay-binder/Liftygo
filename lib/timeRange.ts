import {
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subQuarters,
  subWeeks,
  subYears,
} from "date-fns";

/** ללא אפשרויות "עתיד" — רק היסטוריה / הווה / טווח מותאם */
export type PresetId =
  | "all"
  | "last7days"
  | "last30days"
  | "yesterday"
  | "today"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "last_quarter"
  | "this_year"
  | "last_year"
  | "till_date"
  | "custom";

const weekOpts = { weekStartsOn: 0 as const }; // Sunday

export function getPresetRange(
  preset: PresetId,
  now = new Date()
): { from: string; to: string } | null {
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");

  switch (preset) {
    case "all":
      return null;
    case "last7days":
      return { from: fmt(subDays(now, 6)), to: fmt(now) };
    case "last30days":
      return { from: fmt(subDays(now, 29)), to: fmt(now) };
    case "yesterday": {
      const y = subDays(now, 1);
      return { from: fmt(y), to: fmt(y) };
    }
    case "today":
      return { from: fmt(now), to: fmt(now) };
    case "this_week":
      return {
        from: fmt(startOfWeek(now, weekOpts)),
        to: fmt(endOfWeek(now, weekOpts)),
      };
    case "last_week": {
      const ref = subWeeks(now, 1);
      return {
        from: fmt(startOfWeek(ref, weekOpts)),
        to: fmt(endOfWeek(ref, weekOpts)),
      };
    }
    case "this_month":
      return { from: fmt(startOfMonth(now)), to: fmt(endOfMonth(now)) };
    case "last_month": {
      const ref = subMonths(now, 1);
      return { from: fmt(startOfMonth(ref)), to: fmt(endOfMonth(ref)) };
    }
    case "this_quarter":
      return { from: fmt(startOfQuarter(now)), to: fmt(endOfQuarter(now)) };
    case "last_quarter": {
      const ref = subQuarters(now, 1);
      return { from: fmt(startOfQuarter(ref)), to: fmt(endOfQuarter(ref)) };
    }
    case "this_year":
      return { from: fmt(startOfYear(now)), to: fmt(endOfYear(now)) };
    case "last_year": {
      const ref = subYears(now, 1);
      return { from: fmt(startOfYear(ref)), to: fmt(endOfYear(ref)) };
    }
    case "till_date":
      return { from: "1970-01-01", to: fmt(now) };
    case "custom":
      return null;
    default:
      return null;
  }
}

export const PRESET_OPTIONS: { value: PresetId; label: string }[] = [
  { value: "all", label: "הכל (ללא סינון תאריכים)" },
  { value: "last7days", label: "7 ימים אחרונים" },
  { value: "last30days", label: "30 ימים אחרונים" },
  { value: "yesterday", label: "אתמול" },
  { value: "today", label: "היום" },
  { value: "this_week", label: "השבוע" },
  { value: "last_week", label: "שבוע שעבר" },
  { value: "this_month", label: "החודש" },
  { value: "last_month", label: "חודש שעבר" },
  { value: "this_quarter", label: "הרבעון" },
  { value: "last_quarter", label: "הרבעון הקודם" },
  { value: "this_year", label: "השנה" },
  { value: "last_year", label: "שנה שעברה" },
  { value: "till_date", label: "עד היום" },
  { value: "custom", label: "מותאם (מתאריך / עד תאריך)" },
];
