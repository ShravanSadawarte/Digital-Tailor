import { store } from "../db/index.js";
import { AppError } from "../utils/errors.js";
import { buildPrompt } from "../utils/promptBuilder.js";

export async function generatePrompt({ userId, designId, prefs }) {
  let design = null;
  let merged = { ...prefs };
  if (designId) {
    design = await store.getDesign(designId);
    if (!design) throw AppError.notFound("Design not found");
    if (userId && design.customer_id !== Number(userId)) throw AppError.notFound("Design not found");
    const garment = await store.getGarment(design.garment_id);
    merged = {
      garment: garment?.name, outfit: garment?.name,
      fabric_source: design.fabric_source, fabric_detail: design.fabric_detail,
      color: design.color, neck: design.neck, sleeve: design.sleeve,
      length: design.length_opt, fit: design.fit, embroidery: design.embroidery,
      occasion: design.occasion, style: design.style, footwear: design.footwear,
      accessories: design.accessories, hairstyle: design.hairstyle, grooming: design.grooming,
      season: design.season, location_context: design.location_context,
      background: design.background, lighting: design.lighting,
      extra_preferences: design.extra_preferences, custom_notes: design.custom_notes,
      ...prefs,
    };
  }
  const prompt = buildPrompt(merged);
  let history = null;
  if (userId) {
    history = await store.addPromptHistory({ userId, designId: design?.id || null, inputs: merged, prompt });
    if (design) await store.updateDesign(design.id, { aiPrompt: prompt });
  }
  return { prompt, historyId: history?.id || null };
}
