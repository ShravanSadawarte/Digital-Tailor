import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get, post } from "../api/client";
import { uploadRef } from "../api/uploads";
import { useAuth } from "../auth/useAuth";
import { useCart } from "../cart/CartContext";
import Button from "../components/Button";
import MeasurementOnboarding from "../components/MeasurementOnboarding";
import UpiPayment from "../components/UpiPayment";
import SectionHeading from "../components/SectionHeading";
import PageShell from "./PageShell";

// Bag → measurements (add now or later) → UPI pay → orders.
// If the user skipped measurements after login, they land here and can add them
// inline without leaving the cart.
export default function CartPage() {
  const { user } = useAuth();
  const { items, removeFromCart, updateQty, clearCart, cartValue } = useCart();
  const [profiles, setProfiles] = useState([]);
  const [profileId, setProfileId] = useState("");
  const [offers, setOffers] = useState([]);
  const [offerId, setOfferId] = useState("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState("bag"); // bag | measure | pay | done
  const [utr, setUtr] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState([]);

  useEffect(() => {
    if (!user) return;
    get("/measurements").then((d) => {
      setProfiles(d.data || []);
      const def = (d.data || []).find((x) => x.is_default) || (d.data || [])[0];
      if (def) setProfileId(String(def.id));
    }).catch(() => {});
    get("/offers").then((d) => setOffers(d.data || [])).catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <PageShell>
        <section className="dt-section"><div className="dt-container">
          <SectionHeading eyebrow="Bag" title={<>Your bag is waiting. <em>Log in first.</em></>} align="left" />
          <Button variant="primary" to="/login">Log in →</Button>
        </div></section>
      </PageShell>
    );
  }

  async function ensureDesign(item) {
    if (item.design_id) return item.design_id;
    // Quick-add items become minimal designs so tailoring has a record.
    const d = await post("/designs", {
      garment_id: item.garment_id,
      title: (item.title || item.garment_name || "Custom order").slice(0, 150),
      fabric_source: "shop",
      ...(item.sel?.color ? { color: item.sel.color } : {}),
      ...(item.sel?.neck ? { neck: item.sel.neck } : {}),
      ...(item.sel?.neck_front ? { neck_front: item.sel.neck_front } : {}),
      ...(item.sel?.neck_back ? { neck_back: item.sel.neck_back } : {}),
      ...(item.sel?.sleeve ? { sleeve: item.sel.sleeve } : {}),
      ...(item.sel?.cloth ? { cloth: item.sel.cloth } : {}),
    });
    return d.id;
  }

  async function placeOrders(paidUtr, screenshot) {
    setBusy(true);
    setError("");
    try {
      if (!profileId) throw new Error("measurement");
      const results = [];
      for (const item of items) {
        const designId = await ensureDesign(item);
        const qty = item.qty || 1;
        for (let i = 0; i < qty; i++) {
          const res = await post("/orders", {
            design_id: designId,
            measurement_profile_id: Number(profileId),
            offer_id: offerId ? Number(offerId) : undefined,
            notes: [`UTR ${paidUtr}`, notes].filter(Boolean).join(" · ").slice(0, 1000) || undefined,
          });
          results.push(res.order);
        }
      }
      if (screenshot && results[0]) {
        try { await uploadRef({ file: screenshot, order_id: results[0].id }); } catch { /* proof optional */ }
      }
      setPlaced(results);
      clearCart();
      setStep("done");
    } catch (e) {
      if (e.message === "measurement") setError("Add a measurement profile below first (or Skip → add here).");
      else if (e.code?.startsWith?.("OFFER")) setError("That offer can't be applied — try another.");
      else setError("Could not place order — check measurements & try again.");
    } finally {
      setBusy(false);
    }
  }

  const total = cartValue;

  return (
    <PageShell>
      <section className="dt-section">
        <div className="dt-container">
          <SectionHeading eyebrow="Bag & checkout" title={<>Your bag, <em>your fit.</em></>} sub="Measurements can be added right here — no need to go back." align="left" />
          {error && <p className="pg-error" role="alert">{error}</p>}

          {step !== "done" && items.length === 0 && (
            <div className="pg-panel pg-empty">
              <h3>Bag is empty</h3>
              <p className="pg-muted">Father's fresh pieces are waiting in the shop.</p>
              <div className="pg-detail-actions" style={{ justifyContent: "center" }}>
                <Button variant="primary" size="sm" to="/#shop">Open shop →</Button>
                <Button variant="secondary" size="sm" to="/customize">Personalize ✦</Button>
              </div>
            </div>
          )}

          {items.length > 0 && step === "bag" && (
            <>
              <div className="pg-rows">
                {items.map((it) => (
                  <div className="pg-row" key={it.key}>
                    <div>
                      <strong>{it.title || it.garment_name}</strong>
                      <div className="pg-muted pg-small">
                        ₹{Number(it.estimate || it.base_price).toFixed(0)} × {it.qty || 1}
                        {it.sel ? ` · ${[it.sel.cloth, it.sel.neck_front || it.sel.neck, it.sel.sleeve].filter(Boolean).join(" · ")}` : ""}
                      </div>
                    </div>
                    <div className="pg-row-actions">
                      <button className="pg-linkbtn" onClick={() => updateQty(it.key, (it.qty || 1) - 1)} disabled={(it.qty || 1) <= 1}>−</button>
                      <span>{it.qty || 1}</span>
                      <button className="pg-linkbtn" onClick={() => updateQty(it.key, (it.qty || 1) + 1)}>+</button>
                      <button className="pg-linkbtn danger" onClick={() => removeFromCart(it.key)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-total">
                <strong>Total ≈ ₹{total.toFixed(0)}</strong>
                <span className="pg-muted pg-small">Stitching calculated at order time · offers apply next</span>
              </div>
              <div className="pg-grid2" style={{ marginTop: 16 }}>
                <div className="pg-field">
                  <label htmlFor="cart-offer">Festival offer (optional)</label>
                  <select id="cart-offer" value={offerId} onChange={(e) => setOfferId(e.target.value)}>
                    <option value="">No offer</option>
                    {offers.map((o) => (
                      <option key={o.id} value={o.id}>{o.title}</option>
                    ))}
                  </select>
                </div>
                <div className="pg-field">
                  <label htmlFor="cart-notes">Note for tailor (optional)</label>
                  <input id="cart-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Need before Diwali" maxLength={1000} />
                </div>
              </div>
              <div className="pg-detail-actions">
                <Button variant="primary" size="sm" onClick={() => setStep(profiles.length ? "pay" : "measure")}>
                  Continue → {profiles.length ? "Pay via UPI" : "Measurements"}
                </Button>
                <Button variant="secondary" size="sm" to="/#shop">＋ Add more</Button>
              </div>
            </>
          )}

          {step === "measure" && (
            <div style={{ marginTop: 18 }}>
              <h3 className="pg-h3">Measurements — add now, skip never blocks you later</h3>
              {profiles.length > 0 ? (
                <div className="pg-form pg-form-wide">
                  <div className="pg-field">
                    <label htmlFor="cart-prof">Use measurement profile</label>
                    <select id="cart-prof" value={profileId} onChange={(e) => setProfileId(e.target.value)}>
                      {profiles.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                  </div>
                  <div className="pg-detail-actions">
                    <Button variant="primary" size="sm" onClick={() => setStep("pay")}>Continue to UPI pay →</Button>
                    <Button variant="secondary" size="sm" onClick={() => setStep("bag")}>← Back to bag</Button>
                  </div>
                </div>
              ) : (
                <MeasurementOnboarding
                  compact
                  onSaved={(s) => { setProfiles([s]); setProfileId(String(s.id)); setStep("pay"); }}
                  onSkip={() => setError("Measurements are needed for stitching — add one below to continue. (Skip only hides the popup after login.)")}
                />
              )}
            </div>
          )}

          {step === "pay" && items.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div className="pg-form pg-form-wide">
                <div className="pg-field">
                  <label htmlFor="pay-prof">Stitch to measurements</label>
                  <select id="pay-prof" value={profileId} onChange={(e) => setProfileId(e.target.value)}>
                    {profiles.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                  </select>
                </div>
              </div>
              <UpiPayment
                amount={total}
                onDone={async ({ utr: u, screenshot }) => {
                  setUtr(u);
                  setProofFile(screenshot);
                  await placeOrders(u, screenshot);
                }}
              />
              <div className="pg-detail-actions">
                <Button variant="secondary" size="sm" onClick={() => setStep("bag")}>← Back</Button>
              </div>
              {busy && <p className="pg-muted">Placing your orders…</p>}
            </div>
          )}

          {step === "done" && (
            <div className="pg-panel" style={{ marginTop: 18 }}>
              <h3>Order placed ✓ — UTR {utr}</h3>
              <p className="pg-muted">
                {placed.length} order(s) · Total ₹{placed.reduce((s, o) => s + Number(o.total || 0), 0).toFixed(0)}.
                {proofFile ? " Screenshot attached." : ""} Track in Profile → Orders.
              </p>
              <div className="pg-detail-actions">
                <Button variant="primary" size="sm" to="/profile">Track in Profile →</Button>
                <Button variant="secondary" size="sm" to="/#shop">Continue shopping</Button>
              </div>
            </div>
          )}

          <p className="pg-muted pg-small" style={{ marginTop: 16 }}>
            <Link to="/dashboard">Advanced: Dashboard →</Link> · <Link to="/profile">Profile →</Link>
          </p>
        </div>
      </section>
    </PageShell>
  );
}
