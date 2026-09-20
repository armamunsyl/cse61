import { addDays, addMonths, format, parseISO, startOfWeek } from "date-fns";

export function todayISO() {
  return format(new Date(), "yyyy-MM-dd");
}

export function weekStartISO(dateISO) {
  const date = parseISO(dateISO || todayISO());
  return format(startOfWeek(date, { weekStartsOn: 0 }), "yyyy-MM-dd");
}

export function addDaysISO(dateISO, days) {
  return format(addDays(parseISO(dateISO), days), "yyyy-MM-dd");
}

export function addMonthsISO(dateISO, months) {
  return format(addMonths(parseISO(dateISO), months), "yyyy-MM-dd");
}

export function formatDate(dateISO, pattern = "MMM d") {
  return format(parseISO(dateISO), pattern);
}

export function formatWeekRange(weekStart, weekEnd) {
  return `${formatDate(weekStart, "MMM d")} - ${formatDate(weekEnd, "MMM d, yyyy")}`;
}

export function relativeDay(dateISO) {
  const today = parseISO(todayISO());
  const target = parseISO(dateISO);
  const diff = Math.round((target - today) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1) return `${diff} days later`;
  return formatDate(dateISO, "MMM d");
}

export function displayTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(2026, 0, 1, hours, minutes);
  return format(date, "h:mm a");
}
