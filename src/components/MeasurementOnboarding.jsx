import { useState } from "react";
import { post } from "../api/client";
import Button from "./Button";

/* eslint-disable react-refresh/only-export-components */

export const MEASURE_SETS = {
  kurti: ["bust", "waist", "hip", "shoulder", "armhole", "sleeve_length", "kurti_length", "neck_width", "front_neck_depth", "back_neck_depth"],
  pant: ["waist", "hip", "thigh", "inseam", "pant_length", "bottom_width"],
  palazzo: ["waist", "hip", "thigh", "inseam", "palazzo_length", "bottom_width"],
  "one-piece": ["bust", "waist", "hip", "shoulder", "armhole", "sleeve_length", "dress_length", "neck_width", "front_neck_depth", "back_neck_depth"],
};
const label = (k) => k.replace(/_/g, " ");

// Shown right after login when the customer has no measurement profile.
// Skip is always available — they can add measurements later from Cart/Shop.
export default function MeasurementOnboarding({ onSaved, onSkip, compact = false }) {
  const [hint, setHint] = useState("kurti");
  const [name, setName] = useState("My standard");
  const [values, setValues] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fields = MEASURE_SETS[hint] || MEASURE_SETS.kurti;

  async function save(e) {
    e?.preventDefault?.();
    setError("");
    setBusy(true);
    try {
      const clean = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, Number(v)]));
      const saved = await post("/measurements", { name: name || "My standard", garment_hint: hint, values: clean });
      try { localStorage.removeItem("dt_measure_skip"); } catch { /* noop */ }
      onSaved?.(saved);
    } catch {
      setError("Fill every field (cm). Numbers only — e.g. bust 92, waist 76.");
    } finally {
      setBusy(false);
    }
  }

  function skip() {
    try { localStorage.setItem("dt_measure_skip", String(Date.now())); } catch { /* noop */ }
    onSkip?.();
  }

  return (
    <div className={compact ? "measure-inline" : "dt-modal-backdrop"} role="dialog" aria-label="Add measurements">
      <div className={compact ? "pg-form pg-form-wide" : "dt-modal dt-modal-wide"}>
        {!compact && <p className="dt-eyebrow">One quick step · skip anytime</p>}
        <h3>{compact ? "Add measurements (needed for stitching)" : "Add your measurements?"}</h3>
        <p className="pg-muted">
          So your father's stitching fits perfectly. Takes 1 minute — or <strong>Skip</strong> and add later from Cart while shopping.
        </p>
        {error && <p className="pg-error" role="alert">{error}</p>}
        <form onSubmit={save}>
          <div className="pg-grid2">
            <div className="pg-field">
              <label htmlFor="ob-name">Profile name</label>
              <input id="ob-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
            </div>
            <div className="pg-field">
              <label htmlFor="ob-hint">For garment type</label>
              <select id="ob-hint" value={hint} onChange={(e) => { setHint(e.target.value); setValues({}); }}>
                <option value="kurti">Kurti</option>
                <option value="pant">Pant</option>
                <option value="palazzo">Palazzo</option>
                <option value="one-piece">One-piece</option>
              </select>
            </div>
          </div>
          <div className="pg-measure-grid">
            {fields.map((f) => (
              <div className="pg-field" key={f}>
                <label htmlFor={`ob-${f}`}>{label(f)} (cm)</label>
                <input
                  id={`ob-${f}`}
                  type="number" step="0.5" min="0" required
                  value={values[f] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f]: e.target.value }))}
                  placeholder="cm"
                />
              </div>
            ))}
          </div>
          <div className="pg-detail-actions">
            <Button variant="primary" size="sm" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save measurements ✓"}
            </Button>
            <Button variant="secondary" size="sm" type="button" onClick={skip}>
              Skip for now →
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
