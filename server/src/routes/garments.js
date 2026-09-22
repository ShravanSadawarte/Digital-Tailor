import { Router } from "express";
import { store } from "../db/index.js";
import { requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { AppError } from "../utils/errors.js";
import { pageOut } from "../utils/paging.js";
import { categorySchema, garmentSchema, optionSchema, optionUpdateSchema } from "../validation/schemas.js";

const r = Router();

r.get("/categories", async (_req, res, next) => {
  try {
    res.json({ data: await store.listCategories(true) });
  } catch (e) { next(e); }
});

r.get("/", async (req, res, next) => {
  try {
    // Admins can pass ?all=1 to manage hidden products too.
    const admin = req.session?.role === "admin";
    res.json(pageOut(await store.listGarments({
      category: req.query.category, query: req.query.q,
      page: req.query.page, limit: req.query.limit,
      activeOnly: admin && req.query.all === "1" ? false : true,
    })));
  } catch (e) { next(e); }
});

r.get("/:id", async (req, res, next) => {
  try {
    const g = await store.getGarment(req.params.id);
    if (!g || !g.is_active) throw AppError.notFound("Garment not found");
    res.json({ ...g, options: await store.getGarmentOptions(g.id) });
  } catch (e) { next(e); }
});

function toGarmentCreate(b = {}) {
  return {
    categoryId: b.category_id,
    name: b.name,
    description: b.description,
    basePrice: b.base_price,
    imagePath: b.image_path,
    isActive: b.is_active,
  };
}

function toGarmentUpdate(b = {}) {
  const out = {};
  if (b.category_id !== undefined) out.categoryId = b.category_id;
  if (b.categoryId !== undefined) out.categoryId = b.categoryId;
  if (b.name !== undefined) out.name = b.name;
  if (b.description !== undefined) out.description = b.description;
  if (b.base_price !== undefined) out.basePrice = b.base_price;
  if (b.basePrice !== undefined) out.basePrice = b.basePrice;
  if (b.image_path !== undefined) out.imagePath = b.image_path;
  if (b.imagePath !== undefined) out.imagePath = b.imagePath;
  if (b.is_active !== undefined) out.isActive = b.is_active;
  if (b.isActive !== undefined) out.isActive = b.isActive;
  return out;
}

// — admin catalog —
r.post("/admin/categories", requireRole("admin"), validate(categorySchema), async (req, res, next) => {
  try {
    const c = await store.createCategory(req.body);
    await store.logAction({ adminId: req.user.id, action: "category.create", entity: "categories", entityId: c.id }).catch(() => {});
    res.status(201).json(c);
  } catch (e) { next(e); }
});

r.put("/admin/categories/:id", requireRole("admin"), async (req, res, next) => {
  try {
    res.json(await store.updateCategory(req.params.id, req.body));
  } catch (e) { next(e); }
});

r.post("/admin", requireRole("admin"), validate(garmentSchema), async (req, res, next) => {
  try {
    const g = await store.createGarment(toGarmentCreate(req.body));
    await store.logAction({ adminId: req.user.id, action: "garment.create", entity: "garments", entityId: g.id }).catch(() => {});
    res.status(201).json(g);
  } catch (e) { next(e); }
});

// Admin product detail — includes inactive garments and ALL options
// (the public route hides those), for editing and the design library.
r.get("/admin/:id", requireRole("admin"), async (req, res, next) => {
  try {
    const g = await store.getGarment(req.params.id);
    if (!g) throw AppError.notFound("Garment not found");
    res.json({ ...g, options: await store.getGarmentOptionsAll(g.id) });
  } catch (e) { next(e); }
});

r.put("/admin/:id", requireRole("admin"), async (req, res, next) => {
  try {
    const g = await store.updateGarment(req.params.id, toGarmentUpdate(req.body));
    if (!g) throw AppError.notFound("Garment not found");
    await store.logAction({ adminId: req.user.id, action: "garment.update", entity: "garments", entityId: g.id }).catch(() => {});
    res.json(g);
  } catch (e) { next(e); }
});

r.post("/admin/:id/options", requireRole("admin"), validate(optionSchema), async (req, res, next) => {
  try {
    res.status(201).json(await store.addOption({
      garmentId: req.params.id,
      type: req.body.type,
      value: req.body.value,
      priceDelta: req.body.price_delta ?? req.body.priceDelta ?? 0,
      imageUrl: req.body.image_url ?? req.body.imageUrl ?? null,
    }));
  } catch (e) { next(e); }
});

r.delete("/admin/options/:optionId", requireRole("admin"), async (req, res, next) => {
  try {
    await store.removeOption(req.params.optionId);
    res.status(204).end();
  } catch (e) { next(e); }
});

function toOptionUpdate(b = {}) {
  const out = {};
  if (b.value !== undefined) out.value = b.value;
  if (b.price_delta !== undefined) out.priceDelta = b.price_delta;
  if (b.priceDelta !== undefined) out.priceDelta = b.priceDelta;
  if (b.image_url !== undefined) out.imageUrl = b.image_url;
  if (b.imageUrl !== undefined) out.imageUrl = b.imageUrl;
  if (b.is_active !== undefined) out.isActive = b.is_active;
  if (b.isActive !== undefined) out.isActive = b.isActive;
  return out;
}

r.put("/admin/options/:optionId", requireRole("admin"), validate(optionUpdateSchema), async (req, res, next) => {
  try {
    const o = await store.updateOption(req.params.optionId, toOptionUpdate(req.body));
    if (!o) throw AppError.notFound("Option not found");
    await store.logAction({ adminId: req.user.id, action: "option.update", entity: "garment_options", entityId: o.id }).catch(() => {});
    res.json(o);
  } catch (e) { next(e); }
});

export default r;
