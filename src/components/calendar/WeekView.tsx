import { isToday } from "date-fns";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { Menu } from "@/lib/types";
import { getWeekDays, toDateKey } from "@/lib/date-utils";

export default function WeekView({
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
  const days = getWeekDays(anchor);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {days.map((day) => {
        const key = toDateKey(day);
        const menu = menusByDate.get(key);
        const selected = toDateKey(selectedDate) === key;
        return (
          <button
            key={key}
            onClick={() => onSelectDate(day)}
            className={`flex flex-col gap-2 rounded-xl border p-3 text-left transition-colors ${
              selected
                ? "border-zinc-900 dark:border-zinc-50"
                : "border-black/10 hover:border-zinc-400 dark:border-white/10 dark:hover:border-zinc-500"
            } bg-white dark:bg-zinc-900`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {format(day, "EEEE", { locale: ko })}
              </span>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  isToday(day)
                    ? "bg-zinc-900 font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900"
                    : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {day.getDate()}
              </span>
            </div>
            <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
              <p>
                <span className="text-zinc-400 dark:text-zinc-500">점심 </span>
                {menu?.lunch ?? "-"}
              </p>
              <p>
                <span className="text-zinc-400 dark:text-zinc-500">오전 </span>
                {menu?.morning_snack ?? "-"}
              </p>
              <p>
                <span className="text-zinc-400 dark:text-zinc-500">오후 </span>
                {menu?.afternoon_snack ?? "-"}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
