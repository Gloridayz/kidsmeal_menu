import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getMonthGridDays(anchor: Date): Date[] {
  const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(anchor), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

export function getWeekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor, { weekStartsOn: 0 });
  const end = endOfWeek(anchor, { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

export const WEEKDAY_LABELS_KO = ["일", "월", "화", "수", "목", "금", "토"];
