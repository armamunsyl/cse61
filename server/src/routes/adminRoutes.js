import { Router } from "express";
import {
  approveRequest,
  createEvent,
  createRoutine,
  deleteEvent,
  deleteRoutine,
  getConflicts,
  getDashboard,
  listEvents,
  listExceptions,
  listRequests,
  listRoutine,
  rejectRequest,
  updateEvent,
  updateRoutine,
  upsertClassException
} from "../controllers/adminController.js";
import { sendTestNotification } from "../controllers/pushController.js";
import { requireAdmin } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { classExceptionSchema, eventApprovalSchema, eventPayloadSchema, routineSlotSchema } from "../validators/schemas.js";

export const adminRoutes = Router();

adminRoutes.use(requireAdmin);
adminRoutes.get("/dashboard", getDashboard);
adminRoutes.get("/requests", listRequests);
adminRoutes.post("/requests/:id/approve", validateBody(eventApprovalSchema), approveRequest);
adminRoutes.post("/requests/:id/reject", rejectRequest);
adminRoutes.get("/events", listEvents);
adminRoutes.post("/events", validateBody(eventPayloadSchema), createEvent);
adminRoutes.put("/events/:id", validateBody(eventPayloadSchema), updateEvent);
adminRoutes.delete("/events/:id", deleteEvent);
adminRoutes.get("/routine", listRoutine);
adminRoutes.post("/routine", validateBody(routineSlotSchema), createRoutine);
adminRoutes.put("/routine/:id", validateBody(routineSlotSchema), updateRoutine);
adminRoutes.delete("/routine/:id", deleteRoutine);
adminRoutes.get("/exceptions", listExceptions);
adminRoutes.post("/exceptions", validateBody(classExceptionSchema), upsertClassException);
adminRoutes.get("/conflicts", getConflicts);
adminRoutes.post("/push/test", sendTestNotification);
