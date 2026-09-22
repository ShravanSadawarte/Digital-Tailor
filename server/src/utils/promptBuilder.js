// Deterministic prompt builder — shared server logic.
// Mirrors public behavior: preferences in, ChatGPT-ready text out.
// No image model, no external calls.
export function buildPrompt(p = {}) {
  const pick = (v, fallback = "") => (v && String(v).trim() ? String(v).trim() : fallback);
  const occasion = pick(p.occasion, "festive occasion");
  const outfit = pick(p.outfit || p.outfit_type || p.garment, "kurti");
  const color = pick(p.color || p.colors, "elegant");
  const fabric = pick(p.fabric, "comfortable fabric");
  const style = pick(p.style, "modern");
  const fit = pick(p.fit, "tailored");
  const footwear = pick(p.footwear, "matching footwear");
  const accessories = pick(p.accessories, "");
  const hairstyle = pick(p.hairstyle, "");
  const grooming = pick(p.grooming, "");
  const season = pick(p.season, "");
  const location = pick(p.location_context || p.location, "");
  const background = pick(p.background, "warm celebratory setting");
  const lighting = pick(p.lighting, "soft natural lighting");

  let prompt =
    `Use the uploaded photo as the primary reference. Preserve the person's identity, ` +
    `facial characteristics and realistic body proportions. Show her wearing a ${color} ${fabric} ` +
    `${outfit} in a ${style} style with a ${fit} fit, perfect for ${occasion}. ` +
    `Footwear: ${footwear}.`;
  if (accessories) prompt += ` Accessories: ${accessories}.`;
  if (hairstyle) prompt += ` Hairstyle: ${hairstyle}.`;
  if (grooming) prompt += ` Grooming: ${grooming}.`;
  if (season) prompt += ` Season: ${season}.`;
  if (location) prompt += ` Setting context: ${location}.`;
  prompt +=
    ` Background: ${background}, ${lighting}. Photorealistic full-length fashion ` +
    `visualization with natural fabric drape, realistic fit and natural skin appearance. ` +
    `Avoid distorted faces, extra limbs, warped patterns or text artifacts.`;
  if (p.extra_preferences || p.custom_notes) {
    prompt += ` Additional preferences: ${pick(p.extra_preferences || p.custom_notes).slice(0, 500)}.`;
  }
  return prompt;
}
