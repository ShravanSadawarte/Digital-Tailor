import { useEffect, useState } from "react";
import { get } from "../api/client";
import { useCopy } from "../hooks/useCopy";

/* eslint-disable react-refresh/only-export-components */

// Direct-UPI payment (no gateway fees): show UPI ID + QR, customer pays in any UPI app,
// then enters UTR + optionally uploads screenshot (linked to the order via /uploads).
export function upiLink({ upiId, name, amount, note }) {
  const p = new URLSearchParams({ pa: upiId, pn: name || "Digital Tailor", am: String(amount.toFixed(2)), cu: "INR" });
  if (note) p.set("tn", String(note).slice(0, 80));
  return `upi://pay?${p.toString()}`;
}

export default function UpiPayment({ amount = 0, orderId = null, onDone }) {
  const [info, setInfo] = useState({ upi_id: "father-tailor@upi", upi_name: "Digital Tailor", note: "", qr_image_url: "" });
  const [utr, setUtr] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const { copied, copy } = useCopy();

  useEffect(() => {
    get("/payment-info").then(setInfo).catch(() => {});
  }, []);

  const upiString = upiLink({ upiId: info.upi_id, name: info.upi_name, amount: Number(amount) || 0, note: orderId ? `Order ${orderId}` : "Digital Tailor" });
  const qrSrc = info.qr_image_url || `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiString)}`;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      // UTR is stored in order notes by the caller via onDone; screenshot upload happens there too.
      // This component only validates + hands back proof.
      if (!/^\d{10,14}$/.test(utr.trim()) && !/^[A-Za-z0-9]{8,20}$/.test(utr.trim())) {
        setMsg("Enter the 12-digit UTR / UPI Ref ID from your payment app.");
        setBusy(false);
        return;
      }
      await onDone?.({ utr: utr.trim(), screenshot: file });
      setMsg("Payment noted ✓ — the tailor confirms on WhatsApp / in Orders.");
    } catch {
      setMsg("Could not save payment proof — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="upi-box">
      <h3 className="pg-h3">Pay directly via UPI — no extra charges</h3>
      <p className="pg-muted">{info.note || "Pay in GPay / PhonePe / Paytm, then enter UTR below."}</p>
      <div className="upi-grid">
        <div className="upi-qr">
          <img src={qrSrc} alt={`UPI QR for ${info.upi_id}`} width={220} height={220} loading="lazy" />
          <p className="pg-muted pg-small">Scan with any UPI app · ₹{Number(amount).toFixed(0)}{orderId ? ` · Order #${orderId}` : ""}</p>
        </div>
        <div>
          <div className="pg-field">
            <label>UPI ID</label>
            <div className="upi-row">
              <code className="upi-id">{info.upi_id}</code>
              <button type="button" className="pg-linkbtn" onClick={() => copy(info.upi_id)}>
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
          </div>
          <div className="pg-field">
            <label>Amount</label>
            <strong className="upi-amt">₹{Number(amount).toFixed(0)}</strong>
          </div>
          <a className="dt-btn dt-btn-primary dt-btn-sm" href={upiString}>
            Pay ₹{Number(amount).toFixed(0)} in UPI app →
          </a>
          <p className="pg-muted pg-small" style={{ marginTop: 8 }}>
            On mobile this opens GPay / PhonePe directly. On desktop, scan the QR.
          </p>
        </div>
      </div>
      <form onSubmit={submit} className="upi-proof">
        <div className="pg-grid2">
          <div className="pg-field">
            <label htmlFor="upi-utr">UTR / UPI Ref ID (12 digits) *</label>
            <input id="upi-utr" value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="e.g. 423456789012" required maxLength={20} />
          </div>
          <div className="pg-field">
            <label htmlFor="upi-shot">Payment screenshot (optional)</label>
            <input id="upi-shot" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
        </div>
        {msg && <p className={msg.startsWith("Payment noted") ? "pg-ok" : "pg-error"} role="status">{msg}</p>}
        <button className="dt-btn dt-btn-secondary dt-btn-sm" type="submit" disabled={busy}>
          {busy ? "Saving…" : "I have paid — submit proof ✓"}
        </button>
      </form>
    </div>
  );
}
