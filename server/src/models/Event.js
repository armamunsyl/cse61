import mongoose from "mongoose";
import { EVENT_TYPES } from "../constants.js";

const eventSchema = new mongoose.Schema(
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
    sourceRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "EventRequest", unique: true, sparse: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" }
  },
  { timestamps: true }
);

eventSchema.index({ date: 1, startTime: 1 });
eventSchema.index({ type: 1, date: 1 });

export const Event = mongoose.model("Event", eventSchema);
