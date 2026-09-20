import jwt from "jsonwebtoken";
import { AdminUser } from "../models/AdminUser.js";
import { env } from "../config/env.js";

export async function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.admin_token;
    if (!token) return res.status(401).json({ message: "Authentication required" });
    const payload = jwt.verify(token, env.jwtSecret);
    const admin = await AdminUser.findById(payload.sub).select("-passwordHash");
    if (!admin) return res.status(401).json({ message: "Authentication required" });
    req.admin = admin;
    next();
  } catch {
    res.status(401).json({ message: "Authentication required" });
  }
}
