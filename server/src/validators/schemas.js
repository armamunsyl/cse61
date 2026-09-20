import { z } from "zod";
import { EVENT_TYPES } from "../constants.js";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm time");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD date");
const eventShape = {
  type: z.enum(EVENT_TYPES),
  title: z.string().min(2).max(120),
  subjectName: z.string().max(120).optional().or(z.literal("")),
  subjectCode: z.string().max(40).optional().or(z.literal("")),
  date,
  startTime: time,
  endTime: time,
  marks: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  syllabus: z.string().max(1000).optional().or(z.literal("")),
  details: z.string().max(1000).optional().or(z.literal("")),
  routineSlotId: z.string().optional().or(z.literal(""))
};

function endAfterStart(data) {
  return data.startTime < data.endTime;
}

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const eventPayloadSchema = z.object(eventShape).refine(endAfterStart, {
  message: "End time must be after start time",
  path: ["endTime"]
});

export const eventRequestSchema = z.object({
  ...eventShape,
  proposerName: z.string().min(2).max(100),
  proposerIdentity: z.string().min(2).max(100)
}).refine(endAfterStart, {
  message: "End time must be after start time",
  path: ["endTime"]
});

export const eventApprovalSchema = z.object(eventShape).partial().refine((data) => {
  if (!data.startTime || !data.endTime) return true;
  return endAfterStart(data);
}, {
  message: "End time must be after start time",
  path: ["endTime"]
});

export const routineSlotSchema = z.object({
  subjectName: z.string().min(2).max(120),
  subjectCode: z.string().min(2).max(40),
  teacherName: z.string().min(2).max(120),
  room: z.string().min(1).max(60),
  weekday: z.coerce.number().int().min(0).max(6),
  startTime: time,
  endTime: time,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#2563eb"),
  isActive: z.boolean().optional()
}).refine((data) => data.startTime < data.endTime, {
  message: "End time must be after start time",
  path: ["endTime"]
});

export const classExceptionSchema = z.object({
  routineSlotId: z.string().min(1),
  date,
  status: z.enum(["suspended", "modified"]),
  reason: z.string().max(500).optional().or(z.literal("")),
  replacement: z.object({
    subjectName: z.string().optional(),
    subjectCode: z.string().optional(),
    teacherName: z.string().optional(),
    room: z.string().optional(),
    startTime: time.optional(),
    endTime: time.optional()
  }).optional()
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(10).max(512),
    auth: z.string().min(10).max(256)
  }),
  userAgent: z.string().max(300).optional().or(z.literal("")),
  platform: z.string().max(80).optional().or(z.literal(""))
});

export const pushEndpointSchema = z.object({
  endpoint: z.string().url().max(2048)
});
