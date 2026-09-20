import jwt from "jsonwebtoken";
import { AdminUser } from "../models/AdminUser.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/errors.js";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.cookieSecure || env.nodeEnv === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const admin = await AdminUser.findOne({ email: email.toLowerCase() });
  if (!admin || !(await admin.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  const token = jwt.sign({ sub: admin._id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  res.cookie("admin_token", token, cookieOptions());
  res.json({ admin: { id: admin._id, name: admin.name, email: admin.email } });
});

export function logout(req, res) {
  res.clearCookie("admin_token", cookieOptions());
  res.json({ message: "Logged out" });
}

export function me(req, res) {
  res.json({ admin: req.admin });
}
