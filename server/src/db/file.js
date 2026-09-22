import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Zero-dependency JSON store for local development.
// Same function signatures as mysql.js. Production uses MySQL.
// Data lives in server/data/db.json (gitignored).
const DATA_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "data", "db.json");

function blank() {
  return {
    seq: { users: 1, profiles: 1, mprofiles: 1, categories: 1, garments: 1, options: 1, designs: 1, phistory: 1, orders: 1, items: 1, offers: 1, ousage: 1, appts: 1, refs: 1, actions: 1, history: 1 },
    users: [], profiles: [], mprofiles: [], mvalues: [], categories: [], garments: [],
    options: [], designs: [], phistory: [], orders: [], items: [], omeasures: [],
    ohistory: [], offers: [], ousage: [], appts: [], refs: [], actions: [],
  };
}

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  } catch {
    return blank();
  }
}

function save(db) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(db));
}

const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");
const nid = (db, t) => db.seq[t]++;
const num = (v) => (v === null || v === undefined ? v : Number(v));

function pg(list, page = 1, limit = 20) {
  const l = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const p = Math.max(Number(page) || 1, 1);
  return { rows: list.slice((p - 1) * l, p * l), total: list.length, page: p, limit: l };
}

const pub = (u) => (u ? { id: u.id, name: u.name, phone: u.phone, email: u.email, role: u.role, is_active: !!u.is_active, created_at: u.created_at } : null);
const normGarment = (g, db) => {
  const c = db.categories.find((x) => x.id === g.category_id);
  return { ...g, base_price: num(g.base_price), category_slug: c?.slug, category_name: c?.name };
};

export const fileStore = {
  driver: "file",

  async createUser({ name, phone, email, passwordHash, role = "customer" }) {
    const db = load();
    const u = { id: nid(db, "users"), name, phone, email: email || null, password_hash: passwordHash, role, is_active: 1, created_at: now(), updated_at: now() };
    db.users.push(u);
    db.profiles.push({ id: nid(db, "profiles"), user_id: u.id, address: null, city: null, notes: null, created_at: now(), updated_at: now() });
    save(db);
    return pub(u);
  },
  async findUserById(id) {
    return load().users.find((u) => u.id === Number(id)) || null;
  },
  async findUserByLogin(identifier) {
    return load().users.find((u) => u.phone === identifier || u.email === identifier) || null;
  },
  async listUsers({ search = "", page = 1, limit = 20 }) {
    let list = load().users;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((u) => u.name.toLowerCase().includes(s) || u.phone.includes(s) || (u.email || "").toLowerCase().includes(s));
    }
    const r = pg(list, page, limit);
    return { ...r, rows: r.rows.map(pub) };
  },
  async setUserActive(id, active) {
    const db = load();
    const u = db.users.find((x) => x.id === Number(id));
    if (u) { u.is_active = active ? 1 : 0; u.updated_at = now(); save(db); }
  },

  async getProfileByUser(userId) {
    const db = load();
    const u = db.users.find((x) => x.id === Number(userId));
    if (!u) return null;
    const p = db.profiles.find((x) => x.user_id === Number(userId)) || {};
    return { name: u.name, phone: u.phone, email: u.email, address: p.address ?? null, city: p.city ?? null, notes: p.notes ?? null };
  },
  async upsertProfile(userId, { name, address, city, notes }) {
    const db = load();
    const u = db.users.find((x) => x.id === Number(userId));
    if (name !== undefined) u.name = name;
    let p = db.profiles.find((x) => x.user_id === Number(userId));
    if (!p) { p = { id: nid(db, "profiles"), user_id: Number(userId) }; db.profiles.push(p); }
    if (address !== undefined) p.address = address;
    if (city !== undefined) p.city = city;
    if (notes !== undefined) p.notes = notes;
    save(db);
    return this.getProfileByUser(userId);
  },

  async createMProfile(customerId, { name, garmentHint }) {
    const db = load();
    const p = { id: nid(db, "mprofiles"), customer_id: Number(customerId), name, garment_hint: garmentHint || null, is_default: 0, created_at: now(), updated_at: now() };
    db.mprofiles.push(p);
    save(db);
    return p;
  },
  async listMProfiles(customerId) {
    return load().mprofiles.filter((p) => p.customer_id === Number(customerId))
      .sort((a, b) => b.is_default - a.is_default || b.id - a.id);
  },
  async getMProfile(id) {
    return load().mprofiles.find((p) => p.id === Number(id)) || null;
  },
  async updateMProfile(id, { name, garmentHint, isDefault }) {
    const db = load();
    const p = db.mprofiles.find((x) => x.id === Number(id));
    if (!p) return null;
    if (name !== undefined) p.name = name;
    if (garmentHint !== undefined) p.garment_hint = garmentHint;
    if (isDefault !== undefined) p.is_default = isDefault ? 1 : 0;
    p.updated_at = now();
    save(db);
    return p;
  },
  async clearDefault(customerId) {
    const db = load();
    db.mprofiles.forEach((p) => { if (p.customer_id === Number(customerId)) p.is_default = 0; });
    save(db);
  },
  async deleteMProfile(id) {
    const db = load();
    db.mprofiles = db.mprofiles.filter((p) => p.id !== Number(id));
    db.mvalues = db.mvalues.filter((v) => v.profile_id !== Number(id));
    save(db);
  },
  async getMValues(profileId) {
    return Object.fromEntries(
      load().mvalues.filter((v) => v.profile_id === Number(profileId)).map((v) => [v.field_key, num(v.value_cm)]));
  },
  async replaceMValues(profileId, values) {
    const db = load();
    db.mvalues = db.mvalues.filter((v) => v.profile_id !== Number(profileId));
    for (const [k, v] of Object.entries(values)) {
      db.mvalues.push({ profile_id: Number(profileId), field_key: k, value_cm: Number(v) });
    }
    save(db);
  },

  async listCategories(activeOnly = true) {
    return load().categories.filter((c) => !activeOnly || c.is_active).sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  },
  async getCategory(id) {
    return load().categories.find((c) => c.id === Number(id)) || null;
  },
  async createCategory({ slug, name, description }) {
    const db = load();
    const c = { id: nid(db, "categories"), slug, name, description: description || null, is_active: 1, sort_order: 0, created_at: now(), updated_at: now() };
    db.categories.push(c);
    save(db);
    return c;
  },
  async updateCategory(id, data) {
    const db = load();
    const c = db.categories.find((x) => x.id === Number(id));
    if (!c) return null;
    for (const k of ["slug", "name", "description", "is_active", "sort_order"]) {
      if (data[k] !== undefined) c[k] = data[k];
    }
    c.updated_at = now();
    save(db);
    return c;
  },
  async listGarments({ category, query: search, page = 1, limit = 20, activeOnly = true }) {
    const db = load();
    let list = db.garments.map((g) => normGarment(g, db));
    if (activeOnly) list = list.filter((g) => g.is_active);
    if (category) list = list.filter((g) => g.category_slug === category || String(g.category_id) === String(category));
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((g) => g.name.toLowerCase().includes(s) || (g.description || "").toLowerCase().includes(s));
    }
    return pg(list, page, limit);
  },
  async getGarment(id) {
    const db = load();
    const g = db.garments.find((x) => x.id === Number(id));
    return g ? normGarment(g, db) : null;
  },
  async getGarmentOptions(garmentId) {
    return load().options.filter((o) => o.garment_id === Number(garmentId) && o.is_active)
      .sort((a, b) => (a.option_type + a.option_value).localeCompare(b.option_type + b.option_value));
  },
  async getGarmentOptionsAll(garmentId) {
    return load().options.filter((o) => o.garment_id === Number(garmentId))
      .sort((a, b) => (a.option_type + a.option_value).localeCompare(b.option_type + b.option_value));
  },
  async updateOption(id, { value, priceDelta, imageUrl, isActive }) {
    const db = load();
    const o = db.options.find((x) => x.id === Number(id));
    if (!o) return null;
    if (value !== undefined) o.option_value = value;
    if (priceDelta !== undefined) o.price_delta = Number(priceDelta || 0);
    if (imageUrl !== undefined) o.image_url = imageUrl || null;
    if (isActive !== undefined) o.is_active = isActive ? 1 : 0;
    o.updated_at = now();
    save(db);
    return o;
  },
  async createGarment({ categoryId, name, description, basePrice, imagePath }) {
    const db = load();
    const g = { id: nid(db, "garments"), category_id: Number(categoryId), name, description: description || null, base_price: Number(basePrice || 0), image_path: imagePath || null, is_active: 1, created_at: now(), updated_at: now() };
    db.garments.push(g);
    save(db);
    return normGarment(g, db);
  },
  async updateGarment(id, data) {
    const db = load();
    const g = db.garments.find((x) => x.id === Number(id));
    if (!g) return null;
    const map = { categoryId: "category_id", name: "name", description: "description", basePrice: "base_price", imagePath: "image_path", isActive: "is_active" };
    for (const [k, col] of Object.entries(map)) {
      if (data[k] !== undefined) g[col] = data[k];
    }
    g.updated_at = now();
    save(db);
    return normGarment(g, db);
  },
  async addOption({ garmentId, type, value, priceDelta, imageUrl }) {
    const db = load();
    const o = { id: nid(db, "options"), garment_id: Number(garmentId), option_type: type, option_value: value, price_delta: Number(priceDelta || 0), image_url: imageUrl || null, is_active: 1, created_at: now(), updated_at: now() };
    db.options.push(o);
    save(db);
    return o;
  },
  async removeOption(id) {
    const db = load();
    db.options = db.options.filter((o) => o.id !== Number(id));
    save(db);
  },

  async createDesign(customerId, d) {
    const db = load();
    const row = {
      id: nid(db, "designs"), customer_id: Number(customerId), garment_id: Number(d.garmentId), title: d.title,
      fabric_source: d.fabricSource || "own", fabric_detail: d.fabricDetail || null, cloth: d.cloth || null, color: d.color || null,
      neck: d.neck || null, neck_front: d.neckFront || d.neck_front || null, neck_back: d.neckBack || d.neck_back || null, sleeve: d.sleeve || null, length_opt: d.lengthOpt || null, fit: d.fit || null,
      embroidery: d.embroidery || null, occasion: d.occasion || null, style: d.style || null,
      footwear: d.footwear || null, accessories: d.accessories || null, hairstyle: d.hairstyle || null,
      grooming: d.grooming || null, season: d.season || null, location_context: d.locationContext || null,
      background: d.background || null, lighting: d.lighting || null, extra_preferences: d.extraPreferences || null,
      custom_notes: d.customNotes || null, ai_prompt: d.aiPrompt || null, created_at: now(), updated_at: now(),
    };
    db.designs.push(row);
    save(db);
    return row;
  },
  async listDesigns(customerId, { page = 1, limit = 20 }) {
    return pg(load().designs.filter((d) => d.customer_id === Number(customerId)).sort((a, b) => b.id - a.id), page, limit);
  },
  async getDesign(id) {
    return load().designs.find((d) => d.id === Number(id)) || null;
  },
  async updateDesign(id, d) {
    const db = load();
    const row = db.designs.find((x) => x.id === Number(id));
    if (!row) return null;
    const map = { garmentId: "garment_id", title: "title", fabricSource: "fabric_source", fabricDetail: "fabric_detail", cloth: "cloth", color: "color", neck: "neck", neckFront: "neck_front", neckBack: "neck_back", sleeve: "sleeve", lengthOpt: "length_opt", fit: "fit", embroidery: "embroidery", occasion: "occasion", style: "style", footwear: "footwear", accessories: "accessories", hairstyle: "hairstyle", grooming: "grooming", season: "season", locationContext: "location_context", background: "background", lighting: "lighting", extraPreferences: "extra_preferences", customNotes: "custom_notes", aiPrompt: "ai_prompt" };
    for (const [k, col] of Object.entries(map)) {
      if (d[k] !== undefined) row[col] = d[k];
    }
    row.updated_at = now();
    save(db);
    return row;
  },
  async deleteDesign(id) {
    const db = load();
    db.designs = db.designs.filter((d) => d.id !== Number(id));
    db.refs = db.refs.filter((r) => r.design_id !== Number(id));
    save(db);
  },

  async addPromptHistory({ userId, designId, inputs, prompt }) {
    const db = load();
    const row = { id: nid(db, "phistory"), user_id: Number(userId), design_id: designId ? Number(designId) : null, inputs_snapshot: inputs || {}, prompt_text: prompt, created_at: now() };
    db.phistory.push(row);
    save(db);
    return row;
  },
  async listPromptHistory(userId, { page = 1, limit = 20 }) {
    return pg(load().phistory.filter((h) => h.user_id === Number(userId)).sort((a, b) => b.id - a.id), page, limit);
  },

  async createOrderFull({ header, item, measurements, offerUsage }) {
    const db = load();
    const o = { id: nid(db, "orders"), customer_id: Number(header.customerId), measurement_profile_id: header.measurementProfileId ? Number(header.measurementProfileId) : null, status: "REQUESTED", subtotal: Number(header.subtotal), discount: Number(header.discount), total: Number(header.total), notes: header.notes || null, created_at: now(), updated_at: now() };
    db.orders.push(o);
    db.items.push({ id: nid(db, "items"), order_id: o.id, design_id: Number(item.designId), garment_id: Number(item.garmentId), qty: item.qty || 1, unit_price: Number(item.unitPrice), options_snapshot: item.options || {} });
    for (const [k, v] of Object.entries(measurements)) {
      db.omeasures.push({ order_id: o.id, field_key: k, value_cm: Number(v.value), source: v.source || "customer" });
    }
    db.ohistory.push({ id: nid(db, "history"), order_id: o.id, from_status: null, to_status: "REQUESTED", changed_by: Number(header.customerId), note: "Order request submitted", created_at: now() });
    if (offerUsage) {
      db.ousage.push({ id: nid(db, "ousage"), offer_id: Number(offerUsage.offerId), order_id: o.id, customer_id: Number(header.customerId), discount_given: Number(offerUsage.discount), created_at: now() });
    }
    save(db);
    return o.id;
  },
  async getOrder(id) {
    const o = load().orders.find((x) => x.id === Number(id));
    return o ? { ...o, subtotal: num(o.subtotal), discount: num(o.discount), total: num(o.total) } : null;
  },
  async listOrders({ customerId, status, page = 1, limit = 20 }) {
    let list = load().orders;
    if (customerId) list = list.filter((o) => o.customer_id === Number(customerId));
    if (status) list = list.filter((o) => o.status === status);
    return pg(list.sort((a, b) => b.id - a.id), page, limit);
  },
  async setOrderStatus(id, status) {
    const db = load();
    const o = db.orders.find((x) => x.id === Number(id));
    if (o) { o.status = status; o.updated_at = now(); save(db); }
    return this.getOrder(id);
  },
  async getOrderItems(orderId) {
    return load().items.filter((i) => i.order_id === Number(orderId));
  },
  async getOrderMeasurements(orderId) {
    return Object.fromEntries(
      load().omeasures.filter((m) => m.order_id === Number(orderId)).map((m) => [m.field_key, { value: num(m.value_cm), source: m.source }]));
  },
  async replaceOrderMeasurements(orderId, values, source = "tailor") {
    const db = load();
    db.omeasures = db.omeasures.filter((m) => m.order_id !== Number(orderId));
    for (const [k, v] of Object.entries(values)) {
      db.omeasures.push({ order_id: Number(orderId), field_key: k, value_cm: Number(v), source });
    }
    save(db);
  },
  async addOrderHistory(orderId, from, to, by, note) {
    const db = load();
    db.ohistory.push({ id: nid(db, "history"), order_id: Number(orderId), from_status: from || null, to_status: to, changed_by: by || null, note: note || null, created_at: now() });
    save(db);
  },
  async getOrderHistory(orderId) {
    return load().ohistory.filter((h) => h.order_id === Number(orderId)).sort((a, b) => a.id - b.id);
  },

  async listOffers(activeOnly = true) {
    const list = load().offers.filter((o) => !activeOnly || o.is_active).sort((a, b) => b.id - a.id);
    return list.map((o) => ({ ...o, discount_value: num(o.discount_value), min_order: num(o.min_order) }));
  },
  async getOffer(id) {
    const o = load().offers.find((x) => x.id === Number(id));
    return o ? { ...o, discount_value: num(o.discount_value), min_order: num(o.min_order) } : null;
  },
  async createOffer(o) {
    const db = load();
    const row = { id: nid(db, "offers"), title: o.title, description: o.description || null, discount_type: o.discountType, discount_value: Number(o.discountValue), min_order: Number(o.minOrder || 0), scope_category_id: o.scopeCategoryId ? Number(o.scopeCategoryId) : null, first_order_only: o.firstOrderOnly ? 1 : 0, starts_at: o.startsAt || null, ends_at: o.endsAt || null, is_active: o.isActive === false ? 0 : 1, usage_limit: o.usageLimit ?? null, created_by: o.createdBy || null, created_at: now(), updated_at: now() };
    db.offers.push(row);
    save(db);
    return this.getOffer(row.id);
  },
  async updateOffer(id, o) {
    const db = load();
    const row = db.offers.find((x) => x.id === Number(id));
    if (!row) return null;
    const map = { title: "title", description: "description", discountType: "discount_type", discountValue: "discount_value", minOrder: "min_order", scopeCategoryId: "scope_category_id", firstOrderOnly: "first_order_only", startsAt: "starts_at", endsAt: "ends_at", isActive: "is_active", usageLimit: "usage_limit" };
    for (const [k, col] of Object.entries(map)) {
      if (o[k] !== undefined) row[col] = o[k];
    }
    row.updated_at = now();
    save(db);
    return this.getOffer(id);
  },
  async deleteOffer(id) {
    const db = load();
    const used = db.ousage.some((u) => u.offer_id === Number(id));
    if (used) throw new Error("Offer has been used and cannot be deleted; deactivate it instead");
    db.offers = db.offers.filter((o) => o.id !== Number(id));
    save(db);
  },
  async countOfferUsage(offerId) {
    return load().ousage.filter((u) => u.offer_id === Number(offerId)).length;
  },
  async countCustomerOrders(customerId) {
    return load().orders.filter((o) => o.customer_id === Number(customerId) && o.status !== "CANCELLED").length;
  },

  async createAppt({ customerId, orderId, reason, scheduledAt, notes }) {
    const db = load();
    const a = { id: nid(db, "appts"), customer_id: Number(customerId), order_id: orderId ? Number(orderId) : null, reason, scheduled_at: scheduledAt, status: "REQUESTED", notes: notes || null, created_at: now(), updated_at: now() };
    db.appts.push(a);
    save(db);
    return a;
  },
  async listAppts({ customerId, status, date, page = 1, limit = 20 }) {
    let list = load().appts;
    if (customerId) list = list.filter((a) => a.customer_id === Number(customerId));
    if (status) list = list.filter((a) => a.status === status);
    if (date) list = list.filter((a) => String(a.scheduled_at).slice(0, 10) === date);
    return pg(list.sort((a, b) => String(a.scheduled_at).localeCompare(String(b.scheduled_at))), page, limit);
  },
  async getAppt(id) {
    return load().appts.find((a) => a.id === Number(id)) || null;
  },
  async setApptStatus(id, status) {
    const db = load();
    const a = db.appts.find((x) => x.id === Number(id));
    if (a) { a.status = status; a.updated_at = now(); save(db); }
    return this.getAppt(id);
  },

  async createRef({ ownerId, designId, orderId, filePath, mime, size, original }) {
    const db = load();
    const r = { id: nid(db, "refs"), owner_id: Number(ownerId), design_id: designId ? Number(designId) : null, order_id: orderId ? Number(orderId) : null, file_path: filePath, mime: mime || null, size_bytes: size || null, original_name: original || null, created_at: now() };
    db.refs.push(r);
    save(db);
    return r;
  },
  async getRef(id) {
    return load().refs.find((r) => r.id === Number(id)) || null;
  },
  async listRefsByDesign(designId) {
    return load().refs.filter((r) => r.design_id === Number(designId))
      .map(({ id, mime, size_bytes, original_name, created_at }) => ({ id, mime, size_bytes, original_name, created_at }));
  },
  async listRefsByOrder(orderId) {
    return load().refs.filter((r) => r.order_id === Number(orderId))
      .map(({ id, mime, size_bytes, original_name, created_at }) => ({ id, mime, size_bytes, original_name, created_at }));
  },
  async deleteRef(id) {
    const db = load();
    db.refs = db.refs.filter((r) => r.id !== Number(id));
    save(db);
  },

  async logAction({ adminId, action, entity, entityId, detail }) {
    const db = load();
    db.actions.push({ id: nid(db, "actions"), admin_id: Number(adminId), action, entity: entity || null, entity_id: entityId ?? null, detail: detail || null, created_at: now() });
    save(db);
  },
  async getSummary() {
    const db = load();
    const active = new Set(["CONFIRMED", "MEASUREMENT_PENDING", "MEASUREMENT_CONFIRMED", "FABRIC_PENDING", "CUTTING", "STITCHING", "TRIAL_READY", "ALTERATION"]);
    const today = new Date().toISOString().slice(0, 10);
    const billable = db.orders.filter((o) => o.status !== "CANCELLED");
    return {
      requested: db.orders.filter((o) => o.status === "REQUESTED").length,
      inProgress: db.orders.filter((o) => active.has(o.status)).length,
      trialReady: db.orders.filter((o) => o.status === "TRIAL_READY").length,
      appointmentsToday: db.appts.filter((a) => String(a.scheduled_at).slice(0, 10) === today && ["REQUESTED", "CONFIRMED"].includes(a.status)).length,
      activeOffers: db.offers.filter((o) => o.is_active).length,
      totalOrders: db.orders.length,
      totalCustomers: db.users.filter((u) => u.role !== "admin" && u.is_active).length,
      revenue: Math.round(billable.reduce((s, o) => s + Number(o.total || 0), 0)),
    };
  },
};
