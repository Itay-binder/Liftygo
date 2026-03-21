import {
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  addYears,
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

export type PresetId =
  | "all"
  | "last7days"
  | "last30days"
  | "yesterday"
  | "today"
  | "tomorrow"
  | "this_week"
  | "last_week"
  | "next_week"
  | "this_month"
  | "last_month"
  | "next_month"
  | "this_quarter"
  | "last_quarter"
  | "next_quarter"
  | "this_year"
  | "last_year"
  | "next_year"
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
    case "tomorrow": {
      const t = addDays(now, 1);
      return { from: fmt(t), to: fmt(t) };
    }
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
    case "next_week": {
      const ref = addWeeks(now, 1);
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
    case "next_month": {
      const ref = addMonths(now, 1);
      return { from: fmt(startOfMonth(ref)), to: fmt(endOfMonth(ref)) };
    }
    case "this_quarter":
      return { from: fmt(startOfQuarter(now)), to: fmt(endOfQuarter(now)) };
    case "last_quarter": {
      const ref = subQuarters(now, 1);
      return { from: fmt(startOfQuarter(ref)), to: fmt(endOfQuarter(ref)) };
    }
    case "next_quarter": {
      const ref = addQuarters(startOfQuarter(now), 1);
      return { from: fmt(ref), to: fmt(endOfQuarter(ref)) };
    }
    case "this_year":
      return { from: fmt(startOfYear(now)), to: fmt(endOfYear(now)) };
    case "last_year": {
      const ref = subYears(now, 1);
      return { from: fmt(startOfYear(ref)), to: fmt(endOfYear(ref)) };
    }
    case "next_year": {
      const ref = addYears(now, 1);
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
  { value: "tomorrow", label: "מחר" },
  { value: "this_week", label: "השבוע" },
  { value: "last_week", label: "שבוע שעבר" },
  { value: "next_week", label: "שבוע הבא" },
  { value: "this_month", label: "החודש" },
  { value: "last_month", label: "חודש שעבר" },
  { value: "next_month", label: "חודש הבא" },
  { value: "this_quarter", label: "הרבעון" },
  { value: "last_quarter", label: "הרבעון הקודם" },
  { value: "next_quarter", label: "הרבעון הבא" },
  { value: "this_year", label: "השנה" },
  { value: "last_year", label: "שנה שעברה" },
  { value: "next_year", label: "שנה הבאה" },
  { value: "till_date", label: "עד היום" },
  { value: "custom", label: "מותאם (מתאריך / עד תאריך)" },
];
