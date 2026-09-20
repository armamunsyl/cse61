import { Router } from "express";
import { login, logout, me } from "../controllers/authController.js";
import { requireAdmin } from "../middleware/auth.js";
import { loginLimiter } from "../middleware/rateLimiters.js";
import { validateBody } from "../middleware/validate.js";
import { loginSchema } from "../validators/schemas.js";

export const authRoutes = Router();

authRoutes.post("/login", loginLimiter, validateBody(loginSchema), login);
authRoutes.post("/logout", logout);
authRoutes.get("/me", requireAdmin, me);
