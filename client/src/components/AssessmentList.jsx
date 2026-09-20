import { EVENT_TYPES } from "../constants.js";
import { displayTime, formatDate } from "../utils/date.js";

function typeLabel(type) {
  return EVENT_TYPES.find((item) => item.value === type)?.label || "Event";
}

function courseLabel(item) {
  return item.subjectCode || item.subjectName || item.title || "Assessment";
}

export default function AssessmentList({ month }) {
  const assessments = (month?.days || [])
    .flatMap((day) => (day.assessments || []).map((item) => ({ ...item, date: day.date })))
    .sort((a, b) => `${a.date} ${a.startTime || ""}`.localeCompare(`${b.date} ${b.startTime || ""}`));

  return (
    <section className="rounded-[16px] border border-[#ecd9cc] bg-[#fff8ec] p-3 text-[#402923] shadow-soft">
      <div className="mb-2">
        <h2 className="text-sm font-black leading-none">Assessment list</h2>
        <p className="mt-1 text-[11px] font-bold opacity-65">
          {month ? formatDate(month.monthStart, "MMMM yyyy") : "Current month"}
        </p>
      </div>

      {assessments.length === 0 ? (
        <div className="rounded-lg bg-[#f3e5d8] px-3 py-2 text-xs font-bold opacity-75">
          No assessments scheduled for this month.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#ead8c9]">
          <div className="grid grid-cols-[0.75fr_1fr_0.55fr_1.15fr] bg-[#ecdcd0] px-2 py-1.5 text-[9px] font-black uppercase leading-none sm:text-[10px]">
            <div>Date</div>
            <div>Course</div>
            <div>Marks</div>
            <div>Syllabus</div>
          </div>
          <div className="divide-y divide-[#ead8c9]">
            {assessments.map((item) => (
              <div key={item.id} className="grid grid-cols-[0.75fr_1fr_0.55fr_1.15fr] gap-1 bg-white/45 px-2 py-2 text-[10px] leading-tight sm:text-[11px]">
                <div className="font-black">
                  <div>{formatDate(item.date, "MMM d")}</div>
                  {item.startTime && <div className="mt-0.5 text-[9px] font-bold opacity-65">{displayTime(item.startTime)}</div>}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-black">{courseLabel(item)}</div>
                  <div className="truncate text-[9px] font-bold opacity-65">{typeLabel(item.type)}</div>
                </div>
                <div className="font-black">{item.marks ? `${item.marks}` : "-"}</div>
                <div className="min-w-0">
                  <div className="truncate font-bold">{item.syllabus || "-"}</div>
                  {item.details && <div className="mt-0.5 truncate text-[9px] font-semibold opacity-65">{item.details}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
