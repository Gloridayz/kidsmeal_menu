import { isSameMonth, isToday } from "date-fns";
import type { Menu } from "@/lib/types";
import { WEEKDAY_LABELS_KO, getMonthGridDays, toDateKey } from "@/lib/date-utils";

export default function MonthView({
  anchor,
  menusByDate,
  selectedDate,
  onSelectDate,
}: {
  anchor: Date;
  menusByDate: Map<string, Menu>;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}) {
  const days = getMonthGridDays(anchor);

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <div className="grid grid-cols-7 border-b border-black/5 dark:border-white/5">
        {WEEKDAY_LABELS_KO.map((label) => (
          <div
            key={label}
            className="px-2 py-2 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = toDateKey(day);
          const menu = menusByDate.get(key);
          const inMonth = isSameMonth(day, anchor);
          const selected = toDateKey(selectedDate) === key;
          return (
            <button
              key={key}
              onClick={() => onSelectDate(day)}
              className={`flex min-h-[76px] flex-col items-start gap-1 border-b border-r border-black/5 p-2 text-left last:border-r-0 dark:border-white/5 ${
                inMonth ? "bg-white dark:bg-zinc-900" : "bg-zinc-50 dark:bg-zinc-950/50"
              } ${selected ? "ring-2 ring-inset ring-zinc-900 dark:ring-zinc-50" : ""} hover:bg-zinc-50 dark:hover:bg-zinc-800/60`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  isToday(day)
                    ? "bg-zinc-900 font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900"
                    : inMonth
                      ? "text-zinc-700 dark:text-zinc-300"
                      : "text-zinc-400 dark:text-zinc-600"
                }`}
              >
                {day.getDate()}
              </span>
              {menu?.lunch && (
                <span className="line-clamp-2 w-full text-[11px] leading-tight text-zinc-500 dark:text-zinc-400">
                  {menu.lunch}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
