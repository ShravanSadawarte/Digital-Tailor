import { store } from "../db/index.js";
import { AppError } from "../utils/errors.js";
import { GARMENT_REQUIRED } from "../validation/schemas.js";

// Price = garment base + deltas of chosen options that exist in catalog.
export async function priceFor(garmentId, choices = {}) {
  const garment = await store.getGarment(garmentId);
  if (!garment || !garment.is_active) throw AppError.notFound("Garment not available");
  const options = await store.getGarmentOptions(garmentId);
  const byType = {};
  for (const o of options) {
    (byType[o.option_type] ||= new Set()).add(o.option_value);
  }
  const map = {
    cloth: "cloth", neck: "neck", neck_front: "neck_front", neck_back: "neck_back",
    sleeve: "sleeve", fit: "fit", color: "color",
    length_opt: "length", embroidery: "embroidery", occasion: "occasion",
    style: "style", footwear: "footwear",
  };
  let total = Number(garment.base_price);
  const snapshot = {};
  for (const [choiceKey, optType] of Object.entries(map)) {
    const val = choices[choiceKey];
    if (val == null || val === "") continue;
    // Lenient for new personalize types: if the tailor hasn't added options of
    // this type yet, accept free text (fallback lists) at +₹0 instead of 400ing.
    if (!byType[optType]) {
      snapshot[choiceKey] = val;
      continue;
    }
    if (!byType[optType]?.has(val)) throw AppError.badRequest(`Invalid ${choiceKey}: ${val}`);
    snapshot[choiceKey] = val;
    const opt = options.find((o) => o.option_type === optType && o.option_value === val);
    total += Number(opt?.price_delta || 0);
  }
  return { garment, unitPrice: total, snapshot };
}

export function checkRequiredMeasurements(hint, values) {
  if (!hint || !GARMENT_REQUIRED[hint]) return;
  const missing = GARMENT_REQUIRED[hint].filter((f) => values[f] === undefined);
  if (missing.length) throw AppError.badRequest(`Missing measurements for ${hint}: ${missing.join(", ")}`);
}

export function checkOfferEligible(offer, { subtotal, categoryId, isFirstOrder, now = new Date() }) {
  if (!offer || !offer.is_active) return { ok: false, code: "OFFER_INVALID" };
  if (offer.starts_at && new Date(offer.starts_at) > now) return { ok: false, code: "OFFER_INVALID" };
  if (offer.ends_at && new Date(offer.ends_at) < now) return { ok: false, code: "OFFER_EXPIRED" };
  if (Number(offer.min_order) > subtotal) return { ok: false, code: "OFFER_MIN_ORDER" };
  if (offer.scope_category_id && Number(offer.scope_category_id) !== Number(categoryId)) {
    return { ok: false, code: "OFFER_SCOPE" };
  }
  if (offer.first_order_only && !isFirstOrder) return { ok: false, code: "OFFER_FIRST_ORDER_ONLY" };
  return { ok: true };
}

export function discountFor(offer, subtotal) {
  if (offer.discount_type === "percent") {
    return Math.min(subtotal, Math.round((subtotal * Number(offer.discount_value)) / 100 * 100) / 100);
  }
  return Math.min(subtotal, Number(offer.discount_value));
}
