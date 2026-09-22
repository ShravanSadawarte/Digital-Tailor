import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { del, get, put } from "../api/client";
import { useAuth } from "../auth/useAuth";
import { useWishlist } from "../cart/CartContext";
import Button from "../components/Button";
import SectionHeading from "../components/SectionHeading";
import PageShell from "./PageShell";

// Full profile: account, address, stats, orders, designs, measurements shortcut,
// visits, wishlist — everything a customer needs in one place.
export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { wishlist } = useWishlist();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [measures, setMeasures] = useState([]);
  const [visits, setVisits] = useState([]);
  const [edit, setEdit] = useState({ name: "", address: "", city: "", notes: "" });
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) return;
    get("/customers/profile").then((d) => {
      setProfile(d.profile);
      setEdit({ name: user.name || "", address: d.profile?.address || "", city: d.profile?.city || "", notes: d.profile?.notes || "" });
    }).catch(() => {});
    get("/orders?limit=10").then((d) => setOrders(d.data || [])).catch(() => {});
    get("/designs?limit=10").then((d) => setDesigns(d.data || d.rows || [])).catch(() => {});
    get("/measurements").then((d) => setMeasures(d.data || [])).catch(() => {});
    get("/appointments?limit=10").then((d) => setVisits(d.data || [])).catch(() => {});
  }, [user]);

  if (loading) return <PageShell><section className="dt-section"><div className="dt-container"><p>Loading…</p></div></section></PageShell>;
  if (!user) return <Navigate to="/login" replace />;

  async function saveProfile(e) {
    e.preventDefault();
    setErr(""); setMsg("");
    try {
      const d = await put("/customers/profile", {
        name: edit.name || undefined, address: edit.address || null, city: edit.city || null, notes: edit.notes || null,
      });
      setProfile(d.profile);
      setMsg("Profile saved ✓");
      setEditing(false);
    } catch {
      setErr("Could not save profile.");
    }
  }

  return (
    <PageShell>
      <section className="dt-section">
        <div className="dt-container profile-grid">
          <div>
            <SectionHeading eyebrow="Profile" title={<>Namaste, <em>{user.name?.split(" ")[0]}.</em></>} sub={`${user.phone}${user.email ? ` · ${user.email}` : ""} · ${user.role}`} align="left" />
            {msg && <p className="pg-ok" role="status">{msg}</p>}
            {err && <p className="pg-error" role="alert">{err}</p>}

            <div className="pg-cards profile-stats">
              <div className="pg-stat"><strong>{orders.length}</strong><span>orders</span></div>
              <div className="pg-stat"><strong>{designs.length}</strong><span>designs</span></div>
              <div className="pg-stat"><strong>{measures.length}</strong><span>size profiles</span></div>
              <div className="pg-stat"><strong>{wishlist.length}</strong><span>wishlist</span></div>
            </div>

            <div className="pg-form pg-form-wide">
              <h3 className="pg-h3">Account & address</h3>
              {!editing ? (
                <>
                  <p><strong>{profile?.name || user.name}</strong></p>
                  <p className="pg-muted pg-small">{profile?.address || "No address yet"} {profile?.city ? `· ${profile.city}` : ""}</p>
                  {profile?.notes && <p className="pg-muted pg-small">Note: {profile.notes}</p>}
                  <div className="pg-detail-actions">
                    <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit profile</Button>
                    <Button variant="secondary" size="sm" to="/dashboard">Measurements →</Button>
                  </div>
                </>
              ) : (
                <form onSubmit={saveProfile}>
                  <div className="pg-grid2">
                    <div className="pg-field"><label htmlFor="pf-name">Full name</label><input id="pf-name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} required /></div>
                    <div className="pg-field"><label htmlFor="pf-city">City</label><input id="pf-city" value={edit.city} onChange={(e) => setEdit({ ...edit, city: e.target.value })} placeholder="Nagpur" /></div>
                  </div>
                  <div className="pg-field"><label htmlFor="pf-addr">Address</label><input id="pf-addr" value={edit.address} onChange={(e) => setEdit({ ...edit, address: e.target.value })} placeholder="House no, street, area" /></div>
                  <div className="pg-field"><label htmlFor="pf-notes">Delivery / fitting notes</label><input id="pf-notes" value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} placeholder="e.g. Call before visit" /></div>
                  <div className="pg-detail-actions">
                    <Button variant="primary" size="sm" type="submit">Save</Button>
                    <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </form>
              )}
            </div>

            <div className="pg-form pg-form-wide">
              <h3 className="pg-h3">Recent orders</h3>
              <div className="pg-rows">
                {orders.slice(0, 5).map((o) => (
                  <div className="pg-row" key={o.id}>
                    <div><strong>Order #{o.id}</strong> <span className="pg-flag">{o.status}</span><div className="pg-muted pg-small">₹{Number(o.total).toFixed(0)} · {String(o.created_at).slice(0, 10)}</div></div>
                  </div>
                ))}
                {orders.length === 0 && <p className="pg-muted">No orders yet — <Button variant="secondary" size="sm" to="/#shop">start shopping</Button></p>}
              </div>
              <div className="pg-detail-actions">
                <Button variant="secondary" size="sm" to="/dashboard">All orders →</Button>
                <Button variant="secondary" size="sm" to="/cart">Bag →</Button>
              </div>
            </div>
          </div>

          <aside className="profile-side">
            <div className="pg-panel">
              <h3>Quick links</h3>
              <div className="profile-links">
                <Button variant="secondary" size="sm" to="/#shop">🛍 Shop</Button>
                <Button variant="secondary" size="sm" to="/customize">✦ Personalize</Button>
                <Button variant="secondary" size="sm" to="/cart">Bag</Button>
                <Button variant="secondary" size="sm" to="/dashboard">Dashboard</Button>
                <Button variant="secondary" size="sm" onClick={() => { logout(); navigate("/"); }}>Log out</Button>
              </div>
            </div>
            <div className="pg-panel">
              <h3>My designs ({designs.length})</h3>
              {designs.slice(0, 4).map((d) => (
                <p key={d.id} className="pg-muted pg-small">♥ {d.title}</p>
              ))}
              {designs.length === 0 && <p className="pg-muted pg-small">None yet — personalize one!</p>}
            </div>
            <div className="pg-panel">
              <h3>Wishlist ({wishlist.length})</h3>
              {wishlist.slice(0, 4).map((w) => (
                <p key={w.id} className="pg-muted pg-small">♡ {w.name} · ₹{Number(w.base_price).toFixed(0)}</p>
              ))}
              {wishlist.length === 0 && <p className="pg-muted pg-small">Tap ♡ on any shop piece.</p>}
            </div>
            <div className="pg-panel">
              <h3>Visits ({visits.length})</h3>
              {visits.slice(0, 3).map((v) => (
                <p key={v.id} className="pg-muted pg-small">{v.reason} · {String(v.scheduled_at).slice(0, 10)} · {v.status}</p>
              ))}
              {visits.length === 0 && <p className="pg-muted pg-small">No visits booked.</p>}
            </div>
            <div className="pg-panel">
              <h3>Size profiles ({measures.length})</h3>
              {measures.map((m) => (
                <p key={m.id} className="pg-muted pg-small">
                  {m.name} {m.is_default ? "· default" : ""}
                  <button className="pg-linkbtn danger" style={{ marginLeft: 8 }} onClick={() => del(`/measurements/${m.id}`).then(() => setMeasures((p) => p.filter((x) => x.id !== m.id)))}>delete</button>
                </p>
              ))}
              {measures.length === 0 && <p className="pg-muted pg-small">None — add one in Dashboard.</p>}
            </div>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}
