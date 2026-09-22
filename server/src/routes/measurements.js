import { Router } from "express";
import { store } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { AppError } from "../utils/errors.js";
import { checkRequiredMeasurements } from "../services/pricing.service.js";
import { mProfileSchema, mProfileUpdateSchema } from "../validation/schemas.js";

const r = Router();
r.use(requireAuth);

async function owned(id, customerId) {
  const p = await store.getMProfile(id);
  if (!p || p.customer_id !== Number(customerId)) throw AppError.notFound("Measurement profile not found");
  return p;
}

async function withValues(p) {
  return { ...p, values: await store.getMValues(p.id) };
}

r.get("/", async (req, res, next) => {
  try {
    const list = await store.listMProfiles(req.user.id);
    res.json({ data: await Promise.all(list.map(withValues)) });
  } catch (e) { next(e); }
});

r.post("/", validate(mProfileSchema), async (req, res, next) => {
  try {
    checkRequiredMeasurements(req.body.garment_hint, req.body.values);
    const p = await store.createMProfile(req.user.id, { name: req.body.name, garmentHint: req.body.garment_hint });
    await store.replaceMValues(p.id, req.body.values);
    if (req.body.is_default) {
      await store.clearDefault(req.user.id);
      await store.updateMProfile(p.id, { isDefault: true });
    }
    res.status(201).json(await withValues(await store.getMProfile(p.id)));
  } catch (e) { next(e); }
});

r.get("/:id", async (req, res, next) => {
  try {
    res.json(await withValues(await owned(req.params.id, req.user.id)));
  } catch (e) { next(e); }
});

r.put("/:id", validate(mProfileUpdateSchema), async (req, res, next) => {
  try {
    const p = await owned(req.params.id, req.user.id);
    if (req.body.values) {
      const merged = { ...(await store.getMValues(p.id)), ...req.body.values };
      checkRequiredMeasurements(req.body.garment_hint ?? p.garment_hint, merged);
      await store.replaceMValues(p.id, merged);
    }
    if (req.body.is_default) await store.clearDefault(req.user.id);
    res.json(await withValues(await store.updateMProfile(p.id, {
      name: req.body.name, garmentHint: req.body.garment_hint, isDefault: req.body.is_default,
    })));
  } catch (e) { next(e); }
});

r.delete("/:id", async (req, res, next) => {
  try {
    await owned(req.params.id, req.user.id);
    await store.deleteMProfile(req.params.id);
    res.status(204).end();
  } catch (e) { next(e); }
});

export default r;
