import { addDays, endOfWeek, format, parseISO, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AssessmentLegend from "./AssessmentLegend.jsx";

const WEEK_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SUBJECT_SHORTS = {
  "Database Management Systems": "DBMS",
  "Computer Networks": "CN",
  "Software Engineering": "SE",
  "Operating Systems": "OS",
  Microprocessors: "MP",
  "Web Engineering": "WE"
};

function subjectShort(item = {}) {
  if (item.subjectName && SUBJECT_SHORTS[item.subjectName]) return SUBJECT_SHORTS[item.subjectName];
  if (item.subjectCode && !/^CSE-\d+/i.test(item.subjectCode)) return item.subjectCode;
  const source = item.subjectName || item.subjectCode || item.title || "Event";
  return source
    .replace(/\b(and|of|the|for|systems?)\b/gi, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 5)
    .toUpperCase();
}

function buildGrid(monthStart, monthEnd) {
  const start = startOfWeek(parseISO(monthStart), { weekStartsOn: 0 });
  const end = endOfWeek(parseISO(monthEnd), { weekStartsOn: 0 });
  const dates = [];
  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
    dates.push(format(cursor, "yyyy-MM-dd"));
  }
  return dates;
}

function statusStyle(day, inMonth) {
  if (!inMonth) return { background: "rgba(255,255,255,0.32)", color: "rgba(64,41,35,0.28)" };
  if (day?.assessmentCount > 1) return { background: "#f0b0a4", color: "#402923" };
  if (day?.assessmentCount === 1) return { background: "#f8c99e", color: "#402923" };
  if (day?.classes?.length > 0) return { background: "#d6dfc4", color: "#402923" };
  if (day && !day.academicDay) return { background: "#eadbd0", color: "rgba(64,41,35,0.45)" };
  return { background: "#f4e7db", color: "rgba(64,41,35,0.5)" };
}

export default function MonthOverview({ month, onPreviousMonth, onNextMonth }) {
  if (!month) {
    return (
      <section className="rounded-[18px] bg-[#fff8ec] p-3 shadow-soft">
        <div className="text-sm font-black text-[#402923]">Monthly overview</div>
      </section>
    );
  }

  const monthDays = new Map(month.days.map((day) => [day.date, day]));
  const gridDates = buildGrid(month.monthStart, month.monthEnd);
  const monthTitle = format(parseISO(month.monthStart), "MMMM yyyy");

  return (
    <section className="rounded-[16px] bg-[#fff8ec] p-2.5 shadow-soft sm:p-3">
      <div className="mb-1.5 flex items-start justify-between gap-2 text-[#402923] sm:mb-2">
        <div>
          <h2 className="text-xs font-black leading-none sm:text-sm">Monthly calendar</h2>
          <p className="mt-0.5 text-[10px] font-bold opacity-70 sm:mt-1 sm:text-xs">{monthTitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="focus-ring grid h-6 w-6 place-items-center rounded-md bg-[#ecdcd0] text-[#402923] shadow-sm transition hover:brightness-95"
            onClick={onPreviousMonth}
            title="Previous month"
          >
            <ChevronLeft size={13} strokeWidth={3} />
          </button>
          <button
            type="button"
            className="focus-ring grid h-6 w-6 place-items-center rounded-md bg-[#ecdcd0] text-[#402923] shadow-sm transition hover:brightness-95"
            onClick={onNextMonth}
            title="Next month"
          >
            <ChevronRight size={13} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="mb-2">
        <AssessmentLegend />
      </div>

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {WEEK_LABELS.map((label) => (
          <div key={label} className="rounded bg-[#ecdcd0] py-0.5 text-center text-[8px] font-black text-[#402923] sm:py-1 sm:text-[10px]">
            {label}
          </div>
        ))}

        {gridDates.map((date) => {
          const day = monthDays.get(date);
          const inMonth = Boolean(day);
          const courses = [
            ...(day?.classes || []).map(subjectShort),
            ...(day?.assessments || []).map(subjectShort)
          ];
          const uniqueCourses = [...new Set(courses)].slice(0, 3);

          return (
            <div
              key={date}
              className="min-h-[32px] rounded-md px-1 py-0.5 sm:min-h-[42px] sm:rounded-lg sm:px-1.5 sm:py-1"
              style={statusStyle(day, inMonth)}
              title={uniqueCourses.join(", ")}
            >
              <div className="text-[11px] font-black leading-none sm:text-sm">{format(parseISO(date), "d")}</div>
              <div className="mt-0.5 flex flex-wrap gap-0.5 sm:mt-1">
                {uniqueCourses.map((course) => (
                  <span key={course} className="rounded bg-white/45 px-0.5 text-[6px] font-black leading-3 sm:px-1 sm:text-[8px] sm:leading-4">
                    {course}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
