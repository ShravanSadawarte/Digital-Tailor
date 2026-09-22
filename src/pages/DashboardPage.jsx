import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { del, get, patch, post, put } from "../api/client";
import { useAuth } from "../auth/useAuth";
import Button from "../components/Button";
import PageShell from "./PageShell";

const FIELD_SETS = {
  kurti: ["bust", "waist", "hip", "shoulder", "armhole", "sleeve_length", "kurti_length", "neck_width", "front_neck_depth", "back_neck_depth"],
  pant: ["waist", "hip", "thigh", "inseam", "pant_length", "bottom_width"],
  palazzo: ["waist", "hip", "thigh", "inseam", "palazzo_length", "bottom_width"],
  "one-piece": ["bust", "waist", "hip", "shoulder", "armhole", "sleeve_length", "dress_length", "neck_width", "front_neck_depth", "back_neck_depth"],
};
const ALL_FIELDS = [...new Set(Object.values(FIELD_SETS).flat())];
const label = (k) => k.replace(/_/g, " ");

function Err({ error }) {
  if (!error) return null;
  return (
    <p className="pg-error" role="alert">
      {error}
    </p>
  );
}

function MeasurementsTab() {
  const [profiles, setProfiles] = useState([]);
  const [hint, setHint] = useState("kurti");
  const [name, setName] = useState("");
  const [values, setValues] = useState({});
  const [error, setError] = useState("");
  const fields = hint === "custom" ? ALL_FIELDS : FIELD_SETS[hint] || ALL_FIELDS;

  async function load() {
    try {
      const d = await get("/measurements");
      setProfiles(d.data);
    } catch {
      setError("Could not load profiles.");
    }
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    setError("");
    try {
      await post("/measurements", { name, garment_hint: hint, values });
      setName("");
      setValues({});
      load();
    } catch (err) {
      setError(err.details ? `Check values: ${err.details.map((d) => d.path).join(", ")}` : "Could not save — check the values.");
    }
  }

  return (
    <div>
      <h3 className="pg-h3">Measurement profiles</h3>
      <div className="pg-rows">
        {profiles.map((p) => (
          <div className="pg-row" key={p.id}>
            <div>
              <strong>{p.name}</strong> <span className="pg-muted">· {p.garment_hint || "general"}</span>
              {p.is_default ? <span className="pg-flag">default</span> : null}
              <div className="pg-muted pg-small">{Object.entries(p.values || {}).map(([k, v]) => `${k} ${v}`).join(" · ")}</div>
            </div>
            <div className="pg-row-actions">
              {!p.is_default && (
                <button className="pg-linkbtn" onClick={() => put(`/measurements/${p.id}`, { is_default: true }).then(load)}>
                  Set default
                </button>
              )}
              <button className="pg-linkbtn danger" onClick={() => del(`/measurements/${p.id}`).then(load)}>
                Delete
              </button>
            </div>
          </div>
        ))}
        {profiles.length === 0 && <p className="pg-muted">No profiles yet — save your first below.</p>}
      </div>
      <form className="pg-form pg-form-wide" onSubmit={save}>
        <h3 className="pg-h3">New profile</h3>
        <Err error={error} />
        <div className="pg-grid2">
          <div className="pg-field">
            <label htmlFor="mp-name">Profile name</label>
            <input id="mp-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="My standard" />
          </div>
          <div className="pg-field">
            <label htmlFor="mp-hint">For garment type</label>
            <select id="mp-hint" value={hint} onChange={(e) => { setHint(e.target.value); setValues({}); }}>
              <option value="kurti">Kurti</option>
              <option value="pant">Pant</option>
              <option value="palazzo">Palazzo</option>
              <option value="one-piece">One-piece</option>
              <option value="custom">Custom (all fields)</option>
            </select>
          </div>
        </div>
        <div className="pg-measure-grid">
          {fields.map((f) => (
            <div className="pg-field" key={f}>
              <label htmlFor={`mv-${f}`}>{label(f)} (cm)</label>
              <input
                id={`mv-${f}`}
                type="number"
                step="0.1"
                value={values[f] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f]: Number(e.target.value) }))}
                required
              />
            </div>
          ))}
        </div>
        <Button variant="primary" size="sm" type="submit">
          Save profile
        </Button>
      </form>
    </div>
  );
}

function DesignsTab() {
  const [designs, setDesigns] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [offers, setOffers] = useState([]);
  const [ordering, setOrdering] = useState(null);
  const [profileId, setProfileId] = useState("");
  const [offerId, setOfferId] = useState("");
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState(null);

  async function load() {
    const [d, p, o] = await Promise.all([
      get("/designs?limit=50"),
      get("/measurements"),
      get("/offers"),
    ]);
    setDesigns(d.data);
    setProfiles(p.data);
    setOffers(o.data);
    if (p.data[0]) setProfileId(String(p.data.find((x) => x.is_default)?.id || p.data[0].id));
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    load().catch(() => setError("Could not load designs."));
  }, []);

  async function placeOrder() {
    setError("");
    try {
      const res = await post("/orders", {
        design_id: ordering,
        measurement_profile_id: Number(profileId),
        offer_id: offerId ? Number(offerId) : undefined,
      });
      setPlaced(res.order);
      setOrdering(null);
    } catch (e) {
      setError(e.code?.startsWith("OFFER") ? "That offer can't be applied to this order." : "Could not place the order.");
    }
  }

  return (
    <div>
      <h3 className="pg-h3">Saved designs</h3>
      <Err error={error} />
      {placed && (
        <p className="pg-ok" role="status">
          Order #{placed.id} placed — total ₹{Number(placed.total).toFixed(0)}. Track it under Orders.
        </p>
      )}
      <div className="pg-rows">
        {designs.map((d) => (
          <div className="pg-row" key={d.id}>
            <div>
              <strong>{d.title}</strong>
              <div className="pg-muted pg-small">
                {[d.color, d.neck, d.sleeve, d.fit, d.occasion].filter(Boolean).join(" · ")}
              </div>
            </div>
            <div className="pg-row-actions">
              <button className="pg-linkbtn" onClick={() => { setOrdering(d.id); setPlaced(null); }}>
                Order →
              </button>
              <button className="pg-linkbtn danger" onClick={() => del(`/designs/${d.id}`).then(load)}>
                Delete
              </button>
            </div>
          </div>
        ))}
        {designs.length === 0 && <p className="pg-muted">No saved designs yet — create one from the Styles page via the Studio.</p>}
      </div>
      {ordering && (
        <div className="pg-form pg-form-wide">
          <h3 className="pg-h3">Place order</h3>
          <div className="pg-grid2">
            <div className="pg-field">
              <label htmlFor="ord-prof">Measurement profile</label>
              <select id="ord-prof" value={profileId} onChange={(e) => setProfileId(e.target.value)}>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="pg-field">
              <label htmlFor="ord-offer">Offer (optional)</label>
              <select id="ord-offer" value={offerId} onChange={(e) => setOfferId(e.target.value)}>
                <option value="">No offer</option>
                {offers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="pg-row-actions">
            <Button variant="primary" size="sm" onClick={placeOrder} disabled={!profileId}>
              Confirm order
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setOrdering(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_LABEL = {
  REQUESTED: "Requested", CONFIRMED: "Confirmed", MEASUREMENT_PENDING: "Measurement visit",
  MEASUREMENT_CONFIRMED: "Measurements confirmed", FABRIC_PENDING: "Fabric pending", CUTTING: "Cutting",
  STITCHING: "Stitching", TRIAL_READY: "Trial ready", ALTERATION: "Alteration", READY: "Ready",
  DELIVERED: "Delivered", CANCELLED: "Cancelled",
};

function OrdersTab({ admin }) {
  const [orders, setOrders] = useState([]);
  const [detail, setDetail] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const d = await get(`/orders?limit=50${status ? `&status=${status}` : ""}`);
    setOrders(d.data);
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    load().catch(() => setError("Could not load orders."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function open(id) {
    const d = await get(`/orders/${id}`);
    setDetail(d);
  }

  return (
    <div>
      <h3 className="pg-h3">{admin ? "All orders" : "My orders"}</h3>
      <Err error={error} />
      <div className="pg-field pg-inline">
        <label htmlFor="ord-status">Status</label>
        <select id="ord-status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          {Object.keys(STATUS_LABEL).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="pg-rows">
        {orders.map((o) => (
          <div className="pg-row" key={o.id}>
            <div>
              <strong>Order #{o.id}</strong> <span className="pg-flag">{STATUS_LABEL[o.status] || o.status}</span>
              <div className="pg-muted pg-small">₹{Number(o.total).toFixed(0)} · {String(o.created_at).slice(0, 10)}</div>
            </div>
            <button className="pg-linkbtn" onClick={() => open(o.id)}>
              Details →
            </button>
          </div>
        ))}
        {orders.length === 0 && <p className="pg-muted">No orders here yet.</p>}
      </div>
      {detail && (
        <div className="pg-form pg-form-wide">
          <h3 className="pg-h3">Order #{detail.id} — {STATUS_LABEL[detail.status]}</h3>
          <p className="pg-muted pg-small">Subtotal ₹{Number(detail.subtotal).toFixed(0)} · Discount ₹{Number(detail.discount).toFixed(0)} · Total ₹{Number(detail.total).toFixed(0)}</p>
          <h4 className="pg-h4">Measurements used</h4>
          <p className="pg-muted pg-small">
            {Object.entries(detail.measurements || {}).map(([k, v]) => `${k} ${v.value} (${v.source})`).join(" · ")}
          </p>
          <h4 className="pg-h4">Timeline</h4>
          <ol className="pg-timeline">
            {(detail.history || []).map((h) => (
              <li key={h.id}>
                {h.from_status ? `${h.from_status} → ` : ""}{h.to_status}
                {h.note ? ` — ${h.note}` : ""}
              </li>
            ))}
          </ol>
          <div className="pg-row-actions">
            {!admin && ["REQUESTED", "CONFIRMED"].includes(detail.status) && (
              <Button variant="secondary" size="sm" onClick={() => post(`/orders/${detail.id}/cancel`, {}).then(() => { setDetail(null); load(); })}>
                Cancel order
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => setDetail(null)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentsTab() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ reason: "measurement", scheduled_at: "", notes: "" });
  const [error, setError] = useState("");
  async function load() {
    setList((await get("/appointments?limit=50")).data);
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    load().catch(() => setError("Could not load appointments."));
  }, []);
  async function book(e) {
    e.preventDefault();
    setError("");
    try {
      await post("/appointments", { ...form, scheduled_at: new Date(form.scheduled_at).toISOString() });
      setForm({ reason: "measurement", scheduled_at: "", notes: "" });
      load();
    } catch {
      setError("Pick a future date and time.");
    }
  }
  return (
    <div>
      <h3 className="pg-h3">Appointments</h3>
      <Err error={error} />
      <div className="pg-rows">
        {list.map((a) => (
          <div className="pg-row" key={a.id}>
            <div>
              <strong>{a.reason.replace("-", " ")}</strong> <span className="pg-flag">{a.status}</span>
              <div className="pg-muted pg-small">{String(a.scheduled_at).replace("T", " ").slice(0, 16)}</div>
            </div>
            {a.status === "REQUESTED" && (
              <button className="pg-linkbtn danger" onClick={() => patch(`/appointments/${a.id}/status`, { to: "CANCELLED" }).then(load)}>
                Cancel
              </button>
            )}
          </div>
        ))}
        {list.length === 0 && <p className="pg-muted">No visits booked yet.</p>}
      </div>
      <form className="pg-form pg-form-wide" onSubmit={book}>
        <h3 className="pg-h3">Book a visit</h3>
        <div className="pg-grid2">
          <div className="pg-field">
            <label htmlFor="ap-reason">Reason</label>
            <select id="ap-reason" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}>
              <option value="measurement">Measurement</option>
              <option value="fabric-drop">Fabric drop</option>
              <option value="design-discussion">Design discussion</option>
              <option value="trial">Trial</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>
          <div className="pg-field">
            <label htmlFor="ap-when">Date & time</label>
            <input id="ap-when" type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))} required />
          </div>
        </div>
        <Button variant="primary" size="sm" type="submit">
          Request visit
        </Button>
      </form>
    </div>
  );
}

const NEXT = {
  REQUESTED: ["CONFIRMED", "CANCELLED"], CONFIRMED: ["MEASUREMENT_PENDING", "CANCELLED"],
  MEASUREMENT_PENDING: ["MEASUREMENT_CONFIRMED", "CANCELLED"], MEASUREMENT_CONFIRMED: ["FABRIC_PENDING"],
  FABRIC_PENDING: ["CUTTING"], CUTTING: ["STITCHING"], STITCHING: ["TRIAL_READY"],
  TRIAL_READY: ["ALTERATION", "READY"], ALTERATION: ["READY", "CANCELLED"], READY: ["DELIVERED"],
};

function AdminTab() {
  const [sub, setSub] = useState("overview");
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [orderDetail, setOrderDetail] = useState(null);
  const [statusNote, setStatusNote] = useState("");
  const [appts, setAppts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [offer, setOffer] = useState({ title: "", description: "", discount_type: "percent", discount_value: 10, min_order: 0, first_order_only: false, is_active: true });
  const [customers, setCustomers] = useState([]);
  const [csearch, setCsearch] = useState("");
  const [customer, setCustomer] = useState(null);
  const [categories, setCategories] = useState([]);
  const [garments, setGarments] = useState([]);
  const [newGarment, setNewGarment] = useState({ category_id: "", name: "", description: "", base_price: 999, image_path: "" });
  const [newOption, setNewOption] = useState({ garment_id: "", type: "cloth", value: "", price_delta: 0, image_url: "" });
  const [newCategory, setNewCategory] = useState({ slug: "", name: "" });
  const [pay, setPay] = useState({ upi_id: "", upi_name: "", note: "", qr_image_url: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function refreshAll() {
    setErr("");
    try {
      const [s, o, a, of, c, g, p] = await Promise.all([
        get("/admin/summary"),
        get("/orders?limit=50"),
        get("/appointments?limit=50"),
        get("/admin/offers"),
        get("/categories"),
        get("/garments?limit=50"),
        get("/payment-info").catch(() => null),
      ]);
      setSummary(s);
      setOrders(o.data);
      setAppts(a.data);
      setOffers(of.data);
      setCategories(c.data);
      setGarments(g.data);
      if (p) setPay({ upi_id: p.upi_id || "", upi_name: p.upi_name || "", note: p.note || "", qr_image_url: p.qr_image_url || "" });
      if (c.data[0] && !newGarment.category_id) setNewGarment((v) => ({ ...v, category_id: c.data[0].id }));
    } catch {
      setErr("Admin data needs a fresh login — log out and back in as admin.");
    }
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial admin data load
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function searchCustomers(e) {
    e?.preventDefault?.();
    const d = await get(`/admin/customers?search=${encodeURIComponent(csearch)}&limit=20`);
    setCustomers(d.data);
  }

  async function openCustomer(id) {
    const d = await get(`/admin/customers/${id}`);
    setCustomer(d);
  }

  async function toggleCustomer(id, isActive) {
    await patch(`/admin/customers/${id}/active`, { is_active: !isActive });
    setCustomer(null);
    searchCustomers();
  }

  async function advance(id, to) {
    await patch(`/orders/${id}/status`, { to, note: statusNote || undefined });
    setStatusNote("");
    setOrderDetail(null);
    setOrders((await get("/orders?limit=50")).data);
  }

  async function openOrder(id) {
    setOrderDetail(await get(`/orders/${id}`));
  }

  async function createOffer(e) {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      await post("/offers", { ...offer, discount_value: Number(offer.discount_value), min_order: Number(offer.min_order || 0) });
      setOffer({ title: "", description: "", discount_type: "percent", discount_value: 10, min_order: 0, first_order_only: false, is_active: true });
      setOffers((await get("/admin/offers")).data);
      setMsg("Offer created.");
    } catch { setErr("Could not create offer — check title/value."); }
  }

  async function toggleOffer(o) {
    await put(`/offers/${o.id}`, { is_active: !o.is_active });
    setOffers((await get("/admin/offers")).data);
  }

  async function deleteOffer(id) {
    if (!window.confirm("Delete this offer? Used offers will be deactivated instead.")) return;
    await del(`/offers/${id}`);
    setOffers((await get("/admin/offers")).data);
  }

  async function createGarment(e) {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      await post("/garments/admin", { category_id: Number(newGarment.category_id), name: newGarment.name, description: newGarment.description, base_price: Number(newGarment.base_price), image_path: newGarment.image_path || undefined });
      setNewGarment((v) => ({ ...v, name: "", description: "", base_price: 999, image_path: "" }));
      setGarments((await get("/garments?limit=50")).data);
      setMsg("Garment added to catalog.");
    } catch { setErr("Could not add garment — check category/name/price."); }
  }

  async function toggleGarment(g) {
    await put(`/garments/admin/${g.id}`, { is_active: !g.is_active });
    setGarments((await get("/garments?limit=50")).data);
  }

  async function addOption(e) {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      await post(`/garments/admin/${newOption.garment_id}/options`, { type: newOption.type, value: newOption.value, price_delta: Number(newOption.price_delta || 0), image_url: newOption.image_url || undefined });
      setNewOption((v) => ({ ...v, value: "", price_delta: 0, image_url: "" }));
      setMsg("Option added — shows as cloth / neck / sleeve photo in Personalize.");
    } catch { setErr("Could not add option — value already exists or invalid type."); }
  }

  async function savePayment(e) {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      const updated = await put("/payment-info", { upi_id: pay.upi_id, upi_name: pay.upi_name, note: pay.note, qr_image_url: pay.qr_image_url });
      setPay({ upi_id: updated.upi_id || "", upi_name: updated.upi_name || "", note: updated.note || "", qr_image_url: updated.qr_image_url || "" });
      setMsg("UPI payment info updated — checkout shows it instantly.");
    } catch { setErr("Could not save UPI info — check the UPI ID format (name@bank)."); }
  }

  async function createCategory(e) {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      await post("/garments/admin/categories", { slug: newCategory.slug.trim().toLowerCase().replace(/\s+/g, "-"), name: newCategory.name, description: "" });
      setNewCategory({ slug: "", name: "" });
      setCategories((await get("/categories")).data);
      setMsg("Category created.");
    } catch { setErr("Could not create category — slug must be unique lowercase."); }
  }

  const subs = [["overview", "Overview"], ["orders", "Orders"], ["customers", "Customers"], ["catalog", "Catalog"], ["offers", "Offers"], ["payment", "UPI"], ["visits", "Visits"]];

  return (
    <div>
      {err && <p className="pg-error" role="alert">{err}</p>}
      {msg && <p className="pg-ok" role="status">{msg}</p>}
      <div className="pg-subtabs" role="tablist" aria-label="Admin sections">
        {subs.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={sub === id} className={`pg-subtab${sub === id ? " on" : ""}`} onClick={() => { setSub(id); setMsg(""); }}>
            {label}
          </button>
        ))}
      </div>

      {sub === "overview" && (
        <>
          <h3 className="pg-h3">Shop overview</h3>
          {summary ? (
            <div className="pg-cards">
              <div className="pg-stat"><strong>{summary.requested}</strong><span>new requests</span></div>
              <div className="pg-stat"><strong>{summary.inProgress}</strong><span>in progress</span></div>
              <div className="pg-stat"><strong>{summary.trialReady}</strong><span>trial ready</span></div>
              <div className="pg-stat"><strong>{summary.appointmentsToday}</strong><span>visits today</span></div>
              <div className="pg-stat"><strong>{summary.activeOffers}</strong><span>active offers</span></div>
            </div>
          ) : <p className="pg-muted">Loading summary…</p>}
          <div className="pg-cta-row">
            <Button variant="secondary" size="sm" onClick={() => setSub("orders")}>Review orders →</Button>
            <Button variant="secondary" size="sm" onClick={() => setSub("customers")}>Customers →</Button>
            <Button variant="secondary" size="sm" onClick={() => setSub("catalog")}>Catalog →</Button>
          </div>
        </>
      )}

      {sub === "orders" && (
        <>
          <h3 className="pg-h3">All orders — tap to manage status</h3>
          <div className="pg-rows">
            {orders.map((o) => (
              <div className="pg-row" key={o.id}>
                <div>
                  <strong>#{o.id}</strong> <span className="pg-flag">{STATUS_LABEL[o.status] || o.status}</span>
                  <div className="pg-muted pg-small">₹{Number(o.total).toFixed(0)} · {String(o.created_at).slice(0, 10)}</div>
                </div>
                <button className="pg-linkbtn" onClick={() => openOrder(o.id)}>Manage →</button>
              </div>
            ))}
            {orders.length === 0 && <p className="pg-muted">No orders yet.</p>}
          </div>
          {orderDetail && (
            <div className="pg-form pg-form-wide">
              <h3 className="pg-h3">Order #{orderDetail.id} — {STATUS_LABEL[orderDetail.status]}</h3>
              <p className="pg-muted pg-small">Subtotal ₹{Number(orderDetail.subtotal).toFixed(0)} · Discount ₹{Number(orderDetail.discount).toFixed(0)} · Total ₹{Number(orderDetail.total).toFixed(0)}</p>
              <p className="pg-muted pg-small">{Object.entries(orderDetail.measurements || {}).map(([k, v]) => `${k} ${v.value} (${v.source})`).join(" · ")}</p>
              <ol className="pg-timeline">
                {(orderDetail.history || []).map((h) => (
                  <li key={h.id}>{h.from_status ? `${h.from_status} → ` : ""}{h.to_status}{h.note ? ` — ${h.note}` : ""}</li>
                ))}
              </ol>
              <div className="pg-field">
                <label htmlFor="admin-note">Status note (optional)</label>
                <input id="admin-note" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="e.g. Called customer, fabric arrived" maxLength={500} />
              </div>
              <div className="pg-row-actions">
                {(NEXT[orderDetail.status] || []).map((s) => (
                  <Button key={s} variant="primary" size="sm" onClick={() => advance(orderDetail.id, s)}>→ {STATUS_LABEL[s]}</Button>
                ))}
                <Button variant="secondary" size="sm" onClick={() => setOrderDetail(null)}>Close</Button>
              </div>
            </div>
          )}
        </>
      )}

      {sub === "customers" && (
        <>
          <h3 className="pg-h3">Customers</h3>
          <form className="pg-toolbar" onSubmit={searchCustomers}>
            <input className="pg-search" placeholder="Search name, phone, email…" value={csearch} onChange={(e) => setCsearch(e.target.value)} aria-label="Search customers" />
            <Button variant="primary" size="sm" type="submit">Search</Button>
          </form>
          <div className="pg-rows">
            {customers.map((u) => (
              <div className="pg-row" key={u.id}>
                <div>
                  <strong>{u.name}</strong> <span className="pg-muted pg-small">{u.phone}{u.email ? ` · ${u.email}` : ""}</span>
                  {!u.is_active && <span className="pg-flag">disabled</span>}
                </div>
                <button className="pg-linkbtn" onClick={() => openCustomer(u.id)}>Details →</button>
              </div>
            ))}
            {customers.length === 0 && <p className="pg-muted">Search to list customers.</p>}
          </div>
          {customer && (
            <div className="pg-form pg-form-wide">
              <h3 className="pg-h3">{customer.user.name} — {customer.user.phone}</h3>
              <p className="pg-muted pg-small">{customer.user.email || "no email"} · {customer.user.is_active ? "active" : "disabled"} · {customer.orders?.length || 0} orders</p>
              <div className="pg-row-actions">
                <Button variant="secondary" size="sm" onClick={() => toggleCustomer(customer.user.id, customer.user.is_active)}>
                  {customer.user.is_active ? "Disable" : "Enable"}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setCustomer(null)}>Close</Button>
              </div>
            </div>
          )}
        </>
      )}

      {sub === "catalog" && (
        <>
          <h3 className="pg-h3">Catalog — {garments.length} styles</h3>
          <div className="pg-rows">
            {garments.map((g) => (
              <div className="pg-row" key={g.id}>
                <div>
                  <strong>{g.name}</strong> <span className="pg-muted pg-small">{g.category_name} · ₹{Number(g.base_price).toFixed(0)}</span>
                </div>
                <button className="pg-linkbtn" onClick={() => { setNewOption((v) => ({ ...v, garment_id: g.id })); }}>
                  + option
                </button>
              </div>
            ))}
          </div>
          <form className="pg-form pg-form-wide" onSubmit={createGarment}>
            <h3 className="pg-h3">New garment</h3>
            <div className="pg-grid2">
              <div className="pg-field">
                <label htmlFor="cat-id">Category</label>
                <select id="cat-id" value={newGarment.category_id} onChange={(e) => setNewGarment((v) => ({ ...v, category_id: e.target.value }))}>
                  {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
              <div className="pg-field">
                <label htmlFor="g-price">Base price ₹</label>
                <input id="g-price" type="number" min="0" value={newGarment.base_price} onChange={(e) => setNewGarment((v) => ({ ...v, base_price: e.target.value }))} required />
              </div>
            </div>
            <div className="pg-field">
              <label htmlFor="g-name">Name</label>
              <input id="g-name" value={newGarment.name} onChange={(e) => setNewGarment((v) => ({ ...v, name: e.target.value }))} required maxLength={150} />
            </div>
            <div className="pg-field">
              <label htmlFor="g-desc">Description</label>
              <input id="g-desc" value={newGarment.description} onChange={(e) => setNewGarment((v) => ({ ...v, description: e.target.value }))} maxLength={1000} />
            </div>
            <div className="pg-field">
              <label htmlFor="g-img">Photo URL (cloth pic shown in Shop & Personalize)</label>
              <input id="g-img" value={newGarment.image_path} onChange={(e) => setNewGarment((v) => ({ ...v, image_path: e.target.value }))} maxLength={500} placeholder="https://…/kurti.jpg (optional)" />
            </div>
            <Button variant="primary" size="sm" type="submit">Add garment</Button>
          </form>
          <form className="pg-form pg-form-wide" onSubmit={addOption}>
            <h3 className="pg-h3">Add option — cloth / neck front-back / sleeves (photos by you)</h3>
            <p className="pg-muted pg-small">Use <strong>cloth</strong> for fabric photos, <strong>neck_front / neck_back</strong> for neckline designs, <strong>sleeve</strong> for sleeves. Image URL shows as a card in Personalize.</p>
            <div className="pg-grid2">
              <div className="pg-field">
                <label htmlFor="opt-g">Garment</label>
                <select id="opt-g" value={newOption.garment_id} onChange={(e) => setNewOption((v) => ({ ...v, garment_id: e.target.value }))} required>
                  <option value="">Select…</option>
                  {garments.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
                </select>
              </div>
              <div className="pg-field">
                <label htmlFor="opt-t">Type</label>
                <select id="opt-t" value={newOption.type} onChange={(e) => setNewOption((v) => ({ ...v, type: e.target.value }))}>
                  {["cloth", "fabric", "color", "neck", "neck_front", "neck_back", "sleeve", "length", "fit", "embroidery", "occasion", "style", "footwear"].map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
            </div>
            <div className="pg-grid2">
              <div className="pg-field">
                <label htmlFor="opt-v">Value</label>
                <input id="opt-v" value={newOption.value} onChange={(e) => setNewOption((v) => ({ ...v, value: e.target.value }))} required maxLength={100} placeholder="e.g. Boat Front, Silk, Ankle" />
              </div>
              <div className="pg-field">
                <label htmlFor="opt-p">Extra ₹</label>
                <input id="opt-p" type="number" min="0" value={newOption.price_delta} onChange={(e) => setNewOption((v) => ({ ...v, price_delta: e.target.value }))} />
              </div>
            </div>
            <div className="pg-field">
              <label htmlFor="opt-img">Design photo URL (optional)</label>
              <input id="opt-img" value={newOption.image_url} onChange={(e) => setNewOption((v) => ({ ...v, image_url: e.target.value }))} maxLength={500} placeholder="https://…/neck-design.jpg" />
            </div>
            <Button variant="primary" size="sm" type="submit">Add option</Button>
          </form>
          <form className="pg-form pg-form-wide" onSubmit={createCategory}>
            <h3 className="pg-h3">New category</h3>
            <div className="pg-grid2">
              <div className="pg-field">
                <label htmlFor="c-slug">Slug (lowercase)</label>
                <input id="c-slug" value={newCategory.slug} onChange={(e) => setNewCategory((v) => ({ ...v, slug: e.target.value }))} required maxLength={50} placeholder="e.g. festive-gown" />
              </div>
              <div className="pg-field">
                <label htmlFor="c-name">Name</label>
                <input id="c-name" value={newCategory.name} onChange={(e) => setNewCategory((v) => ({ ...v, name: e.target.value }))} required maxLength={100} />
              </div>
            </div>
            <Button variant="secondary" size="sm" type="submit">Create category</Button>
          </form>
          <h3 className="pg-h3">Deactivate style</h3>
          <div className="pg-rows">
            {garments.slice(0, 10).map((g) => (
              <div className="pg-row" key={g.id}>
                <div><strong>{g.name}</strong></div>
                <button className="pg-linkbtn danger" onClick={() => toggleGarment(g)}>Toggle active</button>
              </div>
            ))}
          </div>
        </>
      )}

      {sub === "offers" && (
        <>
          <h3 className="pg-h3">Offers</h3>
          <div className="pg-rows">
            {offers.map((o) => (
              <div className="pg-row" key={o.id}>
                <div>
                  <strong>{o.title}</strong>
                  <div className="pg-muted pg-small">{o.discount_type} {o.discount_value} · min ₹{Number(o.min_order || 0).toFixed(0)}{o.first_order_only ? " · first order" : ""} · {o.is_active ? "active" : "off"}</div>
                </div>
                <div className="pg-row-actions">
                  <button className="pg-linkbtn" onClick={() => toggleOffer(o)}>{o.is_active ? "Deactivate" : "Activate"}</button>
                  <button className="pg-linkbtn danger" onClick={() => deleteOffer(o.id)}>Delete</button>
                </div>
              </div>
            ))}
            {offers.length === 0 && <p className="pg-muted">No offers yet.</p>}
          </div>
          <form className="pg-form pg-form-wide" onSubmit={createOffer}>
            <h3 className="pg-h3">New offer</h3>
            <div className="pg-field">
              <label htmlFor="of-title">Title</label>
              <input id="of-title" value={offer.title} onChange={(e) => setOffer((o) => ({ ...o, title: e.target.value }))} required maxLength={150} />
            </div>
            <div className="pg-field">
              <label htmlFor="of-desc">Description</label>
              <input id="of-desc" value={offer.description} onChange={(e) => setOffer((o) => ({ ...o, description: e.target.value }))} maxLength={1000} />
            </div>
            <div className="pg-grid2">
              <div className="pg-field">
                <label htmlFor="of-type">Type</label>
                <select id="of-type" value={offer.discount_type} onChange={(e) => setOffer((o) => ({ ...o, discount_type: e.target.value }))}>
                  <option value="percent">Percent %</option>
                  <option value="flat">Flat ₹</option>
                </select>
              </div>
              <div className="pg-field">
                <label htmlFor="of-val">Value</label>
                <input id="of-val" type="number" min="0" value={offer.discount_value} onChange={(e) => setOffer((o) => ({ ...o, discount_value: e.target.value }))} required />
              </div>
            </div>
            <div className="pg-grid2">
              <div className="pg-field">
                <label htmlFor="of-min">Min order ₹</label>
                <input id="of-min" type="number" min="0" value={offer.min_order} onChange={(e) => setOffer((o) => ({ ...o, min_order: e.target.value }))} />
              </div>
              <div className="pg-field">
                <label htmlFor="of-first">First order only?</label>
                <select id="of-first" value={offer.first_order_only ? "yes" : "no"} onChange={(e) => setOffer((o) => ({ ...o, first_order_only: e.target.value === "yes" }))}>
                  <option value="no">No — everyone</option>
                  <option value="yes">Yes — new customers</option>
                </select>
              </div>
            </div>
            <Button variant="primary" size="sm" type="submit">Create offer</Button>
          </form>
          <p className="pg-muted pg-small">Tip: name festival offers clearly — “Diwali Dhamaka — 15% off” shows on the homepage strip automatically.</p>
        </>
      )}

      {sub === "payment" && (
        <>
          <h3 className="pg-h3">UPI — direct payments, zero fees</h3>
          <p className="pg-muted">Customers see this UPI ID + QR at checkout and send UTR + screenshot. No gateway needed.</p>
          <form className="pg-form pg-form-wide" onSubmit={savePayment}>
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
              <input id="pay-note" value={pay.note} onChange={(e) => setPay((p) => ({ ...p, note: e.target.value }))} maxLength={500} placeholder="Pay via any UPI app, add Order ID in note…" />
            </div>
            <div className="pg-field">
              <label htmlFor="pay-qr">Custom QR image URL (optional — auto-generated if empty)</label>
              <input id="pay-qr" value={pay.qr_image_url} onChange={(e) => setPay((p) => ({ ...p, qr_image_url: e.target.value }))} maxLength={500} placeholder="https://…/qr.png" />
            </div>
            <Button variant="primary" size="sm" type="submit">Save UPI info</Button>
          </form>
        </>
      )}

      {sub === "visits" && (
        <>
          <h3 className="pg-h3">Visits / appointments</h3>
          <div className="pg-rows">
            {appts.map((a) => (
              <div className="pg-row" key={a.id}>
                <div>
                  <strong>{a.reason.replace("-", " ")}</strong> <span className="pg-flag">{a.status}</span>
                  <div className="pg-muted pg-small">{String(a.scheduled_at).replace("T", " ").slice(0, 16)}</div>
                </div>
                <div className="pg-row-actions">
                  {a.status === "REQUESTED" && (
                    <button className="pg-linkbtn" onClick={() => patch(`/appointments/${a.id}/status`, { to: "CONFIRMED" }).then(() => get("/appointments?limit=50").then((d) => setAppts(d.data)))}>
                      Confirm
                    </button>
                  )}
                  {!["COMPLETED", "CANCELLED"].includes(a.status) && (
                    <button className="pg-linkbtn" onClick={() => patch(`/appointments/${a.id}/status`, { to: "COMPLETED" }).then(() => get("/appointments?limit=50").then((d) => setAppts(d.data)))}>
                      Complete
                    </button>
                  )}
                  {!["COMPLETED", "CANCELLED"].includes(a.status) && (
                    <button className="pg-linkbtn danger" onClick={() => patch(`/appointments/${a.id}/status`, { to: "CANCELLED" }).then(() => get("/appointments?limit=50").then((d) => setAppts(d.data)))}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
            {appts.length === 0 && <p className="pg-muted">No visits booked.</p>}
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(() => params.get("tab") || "");

  useEffect(() => {
    const t = params.get("tab");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync tab from URL on navigation
    if (t) setTab(t);
    else if (!tab) setTab(user?.role === "admin" ? "admin" : "measurements");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, user]);

  if (loading) {
    return (
      <PageShell>
        <section className="dt-section">
          <div className="dt-container">
            <p>Loading…</p>
          </div>
        </section>
      </PageShell>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  const tabs = [
    ["measurements", "Measurements"],
    ["designs", "Designs"],
    ["orders", "Orders"],
    ["appointments", "Visits"],
  ];
  if (user.role === "admin") tabs.push(["admin", "Shop"]);

  return (
    <PageShell>
      <section className="dt-section">
        <div className="dt-container">
          <div className="pg-dash-head">
            <div>
              <p className="dt-eyebrow">Dashboard</p>
              <h2 className="dt-h2">
                Namaste, <em>{user.name}.</em>
              </h2>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Log out
            </Button>
          </div>
          <div className="pg-tabs" role="tablist" aria-label="Dashboard sections">
            {tabs.map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                className={`pg-tab${tab === id ? " on" : ""}`}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
          {tab === "measurements" && <MeasurementsTab />}
          {tab === "designs" && <DesignsTab />}
          {tab === "orders" && <OrdersTab admin={user.role === "admin"} />}
          {tab === "appointments" && <AppointmentsTab />}
          {tab === "admin" && user.role === "admin" && <AdminTab />}
        </div>
      </section>
    </PageShell>
  );
}
