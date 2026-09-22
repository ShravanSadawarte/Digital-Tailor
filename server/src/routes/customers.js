import { Router } from "express";
import { store } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { profileSchema } from "../validation/schemas.js";

const r = Router();
r.use(requireAuth);

r.get("/profile", async (req, res, next) => {
  try {
    res.json({ profile: await store.getProfileByUser(req.user.id) });
  } catch (e) { next(e); }
});
r.put("/profile", validate(profileSchema), async (req, res, next) => {
  try {
    res.json({ profile: await store.upsertProfile(req.user.id, req.body) });
  } catch (e) { next(e); }
});

export default r;
