import { ActivityLog } from "../models/ActivityLog.js";
import { ClassException } from "../models/ClassException.js";
import { Event } from "../models/Event.js";
import { EventRequest } from "../models/EventRequest.js";
import { RoutineSlot } from "../models/RoutineSlot.js";
import { findConflicts, normalizeEventPayload, sortUpcomingAssessments } from "../services/calendarService.js";
import { logActivity } from "../services/activityService.js";
import { notifyAssessmentUpdate, notifyCancellation, notifyNewAssessment } from "../services/pushService.js";
import { todayISO, weekStartISO, addDaysISO } from "../utils/date.js";
import { asyncHandler, AppError } from "../utils/errors.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const [pendingCount, approvedCount, rejectedCount, events, recentActivity, routine] = await Promise.all([
    EventRequest.countDocuments({ status: "pending" }),
    EventRequest.countDocuments({ status: "approved" }),
    EventRequest.countDocuments({ status: "rejected" }),
    Event.find({ date: { $gte: todayISO() } }).sort({ date: 1, startTime: 1 }).limit(30).lean(),
    ActivityLog.find().sort({ createdAt: -1 }).limit(12).lean(),
    RoutineSlot.find().sort({ weekday: 1, startTime: 1 }).lean()
  ]);
  res.json({
    counts: { pending: pendingCount, approved: approvedCount, rejected: rejectedCount },
    upcomingAssessments: sortUpcomingAssessments(events, todayISO()).slice(0, 8),
    recentActivity,
    routine
  });
});

async function syncSuspensionException(event, adminId) {
  if (event.type !== "suspension" || !event.routineSlotId) return;
  await ClassException.findOneAndUpdate(
    { routineSlotId: event.routineSlotId, date: event.date },
    {
      routineSlotId: event.routineSlotId,
      date: event.date,
      status: "suspended",
      reason: event.details || event.title,
      createdBy: adminId
    },
    { upsert: true, new: true }
  );
}

export const listRequests = asyncHandler(async (req, res) => {
  const status = req.query.status;
  const filter = status ? { status } : {};
  const requests = await EventRequest.find(filter).sort({ createdAt: -1 }).lean();
  res.json({ requests });
});

export const approveRequest = asyncHandler(async (req, res) => {
  const request = await EventRequest.findOneAndUpdate(
    { _id: req.params.id, status: "pending" },
    { $set: { status: "approved", reviewedBy: req.admin._id, reviewedAt: new Date() } },
    { new: true }
  );
  if (!request) throw new AppError("Request not found or already reviewed", 409);

  try {
    const payload = normalizeEventPayload({ ...request.toObject(), ...req.body });
    const event = await Event.create({ ...payload, sourceRequestId: request._id, createdBy: req.admin._id });
    await syncSuspensionException(event, req.admin._id);
    request.approvedEventId = event._id;
    await request.save();
    await logActivity({
      actor: req.admin._id,
      action: "request.approved",
      entityType: "EventRequest",
      entityId: request._id,
      message: `Approved ${request.title}`
    });
    await notifyNewAssessment(event);
    res.json({ request, event });
  } catch (error) {
    request.status = "pending";
    request.reviewedBy = undefined;
    request.reviewedAt = undefined;
    await request.save();
    throw error;
  }
});

export const rejectRequest = asyncHandler(async (req, res) => {
  const request = await EventRequest.findOneAndUpdate(
    { _id: req.params.id, status: "pending" },
    {
      $set: {
        status: "rejected",
        reviewedBy: req.admin._id,
        reviewedAt: new Date(),
        rejectionReason: req.body.reason || "Rejected by admin"
      }
    },
    { new: true }
  );
  if (!request) throw new AppError("Request not found or already reviewed", 404);
  await logActivity({
    actor: req.admin._id,
    action: "request.rejected",
    entityType: "EventRequest",
    entityId: request._id,
    message: `Rejected ${request.title}`
  });
  res.json({ request });
});

export const listEvents = asyncHandler(async (req, res) => {
  const from = req.query.from || addDaysISO(weekStartISO(todayISO()), -30);
  const events = await Event.find({ date: { $gte: from } }).sort({ date: 1, startTime: 1 }).lean();
  res.json({ events });
});

export const createEvent = asyncHandler(async (req, res) => {
  const event = await Event.create({ ...normalizeEventPayload(req.body), createdBy: req.admin._id });
  await syncSuspensionException(event, req.admin._id);
  await logActivity({
    actor: req.admin._id,
    action: "event.created",
    entityType: "Event",
    entityId: event._id,
    message: `Created ${event.title}`
  });
  await notifyNewAssessment(event);
  res.status(201).json({ event });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const previousEvent = await Event.findById(req.params.id).lean();
  if (!previousEvent) throw new AppError("Event not found", 404);
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    { ...normalizeEventPayload(req.body), updatedBy: req.admin._id },
    { new: true, runValidators: true }
  );
  await syncSuspensionException(event, req.admin._id);
  await logActivity({
    actor: req.admin._id,
    action: "event.updated",
    entityType: "Event",
    entityId: event._id,
    message: `Updated ${event.title}`
  });
  await notifyAssessmentUpdate(previousEvent, event);
  res.json({ event });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) throw new AppError("Event not found", 404);
  await logActivity({
    actor: req.admin._id,
    action: "event.deleted",
    entityType: "Event",
    entityId: event._id,
    message: `Deleted ${event.title}`
  });
  await notifyCancellation(event);
  res.json({ message: "Event deleted" });
});

export const listRoutine = asyncHandler(async (req, res) => {
  const routine = await RoutineSlot.find().sort({ weekday: 1, startTime: 1 }).lean();
  res.json({ routine });
});

export const createRoutine = asyncHandler(async (req, res) => {
  const routine = await RoutineSlot.create(req.body);
  await logActivity({
    actor: req.admin._id,
    action: "routine.created",
    entityType: "RoutineSlot",
    entityId: routine._id,
    message: `Created routine ${routine.subjectCode}`
  });
  res.status(201).json({ routine });
});

export const updateRoutine = asyncHandler(async (req, res) => {
  const routine = await RoutineSlot.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!routine) throw new AppError("Routine slot not found", 404);
  await logActivity({
    actor: req.admin._id,
    action: "routine.updated",
    entityType: "RoutineSlot",
    entityId: routine._id,
    message: `Updated routine ${routine.subjectCode}`
  });
  res.json({ routine });
});

export const deleteRoutine = asyncHandler(async (req, res) => {
  const routine = await RoutineSlot.findByIdAndDelete(req.params.id);
  if (!routine) throw new AppError("Routine slot not found", 404);
  await logActivity({
    actor: req.admin._id,
    action: "routine.deleted",
    entityType: "RoutineSlot",
    entityId: routine._id,
    message: `Deleted routine ${routine.subjectCode}`
  });
  res.json({ message: "Routine slot deleted" });
});

export const upsertClassException = asyncHandler(async (req, res) => {
  const exception = await ClassException.findOneAndUpdate(
    { routineSlotId: req.body.routineSlotId, date: req.body.date },
    { ...req.body, createdBy: req.admin._id },
    { upsert: true, new: true, runValidators: true }
  );
  await logActivity({
    actor: req.admin._id,
    action: `class.${exception.status}`,
    entityType: "ClassException",
    entityId: exception._id,
    message: `${exception.status} class on ${exception.date}`
  });
  res.json({ exception });
});

export const listExceptions = asyncHandler(async (req, res) => {
  const exceptions = await ClassException.find().sort({ date: -1 }).limit(100).lean();
  res.json({ exceptions });
});

export const getConflicts = asyncHandler(async (req, res) => {
  const { date, startTime, endTime, excludeId } = req.query;
  const events = await Event.find({ date }).lean();
  res.json({ conflicts: findConflicts(events, { date, startTime, endTime }, excludeId) });
});
