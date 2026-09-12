import { AREAS } from "../data/content";
import Reveal from "./Reveal";

// Local story block: tailor-shop roots, occasions, areas served.
export default function About({
  id = "about",
  eyebrow = "Made for Nagpur",
  title = "From a Nagpur tailor shop to your screen.",
  paragraphs = [
    "Digital Tailor began in the lanes of Nagpur — helping women pick fabrics, fits and designs for everything from college fests and office wear to family weddings. Now it helps you explore styles digitally first, then brings your favourite look to life with expert stitching.",
    "Haldi-kunku, Gudi Padwa, Ganeshotsav or a friend’s wedding — your style, your city, your celebration.",
  ],
  quote = "Good style starts before the first stitch — it starts with an idea.",
  areas = AREAS,
}) {
  return (
    <section className="dt-section dt-section-alt" id={id}>
      <div className="dt-container dt-about">
        <Reveal>
          <div className="dt-about-figure" aria-hidden="true">
            <blockquote>“{quote}”</blockquote>
          </div>
        </Reveal>
        <Reveal>
          <p className="dt-eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          {paragraphs.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
          {areas.length > 0 && (
            <div className="dt-areas" aria-label="Areas served in Nagpur">
              {areas.map((a) => (
                <span key={a}>{a}</span>
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
