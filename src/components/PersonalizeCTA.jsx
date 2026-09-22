import Button from "./Button";
import Reveal from "./Reveal";

// Personalize banner for the home page — the 5-step dress designer.
const STEPS = ["1 · Cloth", "2 · Neck front", "3 · Neck back", "4 · Sleeves", "5 · Your photo"];

export default function PersonalizeCTA() {
  return (
    <section className="dt-section dt-section-alt" id="personalize-home">
      <div className="dt-container home-cta-grid">
        <Reveal>
          <div>
            <p className="dt-eyebrow">Personalize · made for you</p>
            <h2 className="dt-h2">
              Design your dress, <em>step by step.</em>
            </h2>
            <p className="dt-sub">
              Choose the cloth photo, neck front & back designs and sleeves from the tailor's collection —
              then attach your own reference screenshot. Saved straight to your bag.
            </p>
            <div className="home-cta-steps" aria-label="Personalize steps">
              {STEPS.map((s) => (
                <span key={s} className="dt-jpill">{s}</span>
              ))}
            </div>
            <div className="pg-cta-row">
              <Button variant="primary" to="/customize">Start designing ✦</Button>
              <Button variant="secondary" to="/#shop">Browse ready designs</Button>
            </div>
          </div>
        </Reveal>
        <Reveal>
          <div className="home-cta-art" aria-hidden="true">
            <span className="home-cta-big">✦</span>
            <p>Cloth → Neck → Sleeves → You</p>
            <div className="home-cta-swatches"><i /><i /><i /><i /></div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
