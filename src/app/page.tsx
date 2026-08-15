import CalendarView from "@/components/calendar/CalendarView";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <CalendarView />
    </div>
  );
}
