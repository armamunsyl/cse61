import { ActivityLog } from "../models/ActivityLog.js";

export function logActivity({ actor, action, entityType, entityId, message }) {
  return ActivityLog.create({ actor, action, entityType, entityId, message });
}
