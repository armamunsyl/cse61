import { ACADEMIC_WEEKDAYS, ASSESSMENT_TYPES, SLOT_TIMES, WEEKDAYS } from "../constants.js";
import { addDaysISO, rangesOverlap, weekDates, weekStartISO, weekdayIndex, compareDateTime } from "../utils/date.js";

export function normalizeEventPayload(payload) {
  return {
    ...payload,
    marks: payload.marks === "" || payload.marks === undefined ? undefined : Number(payload.marks),
    title: payload.title || titleForType(payload.type, payload.subjectCode || payload.subjectName)
  };
}

export function titleForType(type, subject = "") {
  const labels = {
    quiz: "Quiz",
    ct: "Class Test",
    presentation: "Presentation",
    viva: "Viva",
    suspension: "Class Suspended",
    custom: "Custom Event"
  };
  return `${subject ? `${subject} ` : ""}${labels[type] || "Event"}`.trim();
}

export function expandRoutineForWeek(routineSlots, exceptions, events, anchorDate) {
  const dates = weekDates(anchorDate).filter((date) => ACADEMIC_WEEKDAYS.includes(weekdayIndex(date)));
  const exceptionMap = new Map(exceptions.map((item) => [`${item.routineSlotId}:${item.date}`, item]));
  const slotsByDate = dates.map((date) => {
    const weekday = weekdayIndex(date);
    const classes = routineSlots
      .filter((slot) => slot.weekday === weekday && slot.isActive !== false)
      .map((slot) => {
        const exception = exceptionMap.get(`${slot._id || slot.id}:${date}`);
        const replacement = exception?.status === "modified" && exception.replacement ? exception.replacement : {};
        return {
          kind: "class",
          routineSlotId: String(slot._id || slot.id),
          date,
          subjectName: replacement.subjectName || slot.subjectName,
          subjectCode: replacement.subjectCode || slot.subjectCode,
          teacherName: replacement.teacherName || slot.teacherName,
          room: replacement.room || slot.room,
          startTime: replacement.startTime || slot.startTime,
          endTime: replacement.endTime || slot.endTime,
          color: slot.color,
          suspended: exception?.status === "suspended",
          suspensionReason: exception?.reason
        };
      });

    const dayEvents = events
      .filter((event) => event.date === date)
      .map((event) => ({ ...event, kind: "event" }));

    return {
      date,
      weekday,
      weekdayName: WEEKDAYS[weekday],
      slots: SLOT_TIMES.map((timeSlot) => ({
        ...timeSlot,
        classes: classes.filter((item) => item.startTime === timeSlot.startTime && item.endTime === timeSlot.endTime),
        events: dayEvents.filter((item) => rangesOverlap(timeSlot.startTime, timeSlot.endTime, item.startTime, item.endTime))
      }))
    };
  });

  return {
    weekStart: weekStartISO(anchorDate),
    weekEnd: addDaysISO(weekStartISO(anchorDate), 4),
    days: slotsByDate
  };
}

export function countAssessments(events, date) {
  const weekStart = weekStartISO(date);
  const weekEnd = addDaysISO(weekStart, 6);
  const assessmentEvents = events.filter((event) => ASSESSMENT_TYPES.includes(event.type));
  return {
    day: assessmentEvents.filter((event) => event.date === date).length,
    week: assessmentEvents.filter((event) => event.date >= weekStart && event.date <= weekEnd).length
  };
}

export function findConflicts(events, candidate, excludeId) {
  return events.filter((event) => {
    const eventId = String(event._id || event.id || "");
    return (
      event.date === candidate.date &&
      eventId !== String(excludeId || "") &&
      rangesOverlap(event.startTime, event.endTime, candidate.startTime, candidate.endTime)
    );
  });
}

export function sortUpcomingAssessments(events, fromDate) {
  return events
    .filter((event) => ASSESSMENT_TYPES.includes(event.type) && event.date >= fromDate)
    .sort((a, b) => compareDateTime(a.date, a.startTime, b.date, b.startTime));
}

export function assertRequestCanBeApproved(request) {
  if (!request) {
    const error = new Error("Request not found");
    error.statusCode = 404;
    throw error;
  }
  if (request.status !== "pending") {
    const error = new Error("Request has already been reviewed");
    error.statusCode = 409;
    throw error;
  }
}
