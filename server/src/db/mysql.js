import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import { env } from "../config/env.js";

const MIGRATIONS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "db", "migrations");

let pool = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.name,
      waitForConnections: true,
      connectionLimit: 10,
      decimalNumbers: true,
      dateStrings: true,
    });
  }
  return pool;
}

// Run pending *.sql migrations in filename order (tracked in `migrations`).
export async function migrate() {
  const admin = await mysql.createConnection({
    host: env.db.host, port: env.db.port, user: env.db.user,
    password: env.db.password, multipleStatements: true,
  });
  await admin.query(`CREATE DATABASE IF NOT EXISTS \`${env.db.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await admin.end();
  const p = getPool();
  await p.query(`CREATE TABLE IF NOT EXISTS migrations (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  const [done] = await p.query("SELECT name FROM migrations");
  const applied = new Set(done.map((r) => r.name));
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
  const fresh = [];
  for (const f of files) {
    if (applied.has(f)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, f), "utf8");
    const conn = await p.getConnection();
    try {
      await conn.beginTransaction();
      for (const stmt of sql.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean)) {
        await conn.query(stmt);
      }
      await conn.query("INSERT INTO migrations (name) VALUES (?)", [f]);
      await conn.commit();
      fresh.push(f);
    } catch (e) {
      await conn.rollback();
      throw new Error(`Migration ${f} failed`, { cause: e });
    } finally {
      conn.release();
    }
  }
  return fresh;
}

export async function seed() {
  const seedPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "db", "seeds", "seed.sql");
  const sql = fs.readFileSync(seedPath, "utf8");
  const p = getPool();
  const conn = await p.getConnection();
  try {
    await conn.beginTransaction();
    for (const stmt of sql.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean)) {
      await conn.query(stmt);
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

const q = async (sql, params = []) => (await getPool().query(sql, params))[0];

function pageParams(page = 1, limit = 20) {
  const l = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const p = Math.max(Number(page) || 1, 1);
  return { limit: l, offset: (p - 1) * l, page: p };
}

const pub = (u) => (u ? { id: u.id, name: u.name, phone: u.phone, email: u.email, role: u.role, is_active: !!u.is_active, created_at: u.created_at } : null);

export const mysqlStore = {
  driver: "mysql",

  // — users —
  async createUser({ name, phone, email, passwordHash, role = "customer" }) {
    const [r] = await getPool().query(
      "INSERT INTO users (name, phone, email, password_hash, role) VALUES (?,?,?,?,?)",
      [name, phone, email || null, passwordHash, role]
    );
    await getPool().query("INSERT INTO customer_profiles (user_id) VALUES (?)", [r.insertId]);
    return this.findUserById(r.insertId);
  },
  async findUserById(id) {
    const rows = await q("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0] || null;
  },
  async findUserByLogin(identifier) {
    const rows = await q("SELECT * FROM users WHERE phone = ? OR email = ?", [identifier, identifier]);
    return rows[0] || null;
  },
  async listUsers({ search = "", page = 1, limit = 20 }) {
    const { limit: l, offset, page: p } = pageParams(page, limit);
    let where = "", params = [];
    if (search) { where = "WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?"; params = [`%${search}%`, `%${search}%`, `%${search}%`]; }
    const total = (await q(`SELECT COUNT(*) c FROM users ${where}`, params))[0].c;
    const rows = await q(`SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, l, offset]);
    return { rows: rows.map(pub), total, page: p, limit: l };
  },
  async setUserActive(id, active) {
    await q("UPDATE users SET is_active = ? WHERE id = ?", [active ? 1 : 0, id]);
  },

  // — profiles —
  async getProfileByUser(userId) {
    const rows = await q(
      `SELECT u.name, u.phone, u.email, p.address, p.city, p.notes
       FROM users u LEFT JOIN customer_profiles p ON p.user_id = u.id WHERE u.id = ?`, [userId]);
    return rows[0] || null;
  },
  async upsertProfile(userId, { name, address, city, notes }) {
    if (name) await q("UPDATE users SET name = ? WHERE id = ?", [name, userId]);
    await q("INSERT INTO customer_profiles (user_id, address, city, notes) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE address=VALUES(address), city=VALUES(city), notes=VALUES(notes)",
      [userId, address ?? null, city ?? null, notes ?? null]);
    return this.getProfileByUser(userId);
  },

  // — measurements —
  async createMProfile(customerId, { name, garmentHint }) {
    const [r] = await getPool().query("INSERT INTO measurement_profiles (customer_id, name, garment_hint) VALUES (?,?,?)",
      [customerId, name, garmentHint || null]);
    return this.getMProfile(r.insertId);
  },
  async listMProfiles(customerId) {
    return q("SELECT * FROM measurement_profiles WHERE customer_id = ? ORDER BY is_default DESC, updated_at DESC", [customerId]);
  },
  async getMProfile(id) {
    const rows = await q("SELECT * FROM measurement_profiles WHERE id = ?", [id]);
    return rows[0] || null;
  },
  async updateMProfile(id, { name, garmentHint, isDefault }) {
    const sets = [], params = [];
    if (name !== undefined) { sets.push("name = ?"); params.push(name); }
    if (garmentHint !== undefined) { sets.push("garment_hint = ?"); params.push(garmentHint); }
    if (isDefault !== undefined) { sets.push("is_default = ?"); params.push(isDefault ? 1 : 0); }
    if (sets.length) { params.push(id); await q(`UPDATE measurement_profiles SET ${sets.join(", ")} WHERE id = ?`, params); }
    return this.getMProfile(id);
  },
  async clearDefault(customerId) {
    await q("UPDATE measurement_profiles SET is_default = 0 WHERE customer_id = ?", [customerId]);
  },
  async deleteMProfile(id) {
    await q("DELETE FROM measurement_profiles WHERE id = ?", [id]);
  },
  async getMValues(profileId) {
    const rows = await q("SELECT field_key, value_cm FROM measurement_values WHERE profile_id = ?", [profileId]);
    return Object.fromEntries(rows.map((r) => [r.field_key, Number(r.value_cm)]));
  },
  async replaceMValues(profileId, values) {
    const conn = await getPool().getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("DELETE FROM measurement_values WHERE profile_id = ?", [profileId]);
      for (const [k, v] of Object.entries(values)) {
        await conn.query("INSERT INTO measurement_values (profile_id, field_key, value_cm) VALUES (?,?,?)", [profileId, k, v]);
      }
      await conn.commit();
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  },

  // — catalog —
  async listCategories(activeOnly = true) {
    return q(`SELECT * FROM garment_categories ${activeOnly ? "WHERE is_active = 1" : ""} ORDER BY sort_order, name`);
  },
  async getCategory(id) {
    return (await q("SELECT * FROM garment_categories WHERE id = ?", [id]))[0] || null;
  },
  async createCategory({ slug, name, description }) {
    const [r] = await getPool().query("INSERT INTO garment_categories (slug, name, description) VALUES (?,?,?)", [slug, name, description || null]);
    return this.getCategory(r.insertId);
  },
  async updateCategory(id, data) {
    const sets = [], params = [];
    for (const k of ["slug", "name", "description", "is_active", "sort_order"]) {
      if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); }
    }
    if (sets.length) { params.push(id); await q(`UPDATE garment_categories SET ${sets.join(", ")} WHERE id = ?`, params); }
    return this.getCategory(id);
  },
  async listGarments({ category, query: search, page = 1, limit = 20, activeOnly = true }) {
    const { limit: l, offset, page: p } = pageParams(page, limit);
    const where = [], params = [];
    if (activeOnly) where.push("g.is_active = 1");
    if (category) where.push("(c.slug = ? OR c.id = ?)", params.push(category, category));
    if (search) { where.push("(g.name LIKE ? OR g.description LIKE ?)"); params.push(`%${search}%`, `%${search}%`); }
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const total = (await q(`SELECT COUNT(*) c FROM garments g JOIN garment_categories c ON c.id = g.category_id ${w}`, params))[0].c;
    const rows = await q(
      `SELECT g.*, c.slug AS category_slug, c.name AS category_name FROM garments g
       JOIN garment_categories c ON c.id = g.category_id ${w} ORDER BY g.id LIMIT ? OFFSET ?`,
      [...params, l, offset]);
    return { rows, total, page: p, limit: l };
  },
  async getGarment(id) {
    const rows = await q(
      `SELECT g.*, c.slug AS category_slug, c.name AS category_name FROM garments g
       JOIN garment_categories c ON c.id = g.category_id WHERE g.id = ?`, [id]);
    return rows[0] || null;
  },
  async getGarmentOptions(garmentId) {
    return q("SELECT * FROM garment_options WHERE garment_id = ? AND is_active = 1 ORDER BY option_type, option_value", [garmentId]);
  },
  async getGarmentOptionsAll(garmentId) {
    return q("SELECT * FROM garment_options WHERE garment_id = ? ORDER BY option_type, option_value", [garmentId]);
  },
  async updateOption(id, { value, priceDelta, imageUrl, isActive }) {
    const sets = [], params = [];
    if (value !== undefined) { sets.push("option_value = ?"); params.push(value); }
    if (priceDelta !== undefined) { sets.push("price_delta = ?"); params.push(priceDelta || 0); }
    if (imageUrl !== undefined) { sets.push("image_url = ?"); params.push(imageUrl || null); }
    if (isActive !== undefined) { sets.push("is_active = ?"); params.push(isActive ? 1 : 0); }
    if (!sets.length) return (await q("SELECT * FROM garment_options WHERE id = ?", [id]))[0] || null;
    params.push(id);
    await q(`UPDATE garment_options SET ${sets.join(", ")} WHERE id = ?`, params);
    return (await q("SELECT * FROM garment_options WHERE id = ?", [id]))[0] || null;
  },
  async createGarment({ categoryId, name, description, basePrice, imagePath }) {
    const [r] = await getPool().query(
      "INSERT INTO garments (category_id, name, description, base_price, image_path) VALUES (?,?,?,?,?)",
      [categoryId, name, description || null, basePrice || 0, imagePath || null]);
    return this.getGarment(r.insertId);
  },
  async updateGarment(id, data) {
    const map = { categoryId: "category_id", name: "name", description: "description", basePrice: "base_price", imagePath: "image_path", isActive: "is_active" };
    const sets = [], params = [];
    for (const [k, col] of Object.entries(map)) {
      if (data[k] !== undefined) { sets.push(`${col} = ?`); params.push(data[k]); }
    }
    if (sets.length) { params.push(id); await q(`UPDATE garments SET ${sets.join(", ")} WHERE id = ?`, params); }
    return this.getGarment(id);
  },
  async addOption({ garmentId, type, value, priceDelta, imageUrl }) {
    const [r] = await getPool().query(
      "INSERT INTO garment_options (garment_id, option_type, option_value, price_delta, image_url) VALUES (?,?,?,?,?)",
      [garmentId, type, value, priceDelta || 0, imageUrl || null]);
    return (await q("SELECT * FROM garment_options WHERE id = ?", [r.insertId]))[0];
  },
  async removeOption(id) {
    await q("DELETE FROM garment_options WHERE id = ?", [id]);
  },

  // — designs —
  async createDesign(customerId, d) {
    const norm = { ...d, cloth: d.cloth ?? null, neck_front: d.neckFront ?? d.neck_front ?? null, neck_back: d.neckBack ?? d.neck_back ?? null };
    delete norm.neckFront;
    delete norm.neckBack;
    const cols = ["customer_id", "garment_id", "title", "fabric_source", "fabric_detail", "cloth", "color", "neck", "neck_front", "neck_back", "sleeve",
      "length_opt", "fit", "embroidery", "occasion", "style", "footwear", "accessories", "hairstyle", "grooming",
      "season", "location_context", "background", "lighting", "extra_preferences", "custom_notes", "ai_prompt"];
    const map = { garmentId: "garment_id", fabricSource: "fabric_source", fabricDetail: "fabric_detail", cloth: "cloth", lengthOpt: "length_opt", locationContext: "location_context", extraPreferences: "extra_preferences", customNotes: "custom_notes", aiPrompt: "ai_prompt" };
    const vals = cols.map((c) => {
      if (c === "customer_id") return customerId;
      const key = Object.keys(map).find((k) => map[k] === c) || c;
      return norm[key] ?? null;
    });
    const [r] = await getPool().query(`INSERT INTO customer_designs (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`, vals);
    return this.getDesign(r.insertId);
  },
  async listDesigns(customerId, { page = 1, limit = 20 }) {
    const { limit: l, offset, page: p } = pageParams(page, limit);
    const total = (await q("SELECT COUNT(*) c FROM customer_designs WHERE customer_id = ?", [customerId]))[0].c;
    const rows = await q("SELECT * FROM customer_designs WHERE customer_id = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?", [customerId, l, offset]);
    return { rows, total, page: p, limit: l };
  },
  async getDesign(id) {
    return (await q("SELECT * FROM customer_designs WHERE id = ?", [id]))[0] || null;
  },
  async updateDesign(id, d) {
    const norm = { ...d };
    if (norm.neckFront !== undefined) { norm.neck_front = norm.neckFront; delete norm.neckFront; }
    if (norm.neckBack !== undefined) { norm.neck_back = norm.neckBack; delete norm.neckBack; }
    const map = { garmentId: "garment_id", title: "title", fabricSource: "fabric_source", fabricDetail: "fabric_detail", cloth: "cloth", color: "color", neck: "neck", neck_front: "neck_front", neck_back: "neck_back", sleeve: "sleeve", lengthOpt: "length_opt", fit: "fit", embroidery: "embroidery", occasion: "occasion", style: "style", footwear: "footwear", accessories: "accessories", hairstyle: "hairstyle", grooming: "grooming", season: "season", locationContext: "location_context", background: "background", lighting: "lighting", extraPreferences: "extra_preferences", customNotes: "custom_notes", aiPrompt: "ai_prompt" };
    const sets = [], params = [];
    for (const [k, col] of Object.entries(map)) {
      if (norm[k] !== undefined) { sets.push(`${col} = ?`); params.push(norm[k]); }
    }
    if (sets.length) { params.push(id); await q(`UPDATE customer_designs SET ${sets.join(", ")} WHERE id = ?`, params); }
    return this.getDesign(id);
  },
  async deleteDesign(id) {
    await q("DELETE FROM customer_designs WHERE id = ?", [id]);
  },

  // — prompt history (text only) —
  async addPromptHistory({ userId, designId, inputs, prompt }) {
    const [r] = await getPool().query(
      "INSERT INTO prompt_history (user_id, design_id, inputs_snapshot, prompt_text) VALUES (?,?,?,?)",
      [userId, designId || null, JSON.stringify(inputs || {}), prompt]);
    return (await q("SELECT * FROM prompt_history WHERE id = ?", [r.insertId]))[0];
  },
  async listPromptHistory(userId, { page = 1, limit = 20 }) {
    const { limit: l, offset, page: p } = pageParams(page, limit);
    const total = (await q("SELECT COUNT(*) c FROM prompt_history WHERE user_id = ?", [userId]))[0].c;
    const rows = await q("SELECT * FROM prompt_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?", [userId, l, offset]);
    return { rows, total, page: p, limit: l };
  },

  // — orders (transactional) —
  async createOrderFull({ header, item, measurements, offerUsage }) {
    const conn = await getPool().getConnection();
    try {
      await conn.beginTransaction();
      const [o] = await conn.query(
        "INSERT INTO orders (customer_id, measurement_profile_id, status, subtotal, discount, total, notes) VALUES (?,?,?,?,?,?,?)",
        [header.customerId, header.measurementProfileId || null, "REQUESTED", header.subtotal, header.discount, header.total, header.notes || null]);
      const orderId = o.insertId;
      await conn.query(
        "INSERT INTO order_items (order_id, design_id, garment_id, qty, unit_price, options_snapshot) VALUES (?,?,?,?,?,?)",
        [orderId, item.designId, item.garmentId, item.qty || 1, item.unitPrice, JSON.stringify(item.options || {})]);
      for (const [k, v] of Object.entries(measurements)) {
        await conn.query("INSERT INTO order_measurements (order_id, field_key, value_cm, source) VALUES (?,?,?,?)",
          [orderId, k, v.value, v.source || "customer"]);
      }
      await conn.query("INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note) VALUES (?,?,?, ?,?)",
        [orderId, null, "REQUESTED", header.customerId, "Order request submitted"]);
      if (offerUsage) {
        await conn.query("INSERT INTO offer_usage (offer_id, order_id, customer_id, discount_given) VALUES (?,?,?,?)",
          [offerUsage.offerId, orderId, header.customerId, offerUsage.discount]);
      }
      await conn.commit();
      return orderId;
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  },
  async getOrder(id) {
    return (await q("SELECT * FROM orders WHERE id = ?", [id]))[0] || null;
  },
  async listOrders({ customerId, status, page = 1, limit = 20 }) {
    const { limit: l, offset, page: p } = pageParams(page, limit);
    const where = [], params = [];
    if (customerId) { where.push("customer_id = ?"); params.push(customerId); }
    if (status) { where.push("status = ?"); params.push(status); }
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const total = (await q(`SELECT COUNT(*) c FROM orders ${w}`, params))[0].c;
    const rows = await q(`SELECT * FROM orders ${w} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, l, offset]);
    return { rows, total, page: p, limit: l };
  },
  async setOrderStatus(id, status) {
    await q("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
    return this.getOrder(id);
  },
  async getOrderItems(orderId) {
    return q("SELECT * FROM order_items WHERE order_id = ?", [orderId]);
  },
  async getOrderMeasurements(orderId) {
    const rows = await q("SELECT field_key, value_cm, source FROM order_measurements WHERE order_id = ?", [orderId]);
    return Object.fromEntries(rows.map((r) => [r.field_key, { value: Number(r.value_cm), source: r.source }]));
  },
  async replaceOrderMeasurements(orderId, values, source = "tailor") {
    const conn = await getPool().getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("DELETE FROM order_measurements WHERE order_id = ?", [orderId]);
      for (const [k, v] of Object.entries(values)) {
        await conn.query("INSERT INTO order_measurements (order_id, field_key, value_cm, source) VALUES (?,?,?,?)", [orderId, k, v, source]);
      }
      await conn.commit();
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  },
  async addOrderHistory(orderId, from, to, by, note) {
    await q("INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note) VALUES (?,?,?,?,?)",
      [orderId, from, to, by || null, note || null]);
  },
  async getOrderHistory(orderId) {
    return q("SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC", [orderId]);
  },

  // — offers —
  async listOffers(activeOnly = true) {
    return q(`SELECT * FROM offers ${activeOnly ? "WHERE is_active = 1" : ""} ORDER BY created_at DESC`);
  },
  async getOffer(id) {
    return (await q("SELECT * FROM offers WHERE id = ?", [id]))[0] || null;
  },
  async createOffer(o) {
    const [r] = await getPool().query(
      `INSERT INTO offers (title, description, discount_type, discount_value, min_order, scope_category_id,
       first_order_only, starts_at, ends_at, is_active, usage_limit, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [o.title, o.description || null, o.discountType, o.discountValue, o.minOrder || 0, o.scopeCategoryId || null,
        o.firstOrderOnly ? 1 : 0, o.startsAt || null, o.endsAt || null, o.isActive === false ? 0 : 1, o.usageLimit || null, o.createdBy || null]);
    return this.getOffer(r.insertId);
  },
  async updateOffer(id, o) {
    const map = { title: "title", description: "description", discountType: "discount_type", discountValue: "discount_value", minOrder: "min_order", scopeCategoryId: "scope_category_id", firstOrderOnly: "first_order_only", startsAt: "starts_at", endsAt: "ends_at", isActive: "is_active", usageLimit: "usage_limit" };
    const sets = [], params = [];
    for (const [k, col] of Object.entries(map)) {
      if (o[k] !== undefined) { sets.push(`${col} = ?`); params.push(o[k]); }
    }
    if (sets.length) { params.push(id); await q(`UPDATE offers SET ${sets.join(", ")} WHERE id = ?`, params); }
    return this.getOffer(id);
  },
  async deleteOffer(id) {
    await q("DELETE FROM offers WHERE id = ?", [id]);
  },
  async countOfferUsage(offerId) {
    return (await q("SELECT COUNT(*) c FROM offer_usage WHERE offer_id = ?", [offerId]))[0].c;
  },
  async countCustomerOrders(customerId) {
    return (await q("SELECT COUNT(*) c FROM orders WHERE customer_id = ? AND status != 'CANCELLED'", [customerId]))[0].c;
  },

  // — appointments —
  async createAppt({ customerId, orderId, reason, scheduledAt, notes }) {
    const [r] = await getPool().query(
      "INSERT INTO appointments (customer_id, order_id, reason, scheduled_at, notes) VALUES (?,?,?,?,?)",
      [customerId, orderId || null, reason, scheduledAt, notes || null]);
    return (await q("SELECT * FROM appointments WHERE id = ?", [r.insertId]))[0];
  },
  async listAppts({ customerId, status, date, page = 1, limit = 20 }) {
    const { limit: l, offset, page: p } = pageParams(page, limit);
    const where = [], params = [];
    if (customerId) { where.push("customer_id = ?"); params.push(customerId); }
    if (status) { where.push("status = ?"); params.push(status); }
    if (date) { where.push("DATE(scheduled_at) = ?"); params.push(date); }
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const total = (await q(`SELECT COUNT(*) c FROM appointments ${w}`, params))[0].c;
    const rows = await q(`SELECT * FROM appointments ${w} ORDER BY scheduled_at ASC LIMIT ? OFFSET ?`, [...params, l, offset]);
    return { rows, total, page: p, limit: l };
  },
  async getAppt(id) {
    return (await q("SELECT * FROM appointments WHERE id = ?", [id]))[0] || null;
  },
  async setApptStatus(id, status) {
    await q("UPDATE appointments SET status = ? WHERE id = ?", [status, id]);
    return this.getAppt(id);
  },

  // — uploads —
  async createRef({ ownerId, designId, orderId, filePath, mime, size, original }) {
    const [r] = await getPool().query(
      "INSERT INTO uploaded_references (owner_id, design_id, order_id, file_path, mime, size_bytes, original_name) VALUES (?,?,?,?,?,?,?)",
      [ownerId, designId || null, orderId || null, filePath, mime || null, size || null, original || null]);
    return (await q("SELECT * FROM uploaded_references WHERE id = ?", [r.insertId]))[0];
  },
  async getRef(id) {
    return (await q("SELECT * FROM uploaded_references WHERE id = ?", [id]))[0] || null;
  },
  async listRefsByDesign(designId) {
    return q("SELECT id, mime, size_bytes, original_name, created_at FROM uploaded_references WHERE design_id = ?", [designId]);
  },
  async listRefsByOrder(orderId) {
    return q("SELECT id, mime, size_bytes, original_name, created_at FROM uploaded_references WHERE order_id = ?", [orderId]);
  },
  async deleteRef(id) {
    await q("DELETE FROM uploaded_references WHERE id = ?", [id]);
  },

  // — admin —
  async logAction({ adminId, action, entity, entityId, detail }) {
    await q("INSERT INTO admin_actions (admin_id, action, entity, entity_id, detail) VALUES (?,?,?,?,?)",
      [adminId, action, entity || null, entityId || null, detail ? JSON.stringify(detail) : null]);
  },
  async getSummary() {
    const [[a], [b], [c], [d], [e], [f], [g], [h]] = await Promise.all([
      q("SELECT COUNT(*) c FROM orders WHERE status = 'REQUESTED'"),
      q("SELECT COUNT(*) c FROM orders WHERE status IN ('CONFIRMED','MEASUREMENT_PENDING','MEASUREMENT_CONFIRMED','FABRIC_PENDING','CUTTING','STITCHING','TRIAL_READY','ALTERATION')"),
      q("SELECT COUNT(*) c FROM orders WHERE status = 'TRIAL_READY'"),
      q("SELECT COUNT(*) c FROM appointments WHERE DATE(scheduled_at) = CURDATE() AND status IN ('REQUESTED','CONFIRMED')"),
      q("SELECT COUNT(*) c FROM offers WHERE is_active = 1"),
      q("SELECT COUNT(*) c FROM orders"),
      q("SELECT COUNT(*) c FROM users WHERE role <> 'admin' AND is_active = 1"),
      q("SELECT COALESCE(SUM(total),0) t FROM orders WHERE status <> 'CANCELLED'"),
    ]);
    return { requested: a.c, inProgress: b.c, trialReady: c.c, appointmentsToday: d.c, activeOffers: e.c, totalOrders: f.c, totalCustomers: g.c, revenue: Math.round(Number(h.t || 0)) };
  },
};
