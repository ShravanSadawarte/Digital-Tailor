import fs from "fs";
import { Router } from "express";
import { store } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { AppError } from "../utils/errors.js";
import { pageOut } from "../utils/paging.js";
import { buildPrompt } from "../utils/promptBuilder.js";
import { priceFor } from "../services/pricing.service.js";
import { designSchema } from "../validation/schemas.js";

const r = Router();
r.use(requireAuth);

// API speaks snake_case; the store speaks camelCase.
function toDesign(b = {}) {
  const d = {
    garmentId: b.garment_id, title: b.title, fabricSource: b.fabric_source,
    fabricDetail: b.fabric_detail, cloth: b.cloth, color: b.color, neck: b.neck,
    neckFront: b.neck_front, neckBack: b.neck_back, sleeve: b.sleeve,
    lengthOpt: b.length_opt, fit: b.fit, embroidery: b.embroidery, occasion: b.occasion,
    style: b.style, footwear: b.footwear, accessories: b.accessories, hairstyle: b.hairstyle,
    grooming: b.grooming, season: b.season, locationContext: b.location_context,
    background: b.background, lighting: b.lighting, extraPreferences: b.extra_preferences,
    customNotes: b.custom_notes,
  };
  return Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined));
}

function shape(d) {
  return {
    id: d.id, garment_id: d.garment_id, title: d.title, fabric_source: d.fabric_source,
    fabric_detail: d.fabric_detail, cloth: d.cloth || null, color: d.color, neck: d.neck,
    neck_front: d.neck_front || d.neckFront || null, neck_back: d.neck_back || d.neckBack || null,
    sleeve: d.sleeve,
    length_opt: d.length_opt, fit: d.fit, embroidery: d.embroidery, occasion: d.occasion,
    style: d.style, footwear: d.footwear, accessories: d.accessories, hairstyle: d.hairstyle,
    grooming: d.grooming, season: d.season, location_context: d.location_context,
    background: d.background, lighting: d.lighting, extra_preferences: d.extra_preferences,
    custom_notes: d.custom_notes, ai_prompt: d.ai_prompt, created_at: d.created_at,
  };
}

async function buildAndCache(design) {
  const garment = await store.getGarment(design.garment_id);
  const neckLabel = design.neck_front || design.neckFront || design.neck;
  const prompt = buildPrompt({
    garment: garment?.name, fabric_source: design.fabric_source, fabric_detail: [design.cloth ? `Cloth: ${design.cloth}` : "", design.fabric_detail || ""].filter(Boolean).join(" "),
    color: design.color, neck: [neckLabel, design.neck_back || design.neckBack ? `back ${design.neck_back || design.neckBack}` : ""].filter(Boolean).join(" "), sleeve: design.sleeve, length: design.length_opt,
    fit: design.fit, embroidery: design.embroidery, occasion: design.occasion, style: design.style,
    footwear: design.footwear, accessories: design.accessories, hairstyle: design.hairstyle,
    grooming: design.grooming, season: design.season, location_context: design.location_context,
    background: design.background, lighting: design.lighting,
    extra_preferences: design.extra_preferences, custom_notes: design.custom_notes,
  });
  await store.updateDesign(design.id, { aiPrompt: prompt });
  return prompt;
}

r.post("/", validate(designSchema), async (req, res, next) => {
  try {
    await priceFor(req.body.garment_id, req.body); // validates garment + option values
    const d = await store.createDesign(req.user.id, toDesign(req.body));
    const ai_prompt = await buildAndCache(d);
    res.status(201).json({ ...shape({ ...d, ai_prompt }), ai_prompt });
  } catch (e) { next(e); }
});

r.get("/", async (req, res, next) => {
  try {
    const r2 = await store.listDesigns(req.user.id, { page: req.query.page, limit: req.query.limit });
    res.json(pageOut({ ...r2, rows: r2.rows.map(shape) }));
  } catch (e) { next(e); }
});

r.get("/:id", async (req, res, next) => {
  try {
    const d = await store.getDesign(req.params.id);
    if (!d || d.customer_id !== Number(req.user.id)) throw AppError.notFound("Design not found");
    res.json(shape(d));
  } catch (e) { next(e); }
});

r.put("/:id", validate(designSchema.partial()), async (req, res, next) => {
  try {
    const d = await store.getDesign(req.params.id);
    if (!d || d.customer_id !== Number(req.user.id)) throw AppError.notFound("Design not found");
    const updated = await store.updateDesign(d.id, toDesign(req.body));
    const ai_prompt = await buildAndCache(updated);
    res.json({ ...shape({ ...updated, ai_prompt }), ai_prompt });
  } catch (e) { next(e); }
});

r.delete("/:id", async (req, res, next) => {
  try {
    const d = await store.getDesign(req.params.id);
    if (!d || d.customer_id !== Number(req.user.id)) throw AppError.notFound("Design not found");
    const refs = await store.listRefsByDesign(d.id);
    await store.deleteDesign(d.id);
    for (const ref of refs) {
      const full = await store.getRef(ref.id).catch(() => null);
      if (full?.file_path) fs.rm(full.file_path, { force: true }, () => {});
    }
    res.status(204).end();
  } catch (e) { next(e); }
});

export default r;
