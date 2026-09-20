import mongoose from "mongoose";

const pushSubscriptionSchema = new mongoose.Schema(
  {
    endpoint: { type: String, required: true, unique: true, trim: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    },
    unreadCount: { type: Number, default: 0, min: 0 },
    enabled: { type: Boolean, default: true },
    userAgent: { type: String, trim: true },
    platform: { type: String, trim: true },
    lastSeenAt: Date,
    lastNotificationAt: Date
  },
  { timestamps: true }
);

pushSubscriptionSchema.index({ enabled: 1 });

export const PushSubscription = mongoose.model("PushSubscription", pushSubscriptionSchema);
