import { Router } from "express";
import { getMonthOverview, getPlanningStats, getRoutine, getUpcomingAssessments, getWeekSchedule } from "../controllers/publicController.js";
import { getPublicKey, markRead, status, subscribe, unsubscribe } from "../controllers/pushController.js";
import { createEventRequest } from "../controllers/requestController.js";
import { pushLimiter, requestLimiter } from "../middleware/rateLimiters.js";
import { validateBody } from "../middleware/validate.js";
import { eventRequestSchema, pushEndpointSchema, pushSubscriptionSchema } from "../validators/schemas.js";

export const publicRoutes = Router();

publicRoutes.get("/calendar/week", getWeekSchedule);
publicRoutes.get("/calendar/month", getMonthOverview);
publicRoutes.get("/routine", getRoutine);
publicRoutes.get("/assessments/upcoming", getUpcomingAssessments);
publicRoutes.get("/planning-stats", getPlanningStats);
publicRoutes.post("/requests", requestLimiter, validateBody(eventRequestSchema), createEventRequest);
publicRoutes.get("/push/public-key", getPublicKey);
publicRoutes.get("/push/status", pushLimiter, status);
publicRoutes.post("/push/subscribe", pushLimiter, validateBody(pushSubscriptionSchema), subscribe);
publicRoutes.post("/push/unsubscribe", pushLimiter, validateBody(pushEndpointSchema), unsubscribe);
publicRoutes.post("/push/mark-read", pushLimiter, validateBody(pushEndpointSchema), markRead);
