import { Router } from "express";
import { store } from "../db/index.js";
import { requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { AppError } from "../utils/errors.js";
import { offerSchema } from "../validation/schemas.js";

const r = Router();

r.get("/", async (_req, res, next) => {
  try {
    res.json({ data: await store.listOffers(true) });
  } catch (e) { next(e); }
});

async function mustExist(id) {
  const o = await store.getOffer(id);
  if (!o) throw AppError.notFound("Offer not found");
  return o;
}

function toOffer(b = {}) {
  const out = {};
  if (b.title !== undefined) out.title = b.title;
  if (b.description !== undefined) out.description = b.description;
  if (b.discount_type !== undefined) out.discountType = b.discount_type;
  if (b.discountType !== undefined) out.discountType = b.discountType;
  if (b.discount_value !== undefined) out.discountValue = b.discount_value;
  if (b.discountValue !== undefined) out.discountValue = b.discountValue;
  if (b.min_order !== undefined) out.minOrder = b.min_order;
  if (b.minOrder !== undefined) out.minOrder = b.minOrder;
  if (b.scope_category_id !== undefined) out.scopeCategoryId = b.scope_category_id;
  if (b.scopeCategoryId !== undefined) out.scopeCategoryId = b.scopeCategoryId;
  if (b.first_order_only !== undefined) out.firstOrderOnly = b.first_order_only;
  if (b.firstOrderOnly !== undefined) out.firstOrderOnly = b.firstOrderOnly;
  if (b.starts_at !== undefined) out.startsAt = b.starts_at;
  if (b.startsAt !== undefined) out.startsAt = b.startsAt;
  if (b.ends_at !== undefined) out.endsAt = b.ends_at;
  if (b.endsAt !== undefined) out.endsAt = b.endsAt;
  if (b.usage_limit !== undefined) out.usageLimit = b.usage_limit;
  if (b.usageLimit !== undefined) out.usageLimit = b.usageLimit;
  if (b.is_active !== undefined) out.isActive = b.is_active;
  if (b.isActive !== undefined) out.isActive = b.isActive;
  return out;
}

r.post("/", requireRole("admin"), validate(offerSchema), async (req, res, next) => {
  try {
    const o = await store.createOffer({ ...toOffer(req.body), createdBy: req.user.id });
    await store.logAction({ adminId: req.user.id, action: "offer.create", entity: "offers", entityId: o.id }).catch(() => {});
    res.status(201).json(o);
  } catch (e) { next(e); }
});

r.put("/:id", requireRole("admin"), async (req, res, next) => {
  try {
    await mustExist(req.params.id);
    const o = await store.updateOffer(req.params.id, toOffer(req.body));
    await store.logAction({ adminId: req.user.id, action: "offer.update", entity: "offers", entityId: o.id }).catch(() => {});
    res.json(o);
  } catch (e) { next(e); }
});

r.delete("/:id", requireRole("admin"), async (req, res, next) => {
  try {
    await mustExist(req.params.id);
    try {
      await store.deleteOffer(req.params.id);
    } catch {
      await store.updateOffer(req.params.id, { isActive: false });
    }
    await store.logAction({ adminId: req.user.id, action: "offer.delete", entity: "offers", entityId: Number(req.params.id) }).catch(() => {});
    res.status(204).end();
  } catch (e) { next(e); }
});

export default r;
