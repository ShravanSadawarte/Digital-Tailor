// AdminPage — the shop owner's dashboard: overview, order tracking, products,
// design library (cloth/neck/sleeve options), offers, customers, visits, UPI.
// Admin-only: everyone else is bounced to login / the customer dashboard.
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { del, get, patch, post, put } from "../api/client";
import { uploadCatalog } from "../api/uploads";
import { useAuth } from "../auth/useAuth";
import Button from "../components/Button";
import PageShell from "./PageShell";

const STATUS_LABEL = {
  REQUESTED: "Requested", CONFIRMED: "Confirmed", MEASUREMENT_PENDING: "Measurement visit",
  MEASUREMENT_CONFIRMED: "Measurements confirmed", FABRIC_PENDING: "Fabric pending", CUTTING: "Cutting",
  STITCHING: "Stitching", TRIAL_READY: "Trial ready", ALTERATION: "Alteration", READY: "Ready",
  DELIVERED: "Delivered", CANCELLED: "Cancelled",
};

const NEXT = {
  REQUESTED: ["CONFIRMED", "CANCELLED"], CONFIRMED: ["MEASUREMENT_PENDING", "CANCELLED"],
  MEASUREMENT_PENDING: ["MEASUREMENT_CONFIRMED", "CANCELLED"], MEASUREMENT_CONFIRMED: ["FABRIC_PENDING"],
  FABRIC_PENDING: ["CUTTING"], CUTTING: ["STITCHING"], STITCHING: ["TRIAL_READY"],
  TRIAL_READY: ["ALTERATION", "READY"], ALTERATION: ["READY", "CANCELLED"], READY: ["DELIVERED"],
};

// Main stitching pipeline for the tracking progress bar.
const FLOW = ["REQUESTED", "CONFIRMED", "MEASUREMENT_PENDING", "MEASUREMENT_CONFIRMED", "FABRIC_PENDING", "CUTTING", "STITCHING", "TRIAL_READY", "READY", "DELIVERED"];

const OPTION_TYPES = ["cloth", "fabric", "color", "neck", "neck_front", "neck_back", "sleeve", "length", "fit", "embroidery", "occasion", "style", "footwear"];
const TYPE_LABEL = {
  cloth: "Cloth / fabric", fabric: "Fabric", color: "Color", neck: "Neck", neck_front: "Neck · front",
  neck_back: "Neck · back", sleeve: "Sleeves", length: "Length", fit: "Fit", embroidery: "Embroidery",
  occasion: "Occasion", style: "Style", footwear: "Footwear",
};

const inr = (n) => `₹${Number(n || 0).toFixed(0)}`;
const date10 = (s) => String(s || "").slice(0, 10);

function Err({ error }) {
  if (!error) return null;
  return <p className="pg-error" role="alert">{error}</p>;
}

function Ok({ msg }) {
  if (!msg) return null;
  return <p className="pg-ok" role="status">{msg}</p>;
}

// Product/design thumbnail with graceful fallback.
function Thumb({ src, name, size = 56 }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <span className="ad-thumb ad-thumb-fallback" style={{ width: size, height: size }} aria-hidden="true">
        {(name || "?")[0]}
      </span>
    );
  }
  return <img className="ad-thumb" style={{ width: size, height: size }} src={src} alt="" loading="lazy" onError={() => setBroken(true)} />;
}

// Photo picker: upload from phone/camera OR paste an image URL. Returns a URL.
function PhotoField({ id, label, value, onChange, hint }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFile(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    setError("");
    try {
      const r = await uploadCatalog(f);
      onChange(r.url);
    } catch {
      setError("Upload failed — JPG/PNG/WEBP under the size limit, or paste a URL.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pg-field">
      <label htmlFor={id}>{label}</label>
      <div className="ad-photo-row">
        <Thumb src={value} name={label} size={64} />
        <div style={{ flex: 1, display: "grid", gap: 8 }}>
          <input id={id} value={value || ""} onChange={(e) => onChange(e.target.value)} maxLength={500} placeholder="https://… or upload below" />
          <div className="ad-photo-actions">
            <label className="dt-btn dt-btn-secondary dt-btn-sm" style={{ cursor: "pointer" }}>
              {busy ? "Uploading…" : "📷 Upload photo"}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} disabled={busy} hidden />
            </label>
            {value && (
              <button type="button" className="pg-linkbtn danger" onClick={() => onChange("")}>
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
      {hint && <p className="pg-muted pg-small">{hint}</p>}
      {error && <p className="pg-error" role="alert">{error}</p>}
    </div>
  );
}

// ─── Overview ────────────────────────────────────────────────────────────────
function OverviewSection({ go, onOpenOrder }) {
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial admin data load
    Promise.all([get("/admin/summary"), get("/admin/orders?limit=6")])
      .then(([s, o]) => {
        setSummary(s);
        setRecent(o.data || []);
      })
      .catch(() => setError("Could not load overview — try a fresh login."));
  }, []);

  const cards = summary ? [
    [inr(summary.revenue ?? 0), "revenue (excl. cancelled)"],
    [summary.requested ?? 0, "new requests"],
    [summary.inProgress ?? 0, "in progress"],
    [summary.trialReady ?? 0, "trial ready"],
    [summary.totalOrders ?? 0, "total orders"],
    [summary.totalCustomers ?? 0, "customers"],
    [summary.appointmentsToday ?? 0, "visits today"],
    [summary.activeOffers ?? 0, "active offers"],
  ] : [];

  return (
    <div>
      <h3 className="pg-h3">Shop overview</h3>
      <Err error={error} />
      {summary ? (
        <div className="ad-cards">
          {cards.map(([v, l]) => (
            <div className="ad-stat" key={l}><strong>{v}</strong><span>{l}</span></div>
          ))}
        </div>
      ) : <p className="pg-muted">Loading summary…</p>}
      <h3 className="pg-h3">Latest orders</h3>
      <div className="pg-rows">
        {recent.map((o) => (
          <div className="pg-row" key={o.id}>
            <div>
              <strong>#{o.id}</strong> <span className="pg-flag">{STATUS_LABEL[o.status] || o.status}</span>
              <div className="pg-muted pg-small">{o.customer_name || "Customer"} · {inr(o.total)} · {date10(o.created_at)}</div>
            </div>
            <button className="pg-linkbtn" onClick={() => onOpenOrder(o.id)}>Manage →</button>
          </div>
        ))}
        {recent.length === 0 && <p className="pg-muted">No orders yet.</p>}
      </div>
      <div className="pg-cta-row">
        <Button variant="secondary" size="sm" onClick={() => go("orders")}>All orders →</Button>
        <Button variant="secondary" size="sm" onClick={() => go("products")}>+ Add product</Button>
        <Button variant="secondary" size="sm" onClick={() => go("offers")}>+ New offer</Button>
        <Button variant="secondary" size="sm" onClick={() => go("designs")}>Design library →</Button>
      </div>
    </div>
  );
}

// ─── Orders ──────────────────────────────────────────────────────────────────
function OrderDetail({ id, onClose, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [refs, setRefs] = useState([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [d, r] = await Promise.all([
        get(`/orders/${id}`),
        get(`/admin/orders/${id}/refs`).catch(() => ({ data: [] })),
      ]);
      setDetail(d);
      setRefs(r.data || []);
    } catch {
      setError("Could not load order.");
    }
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load on open
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function advance(to) {
    setBusy(true);
    setError("");
    try {
      await patch(`/orders/${id}/status`, { to, note: note || undefined });
      setNote("");
      await load();
      onChanged?.();
    } catch {
      setError("That status change isn't allowed from here.");
    } finally {
      setBusy(false);
    }
  }

  if (!detail) return <div className="pg-form pg-form-wide"><Err error={error} /><p className="pg-muted">Loading order…</p></div>;
  const stepIdx = FLOW.indexOf(detail.status);

  return (
    <div className="pg-form pg-form-wide">
      <h3 className="pg-h3">Order #{detail.id} — {STATUS_LABEL[detail.status]}</h3>
      <Err error={error} />
      {stepIdx >= 0 && (
        <ol className="ad-steps" aria-label="Stitching progress">
          {FLOW.map((s, i) => (
            <li key={s} className={i < stepIdx ? "done" : i === stepIdx ? "now" : ""} title={STATUS_LABEL[s]}>
              <i />{STATUS_LABEL[s]}
            </li>
          ))}
        </ol>
      )}
      {detail.status === "CANCELLED" && <p className="pg-error">Cancelled.</p>}
      {detail.status === "ALTERATION" && <p className="pg-muted">Side step: alteration — next is Ready or Cancelled.</p>}
      <p className="pg-muted pg-small">
        Subtotal {inr(detail.subtotal)} · Discount {inr(detail.discount)} · <strong>Total {inr(detail.total)}</strong>
      </p>
      <h4 className="pg-h4">Items</h4>
      {(detail.items || []).map((it) => (
        <p className="pg-muted pg-small" key={it.id}>
          ♥ {it.design_title || `Design #${it.design_id}`} · {it.garment_name || `Garment #${it.garment_id}`} · ×{it.qty} · {inr(it.unit_price)}
          {it.options_snapshot && Object.keys(it.options_snapshot).length > 0 && (
            <> — {Object.entries(it.options_snapshot).map(([k, v]) => `${k}: ${v}`).join(" · ")}</>
          )}
        </p>
      ))}
      {detail.notes && (
        <>
          <h4 className="pg-h4">Customer note / UTR</h4>
          <p className="pg-muted pg-small">{detail.notes}</p>
        </>
      )}
      {refs.length > 0 && (
        <>
          <h4 className="pg-h4">Payment screenshots ({refs.length})</h4>
          <div className="ad-photo-actions">
            {refs.map((r) => (
              <a key={r.id} className="pg-linkbtn" href={`/api/uploads/${r.id}`} target="_blank" rel="noreferrer">
                🧾 {r.original_name || `Proof #${r.id}`} →
              </a>
            ))}
          </div>
        </>
      )}
      <h4 className="pg-h4">Measurements used</h4>
      <p className="pg-muted pg-small">
        {Object.entries(detail.measurements || {}).map(([k, v]) => `${k} ${v.value} (${v.source})`).join(" · ") || "—"}
      </p>
      <h4 className="pg-h4">Timeline</h4>
      <ol className="pg-timeline">
        {(detail.history || []).map((h) => (
          <li key={h.id}>{h.from_status ? `${h.from_status} → ` : ""}{h.to_status}{h.note ? ` — ${h.note}` : ""}</li>
        ))}
      </ol>
      <div className="pg-field">
        <label htmlFor="ad-note">Status note (optional)</label>
        <input id="ad-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Called customer, fabric arrived" maxLength={500} />
      </div>
      <div className="pg-row-actions">
        {(NEXT[detail.status] || []).map((s) => (
          <Button key={s} variant="primary" size="sm" onClick={() => advance(s)} disabled={busy}>→ {STATUS_LABEL[s]}</Button>
        ))}
        <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

function OrdersSection({ focusId, clearFocus }) {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState(null);
  const [error, setError] = useState("");

  async function load(st = status) {
    try {
      const d = await get(`/admin/orders?limit=50${st ? `&status=${st}` : ""}`);
      setOrders(d.data || []);
    } catch {
      setError("Could not load orders.");
    }
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial admin data load
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (focusId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- open from overview
      setOpenId(focusId);
      clearFocus?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  const shown = useMemo(() => {
    const s = q.trim();
    if (!s) return orders;
    return orders.filter((o) => String(o.id).includes(s) || (o.customer_name || "").toLowerCase().includes(s.toLowerCase()) || (o.customer_phone || "").includes(s));
  }, [orders, q]);

  return (
    <div>
      <h3 className="pg-h3">Orders tracking</h3>
      <Err error={error} />
      <div className="pg-toolbar">
        <input className="pg-search" placeholder="Search #id, name, phone…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search orders" />
        <select className="pg-search" value={status} onChange={(e) => { setStatus(e.target.value); load(e.target.value); }} aria-label="Filter by status">
          <option value="">All statuses</option>
          {Object.keys(STATUS_LABEL).map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>
      <div className="pg-rows">
        {shown.map((o) => (
          <div className="pg-row" key={o.id}>
            <div>
              <strong>#{o.id}</strong> <span className="pg-flag">{STATUS_LABEL[o.status] || o.status}</span>
              <div className="pg-muted pg-small">{o.customer_name || "Customer"}{o.customer_phone ? ` · ${o.customer_phone}` : ""} · {inr(o.total)} · {date10(o.created_at)}</div>
            </div>
            <button className="pg-linkbtn" onClick={() => setOpenId(o.id)}>Manage →</button>
          </div>
        ))}
        {shown.length === 0 && <p className="pg-muted">No orders found.</p>}
      </div>
      {openId && <OrderDetail id={openId} onClose={() => setOpenId(null)} onChanged={() => load()} />}
    </div>
  );
}

// ─── Products ────────────────────────────────────────────────────────────────
const blankGarment = { category_id: "", name: "", description: "", base_price: 999, image_path: "" };

function ProductsSection({ garments, categories, refresh }) {
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(blankGarment);
  const [editing, setEditing] = useState(null);
  const [editActive, setEditActive] = useState(true);
  const [newCat, setNewCat] = useState({ slug: "", name: "" });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return garments;
    return garments.filter((g) => g.name.toLowerCase().includes(s) || (g.category_name || "").toLowerCase().includes(s));
  }, [garments, q]);

  async function create(e) {
    e.preventDefault();
    setMsg(""); setError("");
    try {
      await post("/garments/admin", {
        category_id: Number(form.category_id), name: form.name, description: form.description || undefined,
        base_price: Number(form.base_price), image_path: form.image_path || undefined,
      });
      setForm((f) => ({ ...blankGarment, category_id: f.category_id }));
      setShowAdd(false);
      await refresh();
      setMsg("Product added to the shop ✓");
    } catch { setError("Could not add product — check category, name and price."); }
  }

  function startEdit(g) {
    setEditing(g.id);
    setForm({ category_id: String(g.category_id), name: g.name, description: g.description || "", base_price: g.base_price, image_path: g.image_path || "" });
    setEditActive(!!g.is_active);
    setMsg(""); setError("");
  }

  async function saveEdit(e) {
    e.preventDefault();
    setMsg(""); setError("");
    try {
      await put(`/garments/admin/${editing}`, {
        category_id: Number(form.category_id), name: form.name, description: form.description,
        base_price: Number(form.base_price), image_path: form.image_path || null, is_active: editActive,
      });
      setEditing(null);
      await refresh();
      setMsg("Product updated ✓");
    } catch { setError("Could not update product."); }
  }

  async function toggle(g) {
    setError("");
    try {
      await put(`/garments/admin/${g.id}`, { is_active: !g.is_active });
      await refresh();
    } catch { setError("Could not change visibility."); }
  }

  async function createCategory(e) {
    e.preventDefault();
    setMsg(""); setError("");
    try {
      await post("/garments/admin/categories", { slug: newCat.slug.trim().toLowerCase().replace(/\s+/g, "-"), name: newCat.name, description: "" });
      setNewCat({ slug: "", name: "" });
      await refresh();
      setMsg("Category created ✓");
    } catch { setError("Could not create category — slug must be unique, lowercase."); }
  }

  return (
    <div>
      <h3 className="pg-h3">Products — {garments.length} styles</h3>
      <Err error={error} />
      <Ok msg={msg} />
      <div className="pg-toolbar">
        <input className="pg-search" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
        <Button variant="primary" size="sm" onClick={() => { setShowAdd((v) => !v); setEditing(null); }}>
          {showAdd ? "Close" : "+ Add product"}
        </Button>
      </div>

      {showAdd && (
        <form className="pg-form pg-form-wide" onSubmit={create}>
          <h3 className="pg-h3">New product</h3>
          <div className="pg-grid2">
            <div className="pg-field">
              <label htmlFor="np-cat">Category</label>
              <select id="np-cat" value={form.category_id} onChange={set("category_id")} required>
                <option value="">Select…</option>
                {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div className="pg-field">
              <label htmlFor="np-price">Base price ₹</label>
              <input id="np-price" type="number" min="0" value={form.base_price} onChange={set("base_price")} required />
            </div>
          </div>
          <div className="pg-field">
            <label htmlFor="np-name">Name</label>
            <input id="np-name" value={form.name} onChange={set("name")} required maxLength={150} placeholder="e.g. Festive Silk Kurti" />
          </div>
          <div className="pg-field">
            <label htmlFor="np-desc">Description</label>
            <input id="np-desc" value={form.description} onChange={set("description")} maxLength={1000} placeholder="Fabric, occasion, fit…" />
          </div>
          <PhotoField id="np-photo" label="Product photo" value={form.image_path} onChange={(v) => setForm((f) => ({ ...f, image_path: v }))} hint="Upload from your phone or paste an image link — shows on the home shop." />
          <Button variant="primary" size="sm" type="submit">Add to shop</Button>
        </form>
      )}

      <div className="pg-rows">
        {shown.map((g) => (
          <div key={g.id}>
            <div className="pg-row">
              <div className="ad-prod">
                <Thumb src={g.image_path} name={g.name} />
                <div>
                  <strong>{g.name}</strong> {!g.is_active && <span className="pg-flag">hidden</span>}
                  <div className="pg-muted pg-small">{g.category_name} · {inr(g.base_price)}</div>
                </div>
              </div>
              <div className="pg-row-actions">
                <button className="pg-linkbtn" onClick={() => { startEdit(g); setShowAdd(false); }}>Edit</button>
                <button className="pg-linkbtn danger" onClick={() => toggle(g)}>{g.is_active ? "Hide" : "Show"}</button>
              </div>
            </div>
            {editing === g.id && (
              <form className="pg-form pg-form-wide" onSubmit={saveEdit}>
                <h3 className="pg-h3">Edit — {g.name}</h3>
                <div className="pg-grid2">
                  <div className="pg-field">
                    <label htmlFor={`ep-cat-${g.id}`}>Category</label>
                    <select id={`ep-cat-${g.id}`} value={form.category_id} onChange={set("category_id")} required>
                      {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                  </div>
                  <div className="pg-field">
                    <label htmlFor={`ep-price-${g.id}`}>Base price ₹</label>
                    <input id={`ep-price-${g.id}`} type="number" min="0" value={form.base_price} onChange={set("base_price")} required />
                  </div>
                </div>
                <div className="pg-field">
                  <label htmlFor={`ep-name-${g.id}`}>Name</label>
                  <input id={`ep-name-${g.id}`} value={form.name} onChange={set("name")} required maxLength={150} />
                </div>
                <div className="pg-field">
                  <label htmlFor={`ep-desc-${g.id}`}>Description</label>
                  <input id={`ep-desc-${g.id}`} value={form.description} onChange={set("description")} maxLength={1000} />
                </div>
                <PhotoField id={`ep-photo-${g.id}`} label="Product photo" value={form.image_path} onChange={(v) => setForm((f) => ({ ...f, image_path: v }))} />
                <div className="pg-field">
                  <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 500 }}>
                    <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} style={{ width: "auto" }} /> Visible in shop
                  </label>
                </div>
                <div className="pg-row-actions">
                  <Button variant="primary" size="sm" type="submit">Save</Button>
                  <Button variant="secondary" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                </div>
              </form>
            )}
          </div>
        ))}
        {shown.length === 0 && <p className="pg-muted">No products found.</p>}
      </div>

      <form className="pg-form pg-form-wide" onSubmit={createCategory}>
        <h3 className="pg-h3">New category</h3>
        <div className="pg-grid2">
          <div className="pg-field">
            <label htmlFor="nc-slug">Slug (lowercase)</label>
            <input id="nc-slug" value={newCat.slug} onChange={(e) => setNewCat((v) => ({ ...v, slug: e.target.value }))} required maxLength={50} placeholder="e.g. festive-gown" />
          </div>
          <div className="pg-field">
            <label htmlFor="nc-name">Name</label>
            <input id="nc-name" value={newCat.name} onChange={(e) => setNewCat((v) => ({ ...v, name: e.target.value }))} required maxLength={100} />
          </div>
        </div>
        <Button variant="secondary" size="sm" type="submit">Create category</Button>
      </form>
    </div>
  );
}

// ─── Design library (raw custom things: cloth, necks, sleeves…) ─────────────
function DesignsSection({ garments }) {
  const [gid, setGid] = useState("");
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ type: "cloth", value: "", price_delta: 0, image_url: "" });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ value: "", price_delta: 0, image_url: "", is_active: true });
  const [copyFrom, setCopyFrom] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (garments[0] && !gid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- pick first product
      setGid(String(garments[0].id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garments]);

  async function loadDetail(id) {
    if (!id) { setDetail(null); return; }
    try {
      setDetail(await get(`/garments/admin/${id}`));
    } catch {
      setError("Could not load options.");
    }
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load on pick
    loadDetail(gid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gid]);

  const groups = useMemo(() => {
    const g = {};
    for (const o of detail?.options || []) (g[o.option_type] ||= []).push(o);
    return g;
  }, [detail]);

  async function add(e) {
    e.preventDefault();
    setMsg(""); setError("");
    try {
      await post(`/garments/admin/${gid}/options`, { type: form.type, value: form.value, price_delta: Number(form.price_delta || 0), image_url: form.image_url || undefined });
      setForm({ type: form.type, value: "", price_delta: 0, image_url: "" });
      await loadDetail(gid);
      setMsg(`Added “${form.value || "option"}” ✓`);
    } catch { setError("Could not add — that name already exists for this type."); }
  }

  function startEdit(o) {
    setEditing(o.id);
    setEditForm({ value: o.option_value, price_delta: o.price_delta, image_url: o.image_url || "", is_active: !!o.is_active });
  }

  async function saveEdit(id) {
    setError("");
    try {
      await put(`/garments/admin/options/${id}`, {
        value: editForm.value, price_delta: Number(editForm.price_delta || 0),
        image_url: editForm.image_url || null, is_active: editForm.is_active,
      });
      setEditing(null);
      await loadDetail(gid);
      setMsg("Option updated ✓");
    } catch { setError("Could not update option."); }
  }

  async function remove(id) {
    if (!window.confirm("Delete this option? Customers won't see it anymore.")) return;
    await del(`/garments/admin/options/${id}`);
    await loadDetail(gid);
  }

  async function copyAll(e) {
    e.preventDefault();
    if (!copyFrom || copyFrom === gid) return;
    setMsg(""); setError("");
    try {
      const src = await get(`/garments/admin/${copyFrom}`);
      const existing = new Set((detail?.options || []).map((o) => `${o.option_type}::${o.option_value}`));
      let added = 0;
      for (const o of src.options || []) {
        if (existing.has(`${o.option_type}::${o.option_value}`)) continue;
        try {
          await post(`/garments/admin/${gid}/options`, { type: o.option_type, value: o.option_value, price_delta: Number(o.price_delta || 0), image_url: o.image_url || undefined });
          added += 1;
        } catch { /* skip duplicates that race in */ }
      }
      await loadDetail(gid);
      setMsg(added ? `Copied ${added} option(s) ✓` : "Everything was already there — nothing to copy.");
    } catch { setError("Could not copy options."); }
  }

  return (
    <div>
      <h3 className="pg-h3">Design library — raw custom things</h3>
      <p className="pg-muted">Cloths, neck fronts/backs, sleeves and more with photos. These are what customers pick in Personalize.</p>
      <Err error={error} />
      <Ok msg={msg} />
      <div className="pg-toolbar">
        <div className="pg-field pg-inline">
          <label htmlFor="dl-g">Product</label>
          <select id="dl-g" value={gid} onChange={(e) => setGid(e.target.value)}>
            {garments.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
          </select>
        </div>
        <form className="pg-field pg-inline" onSubmit={copyAll} style={{ margin: 0 }}>
          <label htmlFor="dl-copy">Copy all from</label>
          <select id="dl-copy" value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)}>
            <option value="">Select…</option>
            {garments.filter((g) => String(g.id) !== String(gid)).map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
          </select>
          <Button variant="secondary" size="sm" type="submit" disabled={!copyFrom}>Copy →</Button>
        </form>
      </div>

      {OPTION_TYPES.filter((t) => groups[t]?.length || ["cloth", "neck_front", "neck_back", "sleeve"].includes(t)).map((t) => (
        <div key={t} className="pg-optgroup">
          <h4>{TYPE_LABEL[t] || t} ({(groups[t] || []).length})</h4>
          <div className="ad-lib-grid">
            {(groups[t] || []).map((o) => (
              <div className="ad-lib-card" key={o.id}>
                {editing === o.id ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    <input value={editForm.value} onChange={(e) => setEditForm((f) => ({ ...f, value: e.target.value }))} maxLength={100} aria-label="Option name" />
                    <div className="pg-grid2">
                      <input type="number" min="0" value={editForm.price_delta} onChange={(e) => setEditForm((f) => ({ ...f, price_delta: e.target.value }))} aria-label="Extra rupees" />
                      <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>
                        <input type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm((f) => ({ ...f, is_active: e.target.checked }))} style={{ width: "auto" }} /> Show
                      </label>
                    </div>
                    <PhotoField id={`oe-${o.id}`} label="Design photo" value={editForm.image_url} onChange={(v) => setEditForm((f) => ({ ...f, image_url: v }))} />
                    <div className="pg-row-actions">
                      <Button variant="primary" size="sm" onClick={() => saveEdit(o.id)}>Save</Button>
                      <Button variant="secondary" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Thumb src={o.image_url} name={o.option_value} size={64} />
                    <strong>{o.option_value}</strong>
                    {!o.is_active && <span className="pg-flag">hidden</span>}
                    <small className="pg-muted">{Number(o.price_delta) > 0 ? `+${inr(o.price_delta)}` : "included"}</small>
                    <div className="pg-row-actions">
                      <button className="pg-linkbtn" onClick={() => startEdit(o)}>Edit</button>
                      <button className="pg-linkbtn danger" onClick={() => remove(o.id)}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <form className="pg-form pg-form-wide" onSubmit={add}>
        <h3 className="pg-h3">Add to {detail?.name || "product"}</h3>
        <div className="pg-grid2">
          <div className="pg-field">
            <label htmlFor="dl-t">Type</label>
            <select id="dl-t" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              {OPTION_TYPES.map((t) => (<option key={t} value={t}>{TYPE_LABEL[t] || t}</option>))}
            </select>
          </div>
          <div className="pg-field">
            <label htmlFor="dl-v">Name</label>
            <input id="dl-v" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} required maxLength={100} placeholder="e.g. Boat Front, Emerald Silk" />
          </div>
        </div>
        <div className="pg-field">
          <label htmlFor="dl-p">Extra charge ₹ (0 = included)</label>
          <input id="dl-p" type="number" min="0" value={form.price_delta} onChange={(e) => setForm((f) => ({ ...f, price_delta: e.target.value }))} />
        </div>
        <PhotoField id="dl-photo" label="Design photo" value={form.image_url} onChange={(v) => setForm((f) => ({ ...f, image_url: v }))} hint="Shows as a card in Personalize — snap the cloth/neck/sleeve." />
        <Button variant="primary" size="sm" type="submit" disabled={!gid}>Add option</Button>
      </form>
    </div>
  );
}

// ─── Offers ──────────────────────────────────────────────────────────────────
const blankOffer = { title: "", description: "", discount_type: "percent", discount_value: 10, min_order: 0, first_order_only: false, usage_limit: "", starts_at: "", ends_at: "", is_active: true };

function OffersSection() {
  const [offers, setOffers] = useState([]);
  const [form, setOffer] = useState(blankOffer);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setOffers((await get("/admin/offers")).data || []);
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial admin data load
    load().catch(() => setError("Could not load offers."));
  }, []);

  const dtl = (v) => (v ? new Date(v).toISOString() : undefined);

  async function create(e) {
    e.preventDefault();
    setMsg(""); setError("");
    try {
      await post("/offers", {
        ...form, discount_value: Number(form.discount_value), min_order: Number(form.min_order || 0),
        usage_limit: form.usage_limit ? Number(form.usage_limit) : undefined,
        starts_at: dtl(form.starts_at), ends_at: dtl(form.ends_at),
      });
      setOffer(blankOffer);
      await load();
      setMsg("Offer is live on the homepage strip ✓");
    } catch { setError("Could not create offer — check title and value."); }
  }

  async function toggle(o) {
    await put(`/offers/${o.id}`, { is_active: !o.is_active });
    await load();
  }

  async function remove(id) {
    if (!window.confirm("Delete this offer? Used offers will be deactivated instead.")) return;
    await del(`/offers/${id}`);
    await load();
  }

  return (
    <div>
      <h3 className="pg-h3">Offers</h3>
      <Err error={error} />
      <Ok msg={msg} />
      <div className="pg-rows">
        {offers.map((o) => (
          <div className="pg-row" key={o.id}>
            <div>
              <strong>{o.title}</strong> {!o.is_active && <span className="pg-flag">off</span>}
              <div className="pg-muted pg-small">
                {o.discount_type} {o.discount_value} · min {inr(o.min_order || 0)}{o.first_order_only ? " · first order" : ""} · used {o.usage ?? 0}×
                {o.ends_at ? ` · ends ${date10(o.ends_at)}` : ""}
              </div>
            </div>
            <div className="pg-row-actions">
              <button className="pg-linkbtn" onClick={() => toggle(o)}>{o.is_active ? "Deactivate" : "Activate"}</button>
              <button className="pg-linkbtn danger" onClick={() => remove(o.id)}>Delete</button>
            </div>
          </div>
        ))}
        {offers.length === 0 && <p className="pg-muted">No offers yet.</p>}
      </div>
      <form className="pg-form pg-form-wide" onSubmit={create}>
        <h3 className="pg-h3">New offer</h3>
        <div className="pg-field">
          <label htmlFor="of-title">Title</label>
          <input id="of-title" value={form.title} onChange={(e) => setOffer((o) => ({ ...o, title: e.target.value }))} required maxLength={150} placeholder="e.g. Diwali Dhamaka — 15% off" />
        </div>
        <div className="pg-field">
          <label htmlFor="of-desc">Description</label>
          <input id="of-desc" value={form.description} onChange={(e) => setOffer((o) => ({ ...o, description: e.target.value }))} maxLength={1000} placeholder="Shows on the homepage strip" />
        </div>
        <div className="pg-grid2">
          <div className="pg-field">
            <label htmlFor="of-type">Type</label>
            <select id="of-type" value={form.discount_type} onChange={(e) => setOffer((o) => ({ ...o, discount_type: e.target.value }))}>
              <option value="percent">Percent %</option>
              <option value="flat">Flat ₹</option>
            </select>
          </div>
          <div className="pg-field">
            <label htmlFor="of-val">Value</label>
            <input id="of-val" type="number" min="0" value={form.discount_value} onChange={(e) => setOffer((o) => ({ ...o, discount_value: e.target.value }))} required />
          </div>
        </div>
        <div className="pg-grid2">
          <div className="pg-field">
            <label htmlFor="of-min">Min order ₹</label>
            <input id="of-min" type="number" min="0" value={form.min_order} onChange={(e) => setOffer((o) => ({ ...o, min_order: e.target.value }))} />
          </div>
          <div className="pg-field">
            <label htmlFor="of-first">First order only?</label>
            <select id="of-first" value={form.first_order_only ? "yes" : "no"} onChange={(e) => setOffer((o) => ({ ...o, first_order_only: e.target.value === "yes" }))}>
              <option value="no">No — everyone</option>
              <option value="yes">Yes — new customers</option>
            </select>
          </div>
        </div>
        <div className="pg-grid2">
          <div className="pg-field">
            <label htmlFor="of-start">Starts (optional)</label>
            <input id="of-start" type="datetime-local" value={form.starts_at} onChange={(e) => setOffer((o) => ({ ...o, starts_at: e.target.value }))} />
          </div>
          <div className="pg-field">
            <label htmlFor="of-end">Ends (optional)</label>
            <input id="of-end" type="datetime-local" value={form.ends_at} onChange={(e) => setOffer((o) => ({ ...o, ends_at: e.target.value }))} />
          </div>
        </div>
        <div className="pg-field">
          <label htmlFor="of-limit">Usage limit (optional)</label>
          <input id="of-limit" type="number" min="1" value={form.usage_limit} onChange={(e) => setOffer((o) => ({ ...o, usage_limit: e.target.value }))} placeholder="e.g. 100" />
        </div>
        <Button variant="primary" size="sm" type="submit">Launch offer</Button>
      </form>
      <p className="pg-muted pg-small">Tip: name festival offers clearly — “Diwali Dhamaka — 15% off” shows on the homepage strip automatically.</p>
    </div>
  );
}

// ─── Customers ───────────────────────────────────────────────────────────────
function CustomersSection() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState("");

  async function search(e) {
    e?.preventDefault?.();
    try {
      setList((await get(`/admin/customers?search=${encodeURIComponent(q)}&limit=20`)).data || []);
    } catch {
      setError("Search failed.");
    }
  }

  async function open(id) {
    setCustomer(await get(`/admin/customers/${id}`));
  }

  async function toggle(id, isActive) {
    await patch(`/admin/customers/${id}/active`, { is_active: !isActive });
    setCustomer(null);
    search();
  }

  return (
    <div>
      <h3 className="pg-h3">Customers</h3>
      <Err error={error} />
      <form className="pg-toolbar" onSubmit={search}>
        <input className="pg-search" placeholder="Search name, phone, email…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search customers" />
        <Button variant="primary" size="sm" type="submit">Search</Button>
      </form>
      <div className="pg-rows">
        {list.map((u) => (
          <div className="pg-row" key={u.id}>
            <div>
              <strong>{u.name}</strong> <span className="pg-muted pg-small">{u.phone}{u.email ? ` · ${u.email}` : ""}</span>
              {!u.is_active && <span className="pg-flag">disabled</span>}
            </div>
            <button className="pg-linkbtn" onClick={() => open(u.id)}>Details →</button>
          </div>
        ))}
        {list.length === 0 && <p className="pg-muted">Search to list customers.</p>}
      </div>
      {customer && (
        <div className="pg-form pg-form-wide">
          <h3 className="pg-h3">{customer.user.name} — {customer.user.phone}</h3>
          <p className="pg-muted pg-small">{customer.user.email || "no email"} · {customer.user.is_active ? "active" : "disabled"} · {customer.orders?.length || 0} orders</p>
          {(customer.orders || []).slice(0, 5).map((o) => (
            <p className="pg-muted pg-small" key={o.id}>#{o.id} · {STATUS_LABEL[o.status] || o.status} · {inr(o.total)} · {date10(o.created_at)}</p>
          ))}
          <div className="pg-row-actions">
            <Button variant="secondary" size="sm" onClick={() => toggle(customer.user.id, customer.user.is_active)}>
              {customer.user.is_active ? "Disable" : "Enable"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setCustomer(null)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Visits ──────────────────────────────────────────────────────────────────
function VisitsSection() {
  const [list, setList] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      setList((await get("/appointments?limit=50")).data || []);
    } catch {
      setError("Could not load visits.");
    }
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial admin data load
    load();
  }, []);

  async function setStatus(id, to) {
    await patch(`/appointments/${id}/status`, { to });
    await load();
  }

  return (
    <div>
      <h3 className="pg-h3">Visits / appointments</h3>
      <Err error={error} />
      <div className="pg-rows">
        {list.map((a) => (
          <div className="pg-row" key={a.id}>
            <div>
              <strong>{String(a.reason || "").replace("-", " ")}</strong> <span className="pg-flag">{a.status}</span>
              <div className="pg-muted pg-small">{String(a.scheduled_at).replace("T", " ").slice(0, 16)}{a.notes ? ` · ${a.notes}` : ""}</div>
            </div>
            <div className="pg-row-actions">
              {a.status === "REQUESTED" && (
                <button className="pg-linkbtn" onClick={() => setStatus(a.id, "CONFIRMED")}>Confirm</button>
              )}
              {!["COMPLETED", "CANCELLED"].includes(a.status) && (
                <button className="pg-linkbtn" onClick={() => setStatus(a.id, "COMPLETED")}>Complete</button>
              )}
              {!["COMPLETED", "CANCELLED"].includes(a.status) && (
                <button className="pg-linkbtn danger" onClick={() => setStatus(a.id, "CANCELLED")}>Cancel</button>
              )}
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="pg-muted">No visits booked.</p>}
      </div>
    </div>
  );
}

// ─── Settings (UPI) ──────────────────────────────────────────────────────────
function SettingsSection() {
  const [pay, setPay] = useState({ upi_id: "", upi_name: "", note: "", qr_image_url: "" });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial admin data load
    get("/payment-info")
      .then((p) => setPay({ upi_id: p.upi_id || "", upi_name: p.upi_name || "", note: p.note || "", qr_image_url: p.qr_image_url || "" }))
      .catch(() => {});
  }, []);

  async function save(e) {
    e.preventDefault();
    setMsg(""); setError("");
    try {
      const u = await put("/payment-info", { upi_id: pay.upi_id, upi_name: pay.upi_name, note: pay.note, qr_image_url: pay.qr_image_url || undefined });
      setPay({ upi_id: u.upi_id || "", upi_name: u.upi_name || "", note: u.note || "", qr_image_url: u.qr_image_url || "" });
      setMsg("UPI info updated — checkout shows it instantly ✓");
    } catch { setError("Could not save — check the UPI ID format (name@bank)."); }
  }

  return (
    <div>
      <h3 className="pg-h3">UPI — direct payments, zero fees</h3>
      <p className="pg-muted">Customers see this UPI ID + QR at checkout and send UTR + screenshot. No gateway needed.</p>
      <Err error={error} />
      <Ok msg={msg} />
      <form className="pg-form pg-form-wide" onSubmit={save}>
        <div className="pg-grid2">
          <div className="pg-field">
            <label htmlFor="pay-id">UPI ID *</label>
            <input id="pay-id" value={pay.upi_id} onChange={(e) => setPay((p) => ({ ...p, upi_id: e.target.value }))} required placeholder="name@okhdfcbank" />
          </div>
          <div className="pg-field">
            <label htmlFor="pay-name">Payee name</label>
            <input id="pay-name" value={pay.upi_name} onChange={(e) => setPay((p) => ({ ...p, upi_name: e.target.value }))} placeholder="Digital Tailor" maxLength={100} />
          </div>
        </div>
        <div className="pg-field">
          <label htmlFor="pay-note">Note shown at checkout</label>
          <input id="pay-note" value={pay.note} onChange={(e) => setPay((p) => ({ ...p, note: e.target.value }))} maxLength={500} />
        </div>
        <PhotoField id="pay-qr" label="QR code photo (optional — auto-generated if empty)" value={pay.qr_image_url} onChange={(v) => setPay((p) => ({ ...p, qr_image_url: v }))} />
        <Button variant="primary" size="sm" type="submit">Save UPI info</Button>
      </form>
    </div>
  );
}

// ─── Shell ───────────────────────────────────────────────────────────────────
const SECTIONS = [
  ["overview", "📊 Overview"],
  ["orders", "🧾 Orders"],
  ["products", "👗 Products"],
  ["designs", "✂️ Designs"],
  ["offers", "🎉 Offers"],
  ["customers", "👥 Customers"],
  ["visits", "📅 Visits"],
  ["settings", "⚙️ UPI & Settings"],
];

export default function AdminPage() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState("overview");
  const [garments, setGarments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [focusOrder, setFocusOrder] = useState(null);

  async function refreshCatalog() {
    const [g, c] = await Promise.all([
      get("/garments?limit=50&all=1"),
      get("/categories"),
    ]);
    setGarments(g.data || []);
    setCategories(c.data || []);
  }
  useEffect(() => {
    if (!user || user.role !== "admin") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial admin data load
    refreshCatalog().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) {
    return <PageShell><section className="dt-section"><div className="dt-container"><p>Loading…</p></div></section></PageShell>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;

  function openOrder(id) {
    setFocusOrder(id);
    setSection("orders");
  }

  return (
    <PageShell>
      <section className="dt-section ad-sec">
        <div className="dt-container">
          <div className="pg-dash-head">
            <div>
              <p className="dt-eyebrow">Admin dashboard</p>
              <h2 className="dt-h2">Namaste, <em>{user.name?.split(" ")[0]}.</em></h2>
            </div>
            <div className="pg-row-actions">
              <Button variant="secondary" size="sm" to="/#shop">View shop</Button>
              <Button variant="secondary" size="sm" onClick={() => { logout(); navigate("/"); }}>Log out</Button>
            </div>
          </div>
          <div className="ad-layout">
            <nav className="ad-side" aria-label="Admin sections">
              {SECTIONS.map(([id, label]) => (
                <button key={id} className={`ad-link${section === id ? " on" : ""}`} onClick={() => setSection(id)} aria-current={section === id ? "page" : undefined}>
                  {label}
                </button>
              ))}
            </nav>
            <div className="ad-main">
              {section === "overview" && <OverviewSection go={setSection} onOpenOrder={openOrder} />}
              {section === "orders" && <OrdersSection focusId={focusOrder} clearFocus={() => setFocusOrder(null)} />}
              {section === "products" && <ProductsSection garments={garments} categories={categories} refresh={refreshCatalog} />}
              {section === "designs" && <DesignsSection garments={garments} />}
              {section === "offers" && <OffersSection />}
              {section === "customers" && <CustomersSection />}
              {section === "visits" && <VisitsSection />}
              {section === "settings" && <SettingsSection />}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
