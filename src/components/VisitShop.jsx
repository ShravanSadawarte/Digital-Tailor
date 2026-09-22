import { AREAS } from "../data/content";
import Button from "./Button";
import Reveal from "./Reveal";

// Visit-the-shop strip for local customers: address, hours, booking.
export default function VisitShop({
  id = "visit",
  cards = [
    { icon: "◉", title: "Visit the shop", text: "Sitabuldi, Nagpur — walk in for fabrics, measurements and trials." },
    { icon: "◷", title: "Shop hours", text: "Monday to Saturday, 10am–8pm. Sundays by appointment." },
    { icon: "✎", title: "Book ahead", text: "Festive season fills fast — reserve a measurement or trial visit online." },
  ],
}) {
  return (
    <section className="dt-section dt-section-alt" id={id}>
      <div className="dt-container">
        <Reveal>
          <p className="dt-eyebrow">Visit us in Nagpur</p>
          <h2 className="dt-h2">
            Come, <em>say hello.</em>
          </h2>
          <p className="dt-sub">Fabric in hand or just an idea — the tailor is happy to meet you.</p>
        </Reveal>
        <div className="dt-cards">
          {cards.map((c, i) => (
            <Reveal key={c.title} className={`reveal-d${i}`}>
              <article className="dt-card">
                <div className={`dt-card-art dt-art-${i}`} aria-hidden="true"><span>{c.icon}</span></div>
                <div className="dt-card-body"><h3>{c.title}</h3><p>{c.text}</p></div>
              </article>
            </Reveal>
          ))}
        </div>
        <div className="dt-areas" aria-label="Areas served in Nagpur" style={{ marginTop: 18 }}>
          {AREAS.map((a) => (
            <span key={a}>{a}</span>
          ))}
        </div>
        <div className="pg-cta-row">
          <Button variant="primary" to="/dashboard">Book a visit</Button>
          <Button variant="secondary" to="/contact">Contact & directions</Button>
        </div>
      </div>
    </section>
  );
}
