import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { get, post } from "../api/client";
import { uploadRef } from "../api/uploads";
import { useAuth } from "../auth/useAuth";
import { useCart } from "../cart/CartContext";
import Button from "../components/Button";
import SectionHeading from "../components/SectionHeading";
import PageShell from "./PageShell";

const FALLBACKS = {
  cloth: ["Emerald Cotton", "Royal Silk", "Blush Georgette", "Festive Velvet", "Soft Chanderi"],
  neck_front: ["Round Front", "V Front", "Boat Front", "Sweetheart Front", "Square Front"],
  neck_back: ["Round Back", "V Back", "Boat Back", "Keyhole Back", "Deep Back"],
  sleeve: ["Sleeveless", "Short", "3-4 Sleeve", "Full", "Puff"],
};

function OptionGrid({ options, value, onPick, fallback, type }) {
  const list = options?.length ? options : (fallback || []).map((v) => ({ option_value: v, price_delta: 0 }));
  return (
    <div className="custom-grid">
      {list.map((o) => (
        <button
          key={o.option_value}
          type="button"
          className={`custom-card${value === o.option_value ? " on" : ""}`}
          onClick={() => onPick(o.option_value)}
        >
          {o.image_url ? (
            <img src={o.image_url} alt={o.option_value} loading="lazy" />
          ) : (
            <span className={`custom-art custom-${type}`} aria-hidden="true">{o.option_value[0]}</span>
          )}
          <strong>{o.option_value}</strong>
          {Number(o.price_delta) > 0 && <small>+₹{Number(o.price_delta).toFixed(0)}</small>}
        </button>
      ))}
    </div>
  );
}

// Personalized dress: cloth pic (admin) → neck front (admin) → neck back (admin)
// → sleeves (admin) → extras + your own reference photo (google/screenshot).
const STEPS = ["Cloth", "Neck · front", "Neck · back", "Sleeves", "Extras & photo"];

export default function CustomizePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [garments, setGarments] = useState([]);
  const [garmentId, setGarmentId] = useState(params.get("garment") || "");
  const [detail, setDetail] = useState(null);
  const [step, setStep] = useState(0);
  const [sel, setSel] = useState({});
  const [title, setTitle] = useState("My festive dress");
  const [extra, setExtra] = useState("");
  const [refFile, setRefFile] = useState(null);
  const [refPreview, setRefPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(null);

  function onRefChange(f) {
    if (refPreview) URL.revokeObjectURL(refPreview);
    setRefFile(f);
    setRefPreview(f ? URL.createObjectURL(f) : "");
  }

  useEffect(() => {
    get("/garments?limit=50").then((d) => {
      setGarments(d.data || []);
      if (!garmentId && d.data?.[0]) setGarmentId(String(d.data[0].id));
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!garmentId) return;
    get(`/garments/${garmentId}`).then(setDetail).catch(() => setDetail(null));
  }, [garmentId]);

  const groups = useMemo(() => {
    const g = {};
    for (const o of detail?.options || []) (g[o.option_type] ||= []).push(o);
    return g;
  }, [detail]);

  const estimate = useMemo(() => {
    if (!detail) return 0;
    let t = Number(detail.base_price || 0);
    for (const [type, val] of Object.entries(sel)) {
      const opt = Object.values(groups).flat().find((o) => o.option_type === type && o.option_value === val);
      if (opt) t += Number(opt.price_delta || 0);
    }
    return t;
  }, [detail, groups, sel]);

  const pick = (type) => (val) => setSel((s) => ({ ...s, [type]: val }));

  async function saveAndBag() {
    setError("");
    if (!user) { navigate("/login"); return; }
    if (!garmentId) { setError("Pick a base silhouette first."); return; }
    setSaving(true);
    try {
      const body = {
        garment_id: Number(garmentId),
        title: title.trim() || "My personalized dress",
        fabric_source: "shop",
        fabric_detail: sel.cloth ? `Cloth: ${sel.cloth}` : undefined,
        cloth: sel.cloth,
        neck: sel.neck_front || sel.neck,
        neck_front: sel.neck_front,
        neck_back: sel.neck_back,
        sleeve: sel.sleeve,
        color: sel.color,
        fit: sel.fit,
        embroidery: sel.embroidery,
        custom_notes: [extra, refFile ? `Reference photo attached: ${refFile.name}` : ""].filter(Boolean).join("\n") || undefined,
      };
      const d = await post("/designs", body);
      if (refFile) {
        try { await uploadRef({ file: refFile, design_id: d.id }); } catch { /* design still saved */ }
      }
      setSaved(d);
      addToCart({
        garment_id: Number(garmentId), garment_name: detail?.name || "Custom dress",
        base_price: detail?.base_price || 0, estimate, title: d.title, design_id: d.id, sel,
      });
    } catch (e) {
      setError(e.message || "Could not save — check selections.");
    } finally {
      setSaving(false);
    }
  }

  const garment = garments.find((g) => String(g.id) === String(garmentId));

  return (
    <PageShell>
      <section className="dt-section">
        <div className="dt-container">
          <SectionHeading
            eyebrow="Personalize"
            title={<>Design your dress, <em>step by step.</em></>}
            sub="Cloth → neck front → neck back → sleeves → your extras + a reference photo (screenshot from Google is fine)."
            align="left"
          />
          <div className="pg-field" style={{ maxWidth: 420 }}>
            <label htmlFor="cz-garment">Base silhouette (by father)</label>
            <select id="cz-garment" value={garmentId} onChange={(e) => setGarmentId(e.target.value)}>
              {garments.map((g) => (<option key={g.id} value={g.id}>{g.name} · ₹{Number(g.base_price).toFixed(0)}</option>))}
            </select>
          </div>

          <ol className="custom-steps">
            {STEPS.map((s, i) => (
              <li key={s} className={i === step ? "on" : i < step ? "done" : ""}>
                <button type="button" onClick={() => setStep(i)}>{i + 1}. {s}</button>
              </li>
            ))}
          </ol>

          {error && <p className="pg-error" role="alert">{error}</p>}
          {saved ? (
            <div className="pg-panel">
              <h3>Saved “{saved.title}” ✓ — added to bag (≈ ₹{estimate.toFixed(0)})</h3>
              <p className="pg-muted">Neck front {sel.neck_front || "—"} · back {sel.neck_back || "—"} · sleeves {sel.sleeve || "—"}{refFile ? " · reference photo attached" : ""}.</p>
              <div className="pg-detail-actions">
                <Button variant="primary" size="sm" to="/cart">Go to bag →</Button>
                <Button variant="secondary" size="sm" onClick={() => { setSaved(null); setSel({}); setStep(0); }}>Design another</Button>
              </div>
            </div>
          ) : (
            <>
              {step === 0 && (
                <>
                  <h3 className="pg-h3">1 · Choose cloth (photos by admin)</h3>
                  <OptionGrid options={[...(groups.cloth || []), ...(groups.fabric || [])]} value={sel.cloth} onPick={(v) => pick("cloth")(v)} fallback={FALLBACKS.cloth} type="cloth" />
                </>
              )}
              {step === 1 && (
                <>
                  <h3 className="pg-h3">2 · Neck design — front</h3>
                  <OptionGrid options={[...(groups.neck_front || []), ...(groups.neck || [])]} value={sel.neck_front} onPick={pick("neck_front")} fallback={FALLBACKS.neck_front} type="neck" />
                </>
              )}
              {step === 2 && (
                <>
                  <h3 className="pg-h3">3 · Neck design — back</h3>
                  <OptionGrid options={groups.neck_back?.length ? groups.neck_back : (groups.neck || [])} value={sel.neck_back} onPick={pick("neck_back")} fallback={FALLBACKS.neck_back} type="neck" />
                </>
              )}
              {step === 3 && (
                <>
                  <h3 className="pg-h3">4 · Sleeves design</h3>
                  <OptionGrid options={groups.sleeve} value={sel.sleeve} onPick={pick("sleeve")} fallback={FALLBACKS.sleeve} type="sleeve" />
                </>
              )}
              {step === 4 && (
                <>
                  <h3 className="pg-h3">5 · Extras + your own idea 📸</h3>
                  <div className="pg-grid2">
                    <div className="pg-field"><label htmlFor="cz-title">Design name</label><input id="cz-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} /></div>
                    <div className="pg-field"><label htmlFor="cz-extra">Anything extra? (lace, piping, length…)</label><input id="cz-extra" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="e.g. gold piping, side slit" maxLength={500} /></div>
                  </div>
                  {["color", "fit", "embroidery"].map((t) =>
                    groups[t]?.length ? (
                      <div key={t} className="pg-optgroup">
                        <h4>{t}</h4>
                        <div className="dt-chips pg-chips">
                          {(groups[t] || []).map((o) => (
                            <button key={o.id} type="button" className={`dt-chip${sel[t] === o.option_value ? " on" : ""}`} onClick={() => pick(t)(o.option_value)}>
                              {o.option_value}{Number(o.price_delta) > 0 ? ` · +₹${o.price_delta}` : ""}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null
                  )}
                  <div className="pg-field">
                    <label htmlFor="cz-ref">Your reference photo — Google image / screenshot (optional)</label>
                    <input id="cz-ref" type="file" accept="image/*" onChange={(e) => onRefChange(e.target.files?.[0] || null)} />
                    {refPreview && <img src={refPreview} alt="Reference preview" className="custom-preview" />}
                    <p className="pg-muted pg-small">Seen something you love? Upload its screenshot — the tailor will match it.</p>
                  </div>
                </>
              )}

              <div className="custom-foot">
                <span className="pg-price">Your build ≈ ₹{estimate.toFixed(0)} {garment ? `· ${garment.name}` : ""}</span>
                <div className="pg-detail-actions">
                  {step > 0 && <Button variant="secondary" size="sm" onClick={() => setStep((s) => s - 1)}>← Back</Button>}
                  {step < 4 && <Button variant="primary" size="sm" onClick={() => setStep((s) => s + 1)}>Next →</Button>}
                  {step === 4 && (
                    <Button variant="primary" size="sm" onClick={saveAndBag} disabled={saving}>
                      {saving ? "Saving…" : user ? `♥ Save & add to bag · ₹${estimate.toFixed(0)}` : "Log in to save"}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </PageShell>
  );
}
