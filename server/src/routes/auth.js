 import { Router } from "express";
import { store } from "../db/index.js";
import { checkCsrf, issueCsrf } from "../middleware/security.js";
import { validate } from "../middleware/validate.js";
import { login, register, startSession } from "../services/auth.service.js";
import { loginSchema, registerSchema } from "../validation/schemas.js";

const r = Router();

r.get("/csrf", issueCsrf);
r.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const user = await register(req.body);
    await startSession(req, user);
    res.status(201).json({ user });
  } catch (e) { next(e); }
});
r.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const user = await login(req.body);
    await startSession(req, user);
    res.json({ user });
  } catch (e) { next(e); }
});
r.post("/logout", (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("dt.sid");
    res.status(204).end();
  });
});
r.get("/me", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Not logged in" } });
  const u = await store.findUserById(req.session.userId);
  if (!u) return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Not logged in" } });
  res.json({ user: { id: u.id, name: u.name, phone: u.phone, email: u.email, role: u.role } });
});

export { checkCsrf };
export default r;
