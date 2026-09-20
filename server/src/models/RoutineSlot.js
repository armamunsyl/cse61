import mongoose from "mongoose";

const routineSlotSchema = new mongoose.Schema(
  {
    subjectName: { type: String, required: true, trim: true },
    subjectCode: { type: String, required: true, trim: true },
    teacherName: { type: String, required: true, trim: true },
    room: { type: String, required: true, trim: true },
    weekday: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    color: { type: String, default: "#2563eb" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

routineSlotSchema.index({ weekday: 1, startTime: 1 });

export const RoutineSlot = mongoose.model("RoutineSlot", routineSlotSchema);
