import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import { env } from "../config/env.js";

const r = Router();
const DATA_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..", "..", "data", "payment.json"
);

function defaults() {
  return {
    upi_id: process.env.UPI_ID || "father-tailor@upi",
    upi_name: process.env.UPI_NAME || "Digital Tailor",
    note: "Pay via any UPI app (GPay / PhonePe / Paytm). Add your Order ID in the UPI note, then enter UTR below.",
    qr_image_url: process.env.UPI_QR_URL || "",
    updated_at: null,
  };
}

function readInfo() {
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    return { ...defaults(), ...raw };
  } catch {
    return defaults();
  }
}

function writeInfo(patch) {
  const next = { ...readInfo(), ...patch, updated_at: new Date().toISOString() };
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(next, null, 2));
  return next;
}

// Public — shown at checkout so customers can pay directly (no gateway fees).
r.get("/", (_req, res) => {
  const info = readInfo();
  // Never leak anything sensitive — this is intentionally public shop config.
  res.json(info);
});

// Admin — update UPI ID / name / QR without a redeploy.
r.put("/", requireRole("admin"), (req, res) => {
  const { upi_id, upi_name, note, qr_image_url } = req.body || {};
  const patch = {};
  if (upi_id !== undefined) {
    const v = String(upi_id).trim();
    if (!/^[\w.+-]{2,}@[a-zA-Z]{2,}$/.test(v)) {
      return res.status(400).json({ error: { code: "INVALID_UPI", message: "UPI ID looks invalid (e.g. name@okhdfcbank)" } });
    }
    patch.upi_id = v;
  }
  if (upi_name !== undefined) patch.upi_name = String(upi_name).slice(0, 100);
  if (note !== undefined) patch.note = String(note).slice(0, 500);
  if (qr_image_url !== undefined) patch.qr_image_url = String(qr_image_url).slice(0, 500);
  res.json(writeInfo(patch));
});

export default r;

// Re-export for env defaults in docs/scripts.
export { defaults as paymentDefaults };
void env;
