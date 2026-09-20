import mongoose from "mongoose";

const notificationLogSchema = new mongoose.Schema(
  {
    dedupeKey: { type: String, required: true, unique: true, trim: true },
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    successCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    skippedReason: { type: String, trim: true }
  },
  { timestamps: true }
);

export const NotificationLog = mongoose.model("NotificationLog", notificationLogSchema);
