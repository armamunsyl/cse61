import { describe, expect, it } from "vitest";
import { requireAdmin } from "../src/middleware/auth.js";
import {
  assertRequestCanBeApproved,
  countAssessments,
  expandRoutineForWeek,
  findConflicts,
  sortUpcomingAssessments
} from "../src/services/calendarService.js";

const routine = [
  {
    _id: "slot-1",
    subjectName: "DBMS",
    subjectCode: "CSE-321",
    teacherName: "Dr. A",
    room: "302",
    weekday: 0,
    startTime: "09:00",
    endTime: "10:30",
    color: "#2563eb",
    isActive: true
  }
];

describe("calendar business rules", () => {
  it("expands weekly routine into the correct weekday class", () => {
    const schedule = expandRoutineForWeek(routine, [], [], "2026-10-04");
    expect(schedule.days[0].date).toBe("2026-10-04");
    expect(schedule.days[0].slots[0].classes[0].subjectCode).toBe("CSE-321");
    expect(schedule.days[1].slots[0].classes).toHaveLength(0);
    expect(schedule.days.map((day) => day.weekdayName)).toEqual(["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]);
  });

  it("applies a suspended class only on the matching date", () => {
    const schedule = expandRoutineForWeek(
      routine,
      [{ routineSlotId: "slot-1", date: "2026-10-04", status: "suspended", reason: "Quiz week" }],
      [],
      "2026-10-04"
    );
    const nextWeek = expandRoutineForWeek(routine, [], [], "2026-10-11");
    expect(schedule.days[0].slots[0].classes[0].suspended).toBe(true);
    expect(nextWeek.days[0].slots[0].classes[0].suspended).toBe(false);
  });

  it("blocks approving the same request twice", () => {
    expect(() => assertRequestCanBeApproved({ status: "approved" })).toThrow("already been reviewed");
  });

  it("sorts upcoming assessments by date and time", () => {
    const sorted = sortUpcomingAssessments(
      [
        { type: "quiz", date: "2026-10-06", startTime: "12:00" },
        { type: "custom", date: "2026-10-05", startTime: "09:00" },
        { type: "ct", date: "2026-10-05", startTime: "10:30" }
      ],
      "2026-10-01"
    );
    expect(sorted.map((event) => event.type)).toEqual(["ct", "quiz"]);
  });

  it("counts same-day and same-week assessment pressure", () => {
    const counts = countAssessments(
      [
        { type: "quiz", date: "2026-10-04" },
        { type: "ct", date: "2026-10-04" },
        { type: "viva", date: "2026-10-07" },
        { type: "custom", date: "2026-10-07" }
      ],
      "2026-10-04"
    );
    expect(counts).toEqual({ day: 2, week: 3 });
  });

  it("detects overlapping approved event times", () => {
    const conflicts = findConflicts(
      [{ id: "a", date: "2026-10-04", startTime: "10:30", endTime: "12:00" }],
      { date: "2026-10-04", startTime: "11:30", endTime: "13:00" }
    );
    expect(conflicts).toHaveLength(1);
  });
});

describe("admin security", () => {
  it("rejects unauthorized admin API access", async () => {
    let statusCode = 200;
    let payload = null;
    const req = { cookies: {} };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        payload = data;
        return this;
      }
    };
    await requireAdmin(req, res, () => {});
    expect(statusCode).toBe(401);
    expect(payload.message).toBe("Authentication required");
  });
});
