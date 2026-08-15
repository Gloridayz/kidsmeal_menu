"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { ko } from "date-fns/locale";
import { supabase } from "@/lib/supabase/client";
import type { Menu } from "@/lib/types";
import { getMonthGridDays, toDateKey } from "@/lib/date-utils";
import ViewToggle, { ViewMode } from "./ViewToggle";
import MonthView from "./MonthView";
import WeekView from "./WeekView";
import MenuDetailPanel from "./MenuDetailPanel";

function getRange(viewMode: ViewMode, anchor: Date): { start: Date; end: Date } {
  if (viewMode === "month") {
    const days = getMonthGridDays(anchor);
    return { start: days[0], end: days[days.length - 1] };
  }
  if (viewMode === "week") {
    return {
      start: startOfWeek(anchor, { weekStartsOn: 0 }),
      end: endOfWeek(anchor, { weekStartsOn: 0 }),
    };
  }
  return { start: anchor, end: anchor };
}

function getHeaderLabel(viewMode: ViewMode, anchor: Date): string {
  if (viewMode === "month") return format(anchor, "yyyy년 M월", { locale: ko });
  if (viewMode === "week") {
    const start = startOfWeek(anchor, { weekStartsOn: 0 });
    const end = endOfWeek(anchor, { weekStartsOn: 0 });
    const sameMonth = start.getMonth() === end.getMonth();
    return sameMonth
      ? `${format(start, "yyyy년 M월 d일", { locale: ko })} - ${format(end, "d일", { locale: ko })}`
      : `${format(start, "M월 d일", { locale: ko })} - ${format(end, "M월 d일", { locale: ko })}`;
  }
  return format(anchor, "yyyy년 M월 d일 (EEEE)", { locale: ko });
}

export default function CalendarView() {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [menus, setMenus] = useState<Menu[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadedRangeKey, setLoadedRangeKey] = useState<string | null>(null);

  const { start, end } = useMemo(() => getRange(viewMode, anchor), [viewMode, anchor]);
  const fetchStart = viewMode === "month" ? startOfMonth(anchor) : start;
  const fetchEnd = viewMode === "month" ? endOfMonth(anchor) : end;
  const rangeKey = `${toDateKey(fetchStart)}_${toDateKey(fetchEnd)}`;
  const loading = loadedRangeKey !== rangeKey;

  useEffect(() => {
    let cancelled = false;
    const [rangeStart, rangeEnd] = rangeKey.split("_");
    supabase
      .from("menus")
      .select("*")
      .gte("date", rangeStart)
      .lte("date", rangeEnd)
      .order("date", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setError("식단 정보를 불러오지 못했습니다.");
        } else {
          setMenus(data ?? []);
          setError(null);
        }
        setLoadedRangeKey(rangeKey);
      });
    return () => {
      cancelled = true;
    };
  }, [rangeKey]);

  const menusByDate = useMemo(() => {
    const map = new Map<string, Menu>();
    for (const m of menus) map.set(m.date, m);
    return map;
  }, [menus]);

  function goPrev() {
    if (viewMode === "month") setAnchor((d) => subMonths(d, 1));
    else if (viewMode === "week") setAnchor((d) => subWeeks(d, 1));
    else {
      const next = subDays(anchor, 1);
      setAnchor(next);
      setSelectedDate(next);
    }
  }

  function goNext() {
    if (viewMode === "month") setAnchor((d) => addMonths(d, 1));
    else if (viewMode === "week") setAnchor((d) => addWeeks(d, 1));
    else {
      const next = addDays(anchor, 1);
      setAnchor(next);
      setSelectedDate(next);
    }
  }

  function goToday() {
    const today = new Date();
    setAnchor(today);
    setSelectedDate(today);
  }

  function handleSelectDate(date: Date) {
    setSelectedDate(date);
    if (viewMode !== "day") setAnchor(date);
  }

  function handleViewChange(mode: ViewMode) {
    setViewMode(mode);
    setAnchor(selectedDate);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          우리반 식단표
        </h1>
        <ViewToggle value={viewMode} onChange={handleViewChange} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            aria-label="이전"
            className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            ‹
          </button>
          <button
            onClick={goNext}
            aria-label="다음"
            className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            ›
          </button>
          <button
            onClick={goToday}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            오늘
          </button>
        </div>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {getHeaderLabel(viewMode, anchor)}
        </p>
      </div>

      {loading && (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">불러오는 중...</p>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {!loading && !error && (
        <>
          {viewMode === "month" && (
            <MonthView
              anchor={anchor}
              menusByDate={menusByDate}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
          )}
          {viewMode === "week" && (
            <WeekView
              anchor={anchor}
              menusByDate={menusByDate}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
          )}

          <MenuDetailPanel date={selectedDate} menu={menusByDate.get(toDateKey(selectedDate)) ?? null} />
        </>
      )}
    </div>
  );
}
