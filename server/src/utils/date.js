import { DateTime } from "luxon";
import { TIME_ZONE } from "../constants.js";

export function todayISO() {
  return DateTime.now().setZone(TIME_ZONE).toISODate();
}

export function toDhakaDate(dateISO) {
  return DateTime.fromISO(dateISO, { zone: TIME_ZONE }).startOf("day");
}

export function weekStartISO(dateISO = todayISO()) {
  const dt = toDhakaDate(dateISO);
  return dt.minus({ days: dt.weekday % 7 }).toISODate();
}

export function addDaysISO(dateISO, days) {
  return toDhakaDate(dateISO).plus({ days }).toISODate();
}

export function weekDates(dateISO) {
  const start = weekStartISO(dateISO);
  return Array.from({ length: 7 }, (_, index) => addDaysISO(start, index));
}

export function monthStartISO(dateISO = todayISO()) {
  return toDhakaDate(dateISO).startOf("month").toISODate();
}

export function monthEndISO(dateISO = todayISO()) {
  return toDhakaDate(dateISO).endOf("month").toISODate();
}

export function monthDates(dateISO = todayISO()) {
  const start = toDhakaDate(dateISO).startOf("month");
  const end = toDhakaDate(dateISO).endOf("month");
  const days = Math.floor(end.diff(start, "days").days) + 1;
  return Array.from({ length: days }, (_, index) => start.plus({ days: index }).toISODate());
}

export function weekdayIndex(dateISO) {
  return toDhakaDate(dateISO).weekday % 7;
}

export function compareDateTime(dateA, timeA, dateB, timeB) {
  const a = DateTime.fromISO(`${dateA}T${timeA}`, { zone: TIME_ZONE });
  const b = DateTime.fromISO(`${dateB}T${timeB}`, { zone: TIME_ZONE });
  return a.toMillis() - b.toMillis();
}

export function isFutureOrToday(dateISO) {
  return toDhakaDate(dateISO) >= toDhakaDate(todayISO());
}

export function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function rangesOverlap(startA, endA, startB, endB) {
  return timeToMinutes(startA) < timeToMinutes(endB) && timeToMinutes(startB) < timeToMinutes(endA);
}

export function formatDisplayDate(dateISO) {
  return DateTime.fromISO(dateISO, { zone: TIME_ZONE }).toFormat("MMM d");
}

export function formatDisplayTime(time) {
  if (!time) return "";
  return DateTime.fromISO(`2026-01-01T${time}`, { zone: TIME_ZONE }).toFormat("h:mm a");
}
