import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";
const cookieSecure = isProduction || process.env.COOKIE_SECURE === "true";

function normalizeOrigin(origin) {
  return origin.replace(/\/+$/, "");
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT || 8000),
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mucse61_schedule",
  jwtSecret: process.env.JWT_SECRET || "development-only-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientOrigin: normalizeOrigin(process.env.CLIENT_ORIGIN || "http://localhost:5174"),
  cookieSecure,
  cookieSameSite: "lax",
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  adminName: process.env.ADMIN_NAME || "CSE 61 D Admin",
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || "",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || "",
  vapidSubject: process.env.VAPID_SUBJECT || "mailto:admin@example.com"
};
