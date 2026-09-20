import { sanitizeObject } from "../utils/sanitize.js";

export function validateBody(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(sanitizeObject(req.body));
    if (!parsed.success) {
      return res.status(422).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors
      });
    }
    req.body = parsed.data;
    next();
  };
}
