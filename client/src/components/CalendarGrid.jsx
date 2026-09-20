import { Fragment } from "react";
import { PlusCircle } from "lucide-react";
import { displayTime, formatDate, todayISO } from "../utils/date.js";

const TYPE_SHORT = {
  quiz: "Quiz",
  ct: "CT",
  presentation: "Pres.",
  viva: "Viva",
  suspension: "Susp.",
  custom: "Event"
};

const DAY_SHORT = {
  Sunday: "Sun",
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat"
};

const SUBJECT_SHORTS = {
  "Database Management Systems": "DBMS",
  "Computer Networks": "CN",
  "Software Engineering": "SE",
  "Operating Systems": "OS",
  Microprocessors: "MP",
  "Web Engineering": "WE"
};

const ROUTINE_COLORS = [
  { header: "#d6d5c4", cell: "#eeece1" },
  { header: "#ead6c1", cell: "#f3e5d8" },
  { header: "#f0dac7", cell: "#f5e7db" },
  { header: "#e9bdb5", cell: "#f0d1c9" },
  { header: "#ffc2a8", cell: "#ffd3c1" },
  { header: "#f0d6c2", cell: "#f6e6da" },
  { header: "#ffd0ba", cell: "#ffe0d2" }
];

const TIME_COLOR = "#ecdcd0";
const TEXT_COLOR = "#402923";
const EVENT_COLORS = {
  quiz: { bg: "#ffe7a8", border: "#e7a22f", text: "#5b3510" },
  ct: { bg: "#ffb8a8", border: "#d85443", text: "#5c2019" },
  presentation: { bg: "#f4d1a6", border: "#c47c39", text: "#573016" },
  viva: { bg: "#e5d68a", border: "#9f8f33", text: "#413813" },
  suspension: { bg: "#ddd4cb", border: "#8a746a", text: "#402923" },
  custom: { bg: "#ead2ba", border: "#b88367", text: "#402923" }
};
const ASSESSMENT_TYPES = ["quiz", "ct", "presentation", "viva"];
const DAY_STATUS_COLORS = {
  classOnly: { bg: "#b9d7a0", border: "#6f9d54" },
  oneAssessment: { bg: "#ffb86b", border: "#d97706" },
  multipleAssessments: { bg: "#f28b82", border: "#dc2626" }
};

function subjectShort(item = {}) {
  if (item.subjectName && SUBJECT_SHORTS[item.subjectName]) return SUBJECT_SHORTS[item.subjectName];
  if (item.subjectCode && !/^CSE-\d+/i.test(item.subjectCode)) return item.subjectCode;
  const source = item.subjectName || item.subjectCode || "Class";
  return source
    .replace(/\b(and|of|the|for|systems?)\b/gi, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 5)
    .toUpperCase();
}

function EventPill({ event }) {
  const subject = subjectShort(event);
  const label = `${subject} ${TYPE_SHORT[event.type] || "Event"}`.trim();
  const color = EVENT_COLORS[event.type] || EVENT_COLORS.custom;

  return (
    <div
      className="mt-0.5 rounded border px-1 py-0.5 text-center text-[7px] font-black leading-none shadow-sm sm:rounded-md sm:text-[8px]"
      style={{ background: color.bg, borderColor: color.border, color: color.text }}
      title={event.title}
    >
      <div className="truncate">
        {label}
        {event.marks ? ` · ${event.marks}m` : ""}
      </div>
    </div>
  );
}

function ClassCard({ item }) {
  const shortName = subjectShort(item);

  return (
    <div
      className={`flex h-full min-h-0 flex-col items-center justify-center text-center text-[10px] font-black leading-tight sm:text-[11px] md:text-xs ${
        item.suspended ? "line-through opacity-60" : ""
      }`}
      style={{ color: TEXT_COLOR }}
      title={`${item.subjectName} · ${item.room} · ${item.teacherName}`}
    >
      <div className="truncate">{shortName}</div>
      <div className="mt-0.5 truncate text-[9px] font-extrabold opacity-95 sm:text-[10px] md:text-[11px]">{item.room}</div>
      {item.suspended && <div className="mt-0.5 text-[9px] font-bold not-italic no-underline">Susp.</div>}
    </div>
  );
}

function AssessmentCellContent({ classItem, event }) {
  const subject = classItem ? subjectShort(classItem) : subjectShort(event);
  const room = classItem?.room;
  const type = TYPE_SHORT[event.type] || "Event";
  const color = EVENT_COLORS[event.type] || EVENT_COLORS.custom;

  return (
    <div className="flex h-full flex-col items-center justify-center overflow-hidden text-center" style={{ color: TEXT_COLOR }}>
      <div className="max-w-full truncate text-[8px] font-black leading-none sm:text-[10px]">
        {subject}
        {room ? ` · ${room}` : ""}
      </div>
      <div className="mt-0.5 rounded px-1.5 py-0.5 text-[7px] font-black leading-none text-white sm:mt-1 sm:px-2 sm:text-[9px]" style={{ background: color.border }}>
        {type}
        {event.marks ? ` · ${event.marks}m` : ""}
      </div>
    </div>
  );
}

function getDayStatus(day) {
  const assessmentIds = new Set();
  let classCount = 0;

  for (const slot of day.slots || []) {
    classCount += slot.classes?.length || 0;
    for (const event of slot.events || []) {
      if (ASSESSMENT_TYPES.includes(event.type)) {
        assessmentIds.add(event._id || `${event.type}-${event.title}-${event.startTime}`);
      }
    }
  }

  if (assessmentIds.size > 1) return DAY_STATUS_COLORS.multipleAssessments;
  if (assessmentIds.size === 1) return DAY_STATUS_COLORS.oneAssessment;
  if (classCount > 0) return DAY_STATUS_COLORS.classOnly;
  return null;
}

export default function CalendarGrid({ schedule, onSlotSelect }) {
  const timeSlots = schedule.days[0]?.slots || [];
  const dayCount = schedule.days.length || 5;
  const currentDate = todayISO();
  const hasToday = schedule.days.some((day) => day.date === currentDate);
  const gridTemplateColumns = `var(--routine-time-col, 44px) repeat(${dayCount}, minmax(0, 1fr))`;

  return (
    <div
      className={`routine-schedule-card overflow-visible rounded-[18px] px-2 pb-2 shadow-soft ${hasToday ? "pt-5" : "pt-2"}`}
      style={{
        width: "100%",
        maxWidth: `calc(var(--routine-time-col, 44px) + (${dayCount} * var(--routine-day-col, 74px)) + ((${dayCount} + 1) * 4px) + 16px)`,
        background: "#fff8ec"
      }}
    >
      <div>
        <div className="grid gap-1" style={{ gridTemplateColumns }}>
          <div className="h-11 rounded-md sm:h-11 sm:rounded-lg md:h-12" style={{ background: TIME_COLOR }} />
          {schedule.days.map((day) => {
            const status = getDayStatus(day);
            return (
              <div
                key={day.date}
                className="relative flex h-11 flex-col items-center justify-center gap-0.5 rounded-md border-2 px-0.5 pb-1 text-center shadow-sm sm:h-11 sm:rounded-lg sm:px-1 md:h-12 md:gap-1"
                style={{
                  background: status?.bg || "#ecdcd0",
                  borderColor: status?.border || "#d7c5b8",
                  color: TEXT_COLOR
                }}
              >
                {day.date === currentDate && (
                  <span className="absolute -top-3.5 rounded-full bg-[#402923] px-2 py-0.5 text-[7px] font-black uppercase leading-none text-white shadow-sm">
                    Today
                  </span>
                )}
                <div className="text-[11px] font-black leading-none sm:text-xs md:text-sm">{DAY_SHORT[day.weekdayName] || day.weekdayName.slice(0, 3)}</div>
                <div className="flex items-center justify-center leading-none">
                  <span className="inline-flex h-[17px] items-center gap-0.5 rounded bg-white/65 px-1 text-[11px] font-black leading-none shadow-sm sm:h-4 sm:text-xs md:h-5 md:px-1.5 md:text-sm">
                    {formatDate(day.date, "d")}
                    <span className="text-[5px] font-black uppercase leading-none opacity-75 sm:text-[6px] md:text-[7px]">{formatDate(day.date, "MMM")}</span>
                  </span>
                </div>
              </div>
            );
          })}

          {timeSlots.map((slot, slotIndex) => (
            <Fragment key={`${slot.startTime}-${slot.endTime}`}>
              <div
                key={`${slot.startTime}-label`}
                className="flex h-9 flex-col items-center justify-center rounded-md px-0.5 text-center sm:h-11 sm:rounded-lg sm:px-1 md:h-[62px]"
                style={{ background: TIME_COLOR, color: TEXT_COLOR }}
              >
                <div className="text-[7px] font-black leading-tight sm:text-[9px] md:text-[10px]">{displayTime(slot.startTime)}</div>
                <div className="text-[7px] font-black leading-tight sm:text-[9px] md:text-[10px]">-</div>
                <div className="text-[7px] font-black leading-tight sm:text-[9px] md:text-[10px]">{displayTime(slot.endTime)}</div>
              </div>
              {schedule.days.map((day, dayIndex) => {
              const daySlot = day.slots[slotIndex] || slot;
              const classes = daySlot.classes || [];
              const events = daySlot.events || [];
              const primaryClass = classes[0];
              const isEmpty = classes.length === 0 && events.length === 0;
              const primaryEvent = events[0];
              const eventColor = primaryEvent ? (EVENT_COLORS[primaryEvent.type] || EVENT_COLORS.custom) : null;
              return (
                <button
                  key={`${day.date}-${slot.startTime}-${slot.endTime}`}
                  className="focus-ring group relative h-9 overflow-hidden rounded-md px-0.5 py-0.5 text-center transition hover:brightness-95 sm:h-11 sm:rounded-lg sm:px-1 md:h-[62px]"
                  style={{
                    background: eventColor?.bg || ROUTINE_COLORS[dayIndex]?.cell || "#f5e7db",
                    border: eventColor ? `2px solid ${eventColor.border}` : "2px solid transparent"
                  }}
                  onClick={() =>
                    onSlotSelect({
                      date: day.date,
                      startTime: daySlot.startTime,
                      endTime: daySlot.endTime,
                      classItem: primaryClass,
                      classes,
                      events
                    })
                  }
                >
                  <div className="flex h-full flex-col gap-1 overflow-hidden">
                    {isEmpty ? (
                      <div className="sr-only">Open slot</div>
                    ) : primaryEvent ? (
                      <AssessmentCellContent classItem={primaryClass} event={primaryEvent} />
                    ) : (
                      <>
                        {classes.map((item) => (
                          <ClassCard key={item.routineSlotId} item={item} />
                        ))}
                        {events.map((event) => (
                          <EventPill key={event._id || event.id || event.title} event={event} />
                        ))}
                      </>
                    )}
                    <div className="pointer-events-none absolute right-1 top-1">
                      <PlusCircle className="text-slate-300 opacity-0 transition group-hover:opacity-100" size={11} />
                    </div>
                  </div>
                </button>
              );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
