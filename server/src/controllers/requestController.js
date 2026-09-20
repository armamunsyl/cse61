import { EventRequest } from "../models/EventRequest.js";
import { asyncHandler } from "../utils/errors.js";
import { normalizeEventPayload } from "../services/calendarService.js";

export const createEventRequest = asyncHandler(async (req, res) => {
  const payload = normalizeEventPayload(req.body);
  const eventRequest = await EventRequest.create(payload);
  res.status(201).json({
    message: "Request submitted successfully. An admin will review it before publishing.",
    request: eventRequest
  });
});
