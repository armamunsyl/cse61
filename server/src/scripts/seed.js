import { connectDb, disconnectDb } from "../config/db.js";
import { env } from "../config/env.js";
import { AdminUser } from "../models/AdminUser.js";
import { Event } from "../models/Event.js";
import { EventRequest } from "../models/EventRequest.js";
import { RoutineSlot } from "../models/RoutineSlot.js";
import { routineRowsToDocuments, updatedRoutine } from "../data/updatedRoutine.js";
import { addDaysISO, todayISO } from "../utils/date.js";

async function seedAdmin() {
  if (!env.adminEmail || !env.adminPassword) {
    console.log("ADMIN_EMAIL and ADMIN_PASSWORD are required to seed admin.");
    return;
  }
  const existing = await AdminUser.findOne({ email: env.adminEmail.toLowerCase() });
  if (existing) {
    console.log("Admin already exists.");
    return;
  }
  const passwordHash = await AdminUser.hashPassword(env.adminPassword);
  await AdminUser.create({ name: env.adminName, email: env.adminEmail, passwordHash });
  console.log("Admin created.");
}

async function seedRoutine() {
  const count = await RoutineSlot.countDocuments();
  if (count) return console.log("Routine seed skipped.");
  await RoutineSlot.insertMany(routineRowsToDocuments(updatedRoutine));
  console.log("Routine seed inserted.");
}

async function seedEvents() {
  const count = await Event.countDocuments();
  if (count) return console.log("Event seed skipped.");
  await Event.insertMany([
    {
      type: "quiz",
      title: "DBMS Quiz",
      subjectName: "Database Management Systems",
      subjectCode: "CSE-321",
      date: addDaysISO(todayISO(), 2),
      startTime: "10:30",
      endTime: "12:00",
      marks: 10,
      syllabus: "Normalization and ER diagrams"
    },
    {
      type: "ct",
      title: "Computer Networks CT",
      subjectName: "Computer Networks",
      subjectCode: "CSE-323",
      date: addDaysISO(todayISO(), 6),
      startTime: "09:00",
      endTime: "10:30",
      marks: 20,
      syllabus: "TCP/IP and routing basics"
    }
  ]);
  console.log("Event seed inserted.");
}

async function seedRequests() {
  const count = await EventRequest.countDocuments();
  if (count) return console.log("Request seed skipped.");
  await EventRequest.insertMany([
    {
      type: "presentation",
      title: "Software Engineering Presentation",
      subjectName: "Software Engineering",
      subjectCode: "CSE-325",
      date: addDaysISO(todayISO(), 8),
      startTime: "12:00",
      endTime: "13:30",
      proposerName: "Sample Student",
      proposerIdentity: "CSE 61 D",
      details: "Group presentation slot request"
    },
    {
      type: "quiz",
      title: "Operating Systems Quiz",
      subjectName: "Operating Systems",
      subjectCode: "CSE-327",
      date: addDaysISO(todayISO(), 9),
      startTime: "10:30",
      endTime: "12:00",
      marks: 10,
      proposerName: "CR 61 D",
      proposerIdentity: "Class Representative",
      syllabus: "Process scheduling"
    }
  ]);
  console.log("Request seed inserted.");
}

async function run() {
  await connectDb();
  await seedAdmin();
  await seedRoutine();
  await seedEvents();
  await seedRequests();
  await disconnectDb();
}

run().catch(async (error) => {
  console.error(error);
  await disconnectDb();
  process.exit(1);
});
