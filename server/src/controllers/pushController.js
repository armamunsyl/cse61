import { env } from "../config/env.js";
import { PushSubscription } from "../models/PushSubscription.js";
import { notifyTest } from "../services/pushService.js";
import { asyncHandler } from "../utils/errors.js";

export const getPublicKey = asyncHandler(async (req, res) => {
  res.json({ publicKey: env.vapidPublicKey, configured: Boolean(env.vapidPublicKey) });
});

export const subscribe = asyncHandler(async (req, res) => {
  const subscription = await PushSubscription.findOneAndUpdate(
    { endpoint: req.body.endpoint },
    {
      $set: {
        endpoint: req.body.endpoint,
        keys: req.body.keys,
        enabled: true,
        userAgent: req.body.userAgent || req.get("user-agent") || "",
        platform: req.body.platform || "",
        lastSeenAt: new Date()
      },
      $setOnInsert: { unreadCount: 0 }
    },
    { upsert: true, new: true, runValidators: true }
  );
  res.status(201).json({ enabled: subscription.enabled, unreadCount: subscription.unreadCount });
});

export const unsubscribe = asyncHandler(async (req, res) => {
  await PushSubscription.findOneAndUpdate(
    { endpoint: req.body.endpoint },
    { enabled: false, lastSeenAt: new Date() }
  );
  res.json({ enabled: false });
});

export const markRead = asyncHandler(async (req, res) => {
  const subscription = await PushSubscription.findOneAndUpdate(
    { endpoint: req.body.endpoint },
    { unreadCount: 0, lastSeenAt: new Date() },
    { new: true }
  );
  res.json({ unreadCount: subscription?.unreadCount || 0 });
});

export const status = asyncHandler(async (req, res) => {
  const endpoint = req.query.endpoint;
  if (!endpoint) return res.json({ enabled: false, unreadCount: 0 });
  const subscription = await PushSubscription.findOne({ endpoint }).lean();
  res.json({
    enabled: Boolean(subscription?.enabled),
    unreadCount: subscription?.unreadCount || 0
  });
});

export const sendTestNotification = asyncHandler(async (req, res) => {
  const result = await notifyTest();
  res.json({ message: "Test notification queued", result });
});
