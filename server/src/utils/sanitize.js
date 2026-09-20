import validator from "validator";

export function sanitizeText(value) {
  if (value === undefined || value === null) return value;
  return validator.escape(String(value).trim());
}

export function sanitizeObject(input) {
  if (!input || typeof input !== "object") return input;
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      typeof value === "string" ? sanitizeText(value) : value
    ])
  );
}
