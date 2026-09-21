import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { adminRoutes } from "./routes/adminRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { publicRoutes } from "./routes/publicRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

function ensureDbConnection() {
  return async (req, res, next) => {
    try {
      await connectDb();
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function createApp({ autoConnectDb = false } = {}) {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  if (env.nodeEnv !== "test") app.use(morgan("dev"));

  app.get("/health", (req, res) => res.json({ ok: true, timezone: "Asia/Dhaka" }));
  if (autoConnectDb) app.use(ensureDbConnection());
  app.use("/api", publicRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

const app = createApp({ autoConnectDb: true });

export default app;
