import { ClassException } from "../models/ClassException.js";
import { Event } from "../models/Event.js";
import { RoutineSlot } from "../models/RoutineSlot.js";
import { ACADEMIC_WEEKDAYS, ASSESSMENT_TYPES, WEEKDAYS } from "../constants.js";
import { countAssessments, expandRoutineForWeek, findConflicts, sortUpcomingAssessments } from "../services/calendarService.js";
import { addDaysISO, monthDates, monthEndISO, monthStartISO, todayISO, weekStartISO, weekdayIndex } from "../utils/date.js";
import { asyncHandler } from "../utils/errors.js";

export const getWeekSchedule = asyncHandler(async (req, res) => {
  const date = req.query.date || todayISO();
  const weekStart = weekStartISO(date);
  const weekEnd = addDaysISO(weekStart, 4);
  const [routineSlots, exceptions, events] = await Promise.all([
    RoutineSlot.find({ isActive: true }).lean(),
    ClassException.find({ date: { $gte: weekStart, $lte: weekEnd } }).lean(),
    Event.find({ date: { $gte: weekStart, $lte: weekEnd } }).lean()
  ]);
  res.json(expandRoutineForWeek(routineSlots, exceptions, events, date));
});

export const getRoutine = asyncHandler(async (req, res) => {
  const routine = await RoutineSlot.find().sort({ weekday: 1, startTime: 1 }).lean();
  res.json({ routine });
});

export const getUpcomingAssessments = asyncHandler(async (req, res) => {
  const from = req.query.from || todayISO();
  const events = await Event.find({ date: { $gte: from } }).lean();
  res.json({ assessments: sortUpcomingAssessments(events, from).slice(0, 12) });
});

export const getMonthOverview = asyncHandler(async (req, res) => {
  const date = req.query.date || todayISO();
  const monthStart = monthStartISO(date);
  const monthEnd = monthEndISO(date);
  const dates = monthDates(date);
  const [routineSlots, exceptions, events] = await Promise.all([
    RoutineSlot.find({ isActive: true }).lean(),
    ClassException.find({ date: { $gte: monthStart, $lte: monthEnd } }).lean(),
    Event.find({ date: { $gte: monthStart, $lte: monthEnd } }).lean()
  ]);
  const exceptionMap = new Map(exceptions.map((item) => [`${item.routineSlotId}:${item.date}`, item]));

  const days = dates.map((day) => {
    const weekday = weekdayIndex(day);
    const academicDay = ACADEMIC_WEEKDAYS.includes(weekday);
    const dayClasses = academicDay
      ? routineSlots
          .filter((slot) => slot.weekday === weekday && slot.isActive !== false)
          .filter((slot) => exceptionMap.get(`${slot._id || slot.id}:${day}`)?.status !== "suspended")
          .map((slot) => ({
            routineSlotId: String(slot._id || slot.id),
            subjectName: slot.subjectName,
            subjectCode: slot.subjectCode,
            room: slot.room
          }))
      : [];
    const dayEvents = events.filter((event) => event.date === day);
    const assessments = dayEvents
      .filter((event) => ASSESSMENT_TYPES.includes(event.type))
      .map((event) => ({
        id: String(event._id),
        type: event.type,
        title: event.title,
        subjectName: event.subjectName,
        subjectCode: event.subjectCode,
        startTime: event.startTime,
        endTime: event.endTime,
        marks: event.marks,
        syllabus: event.syllabus,
        details: event.details
      }));

    return {
      date: day,
      weekday,
      weekdayName: WEEKDAYS[weekday],
      academicDay,
      classes: dayClasses,
      assessments,
      assessmentCount: assessments.length
    };
  });

  res.json({ monthStart, monthEnd, days });
});

export const getPlanningStats = asyncHandler(async (req, res) => {
  const { date, startTime, endTime } = req.query;
  const weekStart = weekStartISO(date || todayISO());
  const weekEnd = addDaysISO(weekStart, 6);
  const events = await Event.find({ date: { $gte: weekStart, $lte: weekEnd } }).lean();
  const pressure = countAssessments(events, date || todayISO());
  const conflicts = startTime && endTime ? findConflicts(events, { date, startTime, endTime }) : [];
  res.json({ pressure, conflicts });
});
