import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../api/client";

// Festival offers strip — Diwali, Eid, Wedding etc. driven by admin (/dashboard → Shop → Offers).
// Falls back to a Diwali teaser when the API is offline so the homepage never looks empty.
const FALLBACK = [
  { id: "diwali", title: "🪔 Diwali Dhamaka — up to 20% off stitching", description: "Festive season special. Order early for on-time delivery." },
  { id: "first", title: "✦ First Stitch — flat ₹200 off", description: "New here? Your first custom order saves instantly." },
];

function daysToDiwali() {
  // Approximate: Diwali 2026 ≈ Nov 8, 2027 ≈ Oct 29. Pick next upcoming from list.
  const now = new Date();
  const dates = [new Date("2026-11-08T00:00:00"), new Date("2027-10-29T00:00:00"), new Date("2028-10-17T00:00:00")];
  const next = dates.find((d) => d > now);
  if (!next) return null;
  return Math.ceil((next - now) / 86400000);
}

export default function OffersBar({ compact = false }) {
  const [offers, setOffers] = useState(FALLBACK);
  useEffect(() => {
    get("/offers")
      .then((d) => {
        if (d.data?.length) setOffers(d.data);
      })
      .catch(() => {});
  }, []);

  const days = daysToDiwali();

  return (
    <section className={`offers-bar${compact ? " compact" : ""}`} aria-label="Festival offers">
      <div className="dt-container offers-bar-inner">
        <div className="offers-head">
          <p className="dt-eyebrow">🎉 Festival offers</p>
          <h2>{days != null ? `Diwali in ${days} days — stitch early` : "Festive offers are live"}</h2>
          <p className="pg-muted">Admin-curated for every festival — Diwali, Eid, Weddings & more. Discount auto-applies at checkout.</p>
        </div>
        <div className="offers-row">
          {offers.slice(0, 4).map((o) => (
            <article key={o.id} className="offer-card">
              <strong>{o.title}</strong>
              <p>{o.description || (o.discount_type === "percent" ? `${o.discount_value}% off` : `Flat ₹${o.discount_value} off`)}</p>
              {o.discount_value != null && (
                <span className="pg-flag">
                  {o.discount_type === "percent" ? `${o.discount_value}% OFF` : `₹${o.discount_value} OFF`}
                </span>
              )}
            </article>
          ))}
        </div>
        {!compact && (
          <p className="pg-muted pg-small" style={{ marginTop: 12 }}>
            <Link to="/#shop">Open the shop →</Link> · New: <Link to="/customize">Design your own dress →</Link>
          </p>
        )}
      </div>
    </section>
  );
}
