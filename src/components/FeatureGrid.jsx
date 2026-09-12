import { WHY_ITEMS } from "../data/content";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

// Generic icon-card grid (used for "Why Digital Tailor").
export default function FeatureGrid({
  id,
  eyebrow,
  title,
  items = WHY_ITEMS,
  sectionClass = "dt-section",
}) {
  return (
    <section className={sectionClass} id={id}>
      <div className="dt-container">
        <SectionHeading eyebrow={eyebrow} title={title} align="left" />
        <div className="dt-why">
          {items.map((f, i) => (
            <Reveal key={f.title} className={`reveal-d${i % 4}`}>
              <article className="dt-why-card">
                <span className="dt-why-icon" aria-hidden="true">
                  {f.icon}
                </span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
