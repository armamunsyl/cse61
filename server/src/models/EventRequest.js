import mongoose from "mongoose";
import { EVENT_TYPES, REQUEST_STATUSES } from "../constants.js";

const eventRequestSchema = new mongoose.Schema(
  {
    type: { type: String, enum: EVENT_TYPES, required: true },
    title: { type: String, required: true, trim: true },
    subjectName: { type: String, trim: true },
    subjectCode: { type: String, trim: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    marks: { type: Number, min: 0 },
    syllabus: { type: String, trim: true },
    details: { type: String, trim: true },
    routineSlotId: { type: mongoose.Schema.Types.ObjectId, ref: "RoutineSlot" },
    proposerName: { type: String, required: true, trim: true },
    proposerIdentity: { type: String, required: true, trim: true },
    status: { type: String, enum: REQUEST_STATUSES, default: "pending" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
    reviewedAt: Date,
    rejectionReason: { type: String, trim: true },
    approvedEventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" }
  },
  { timestamps: true }
);

eventRequestSchema.index({ status: 1, createdAt: -1 });
eventRequestSchema.index({ date: 1, startTime: 1 });

export const EventRequest = mongoose.model("EventRequest", eventRequestSchema);
