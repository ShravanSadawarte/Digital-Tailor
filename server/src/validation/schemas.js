import { z } from "zod";

const phone = z.string().trim().min(7).max(20);
const email = z.string().trim().email().max(191).optional().nullable();
const pwd = z.string().min(8).max(128);
const str = (max) => z.string().trim().max(max);
const optStr = (max) => z.string().trim().max(max).optional().nullable();
const num = z.number();

export const registerSchema = z.object({
  name: str(100).refine((s) => s.length >= 2, "Name too short"),
  phone,
  email,
  password: pwd,
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(3),
  password: z.string().min(1),
});

export const profileSchema = z.object({
  name: str(100).optional(),
  address: optStr(500),
  city: optStr(100),
  notes: optStr(500),
});

export const MEASURE_FIELDS = [
  "bust", "waist", "hip", "shoulder", "armhole", "sleeve_length", "kurti_length",
  "dress_length", "neck_width", "front_neck_depth", "back_neck_depth",
  "pant_length", "palazzo_length", "inseam", "thigh", "bottom_width",
];

export const MEASURE_RANGES = {
  bust: [60, 160], waist: [50, 160], hip: [60, 170], shoulder: [25, 60],
  armhole: [30, 70], sleeve_length: [5, 75], kurti_length: [50, 150],
  dress_length: [50, 180], neck_width: [8, 30], front_neck_depth: [2, 30],
  back_neck_depth: [2, 30], pant_length: [50, 140], palazzo_length: [50, 140],
  inseam: [40, 110], thigh: [30, 100], bottom_width: [10, 60],
};

export const GARMENT_REQUIRED = {
  kurti: ["bust", "waist", "hip", "shoulder", "armhole", "sleeve_length", "kurti_length", "neck_width", "front_neck_depth", "back_neck_depth"],
  pant: ["waist", "hip", "thigh", "inseam", "pant_length", "bottom_width"],
  palazzo: ["waist", "hip", "thigh", "inseam", "palazzo_length", "bottom_width"],
  "one-piece": ["bust", "waist", "hip", "shoulder", "armhole", "sleeve_length", "dress_length", "neck_width", "front_neck_depth", "back_neck_depth"],
};

const valuesSchema = z.record(z.string(), num).refine(
  (vals) => {
    for (const [k, v] of Object.entries(vals)) {
      if (!MEASURE_FIELDS.includes(k)) return false;
      const [min, max] = MEASURE_RANGES[k];
      if (!(v >= min && v <= max)) return false;
    }
    return Object.keys(vals).length > 0;
  },
  { message: "Unknown field or value out of range" }
);

export const mProfileSchema = z.object({
  name: str(100),
  garment_hint: optStr(50),
  values: valuesSchema,
  is_default: z.boolean().optional(),
});

export const mProfileUpdateSchema = z.object({
  name: str(100).optional(),
  garment_hint: optStr(50),
  values: valuesSchema.optional(),
  is_default: z.boolean().optional(),
});

export const designSchema = z.object({
  garment_id: z.coerce.number().int().positive(),
  title: str(150),
  fabric_source: z.enum(["own", "shop"]).default("own"),
  fabric_detail: optStr(300),
  cloth: optStr(100),
  color: optStr(50),
  neck: optStr(50),
  neck_front: optStr(100),
  neck_back: optStr(100),
  sleeve: optStr(50),
  length_opt: optStr(50),
  fit: optStr(50),
  embroidery: optStr(300),
  occasion: optStr(80),
  style: optStr(80),
  footwear: optStr(150),
  accessories: optStr(300),
  hairstyle: optStr(150),
  grooming: optStr(150),
  season: optStr(40),
  location_context: optStr(150),
  background: optStr(150),
  lighting: optStr(100),
  extra_preferences: optStr(500),
  custom_notes: z.string().trim().max(2000).optional().nullable(),
});

const INJECTION = /(ignore (previous|all) instructions|system\s*:|role\s*:\s*(system|assistant))/i;

export const promptSchema = z.object({
  design_id: z.coerce.number().int().positive().optional().nullable(),
  occasion: optStr(80),
  outfit: optStr(150),
  outfit_type: optStr(150),
  garment_id: z.coerce.number().int().positive().optional().nullable(),
  clothing_category: optStr(80),
  colors: optStr(80),
  color: optStr(80),
  style: optStr(80),
  fit: optStr(80),
  fabric: optStr(150),
  footwear: optStr(150),
  accessories: optStr(300),
  hairstyle: optStr(150),
  grooming: optStr(150),
  season: optStr(40),
  location_context: optStr(150),
  location: optStr(150),
  background: optStr(150),
  lighting: optStr(100),
  photography_style: optStr(100),
  gender: optStr(40),
  age_group: optStr(40),
  extra_preferences: optStr(500),
}).refine(
  (v) => {
    for (const val of Object.values(v)) {
      if (typeof val === "string" && INJECTION.test(val)) return false;
    }
    return true;
  },
  { message: "Prompt input looks like an instruction override" }
);

export const promptPartialSchema = z
  .record(z.string(), z.unknown())
  .refine(
    (v) => {
      for (const val of Object.values(v || {})) {
        if (typeof val === "string" && INJECTION.test(val)) return false;
      }
      return true;
    },
    { message: "Prompt input looks like an instruction override" }
  );

export const orderSchema = z.object({
  design_id: z.coerce.number().int().positive(),
  measurement_profile_id: z.coerce.number().int().positive(),
  offer_id: z.coerce.number().int().positive().optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const statusSchema = z.object({
  to: z.enum(["REQUESTED", "CONFIRMED", "MEASUREMENT_PENDING", "MEASUREMENT_CONFIRMED", "FABRIC_PENDING", "CUTTING", "STITCHING", "TRIAL_READY", "ALTERATION", "READY", "DELIVERED", "CANCELLED"]),
  note: optStr(500),
});

export const confirmMeasuresSchema = z.object({ values: valuesSchema });

export const offerSchema = z.object({
  title: str(150),
  description: optStr(1000),
  discount_type: z.enum(["percent", "flat"]),
  discount_value: num.min(0),
  min_order: num.min(0).optional().default(0),
  scope_category_id: z.coerce.number().int().positive().optional().nullable(),
  first_order_only: z.boolean().optional().default(false),
  starts_at: z.string().max(30).optional().nullable(),
  ends_at: z.string().max(30).optional().nullable(),
  usage_limit: z.coerce.number().int().positive().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export const appointmentSchema = z.object({
  reason: z.enum(["measurement", "fabric-drop", "design-discussion", "trial", "delivery", "other"]),
  scheduled_at: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Invalid datetime"),
  order_id: z.coerce.number().int().positive().optional().nullable(),
  notes: optStr(500),
});

export const apptStatusSchema = z.object({
  to: z.enum(["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED"]),
  note: optStr(500),
});

export const categorySchema = z.object({
  slug: str(50).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, dashes"),
  name: str(100),
  description: optStr(500),
  is_active: z.boolean().optional(),
  sort_order: z.coerce.number().int().optional(),
});

export const garmentSchema = z.object({
  category_id: z.coerce.number().int().positive(),
  name: str(150),
  description: optStr(1000),
  base_price: num.min(0),
  image_path: optStr(500),
  is_active: z.boolean().optional(),
}).partial({ description: true, image_path: true, is_active: true });

export const optionSchema = z.object({
  type: z.enum(["fabric", "cloth", "color", "neck", "neck_front", "neck_back", "sleeve", "length", "fit", "embroidery", "occasion", "style", "footwear", "accessory", "hairstyle", "background", "lighting"]),
  value: str(100),
  price_delta: num.min(0).optional().default(0),
  image_url: optStr(500),
});

export const optionUpdateSchema = z.object({
  value: str(100).optional(),
  price_delta: num.min(0).optional(),
  image_url: optStr(500),
  is_active: z.boolean().optional(),
});
