import { AppError } from "../utils/errors.js";

// Session-based auth. Role always comes from the server session, never the client.
export function requireAuth(req, _res, next) {
  if (!req.session?.userId) return next(AppError.unauthorized());
  req.user = { id: req.session.userId, role: req.session.role };
  next();
}

export function requireRole(role) {
  return (req, _res, next) => {
    if (!req.session?.userId) return next(AppError.unauthorized());
    if (req.session.role !== role) return next(AppError.forbidden("Admin only"));
    req.user = { id: req.session.userId, role: req.session.role };
    next();
  };
}
