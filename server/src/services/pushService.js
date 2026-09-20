import webPush from "web-push";
import { ASSESSMENT_TYPES } from "../constants.js";
import { env } from "../config/env.js";
import { NotificationLog } from "../models/NotificationLog.js";
import { PushSubscription } from "../models/PushSubscription.js";
import { formatDisplayDate, formatDisplayTime } from "../utils/date.js";

const NOTIFIABLE_TYPES = new Set([...ASSESSMENT_TYPES, "custom", "suspension"]);
const IMPORTANT_UPDATE_FIELDS = ["type", "date", "startTime", "endTime", "marks", "syllabus"];

if (env.vapidPublicKey && env.vapidPrivateKey) {
  webPush.setVapidDetails(env.vapidSubject, env.vapidPublicKey, env.vapidPrivateKey);
}

export function isPushConfigured() {
  return Boolean(env.vapidPublicKey && env.vapidPrivateKey);
}

export function isNotifiableEvent(event = {}) {
  return NOTIFIABLE_TYPES.has(event.type);
}

export function importantEventChanged(previous = {}, next = {}) {
  return IMPORTANT_UPDATE_FIELDS.some((field) => String(previous[field] ?? "") !== String(next[field] ?? ""));
}

function typeLabel(type) {
  const labels = {
    quiz: "Quiz",
    ct: "CT",
    presentation: "Presentation",
    viva: "Viva",
    custom: "Event",
    suspension: "Class Postponed"
  };
  return labels[type] || "Event";
}

function subjectLabel(event = {}) {
  return event.subjectCode || event.subjectName || event.title || "CSE 61 D";
}

export function notificationForEvent(event, action = "created") {
  const subject = subjectLabel(event);
  if (event.type === "suspension") {
    return {
      type: "class-postponed",
      title: action === "cancelled" ? "Postponement Cancelled" : "Class Postponed",
      body: `${subject} • ${formatDisplayDate(event.date)} • ${formatDisplayTime(event.startTime)}`,
      url: "/"
    };
  }

  const label = typeLabel(event.type);
  const titles = {
    created: `New ${label} Scheduled`,
    updated: "Assessment Updated",
    cancelled: "Assessment Cancelled"
  };
  const marks = event.marks ? ` • ${event.marks} Marks` : "";
  return {
    type: `assessment-${action}`,
    title: titles[action] || titles.created,
    body: `${subject} ${label} • ${formatDisplayDate(event.date)}${marks}`,
    url: `/assessments?event=${event._id || event.id}`
  };
}

export function isExpiredPushStatus(statusCode) {
  return statusCode === 404 || statusCode === 410;
}

export async function sendPushToSubscription(subscription, payload) {
  const webPushSubscription = {
    endpoint: subscription.endpoint,
    keys: subscription.keys
  };
  return webPush.sendNotification(webPushSubscription, JSON.stringify(payload));
}

async function createNotificationLog(dedupeKey, payload) {
  try {
    return await NotificationLog.create({
      dedupeKey,
      type: payload.type,
      title: payload.title,
      eventId: payload.eventId
    });
  } catch (error) {
    if (error?.code === 11000) return null;
    throw error;
  }
}

export async function broadcastPush(basePayload, dedupeKey, { force = false } = {}) {
  if (!isPushConfigured()) {
    return { skipped: true, reason: "push-not-configured" };
  }

  let log = null;
  if (!force) {
    log = await createNotificationLog(dedupeKey, basePayload);
    if (!log) return { skipped: true, reason: "duplicate" };
  }

  const subscriptions = await PushSubscription.find({ enabled: true }).lean();
  let successCount = 0;
  let failureCount = 0;

  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      const updated = await PushSubscription.findByIdAndUpdate(
        subscription._id,
        { $inc: { unreadCount: 1 }, $set: { lastNotificationAt: new Date() } },
        { new: true }
      ).lean();
      const payload = { ...basePayload, unreadCount: updated?.unreadCount || 1 };

      try {
        await sendPushToSubscription(subscription, payload);
        successCount += 1;
      } catch (error) {
        failureCount += 1;
        if (isExpiredPushStatus(error?.statusCode)) {
          await PushSubscription.findByIdAndUpdate(subscription._id, { enabled: false });
        }
        console.error("Push delivery failed", error?.statusCode || error?.message || error);
      }
    })
  );

  if (log) {
    await NotificationLog.findByIdAndUpdate(log._id, { successCount, failureCount });
  }

  return { successCount, failureCount, total: subscriptions.length };
}

async function safeBroadcast(payload, dedupeKey, options) {
  try {
    return await broadcastPush(payload, dedupeKey, options);
  } catch (error) {
    console.error("Push broadcast failed", error);
    return { skipped: true, reason: "push-failed" };
  }
}

export async function notifyNewAssessment(event) {
  if (!isNotifiableEvent(event)) return { skipped: true, reason: "not-notifiable" };
  const payload = { ...notificationForEvent(event, "created"), eventId: String(event._id || event.id) };
  return safeBroadcast(payload, `event-created:${event._id || event.id}`);
}

export async function notifyAssessmentUpdate(previous, next) {
  if (!isNotifiableEvent(next) || !importantEventChanged(previous, next)) {
    return { skipped: true, reason: "not-important" };
  }
  const payload = { ...notificationForEvent(next, "updated"), eventId: String(next._id || next.id) };
  return safeBroadcast(payload, `event-updated:${next._id || next.id}:${next.updatedAt?.getTime?.() || Date.now()}`);
}

export async function notifyCancellation(event) {
  if (!isNotifiableEvent(event)) return { skipped: true, reason: "not-notifiable" };
  const payload = { ...notificationForEvent(event, "cancelled"), eventId: String(event._id || event.id) };
  return safeBroadcast(payload, `event-cancelled:${event._id || event.id}`);
}

export async function notifyTest() {
  return safeBroadcast(
    {
      type: "test",
      title: "CSE 61 D",
      body: "Notifications are working.",
      url: "/"
    },
    `test:${Date.now()}`,
    { force: true }
  );
}
