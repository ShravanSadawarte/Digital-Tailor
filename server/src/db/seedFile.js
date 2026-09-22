import { store } from "./index.js";

// Dev seed for the file store (mirrors db/seeds/seed.sql).
export async function seedFileStore() {
  const cats = await store.listCategories(false);
  if (cats.length > 0) return { seeded: false, reason: "already seeded" };
  const defs = [
    ["kurti", "Kurti", "Everyday and festive kurtis in all fits"],
    ["salwar-suit", "Salwar Suit", "Classic salwar suits with matching bottoms"],
    ["pant-kurti", "Pant Kurti", "Kurti paired with tailored pants"],
    ["palazzo", "Palazzo", "Palazzo sets in flowing fabrics"],
    ["one-piece", "One Piece", "One-piece dresses for occasions"],
    ["custom-dress", "Custom Dress", "Fully custom festive and casual dresses"],
  ];
  const catIds = {};
  for (const [slug, name, description] of defs) {
    const c = await store.createCategory({ slug, name, description });
    catIds[slug] = c.id;
  }
  const garments = [
    ["kurti", "Straight-fit Cotton Kurti", "Breezy daily-wear kurti", 999],
    ["kurti", "Festive Silk Kurti", "Silk kurti with embroidered neckline", 1899],
    ["salwar-suit", "Classic Salwar Suit", "Kurta with matching salwar and dupatta", 1499],
    ["pant-kurti", "Office Pant Kurti", "Sharp kurti with tapered pants", 1299],
    ["palazzo", "Georgette Palazzo Set", "Flowy palazzo with short kurti", 1599],
    ["one-piece", "Evening One-Piece", "Occasion one-piece dress", 1799],
    ["custom-dress", "Bridal Custom Gown", "Made-to-dream bridal wear", 4999],
    ["kurti", "A-line Festive Kurti", "Flared festive kurti", 1399],
  ];
  const optionSets = [
    ["fabric", "Cotton", 0], ["fabric", "Silk", 400], ["fabric", "Georgette", 250], ["fabric", "Velvet", 600],
    ["cloth", "Emerald Cotton", 0], ["cloth", "Royal Silk", 400], ["cloth", "Blush Georgette", 250], ["cloth", "Festive Velvet", 600],
    ["color", "Emerald Green", 0], ["color", "Royal Maroon", 0], ["color", "Blush Pink", 0], ["color", "Sky Blue", 0],
    ["neck", "Round", 0], ["neck", "V-neck", 0], ["neck", "Boat", 50],
    ["neck_front", "Round Front", 0], ["neck_front", "V Front", 0], ["neck_front", "Boat Front", 50], ["neck_front", "Sweetheart Front", 100],
    ["neck_back", "Round Back", 0], ["neck_back", "V Back", 0], ["neck_back", "Boat Back", 50], ["neck_back", "Keyhole Back", 100],
    ["sleeve", "Sleeveless", 0], ["sleeve", "Short", 0], ["sleeve", "3-4 Sleeve", 0], ["sleeve", "Full", 100],
    ["length", "Knee", 0], ["length", "Calf", 0], ["length", "Ankle", 150],
    ["fit", "Relaxed", 0], ["fit", "Straight", 0], ["fit", "Tailored", 200],
    ["embroidery", "None", 0], ["embroidery", "Neckline", 300], ["embroidery", "All-over", 800],
    ["occasion", "Festive", 0], ["occasion", "Wedding", 0], ["occasion", "Office", 0], ["occasion", "Casual", 0],
    ["style", "Traditional", 0], ["style", "Modern", 0], ["style", "Modest Festive", 0],
    ["footwear", "Juttis", 0], ["footwear", "Block Heels", 0], ["footwear", "Sneakers", 0],
  ];
  for (const [slug, name, description, basePrice] of garments) {
    const g = await store.createGarment({ categoryId: catIds[slug], name, description, basePrice });
    for (const [type, value, priceDelta] of optionSets) {
      await store.addOption({ garmentId: g.id, type, value, priceDelta });
    }
  }
  await store.createOffer({ title: "Diwali Dhamaka — 10% off", description: "Festive season special on all stitching", discountType: "percent", discountValue: 10 });
  await store.createOffer({ title: "First Stitch — flat Rs 200 off", description: "Welcome offer for new customers", discountType: "flat", discountValue: 200, firstOrderOnly: true });
  return { seeded: true };
}
