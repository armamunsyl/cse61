import { CalendarCheck } from "lucide-react";
import { displayTime, relativeDay } from "../utils/date.js";

const CARD_STYLES = {
  quiz: { bg: "#f7e3dd", accent: "#be7b70" },
  ct: { bg: "#f5d8d2", accent: "#a85f5e" },
  presentation: { bg: "#eadfcd", accent: "#b38a68" },
  viva: { bg: "#e7e4d5", accent: "#8e8f76" },
  suspension: { bg: "#e8ded6", accent: "#8a746a" },
  custom: { bg: "#f0e2d4", accent: "#b88367" }
};

export default function UpcomingAssessments({ assessments = [] }) {
  return (
    <section className="rounded-[14px] border border-[#ecd9cc] bg-[#fff8ec] px-3 py-2 shadow-soft">
      <div className="mb-2 flex items-center gap-2 text-[#402923]">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#ecdcd0]">
          <CalendarCheck size={15} />
        </span>
        <h2 className="text-sm font-black tracking-wide">Upcoming assessments</h2>
      </div>
      {assessments.length === 0 ? (
        <p className="text-xs font-semibold text-[#8a746a]">No approved upcoming assessments.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {assessments.slice(0, 3).map((item) => {
            const style = CARD_STYLES[item.type] || CARD_STYLES.custom;
            return (
              <div
                key={item._id || `${item.date}-${item.title}`}
                className="min-w-0 rounded-xl px-3 py-2"
                style={{
                  background: style.bg,
                  boxShadow: "inset 4px 0 0 rgba(64, 41, 35, 0.18)",
                  color: "#402923"
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-[10px] font-black uppercase tracking-wide opacity-75">
                    {relativeDay(item.date)} · {displayTime(item.startTime)}
                  </div>
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: style.accent }} />
                </div>
                <div className="mt-1 truncate text-sm font-black">{item.title}</div>
                <div className="mt-0.5 truncate text-xs font-bold opacity-75">
                  {item.subjectCode || item.subjectName || item.type}
                  {item.marks ? ` · ${item.marks} marks` : ""}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
