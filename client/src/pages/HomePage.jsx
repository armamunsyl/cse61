import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import AdminSlotModal from "../components/AdminSlotModal.jsx";
import CalendarGrid from "../components/CalendarGrid.jsx";
import CourseInfo from "../components/CourseInfo.jsx";
import EventRequestModal from "../components/EventRequestModal.jsx";
import MonthOverview from "../components/MonthOverview.jsx";
import StateBlock from "../components/StateBlock.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { api } from "../services/api.js";
import { useAuth } from "../state/AuthContext.jsx";
import { addDaysISO, addMonthsISO, formatDate, formatWeekRange, todayISO, weekStartISO } from "../utils/date.js";
import { markNotificationsRead } from "../utils/pwa.js";

export default function HomePage() {
  const { admin } = useAuth();
  const [anchorDate, setAnchorDate] = useState(todayISO());
  const [monthAnchor, setMonthAnchor] = useState(todayISO());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [adminSlot, setAdminSlot] = useState(null);
  const schedule = useAsync(() => api.getWeek(anchorDate), [anchorDate]);
  const month = useAsync(() => api.getMonth(monthAnchor), [monthAnchor]);

  useEffect(() => {
    if (schedule.data || month.data) {
      markNotificationsRead();
    }
  }, [schedule.data, month.data]);

  function moveWeek(days) {
    setAnchorDate((current) => addDaysISO(current, days));
  }

  function handleSlotSelect(slot) {
    if (admin) {
      setAdminSlot(slot);
    } else {
      setSelectedSlot(slot);
    }
  }

  const weekLabel = schedule.data ? formatWeekRange(schedule.data.weekStart, schedule.data.weekEnd) : formatDate(weekStartISO(anchorDate), "MMM d, yyyy");
  const compactWeekLabel = schedule.data
    ? `${formatDate(schedule.data.weekStart, "MMM d")} - ${formatDate(schedule.data.weekEnd, "MMM d")}`
    : formatDate(weekStartISO(anchorDate), "MMM d");

  return (
    <div className="mx-auto max-w-[1500px] px-3 py-3 sm:px-4 lg:px-6">
      <div className="space-y-2.5">
          <div id="courses" className="scroll-mt-20 grid gap-2 min-[1000px]:grid-cols-[minmax(0,1fr)_280px]">
            <CourseInfo />
            <section className="rounded-md border border-line bg-white px-3 py-2 text-xs leading-5 text-slate-600 shadow-soft">
              <span className="font-semibold text-ink">For teachers: </span>
              Check load and open slots before choosing an assessment date.
            </section>
          </div>

          {schedule.loading && <StateBlock title="Loading schedule..." />}
          {schedule.error && <StateBlock title="Could not load schedule" message={schedule.error} />}
          <section className="rounded-md border border-line bg-white px-3 py-2 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-500">Current week</div>
                <div className="text-lg font-semibold leading-tight sm:hidden">{compactWeekLabel}</div>
                <div className="hidden truncate text-base font-semibold sm:block">{weekLabel}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button className="focus-ring grid h-8 w-8 place-items-center rounded-md border border-line hover:bg-slate-50" onClick={() => moveWeek(-7)} title="Previous week">
                  <ChevronLeft size={16} />
                </button>
                <button className="focus-ring rounded-md border border-line px-2.5 py-1.5 text-sm font-semibold hover:bg-slate-50 sm:px-3" onClick={() => setAnchorDate(todayISO())}>
                  Today
                </button>
                <button className="focus-ring grid h-8 w-8 place-items-center rounded-md border border-line hover:bg-slate-50" onClick={() => moveWeek(7)} title="Next week">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>
          <div className="grid items-start gap-3 min-[1000px]:grid-cols-[minmax(0,650px)_minmax(300px,1fr)] xl:grid-cols-[minmax(0,760px)_minmax(520px,1fr)]">
            <div id="routine" className="flex scroll-mt-20 justify-center min-[1000px]:justify-start">
              {schedule.data && <CalendarGrid schedule={schedule.data} onSlotSelect={handleSlotSelect} />}
            </div>
            <div id="monthly" className="mx-auto w-full max-w-[640px] scroll-mt-20 min-[1000px]:max-w-none">
              <MonthOverview
                month={month.data}
                onPreviousMonth={() => setMonthAnchor((current) => addMonthsISO(current, -1))}
                onNextMonth={() => setMonthAnchor((current) => addMonthsISO(current, 1))}
              />
            </div>
          </div>
      </div>
      <EventRequestModal slot={selectedSlot} onClose={() => setSelectedSlot(null)} onCreated={() => { schedule.reload(); month.reload(); }} />
      <AdminSlotModal
        slot={adminSlot}
        onClose={() => setAdminSlot(null)}
        onChanged={() => {
          schedule.reload();
          month.reload();
        }}
      />
    </div>
  );
}
