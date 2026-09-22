import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export const globalLimiter = rateLimit({
  windowMs: env.rateWindowMs,
  max: env.rateMax,
  standardHeaders: "draft-7",
  message: { error: { code: "RATE_LIMITED", message: "Too many requests, slow down" } },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: "draft-7",
  message: { error: { code: "RATE_LIMITED", message: "Too many auth attempts" } },
});

export const promptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: "draft-7",
  message: { error: { code: "RATE_LIMITED", message: "Prompt quota exceeded, try later" } },
});

// Double-submit CSRF for cookie-auth mutations.
export function issueCsrf(req, res) {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString("hex");
  res.json({ csrfToken: req.session.csrf });
}

export function checkCsrf(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (!req.session?.userId) return next(); // nothing to forge without a login session
  const sent = req.get("x-csrf-token");
  if (req.session?.csrf && sent && sent === req.session.csrf) return next();
  res.status(403).json({ error: { code: "FORBIDDEN", message: "Invalid CSRF token" } });
}
