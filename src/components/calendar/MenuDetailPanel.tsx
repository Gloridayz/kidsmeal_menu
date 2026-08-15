import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { Menu } from "@/lib/types";

const FIELDS: { key: keyof Pick<Menu, "lunch" | "morning_snack" | "afternoon_snack">; label: string }[] = [
  { key: "lunch", label: "점심" },
  { key: "morning_snack", label: "오전간식" },
  { key: "afternoon_snack", label: "오후간식" },
];

export default function MenuDetailPanel({ date, menu }: { date: Date; menu: Menu | null }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {format(date, "M월 d일 (EEEE)", { locale: ko })}
      </h2>
      <dl className="mt-4 space-y-3">
        {FIELDS.map(({ key, label }) => (
          <div key={key} className="flex gap-3">
            <dt className="w-20 shrink-0 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {label}
            </dt>
            <dd className="text-sm text-zinc-800 dark:text-zinc-200">
              {menu?.[key] ?? <span className="text-zinc-400 dark:text-zinc-600">등록된 메뉴 없음</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
