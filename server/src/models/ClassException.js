import mongoose from "mongoose";

const classExceptionSchema = new mongoose.Schema(
  {
    routineSlotId: { type: mongoose.Schema.Types.ObjectId, ref: "RoutineSlot", required: true },
    date: { type: String, required: true },
    status: { type: String, enum: ["suspended", "modified"], required: true },
    reason: { type: String, trim: true },
    replacement: {
      subjectName: String,
      subjectCode: String,
      teacherName: String,
      room: String,
      startTime: String,
      endTime: String
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" }
  },
  { timestamps: true }
);

classExceptionSchema.index({ routineSlotId: 1, date: 1 }, { unique: true });

export const ClassException = mongoose.model("ClassException", classExceptionSchema);
